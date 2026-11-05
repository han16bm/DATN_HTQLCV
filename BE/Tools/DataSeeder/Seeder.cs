using System.Globalization;
using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Shared.Entities;
using Shared.Entities.Auditing;
using Shared.Entities.Entities;
using Shared.Entities.Enums;

namespace DataSeeder;

/// <summary>
/// Ánh xạ seed của MSW mock (FE/src/mocks/data.json) sang entity EF và nạp vào DB. Giữ nguyên Id để FE ở chế độ
/// http thấy cùng dữ liệu như chế độ mock. Đọc được cả seed cũ (users[].systemRole) lẫn seed mới (isSysAdmin + permissionGroups).
/// Dấu vết CreatedBy/UpdatedBy: lấy từ seed nếu có, không thì theo quy tắc docs/ADMIN_MODULES.md §8.2. DbContext của tool
/// không gắn AuditStampInterceptor nên giá trị gán ở đây được giữ nguyên.
/// </summary>
public class Seeder(ApplicationDbContext context, JsonElement root, string uploadsDir)
{
    private static readonly PasswordHasher<User> Hasher = new();
    private readonly DateTime _clock = ReadDate(root.GetProperty("clock"));
    private readonly Dictionary<string, int> _summary = new();
    private readonly string _adminId = root.GetProperty("users").EnumerateArray()
        .Where(u => u.TryGetProperty("isSysAdmin", out var sys) && sys.GetBoolean() || OptStr(u, "systemRole") == "ADMIN")
        .Select(u => Str(u, "id")).FirstOrDefault() ?? "u-admin";

    // Bảng nghiệp vụ bị xoá khi --reset; Features, PermissionGroups hệ thống và SystemConfigs do migration quản lý nên giữ lại
    private static readonly Type[] ResetEntities =
    [
        typeof(AuditLog), typeof(Alert), typeof(Report), typeof(Attachment), typeof(Submission), typeof(TimeLog),
        typeof(TaskAssignment), typeof(WorkTask), typeof(ProjectMembership), typeof(Project), typeof(TeamMember), typeof(Team),
        typeof(PermissionGroupMember), typeof(IpWhitelistEntry), typeof(JobRun), typeof(User), typeof(Unit)
    ];

    public static async Task ResetAsync(ApplicationDbContext context)
    {
        var tables = ResetEntities
            .Select(t => context.Model.FindEntityType(t)?.GetTableName())
            .Where(n => n is not null)
            .Select(n => $"\"{n}\"");
        // Tên bảng lấy từ model EF (không từ input người dùng) nên ghép chuỗi an toàn
        var truncate = "TRUNCATE " + string.Join(", ", tables) + " CASCADE;";
        await context.Database.ExecuteSqlRawAsync(truncate);
        // Nhóm không phải hệ thống là dữ liệu nghiệp vụ, nhóm hệ thống (seed migration) giữ nguyên
        await context.PermissionGroups.Where(g => !g.IsSystem).ExecuteDeleteAsync();
    }

    public async Task<Dictionary<string, int>> SeedAsync()
    {
        await using var transaction = await context.Database.BeginTransactionAsync();

        var units = SeedUnits();
        await context.SaveChangesAsync();
        SeedUsers();
        await context.SaveChangesAsync();
        // Units ↔ Users tham chiếu vòng (ManagerId) nên gán trưởng đơn vị sau khi đã có tài khoản
        foreach (var (unit, managerId) in units)
            unit.ManagerId = managerId;
        await SeedPermissionGroupsAsync();
        SeedTeams();
        SeedProjects();
        await context.SaveChangesAsync();
        SeedTasks();
        await context.SaveChangesAsync();
        SeedAssignments();
        SeedTimeLogs();
        SeedAttachments();
        SeedSubmissions();
        SeedReports();
        SeedAlerts();
        SeedAudits();
        SeedIpWhitelist();
        await SeedJobsAsync();
        await context.SaveChangesAsync();

        await transaction.CommitAsync();
        return _summary;
    }

