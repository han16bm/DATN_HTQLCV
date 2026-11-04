using System.Text.Json;
using Analytics.Api.Interfaces;
using Analytics.Api.Models.Dtos;
using Analytics.Api.Models.Queries;
using Analytics.Api.Models.Requests;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Shared.Commons.Exceptions;
using Shared.Commons.Extensions;
using Shared.Commons.Models;
using Shared.Commons.Utils;
using Shared.Entities;
using Shared.Entities.Auditing;
using Shared.Entities.Entities;

namespace Analytics.Api.Services;

public class JobService(
    ApplicationDbContext context,
    IHttpContextAccessor httpContextAccessor,
    IServiceScopeFactory scopeFactory,
    IOptions<AlertGenerationOptions> alertOptions,
    ILogger<JobService> logger) : BaseService<BackgroundJob>(context, httpContextAccessor), IJobService
{
    public const string AlertGeneration = "ALERT_GENERATION";
    private const int RunsToKeep = 200;

    // Dùng chung giữa vòng lặp nền và chạy thủ công để không bao giờ có 2 lần chạy chồng nhau trong process
    private static readonly SemaphoreSlim Gate = new(1, 1);

    public async Task<List<BackgroundJobDto>> ListAsync()
    {
        var jobs = await Context.BackgroundJobs.AsNoTracking().OrderBy(j => j.Code).ToListAsync();
        var names = await AuditActorNames.LoadAsync(Context, jobs.Select(j => j.UpdatedBy));
        return jobs.Select(j => ToDto(j, names)).ToList();
    }

    public async Task<BackgroundJobDto> UpdateAsync(string code, BackgroundJobPatchRequest request)
    {
        var job = await FindAsync(code);
        CheckIfMatch(job.Version);

        var before = new { job.IsEnabled, job.IntervalMinutes };
        var now = DateTime.UtcNow;
        if (request.IntervalMinutes.HasValue && request.IntervalMinutes.Value != job.IntervalMinutes)
        {
            job.IntervalMinutes = request.IntervalMinutes.Value;
            job.NextRunAt = (job.LastRunAt ?? now).AddMinutes(job.IntervalMinutes);
        }
        if (request.IsEnabled.HasValue)
        {
            job.IsEnabled = request.IsEnabled.Value;
            if (job.IsEnabled && job.NextRunAt is null) job.NextRunAt = now;
        }
        job.UpdatedAt = now;
        job.Version++;

        await WriteAuditLogAsync(job.Code, "UPDATE", before, new { job.IsEnabled, job.IntervalMinutes }, request.Reason);
        await Context.SaveChangesAsync();
        return ToDto(job, await AuditActorNames.LoadAsync(Context, [job.UpdatedBy]));
    }

    public async Task<JobRunDto> RunNowAsync(string code)
    {
        await FindAsync(code);
        if (!Gate.Wait(0))
            throw new BusinessRuleException("Job đang chạy.");
        try
        {
            // Chạy đồng bộ trong request; không gắn RequestAborted để client ngắt kết nối không bỏ dở job giữa chừng
            var run = await ExecuteAsync(code, "MANUAL", CurrentUserId, CancellationToken.None);
            return ToDto(run, await LoadDisplayNamesAsync([run.TriggeredBy]));
        }
        finally
        {
            Gate.Release();
        }
    }

    public async Task<PagedResult<JobRunDto>> ListRunsAsync(string code, JobRunQuery query)
    {
        await FindAsync(code);
        var q = Context.JobRuns.AsNoTracking().Where(r => r.JobCode == code);
        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            var status = query.Status.ToUpperInvariant();
            q = q.Where(r => r.Status == status);
        }

        var paged = await q.OrderByDescending(r => r.StartedAt).ToPagedResultAsync(query);
        var names = await LoadDisplayNamesAsync(paged.Items.Select(r => r.TriggeredBy));
        return new PagedResult<JobRunDto>
        {
            Items = paged.Items.Select(r => ToDto(r, names)).ToList(),
            Page = paged.Page,
            PageSize = paged.PageSize,
            Total = paged.Total
        };
    }

    /// <summary>Chạy lúc khởi động: tạo cấu hình job từ appsettings nếu DB chưa có; sau đó DB là nguồn sự thật.</summary>
    public async Task EnsureJobsAsync(CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        if (!await Context.BackgroundJobs.AnyAsync(j => j.Code == AlertGeneration, cancellationToken))
        {
            var options = alertOptions.Value;
            Context.BackgroundJobs.Add(new BackgroundJob
            {
                Code = AlertGeneration,
                Name = "Sinh cảnh báo tự động",
                Description = "Quét công việc đang mở để tạo, cập nhật hoặc tắt cảnh báo quá hạn, nguy cơ trễ hạn, nghẽn và thiếu dữ liệu.",
                IsEnabled = options.Enabled,
                IntervalMinutes = Math.Clamp(options.IntervalMinutes, 1, 1440),
                NextRunAt = now,
                Version = 1,
                UpdatedAt = now
            });
        }

        // Một instance Analytics duy nhất: lần chạy còn RUNNING lúc khởi động là do process trước dừng giữa chừng
        var staleRuns = await Context.JobRuns.Where(r => r.Status == "RUNNING").ToListAsync(cancellationToken);
        foreach (var run in staleRuns)
        {
            run.Status = "FAILED";
            run.FinishedAt = now;
            run.Error = "Bị gián đoạn do dịch vụ dừng khi đang chạy.";
        }
        var staleJobs = await Context.BackgroundJobs.Where(j => j.LastStatus == "RUNNING").ToListAsync(cancellationToken);
        foreach (var job in staleJobs)
        {
            job.LastStatus = "FAILED";
        }

        await Context.SaveChangesAsync(cancellationToken);
    }

    public async Task RunDueJobsAsync(CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var due = await Context.BackgroundJobs.AsNoTracking()
            .Where(j => j.IsEnabled && (j.NextRunAt == null || j.NextRunAt <= now))
            .OrderBy(j => j.Code)
            .Select(j => j.Code)
            .ToListAsync(cancellationToken);

        foreach (var code in due)
        {
            if (!await Gate.WaitAsync(0, cancellationToken))
                return;
            try
            {
                await ExecuteAsync(code, "SCHEDULE", null, cancellationToken);
            }
            finally
            {
                Gate.Release();
            }
        }
    }

    private async Task<JobRun> ExecuteAsync(string code, string trigger, string? triggeredBy, CancellationToken cancellationToken)
    {
        var job = await Context.BackgroundJobs.FirstAsync(j => j.Code == code, CancellationToken.None);
        var run = new JobRun
        {
            Id = GuidGenerator.NewId(),
            JobCode = code,
            StartedAt = DateTime.UtcNow,
            Status = "RUNNING",
            Trigger = trigger,
            TriggeredBy = triggeredBy
        };
        Context.JobRuns.Add(run);
        job.LastStatus = "RUNNING";
        await Context.SaveChangesAsync(CancellationToken.None);

        try
        {
            var summary = await DispatchAsync(code, cancellationToken);
            run.Status = "SUCCEEDED";
            run.SummaryJson = JsonSerializer.Serialize(summary);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Job {JobCode} chạy lỗi.", code);
            run.Status = "FAILED";
            run.Error = ex.Message.Length > 4000 ? ex.Message[..4000] : ex.Message;
        }

        run.FinishedAt = DateTime.UtcNow;
        job.LastRunAt = run.StartedAt;
        job.LastStatus = run.Status;
        job.NextRunAt = run.FinishedAt.Value.AddMinutes(job.IntervalMinutes);
        await Context.SaveChangesAsync(CancellationToken.None);

        var keepIds = Context.JobRuns.Where(r => r.JobCode == code).OrderByDescending(r => r.StartedAt).Take(RunsToKeep).Select(r => r.Id);
        await Context.JobRuns.Where(r => r.JobCode == code && !keepIds.Contains(r.Id)).ExecuteDeleteAsync(CancellationToken.None);
        return run;
    }

    // Scope riêng: job lỗi giữa chừng không để lại entity dở dang trong DbContext đang ghi JobRuns
    private async Task<Dictionary<string, int>> DispatchAsync(string code, CancellationToken cancellationToken)
    {
        using var scope = scopeFactory.CreateScope();
        // Dữ liệu do job sinh/sửa luôn ghi dấu "SYSTEM", kể cả khi admin bấm chạy tay (người bấm nằm ở JobRun.TriggeredBy)
        using var actor = AuditActorScope.Use(AuditActors.System);
        switch (code)
        {
            case AlertGeneration:
                var result = await scope.ServiceProvider.GetRequiredService<IAlertGenerationService>().GenerateAsync(cancellationToken);
                return new Dictionary<string, int>
                {
                    ["created"] = result.Created,
                    ["updated"] = result.Updated,
                    ["deactivated"] = result.Deactivated
                };
            default:
                throw new InvalidOperationException($"Chưa có xử lý cho job {code}.");
        }
    }

    private async Task<BackgroundJob> FindAsync(string code)
    {
        return await Context.BackgroundJobs.FirstOrDefaultAsync(j => j.Code == code)
            ?? throw new NotFoundException("Không tìm thấy job.");
    }

    private async Task<Dictionary<string, string>> LoadDisplayNamesAsync(IEnumerable<string?> userIds)
    {
        var ids = userIds.Where(id => id is not null).Distinct().ToList();
        return await Context.Users.AsNoTracking().Where(u => ids.Contains(u.Id)).ToDictionaryAsync(u => u.Id, u => u.DisplayName);
    }

    private static BackgroundJobDto ToDto(BackgroundJob j, Dictionary<string, string> names)
    {
        var updatedBy = j.UpdatedBy is null ? null : new RefDto(j.UpdatedBy, AuditActorNames.Label(j.UpdatedBy, names)!);
        return new BackgroundJobDto(
            j.Code, j.Version, j.Name, j.Description, j.IsEnabled, j.IntervalMinutes, j.LastRunAt, j.NextRunAt, j.LastStatus, j.UpdatedAt,
            updatedBy);
    }

    private static JobRunDto ToDto(JobRun r, Dictionary<string, string> names)
    {
        var duration = r.FinishedAt.HasValue ? (long)(r.FinishedAt.Value - r.StartedAt).TotalMilliseconds : (long?)null;
        var triggeredBy = r.TriggeredBy is null ? null : new RefDto(r.TriggeredBy, names.GetValueOrDefault(r.TriggeredBy, r.TriggeredBy));
        var summary = r.SummaryJson is null ? null : JsonSerializer.Deserialize<Dictionary<string, int>>(r.SummaryJson);
        return new JobRunDto(r.Id, r.JobCode, r.StartedAt, r.FinishedAt, duration, r.Status, r.Trigger, triggeredBy, summary, r.Error);
    }
}
