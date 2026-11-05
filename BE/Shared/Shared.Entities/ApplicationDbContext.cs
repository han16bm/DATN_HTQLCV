using Microsoft.EntityFrameworkCore;
using Shared.Entities.Entities;

namespace Shared.Entities;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Unit> Units => Set<Unit>();
    public DbSet<Team> Teams => Set<Team>();
    public DbSet<TeamMember> TeamMembers => Set<TeamMember>();
    public DbSet<PermissionGroup> PermissionGroups => Set<PermissionGroup>();
    public DbSet<PermissionGroupMember> PermissionGroupMembers => Set<PermissionGroupMember>();

    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectMembership> ProjectMemberships => Set<ProjectMembership>();

    public DbSet<WorkTask> Tasks => Set<WorkTask>();
    public DbSet<TaskAssignment> TaskAssignments => Set<TaskAssignment>();
    public DbSet<TimeLog> TimeLogs => Set<TimeLog>();
    public DbSet<Submission> Submissions => Set<Submission>();
    public DbSet<Attachment> Attachments => Set<Attachment>();
    public DbSet<Report> Reports => Set<Report>();

    public DbSet<Alert> Alerts => Set<Alert>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    public DbSet<Feature> Features => Set<Feature>();
    public DbSet<BackgroundJob> BackgroundJobs => Set<BackgroundJob>();
    public DbSet<JobRun> JobRuns => Set<JobRun>();
    public DbSet<SystemConfig> SystemConfigs => Set<SystemConfig>();
    public DbSet<IpWhitelistEntry> IpWhitelistEntries => Set<IpWhitelistEntry>();
    public DbSet<IpAccessLog> IpAccessLogs => Set<IpAccessLog>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<ProjectRolePolicy> ProjectRolePolicies => Set<ProjectRolePolicy>();
    public DbSet<AnalysisSnapshot> AnalysisSnapshots => Set<AnalysisSnapshot>();
    public DbSet<AnalysisJob> AnalysisJobs => Set<AnalysisJob>();
    public DbSet<AnalysisFeedback> AnalysisFeedback => Set<AnalysisFeedback>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var stringListConverter = new Microsoft.EntityFrameworkCore.Storage.ValueConversion.ValueConverter<List<string>, string>(
            v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
            v => System.Text.Json.JsonSerializer.Deserialize<List<string>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new List<string>());

        var stringListComparer = new Microsoft.EntityFrameworkCore.ChangeTracking.ValueComparer<List<string>>(
            (a, b) => (a ?? new List<string>()).SequenceEqual(b ?? new List<string>()),
            v => v.Aggregate(0, (hash, s) => HashCode.Combine(hash, s.GetHashCode())),
            v => v.ToList());

        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Status).HasConversion<string>();
            e.Property(x => x.GrantedFeatures).HasDefaultValueSql("'{}'::text[]");
            e.Property(x => x.RevokedFeatures).HasDefaultValueSql("'{}'::text[]");
            e.HasIndex(x => x.Username).IsUnique();
            e.Property(x => x.AvatarUrl).HasMaxLength(1000);
            e.Property(x => x.AvatarKey).HasMaxLength(500);
            e.HasOne(x => x.Unit).WithMany().HasForeignKey(x => x.UnitId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Unit>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Status).HasConversion<string>();
            e.HasOne(x => x.Parent).WithMany().HasForeignKey(x => x.ParentId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Team>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Status).HasConversion<string>();
        });

        modelBuilder.Entity<TeamMember>(e =>
        {
            e.HasKey(x => new { x.TeamId, x.UserId });
            e.HasOne(x => x.Team).WithMany(t => t.Members).HasForeignKey(x => x.TeamId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<PermissionGroup>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Status).HasConversion<string>();
            e.Property(x => x.Features).HasConversion(stringListConverter, stringListComparer);
            e.HasIndex(x => x.Code).IsUnique();
            e.HasData(SeedData.PermissionGroups());
        });

        modelBuilder.Entity<PermissionGroupMember>(e =>
        {
            e.HasKey(x => new { x.PermissionGroupId, x.UserId });
            e.HasOne(x => x.PermissionGroup).WithMany(g => g.Members).HasForeignKey(x => x.PermissionGroupId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Project>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Status).HasConversion<string>();
            e.HasIndex(x => x.Code).IsUnique();
        });

        modelBuilder.Entity<ProjectMembership>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.ProjectRole).HasConversion<string>();
            e.HasOne(x => x.Project).WithMany(p => p.Memberships).HasForeignKey(x => x.ProjectId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<WorkTask>(e =>
        {
            e.HasKey(x => x.Id);
            e.ToTable("Tasks");
            e.Property(x => x.Priority).HasConversion<string>();
            e.Property(x => x.Status).HasConversion<string>();
            e.HasOne(x => x.Project).WithMany().HasForeignKey(x => x.ProjectId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<TaskAssignment>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasOne(x => x.Task).WithMany(t => t.Assignments).HasForeignKey(x => x.TaskId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TimeLog>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Status).HasConversion<string>();
            e.HasOne(x => x.Task).WithMany(t => t.TimeLogs).HasForeignKey(x => x.TaskId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Submission>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Status).HasConversion<string>();
            e.Property(x => x.Links).HasConversion(stringListConverter, stringListComparer);
            e.Property(x => x.AttachmentIds).HasConversion(stringListConverter, stringListComparer);
            e.HasOne(x => x.Task).WithMany(t => t.Submissions).HasForeignKey(x => x.TaskId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Attachment>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Status).HasConversion<string>();
            e.HasOne(x => x.Task).WithMany(t => t.Attachments).HasForeignKey(x => x.TaskId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Report>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.PeriodType).HasConversion<string>();
            e.Property(x => x.Status).HasConversion<string>();
            e.Property(x => x.SelectedTaskIds).HasConversion(stringListConverter, stringListComparer);
            e.HasIndex(x => new { x.AuthorId, x.ProjectId, x.PeriodType, x.PeriodStart }).IsUnique();
        });

        modelBuilder.Entity<Notification>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Type).HasMaxLength(40);
            e.HasIndex(x => new { x.RecipientId, x.CreatedAt });
        });

        modelBuilder.Entity<ProjectRolePolicy>(e =>
        {
            e.HasKey(x => x.Role);
            e.Property(x => x.Role).HasMaxLength(20);
            e.Property(x => x.Permissions).HasDefaultValueSql("'{}'::text[]");
        });

        // Phân tích: bản chụp số liệu + job diễn giải + phản hồi (FE /analytics/details, /analytics/jobs).
        modelBuilder.Entity<AnalysisSnapshot>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasMaxLength(100);
            e.Property(x => x.SnapshotId).HasMaxLength(100);
            e.Property(x => x.AnalysisType).HasMaxLength(20);
            e.Property(x => x.SubjectKind).HasMaxLength(20);
            e.Property(x => x.SubjectId).HasMaxLength(100);
            e.Property(x => x.Title).HasMaxLength(255);
            e.Property(x => x.ExplanationStatus).HasMaxLength(20);
            e.Property(x => x.ProjectIds).HasDefaultValueSql("'{}'::text[]");
            e.HasIndex(x => x.ExpiresAt);
        });
        modelBuilder.Entity<AnalysisJob>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Status).HasMaxLength(20);
            e.HasIndex(x => x.AnalysisId);
        });
        modelBuilder.Entity<AnalysisFeedback>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Verdict).HasMaxLength(20);
            e.Property(x => x.Comment).HasMaxLength(2000);
            e.HasIndex(x => new { x.AnalysisId, x.CreatedAt });
        });

        modelBuilder.Entity<Alert>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Type).HasConversion<string>();
            e.Property(x => x.Severity).HasConversion<string>();
            e.Property(x => x.Status).HasConversion<string>();
            e.Property(x => x.Evidence).HasConversion(stringListConverter, stringListComparer);
        });

        modelBuilder.Entity<AuditLog>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.EntityType, x.EntityId });
            e.HasIndex(x => x.At).IsDescending();
            e.HasIndex(x => new { x.ActorId, x.At });
        });

        modelBuilder.Entity<Feature>(e =>
        {
            e.HasKey(x => x.Code);
            e.HasData(SeedData.Features());
        });

        modelBuilder.Entity<BackgroundJob>(e =>
        {
            e.HasKey(x => x.Code);
            e.ToTable(t => t.HasCheckConstraint("CK_BackgroundJobs_IntervalMinutes", "\"IntervalMinutes\" BETWEEN 1 AND 1440"));
        });

        modelBuilder.Entity<JobRun>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Error).HasMaxLength(4000);
            e.HasOne(x => x.Job).WithMany().HasForeignKey(x => x.JobCode).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => new { x.JobCode, x.StartedAt });
        });

        modelBuilder.Entity<SystemConfig>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Key).HasMaxLength(200);
            e.Property(x => x.ServiceType).HasMaxLength(50);
            e.Property(x => x.Group).HasMaxLength(50);
            e.Property(x => x.Name).HasMaxLength(255);
            e.Property(x => x.DataType).HasMaxLength(10);
            e.HasIndex(x => new { x.Key, x.ServiceType }).IsUnique();
            e.HasData(SeedData.SystemConfigs());
        });

        modelBuilder.Entity<IpWhitelistEntry>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Cidr).HasMaxLength(64);
        });

        modelBuilder.Entity<IpAccessLog>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Ip).HasMaxLength(64);
            e.Property(x => x.Scope).HasMaxLength(10);
            e.Property(x => x.Status).HasMaxLength(20);
            e.Property(x => x.LastUsername).HasMaxLength(100);
            e.Property(x => x.LastPath).HasMaxLength(500);
            e.Property(x => x.ResolveNote).HasMaxLength(2000);
            // Đích của INSERT … ON CONFLICT ("Ip","Scope") trong IpAccessRecorder
            e.HasIndex(x => new { x.Ip, x.Scope }).IsUnique();
        });
    }
}