    private List<(Unit Unit, string? ManagerId)> SeedUnits()
    {
        var result = new List<(Unit, string?)>();
        foreach (var u in Items("units"))
        {
            var unit = new Unit
            {
                Id = Str(u, "id"), Version = Int(u, "version", 1), CreatedAt = _clock, UpdatedAt = _clock,
                Name = Str(u, "name"), ParentId = OptStr(u, "parentId"), ManagerId = null,
                Status = Enum<OrgStatus>(Str(u, "status")),
                CreatedBy = OptStr(u, "createdBy") ?? _adminId, UpdatedBy = OptStr(u, "updatedBy") ?? _adminId
            };
            context.Units.Add(unit);
            result.Add((unit, OptStr(u, "managerId")));
        }
        Count("Units", result.Count);
        return result;
    }

    private void SeedUsers()
    {
        var password = root.GetProperty("password").GetString()!;
        var count = 0;
        foreach (var u in Items("users"))
        {
            var legacyRole = OptStr(u, "systemRole");
            var user = new User
            {
                Id = Str(u, "id"), Version = Int(u, "version", 1),
                CreatedAt = _clock, UpdatedAt = OptDate(u, "updatedAt") ?? _clock,
                Username = Str(u, "username"), DisplayName = Str(u, "displayName"), Email = Str(u, "email"),
                UnitId = Str(u, "unitId"), Status = Enum<UserStatus>(Str(u, "status")),
                IsSysAdmin = u.TryGetProperty("isSysAdmin", out var sys) ? sys.GetBoolean() : legacyRole == "ADMIN",
                GrantedFeatures = StrList(u, "grantedFeatures"),
                RevokedFeatures = StrList(u, "revokedFeatures"),
                Gender = OptStr(u, "gender"),
                BirthDate = OptStr(u, "birthDate") is { } birth ? DateOnly.Parse(birth, CultureInfo.InvariantCulture) : null,
                Phone = OptStr(u, "phone"),
                PermanentAddress = OptStr(u, "permanentAddress"),
                TemporaryAddress = OptStr(u, "temporaryAddress"),
                FailedLoginCount = 0, TokenVersion = 0,
                CreatedBy = OptStr(u, "createdBy") ?? _adminId, UpdatedBy = OptStr(u, "updatedBy") ?? _adminId
            };
            if (user.Status == UserStatus.Locked)
            {
                user.LockedAt = _clock;
                user.LockReason = "Khoá sẵn trong dữ liệu mẫu.";
            }
            user.PasswordHash = Hasher.HashPassword(user, password);
            context.Users.Add(user);
            count++;
        }
        Count("Users", count);
    }

    private async Task SeedPermissionGroupsAsync()
    {
        var existing = await context.PermissionGroups.Include(g => g.Members).ToDictionaryAsync(g => g.Id);
        var memberships = 0;
        var groups = 0;

        if (root.TryGetProperty("permissionGroups", out var seedGroups))
        {
            foreach (var g in seedGroups.EnumerateArray())
            {
                var id = Str(g, "id");
                if (!existing.TryGetValue(id, out var group))
                {
                    group = new PermissionGroup
                    {
                        Id = id, Version = Int(g, "version", 1),
                        CreatedAt = OptDate(g, "createdAt") ?? _clock, UpdatedAt = OptDate(g, "updatedAt") ?? _clock,
                        Code = Str(g, "code"), Name = Str(g, "name"), Description = OptStr(g, "description"),
                        IsSystem = g.TryGetProperty("isSystem", out var sys) && sys.GetBoolean(),
                        Status = Enum<OrgStatus>(Str(g, "status")),
                        Features = StrList(g, "features"),
                        CreatedBy = OptStr(g, "createdBy") ?? _adminId, UpdatedBy = OptStr(g, "updatedBy") ?? _adminId
                    };
                    context.PermissionGroups.Add(group);
                    existing[id] = group;
                    groups++;
                }
                foreach (var userId in StrList(g, "memberIds"))
                {
                    context.PermissionGroupMembers.Add(new PermissionGroupMember { PermissionGroupId = id, UserId = userId });
                    memberships++;
                }
            }
        }
        else
        {
            // Seed cũ: suy nhóm từ systemRole giống migration AdminModulesAndDynamicRbac
            foreach (var u in Items("users"))
            {
                var groupId = OptStr(u, "systemRole") switch
                {
                    "ADMIN" => SeedData.AdminGroupId,
                    "MANAGER" => SeedData.ProjectManagerGroupId,
                    _ => null
                };
                if (groupId is null) continue;
                context.PermissionGroupMembers.Add(new PermissionGroupMember { PermissionGroupId = groupId, UserId = Str(u, "id") });
                memberships++;
            }
        }
        Count("PermissionGroups (mới)", groups);
        Count("PermissionGroupMembers", memberships);
    }

