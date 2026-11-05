using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Analytics.Api.Models.Dtos;
using Analytics.Api.Models.Queries;
using Microsoft.EntityFrameworkCore;
using Shared.Commons.Extensions;
using Shared.Entities;
using Shared.Entities.Entities;

namespace Analytics.Api.Services;

/// <summary>Nội dung một tham chiếu phân tích trước khi lưu.</summary>
public sealed record AnalysisDraft(
    string Type,
    AnalysisSubjectDto Subject,
    string Title,
    List<MeasureDto> Metrics,
    List<EvidenceDto> Evidence,
    string Summary,
    IReadOnlyCollection<string> ProjectIds,
    List<SeriesDto>? Series = null,
    string? QualityStatus = null);

/// <summary>Phần nội dung lưu trong AnalysisSnapshot.PayloadJson.</summary>
public sealed record SnapshotPayload(
    AnalysisSubjectDto Subject,
    QualityDto Quality,
    List<MeasureDto> Metrics,
    List<ContextItemDto> Context,
    List<SeriesDto> Series,
    List<EvidenceDto> Evidence,
    string SystemSummary);

/// <summary>Phạm vi lọc đã chuẩn hoá — vừa để băm Id vừa để tính lại khi kiểm độ mới.</summary>
public sealed record SnapshotScope(
    DateOnly From,
    DateOnly To,
    string? UnitId,
    string? ProjectId,
    string? OwnerId,
    string? AssigneeId,
    string? Status,
    string? Priority,
    string? TeamId)
{
    public static SnapshotScope Of(AnalyticsQuery q) => new(q.From, q.To, Blank(q.UnitId), Blank(q.ProjectId), Blank(q.OwnerId),
        Blank(q.AssigneeId), q.Status?.ToString(), q.Priority?.ToString(), Blank(q.TeamId));

    public AnalyticsQuery ToQuery() => new()
    {
        From = From,
        To = To,
        UnitId = UnitId,
        ProjectId = ProjectId,
        OwnerId = OwnerId,
        AssigneeId = AssigneeId,
        Status = Status is null ? null : Enum.Parse<Shared.Entities.Enums.WorkTaskStatus>(Status),
        Priority = Priority is null ? null : Enum.Parse<Shared.Entities.Enums.TaskPriority>(Priority),
        TeamId = TeamId
    };

    private static string? Blank(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}

/// <summary>
/// Gom các tham chiếu phân tích sinh ra trong một request rồi lưu một lần (FlushAsync).
/// Id = "an-" + SHA-256(loại|đối tượng|phạm vi|nội dung|dự án): số liệu không đổi thì dùng lại bản cũ,
/// đổi thì sinh bản mới — Latest(...) cho biết Id mới nhất của một đối tượng sau khi tính lại.
/// </summary>
public class AnalysisSnapshotStore(ApplicationDbContext context, IHttpContextAccessor http)
{
    public const int RetentionDays = 7;
    public static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    private static long _lastCleanupTicks;
    private readonly Dictionary<string, AnalysisSnapshot> _pending = new();
    private readonly Dictionary<string, string> _latest = new();

    public AnalysisRefDto Ref(AnalyticsQuery query, AnalysisDraft draft)
    {
        var scope = SnapshotScope.Of(query);
        var scopeJson = JsonSerializer.Serialize(scope, Json);
        var quality = draft.QualityStatus
            ?? (draft.Metrics.Count > 0 && draft.Metrics.All(m => m.Value is null) ? "INSUFFICIENT"
                : draft.Metrics.Any(m => m.Value is null) ? "PARTIAL" : "SUFFICIENT");
        var context = new List<ContextItemDto>
        {
            new("from", "Từ ngày", scope.From.ToString("yyyy-MM-dd"), "DATE"),
            new("to", "Đến ngày", scope.To.ToString("yyyy-MM-dd"), "DATE")
        };
        var payload = new SnapshotPayload(draft.Subject, new QualityDto(quality), draft.Metrics, context,
            draft.Series ?? [], draft.Evidence, Truncate(draft.Summary, 4000));
        var payloadJson = JsonSerializer.Serialize(payload, Json);
        var projectIds = draft.ProjectIds.Distinct().Order(StringComparer.Ordinal).ToList();

        var hash = Hash($"{draft.Type}|{draft.Subject.Kind}|{draft.Subject.Key}|{scopeJson}|{payloadJson}|{string.Join(',', projectIds)}");
        var id = $"an-{hash}";
        _latest[LatestKey(draft.Type, draft.Subject)] = id;
        if (!_pending.ContainsKey(id))
        {
            var now = DateTime.UtcNow;
            _pending[id] = new AnalysisSnapshot
            {
                Id = id,
                SnapshotId = $"snap-{hash}",
                AnalysisType = draft.Type,
                SubjectKind = draft.Subject.Kind,
                SubjectId = Truncate(draft.Subject.Key, 100),
                Title = Truncate(draft.Title, 255),
                ScopeJson = scopeJson,
                PayloadJson = payloadJson,
                ProjectIds = projectIds,
                CreatedBy = http.HttpContext?.GetUserId() ?? "SYSTEM",
                CreatedAt = now,
                ExpiresAt = now.AddDays(RetentionDays)
            };
        }
        return new AnalysisRefDto(id);
    }

    public string? Latest(string type, AnalysisSubjectDto subject) => _latest.GetValueOrDefault(LatestKey(type, subject));

    public async Task FlushAsync()
    {
        if (_pending.Count == 0) return;
        var now = DateTime.UtcNow;
        var ids = _pending.Keys.ToList();
        var rows = await context.AnalysisSnapshots.Where(s => ids.Contains(s.Id))
            .Select(s => new { s.Id, s.ExpiresAt }).ToListAsync();
        var existing = rows.Select(r => r.Id).ToList();
        // Gia hạn bản đang được xem; chỉ ghi khi còn dưới (RetentionDays - 1) ngày để không ghi DB mỗi lần tải trang.
        var renew = rows.Where(r => r.ExpiresAt < now.AddDays(RetentionDays - 1)).Select(r => r.Id).ToList();
        if (renew.Count > 0)
            await context.AnalysisSnapshots.Where(s => renew.Contains(s.Id))
                .ExecuteUpdateAsync(s => s.SetProperty(x => x.ExpiresAt, now.AddDays(RetentionDays)));

        var fresh = _pending.Values.Where(s => !existing.Contains(s.Id)).ToList();
        _pending.Clear();
        await CleanupAsync(now);
        if (fresh.Count == 0) return;
        context.AnalysisSnapshots.AddRange(fresh);
        try
        {
            await context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            // Request song song vừa lưu cùng bản (cùng Id tất định): bỏ phần đã có rồi thử lại một lần.
            foreach (var entry in context.ChangeTracker.Entries<AnalysisSnapshot>().ToList()) entry.State = EntityState.Detached;
            var freshIds = fresh.Select(s => s.Id).ToList();
            var saved = await context.AnalysisSnapshots.Where(s => freshIds.Contains(s.Id)).Select(s => s.Id).ToListAsync();
            context.AnalysisSnapshots.AddRange(fresh.Where(s => !saved.Contains(s.Id)));
            await context.SaveChangesAsync();
        }

    }

    // Dọn bản hết hạn (cùng phản hồi/job của chúng) tối đa 30 phút một lần mỗi tiến trình.
    private async Task CleanupAsync(DateTime now)
    {
        var last = Interlocked.Read(ref _lastCleanupTicks);
        if (now.Ticks - last < TimeSpan.FromMinutes(30).Ticks
            || Interlocked.CompareExchange(ref _lastCleanupTicks, now.Ticks, last) != last)
            return;
        var expired = context.AnalysisSnapshots.Where(s => s.ExpiresAt < now).Select(s => s.Id);
        await context.AnalysisJobs.Where(j => expired.Contains(j.AnalysisId)).ExecuteDeleteAsync();
        await context.AnalysisFeedback.Where(f => expired.Contains(f.AnalysisId)).ExecuteDeleteAsync();
        await context.AnalysisSnapshots.Where(s => s.ExpiresAt < now).ExecuteDeleteAsync();
    }

    private static string LatestKey(string type, AnalysisSubjectDto subject) => $"{type}|{subject.Kind}|{subject.Key}";

    private static string Hash(string value) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)))[..32].ToLowerInvariant();

    private static string Truncate(string value, int max) => value.Length <= max ? value : value[..(max - 1)] + "…";
}
