using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Shared.Commons.Exceptions;
using Shared.Commons.Utils;
using Shared.Entities;
using Shared.Entities.Entities;
using Shared.Entities.Enums;
using Tasks.Api.Interfaces;
using Tasks.Api.Models.Dtos;

namespace Tasks.Api.Services;

public class AttachmentService(ApplicationDbContext db, IWebHostEnvironment env) : BaseService(db), IAttachmentService
{
    private static readonly string[] AllowedMimeTypes = ["application/pdf", "image/png", "image/jpeg", "text/plain",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    private const long MaxBytes = 20 * 1024 * 1024;

    public UploadPolicyDto GetUploadPolicy()
    {
        return new(MaxBytes, 10, AllowedMimeTypes.ToList());
    }

    public async Task<AttachmentDto> UploadAsync(string taskId, IFormFile file, string actorId)
    {
        var task = await Db.Tasks.FirstOrDefaultAsync(t => t.Id == taskId) ?? throw new NotFoundException("Không tìm thấy công việc.");
        if (task.AssigneeId != actorId || task.Status != WorkTaskStatus.InProgress)
            throw new BusinessRuleException("Chỉ người nhận hiện tại ở Đang thực hiện được tải minh chứng.");
        if (file.Length == 0 || file.Length > MaxBytes)
            throw new ValidationException("Dung lượng tệp vượt giới hạn cho phép.");
        if (!AllowedMimeTypes.Contains(file.ContentType))
            throw new ValidationException("Loại tệp không được hỗ trợ.");

        // shortcut: lưu đĩa cục bộ wwwroot/uploads cho bản base; sản phẩm thật cần chuyển sang blob storage.
        var uploadsDir = Path.Combine(env.ContentRootPath, "wwwroot", "uploads");
        Directory.CreateDirectory(uploadsDir);
        var id = GuidGenerator.NewId();
        var storagePath = Path.Combine(uploadsDir, id);
        await using (var stream = File.Create(storagePath))
            await file.CopyToAsync(stream);

        var now = DateTime.UtcNow;
        var entity = new Attachment
        {
            Id = id,
            Version = 1,
            CreatedAt = now,
            UpdatedAt = now,
            TaskId = taskId,
            UploadedBy = actorId,
            Filename = file.FileName,
            MimeType = file.ContentType,
            SizeBytes = file.Length,
            StoragePath = storagePath,
            Status = AttachmentStatus.Ready
        };

        Db.Attachments.Add(entity);
        WriteAuditLog(nameof(Attachment), entity.Id, actorId, "UPLOAD", null, new { entity.Filename, entity.SizeBytes });
        await Db.SaveChangesAsync();
        return entity.ToDto();
    }

    public async Task<AttachmentDto> GetAsync(string attachmentId, string actorId)
    {
        var a = await Db.Attachments.AsNoTracking().FirstOrDefaultAsync(x => x.Id == attachmentId) ?? throw new NotFoundException("Không tìm thấy tệp.");
        await EnsureAccessAsync(a, actorId);
        return a.ToDto();
    }

    public async Task<(Stream Content, string MimeType, string Filename)> DownloadAsync(string attachmentId, string actorId)
    {
        var a = await Db.Attachments.AsNoTracking().FirstOrDefaultAsync(x => x.Id == attachmentId) ?? throw new NotFoundException("Không tìm thấy tệp.");
        await EnsureAccessAsync(a, actorId);
        if (!File.Exists(a.StoragePath))
            throw new NotFoundException("Tệp không còn trên hệ thống lưu trữ.");
        return (File.OpenRead(a.StoragePath), a.MimeType, a.Filename);
    }

    // Chỉ người tải lên hoặc thành viên đang hoạt động của dự án chứa công việc mới được xem/tải minh chứng.
    private async Task EnsureAccessAsync(Attachment a, string actorId)
    {
        if (a.UploadedBy == actorId) return;

        var task = await Db.Tasks.AsNoTracking().FirstOrDefaultAsync(t => t.Id == a.TaskId)
            ?? throw new NotFoundException("Không tìm thấy công việc.");
        var isMember = await Db.ProjectMemberships.AsNoTracking()
            .AnyAsync(m => m.ProjectId == task.ProjectId && m.UserId == actorId && m.EndedAt == null);
        if (!isMember)
            throw new ForbiddenException("Không có quyền truy cập tệp này.");
    }
}