    private void SeedTeams()
    {
        var teams = 0;
        var members = 0;
        foreach (var t in Items("teams"))
        {
            var team = new Team
            {
                Id = Str(t, "id"), Version = Int(t, "version", 1), CreatedAt = _clock, UpdatedAt = _clock,
                Name = Str(t, "name"), UnitId = Str(t, "unitId"), Status = Enum<OrgStatus>(Str(t, "status")),
                CreatedBy = OptStr(t, "createdBy") ?? _adminId, UpdatedBy = OptStr(t, "updatedBy") ?? _adminId
            };
            team.Members = StrList(t, "memberIds").Select(id => new TeamMember { TeamId = team.Id, UserId = id }).ToList();
            members += team.Members.Count;
            context.Teams.Add(team);
            teams++;
        }
        Count("Teams", teams);
        Count("TeamMembers", members);
    }

    private void SeedProjects()
    {
        var projects = 0;
        foreach (var p in Items("projects"))
        {
            context.Projects.Add(new Project
            {
                Id = Str(p, "id"), Version = Int(p, "version", 1),
                CreatedAt = OptDate(p, "createdAt") ?? _clock, UpdatedAt = OptDate(p, "updatedAt") ?? _clock,
                Code = Str(p, "code"), Name = Str(p, "name"), Objective = Str(p, "objective"),
                UnitId = Str(p, "unitId"), OwnerId = Str(p, "ownerId"),
                StartDate = DateOnly.Parse(Str(p, "startDate"), CultureInfo.InvariantCulture),
                DueAt = Date(p, "dueAt"), Status = Enum<ProjectStatus>(Str(p, "status")),
                CompletedAt = OptDate(p, "completedAt"), CancelledAt = OptDate(p, "cancelledAt"),
                CreatedBy = OptStr(p, "createdBy") ?? Str(p, "ownerId"), UpdatedBy = OptStr(p, "updatedBy") ?? Str(p, "ownerId")
            });
            projects++;
        }
        Count("Projects", projects);

        var owners = Items("projects").ToDictionary(p => Str(p, "id"), p => Str(p, "ownerId"));
        var members = 0;
        foreach (var m in Items("members"))
        {
            var owner = owners[Str(m, "projectId")];
            context.ProjectMemberships.Add(new ProjectMembership
            {
                Id = Str(m, "id"), Version = Int(m, "version", 1), CreatedAt = _clock, UpdatedAt = _clock,
                ProjectId = Str(m, "projectId"), UserId = Str(m, "userId"),
                ProjectRole = Enum<ProjectRole>(Str(m, "projectRole")), EndedAt = OptDate(m, "endedAt"),
                CreatedBy = OptStr(m, "createdBy") ?? owner, UpdatedBy = OptStr(m, "updatedBy") ?? owner
            });
            members++;
        }
        Count("ProjectMemberships", members);
    }

