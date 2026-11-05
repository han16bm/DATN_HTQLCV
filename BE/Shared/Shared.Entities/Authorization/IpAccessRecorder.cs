using System.Collections.Concurrent;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Shared.Commons.Utils;
using Shared.Entities.Entities;

namespace Shared.Entities.Authorization;

/// <summary>
/// Gộp lượt truy cập từ IP chưa có rule trong bộ nhớ, ghi IpAccessLogs tối đa một lần mỗi 30 giây cho mỗi (Ip, Scope) (§10.2).
/// Ghi bằng INSERT … ON CONFLICT để 4 tiến trình dùng chung DB cộng dồn đúng. Lỗi ghi chỉ log, không làm hỏng request.
/// </summary>
public sealed class IpAccessRecorder : IDisposable
{
    private static readonly TimeSpan FlushInterval = TimeSpan.FromSeconds(30);
    private static readonly TimeSpan IdleEviction = TimeSpan.FromMinutes(10);

    private readonly ConcurrentDictionary<(string Ip, string Scope), Bucket> _buckets = new();
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<IpAccessRecorder> _logger;
    private readonly Timer _timer;

    public IpAccessRecorder(IServiceScopeFactory scopeFactory, ILogger<IpAccessRecorder> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        // Xả phần lượt còn nằm trong bộ nhớ của những IP không quay lại sau lần ghi gần nhất
        _timer = new Timer(_ => FlushDue(), null, FlushInterval, FlushInterval);
    }

    public void Record(string ip, string scope, bool blocked, string? userId, string? username, string path)
    {
        while (true)
        {
            var bucket = _buckets.GetOrAdd((ip, scope), _ => new Bucket());
            Snapshot? due;
            lock (bucket)
            {
                if (bucket.Evicted)
                    continue;
                var now = DateTime.UtcNow;
                if (bucket.Hits == 0)
                    bucket.FirstSeenAt = now;
                bucket.Hits++;
                if (blocked)
                    bucket.Blocked++;
                bucket.LastSeenAt = now;
                bucket.UserId = userId ?? bucket.UserId;
                bucket.Username = Truncate(username, 100) ?? bucket.Username;
                bucket.Path = Truncate(path, 500)!;
                due = bucket.TakeIfDue(now);
            }
            if (due is not null)
                _ = WriteAsync(ip, scope, due);
            return;
        }
    }

    public void Dispose()
    {
        _timer.Dispose();
    }

    private void FlushDue()
    {
        var now = DateTime.UtcNow;
        foreach (var (key, bucket) in _buckets)
        {
            Snapshot? due;
            lock (bucket)
            {
                due = bucket.TakeIfDue(now);
                if (due is null && bucket.Hits == 0 && now - bucket.LastFlushAt > IdleEviction)
                {
                    bucket.Evicted = true;
                    _buckets.TryRemove(key, out _);
                }
            }
            if (due is not null)
                _ = WriteAsync(key.Ip, key.Scope, due);
        }
    }

    private async Task WriteAsync(string ip, string scope, Snapshot s)
    {
        try
        {
            using var serviceScope = _scopeFactory.CreateScope();
            var db = serviceScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var pending = IpAccessLog.StatusPending;
            // IP đã ALLOWED/DISMISSED mà vẫn truy cập không khớp rule → quay lại PENDING (tăng Version để If-Match cũ bị 412)
            await db.Database.ExecuteSqlAsync($"""
                INSERT INTO "IpAccessLogs" AS t ("Id", "Version", "Ip", "Scope", "FirstSeenAt", "LastSeenAt", "HitCount", "BlockedCount",
                                                 "LastUserId", "LastUsername", "LastPath", "Status")
                VALUES ({GuidGenerator.NewId()}, 1, {ip}, {scope}, {s.FirstSeenAt}, {s.LastSeenAt}, {s.Hits}, {s.Blocked},
                        {s.UserId}, {s.Username}, {s.Path}, {pending})
                ON CONFLICT ("Ip", "Scope") DO UPDATE SET
                    "FirstSeenAt" = LEAST(t."FirstSeenAt", EXCLUDED."FirstSeenAt"),
                    "LastSeenAt" = GREATEST(t."LastSeenAt", EXCLUDED."LastSeenAt"),
                    "HitCount" = t."HitCount" + EXCLUDED."HitCount",
                    "BlockedCount" = t."BlockedCount" + EXCLUDED."BlockedCount",
                    "LastUserId" = COALESCE(EXCLUDED."LastUserId", t."LastUserId"),
                    "LastUsername" = COALESCE(EXCLUDED."LastUsername", t."LastUsername"),
                    "LastPath" = EXCLUDED."LastPath",
                    "Version" = CASE WHEN t."Status" = EXCLUDED."Status" THEN t."Version" ELSE t."Version" + 1 END,
                    "Status" = EXCLUDED."Status"
                """);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Không ghi được IpAccessLogs cho {Ip} ({Scope}); bỏ qua {Hits} lượt.", ip, scope, s.Hits);
        }
    }

    private static string? Truncate(string? value, int max)
    {
        return value is not null && value.Length > max ? value[..max] : value;
    }

    private sealed record Snapshot(DateTime FirstSeenAt, DateTime LastSeenAt, int Hits, int Blocked, string? UserId, string? Username, string Path);

    private sealed class Bucket
    {
        public DateTime LastFlushAt = DateTime.MinValue;
        public DateTime FirstSeenAt;
        public DateTime LastSeenAt;
        public int Hits;
        public int Blocked;
        public string? UserId;
        public string? Username;
        public string Path = string.Empty;
        public bool Evicted;

        /// <summary>Lấy phần đã gộp nếu đã đủ 30 giây từ lần ghi trước (lần đầu ghi ngay), rồi đặt lại bộ đếm.</summary>
        public Snapshot? TakeIfDue(DateTime now)
        {
            if (Hits == 0 || now - LastFlushAt < FlushInterval)
                return null;
            var snapshot = new Snapshot(FirstSeenAt, LastSeenAt, Hits, Blocked, UserId, Username, Path);
            Hits = 0;
            Blocked = 0;
            UserId = null;
            Username = null;
            LastFlushAt = now;
            return snapshot;
        }
    }
}