    private void SeedTasks()
    {
        var owners = Items("projects").ToDictionary(p => Str(p, "id"), p => Str(p, "ownerId"));
        string[] started = ["IN_PROGRESS", "PENDING_REVIEW", "COMPLETED"];
        var count = 0;
        foreach (var t in Items("tasks"))
        {
            var owner = owners[Str(t, "projectId")];
            // Người nhận là người thao tác cuối khi việc đã bắt đầu; còn lại là owner dự án (tạo, giao, huỷ)
            var lastEditor = started.Contains(Str(t, "status")) ? OptStr(t, "assigneeId") ?? owner : owner;
            context.Tasks.Add(new WorkTask
            {
                Id = Str(t, "id"), Version = Int(t, "version", 1),
                CreatedAt = OptDate(t, "createdAt") ?? _clock, UpdatedAt = OptDate(t, "updatedAt") ?? _clock,
                ProjectId = Str(t, "projectId"), Title = Str(t, "title"), Description = OptStr(t, "description"),
                AcceptanceCriteria = Str(t, "acceptanceCriteria"), Priority = Enum<TaskPriority>(Str(t, "priority")),
                DueAt = Date(t, "dueAt"), OriginalDueAt = Date(t, "originalDueAt"),
                EstimatedMinutes = Int(t, "estimatedMinutes", 0), OriginalEstimatedMinutes = Int(t, "originalEstimatedMinutes", 0),
                RemainingMinutes = OptInt(t, "remainingMinutes"), AssigneeId = OptStr(t, "assigneeId"),
                Status = Enum<WorkTaskStatus>(Str(t, "status")), StatusChangedAt = Date(t, "statusChangedAt"),
                FirstStartedAt = OptDate(t, "firstStartedAt"), CompletedAt = OptDate(t, "completedAt"),
                CancelledAt = OptDate(t, "cancelledAt") ?? (Str(t, "status") == "CANCELLED" ? Date(t, "statusChangedAt") : null),
                LatestSubmissionId = OptStr(t, "latestSubmissionId"),
                CreatedBy = OptStr(t, "createdBy") ?? owner, UpdatedBy = OptStr(t, "updatedBy") ?? lastEditor
            });
            count++;
        }
        Count("Tasks", count);
    }

    private void SeedAssignments()
    {
        var owners = Items("projects").ToDictionary(p => Str(p, "id"), p => Str(p, "ownerId"));
        var projectOfTask = Items("tasks").ToDictionary(t => Str(t, "id"), t => Str(t, "projectId"));
        var count = 0;
        foreach (var a in Items("assignments"))
        {
            var taskId = Str(a, "taskId");
            context.TaskAssignments.Add(new TaskAssignment
            {
                Id = $"as-{taskId}-{count + 1}", TaskId = taskId, AssigneeId = Str(a, "userId"),
                AssignedBy = owners[projectOfTask[taskId]], StartedAt = Date(a, "startedAt"), EndedAt = OptDate(a, "endedAt")
            });
            count++;
        }
        Count("TaskAssignments", count);
    }

    private void SeedTimeLogs()
    {
        var count = 0;
        foreach (var l in Items("timeLogs"))
        {
            context.TimeLogs.Add(new TimeLog
            {
                Id = Str(l, "id"), Version = Int(l, "version", 1), CreatedAt = _clock, UpdatedAt = _clock,
                TaskId = Str(l, "taskId"), UserId = Str(l, "userId"),
                WorkDate = DateOnly.Parse(Str(l, "workDate"), CultureInfo.InvariantCulture),
                Minutes = Int(l, "minutes", 0), Description = Str(l, "description"),
                Status = Enum<TimeLogStatus>(Str(l, "status")), VoidReason = OptStr(l, "voidReason")
            });
            count++;
        }
        Count("TimeLogs", count);
    }

    private void SeedAttachments()
    {
        // Nội dung tệp mẫu chung của mock; Tasks.Api đọc tệp theo StoragePath tuyệt đối (thư mục wwwroot/uploads)
        var content = root.GetProperty("fileContent").GetString() ?? string.Empty;
        Directory.CreateDirectory(uploadsDir);
        var count = 0;
        foreach (var a in Items("attachments"))
        {
            var id = Str(a, "id");
            var path = Path.Combine(uploadsDir, id);
            File.WriteAllText(path, content);
            context.Attachments.Add(new Attachment
            {
                Id = id, Version = Int(a, "version", 1), CreatedAt = _clock, UpdatedAt = _clock,
                TaskId = Str(a, "taskId"), UploadedBy = Str(a, "uploadedBy"), Filename = Str(a, "filename"),
                MimeType = Str(a, "mimeType"), SizeBytes = new FileInfo(path).Length, StoragePath = path,
                Status = Enum<AttachmentStatus>(Str(a, "status"))
            });
            count++;
        }
        Count("Attachments", count);
    }

    private void SeedSubmissions()
    {
        var count = 0;
        foreach (var s in Items("submissions"))
        {
            context.Submissions.Add(new Submission
            {
                Id = Str(s, "id"), Version = Int(s, "version", 1), CreatedAt = Date(s, "submittedAt"), UpdatedAt = Date(s, "submittedAt"),
                TaskId = Str(s, "taskId"), Sequence = Int(s, "sequence", 1), SubmittedBy = Str(s, "submittedBy"),
                SubmittedAt = Date(s, "submittedAt"), Summary = Str(s, "summary"),
                Links = StrList(s, "links"), AttachmentIds = StrList(s, "attachmentIds"),
                DueAtSnapshot = Date(s, "dueAtSnapshot"), ActualMinutesSnapshot = Int(s, "actualMinutesSnapshot", 0),
                Status = Enum<SubmissionStatus>(Str(s, "status")), ReviewedBy = OptStr(s, "reviewedBy"),
                ReviewedAt = OptDate(s, "reviewedAt"), ReviewComment = OptStr(s, "reviewComment"),
                RequestedChanges = OptStr(s, "requestedChanges")
            });
            count++;
        }
        Count("Submissions", count);
    }

    private void SeedReports()
    {
        var count = 0;
        foreach (var r in Items("reports"))
        {
            var periodType = Enum<PeriodType>(Str(r, "periodType"));
            var periodStart = DateOnly.Parse(Str(r, "periodStart"), CultureInfo.InvariantCulture);
            context.Reports.Add(new Report
            {
                Id = Str(r, "id"), Version = Int(r, "version", 1), CreatedAt = _clock, UpdatedAt = _clock,
                ProjectId = Str(r, "projectId"), PeriodType = periodType, PeriodStart = periodStart,
                AuthorId = Str(r, "authorId"), Status = Enum<ReportStatus>(Str(r, "status")),
                Achievements = Str(r, "achievements"), Blockers = Str(r, "blockers"), NextPlan = Str(r, "nextPlan"),
                SelectedTaskIds = StrList(r, "selectedTaskIds"), ZeroTimeReason = OptStr(r, "zeroTimeReason"),
                SubmittedAt = OptDate(r, "submittedAt"),
                SnapshotJson = SnapshotJson(r, Str(r, "projectId"), periodType, periodStart)
            });
            count++;
        }
        Count("Reports", count);
    }

    // Cùng hình dạng ReportPreviewDto của Tasks.Api, serialize bằng option mặc định như ReportService
    private static string? SnapshotJson(JsonElement report, string projectId, PeriodType periodType, DateOnly periodStart)
    {
        if (!report.TryGetProperty("snapshot", out var snap) || snap.ValueKind != JsonValueKind.Object)
            return null;

        var startUtc = periodStart.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc).AddHours(-7);
        var preview = new
        {
            ProjectId = projectId,
            PeriodType = periodType,
            PeriodStart = periodStart,
            PeriodEndExclusive = startUtc.AddDays(periodType == PeriodType.Weekly ? 7 : 1),
            DataAsOf = Date(snap, "dataAsOf"),
            TotalMinutes = Int(snap, "totalMinutes", 0),
            Items = snap.GetProperty("items").EnumerateArray().Select(i => new
            {
                TaskId = Str(i, "taskId"),
                Title = Str(i, "title"),
                Status = Enum<WorkTaskStatus>(Str(i, "status")),
                Minutes = Int(i, "minutes", 0)
            }).ToList(),
            PartialPeriod = snap.TryGetProperty("partialPeriod", out var partial) && partial.GetBoolean()
        };
        return JsonSerializer.Serialize(preview);
    }

    private void SeedAlerts()
    {
        var count = 0;
        foreach (var a in Items("alerts"))
        {
            context.Alerts.Add(new Alert
            {
                Id = Str(a, "id"), Version = Int(a, "version", 1),
                CreatedAt = OptDate(a, "createdAt") ?? _clock, UpdatedAt = OptDate(a, "updatedAt") ?? _clock,
                ProjectId = Str(a, "projectId"), TaskId = OptStr(a, "taskId"),
                Type = Enum<AlertType>(Str(a, "type")), Severity = Enum<AlertSeverity>(Str(a, "severity")),
                Status = Enum<AlertStatus>(Str(a, "status")), ConditionActive = a.GetProperty("conditionActive").GetBoolean(),
                Evidence = StrList(a, "evidence"), DataAsOf = Date(a, "dataAsOf"), MethodVersion = Str(a, "methodVersion"),
                ResolutionNote = OptStr(a, "resolutionNote"), HandledBy = OptStr(a, "handledBy"), HandledAt = OptDate(a, "handledAt"),
                CreatedBy = OptStr(a, "createdBy") ?? AuditActors.System,
                UpdatedBy = OptStr(a, "updatedBy") ?? OptStr(a, "handledBy") ?? AuditActors.System
            });
            count++;
        }
        Count("Alerts", count);
    }

    private void SeedAudits()
    {
        // Mock dùng TASK/PROJECT; BE ghi theo tên entity (nameof(WorkTask), nameof(Project)...)
        var entityTypes = new Dictionary<string, string>
        {
            ["TASK"] = nameof(WorkTask), ["PROJECT"] = nameof(Project), ["USER"] = nameof(User),
            ["UNIT"] = nameof(Unit), ["TEAM"] = nameof(Team), ["MEMBER"] = nameof(ProjectMembership)
        };
        var count = 0;
        foreach (var a in Items("audits"))
        {
            var type = Str(a, "entityType");
            context.AuditLogs.Add(new AuditLog
            {
                Id = Str(a, "id"), EntityType = entityTypes.GetValueOrDefault(type, type), EntityId = Str(a, "entityId"),
                ActorId = Str(a, "actorId"), Action = Str(a, "action"), At = Date(a, "at"),
                BeforeJson = RawOrNull(a, "before"), AfterJson = RawOrNull(a, "after"), Reason = OptStr(a, "reason")
            });
            count++;
        }
        Count("AuditLogs", count);
    }

    private void SeedIpWhitelist()
    {
        var count = 0;
        foreach (var e in Items("ipWhitelist"))
        {
            context.IpWhitelistEntries.Add(new IpWhitelistEntry
            {
                Id = Str(e, "id"), Version = Int(e, "version", 1),
                CreatedAt = OptDate(e, "createdAt") ?? _clock, UpdatedAt = OptDate(e, "updatedAt") ?? _clock,
                CreatedBy = OptStr(e, "createdBy"), Cidr = Str(e, "cidr"), Description = OptStr(e, "description"),
                IsActive = e.GetProperty("isActive").GetBoolean(),
                UpdatedBy = OptStr(e, "updatedBy") ?? OptStr(e, "createdBy")
            });
            count++;
        }
        Count("IpWhitelistEntries", count);
    }

    private async Task SeedJobsAsync()
    {
        var jobs = 0;
        foreach (var j in Items("backgroundJobs"))
        {
            var code = Str(j, "code");
            var job = await context.BackgroundJobs.FirstOrDefaultAsync(x => x.Code == code);
            if (job is null)
            {
                // Analytics.Api cũng tự tạo dòng này khi khởi động; nạp trước để lịch sử chạy có job cha
                job = new BackgroundJob { Code = code, Version = Int(j, "version", 1) };
                context.BackgroundJobs.Add(job);
            }
            job.Name = Str(j, "name");
            job.Description = OptStr(j, "description");
            job.IsEnabled = j.GetProperty("isEnabled").GetBoolean();
            job.IntervalMinutes = Int(j, "intervalMinutes", 15);
            job.LastRunAt = OptDate(j, "lastRunAt");
            job.LastStatus = OptStr(j, "lastStatus");
            // Lần chạy kế tiếp tính từ bây giờ để job chạy thật ngay khi Analytics.Api khởi động
            job.NextRunAt = DateTime.UtcNow;
            job.UpdatedAt = OptDate(j, "updatedAt") ?? _clock;
            job.UpdatedBy = OptStr(j, "updatedBy") ?? AuditActors.System;
            jobs++;
        }
        Count("BackgroundJobs", jobs);

        var runs = 0;
        foreach (var r in Items("jobRuns"))
        {
            context.JobRuns.Add(new JobRun
            {
                Id = Str(r, "id"), JobCode = Str(r, "jobCode"), StartedAt = Date(r, "startedAt"), FinishedAt = OptDate(r, "finishedAt"),
                Status = Str(r, "status"), Trigger = Str(r, "trigger"), TriggeredBy = OptStr(r, "triggeredBy"),
                SummaryJson = RawOrNull(r, "summary"), Error = OptStr(r, "error")
            });
            runs++;
        }
        Count("JobRuns", runs);
    }

    // ---- Đọc JSON ----

    private IEnumerable<JsonElement> Items(string name)
    {
        return root.TryGetProperty(name, out var array) && array.ValueKind == JsonValueKind.Array
            ? array.EnumerateArray()
            : [];
    }

    private void Count(string table, int count)
    {
        _summary[table] = count;
    }

    private static string Str(JsonElement e, string name)
    {
        return e.GetProperty(name).GetString() ?? throw new InvalidDataException($"Thiếu '{name}'.");
    }

    private static string? OptStr(JsonElement e, string name)
    {
        return e.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.String ? v.GetString() : null;
    }

    private static int Int(JsonElement e, string name, int fallback)
    {
        return e.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.Number ? v.GetInt32() : fallback;
    }

    private static int? OptInt(JsonElement e, string name)
    {
        return e.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.Number ? v.GetInt32() : null;
    }

    private static DateTime Date(JsonElement e, string name)
    {
        return ReadDate(e.GetProperty(name));
    }

    private static DateTime? OptDate(JsonElement e, string name)
    {
        return e.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.String ? ReadDate(v) : null;
    }

    private static DateTime ReadDate(JsonElement v)
    {
        return DateTime.Parse(v.GetString()!, CultureInfo.InvariantCulture, DateTimeStyles.AdjustToUniversal | DateTimeStyles.AssumeUniversal);
    }

    private static List<string> StrList(JsonElement e, string name)
    {
        return e.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.Array
            ? v.EnumerateArray().Select(x => x.GetString()!).ToList()
            : [];
    }

    private static string? RawOrNull(JsonElement e, string name)
    {
        return e.TryGetProperty(name, out var v) && v.ValueKind is not (JsonValueKind.Null or JsonValueKind.Undefined)
            ? v.GetRawText()
            : null;
    }

    // "IN_PROGRESS" → WorkTaskStatus.InProgress
    private static T Enum<T>(string raw) where T : struct, System.Enum
    {
        return System.Enum.Parse<T>(raw.Replace("_", string.Empty), ignoreCase: true);
    }
}
