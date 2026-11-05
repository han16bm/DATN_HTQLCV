using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Shared.Commons.Exceptions;
using Shared.Commons.Storage;
using Shared.Commons.Utils;
using Shared.Entities;
using Shared.Entities.Entities;
using Shared.Entities.Enums;
using Tasks.Api.Interfaces;
using Tasks.Api.Models.Dtos;

namespace Tasks.Api.Services;

public class AttachmentService(ApplicationDbContext db, IFileStorage storage, IHttpContextAccessor http) : BaseService(db, http), IAttachmentService
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
        var task = await RequireTaskAsync(taskId);
        if (task.AssigneeId != actorId || task.Status != WorkTaskStatus.InProgress)
            throw new BusinessRuleException("Chỉ người nhận hiện tại ở Đang thực hiện được tải minh chứng.");
        if (file.Length == 0 || file.Length > MaxBytes)
            throw new ValidationException("Dung lượng tệp vượt giới hạn cho phép.");
        if (!AllowedMimeTypes.Contains(file.ContentType))
            throw new ValidationException("Loại tệp không được hỗ trợ.");

        // Chặn tệp khai sai loại (ví dụ HTML đổi đuôi .png): chữ ký đầu tệp phải khớp MIME.
        await using (var probe = file.OpenReadStream())
        {
            if (!FileSignatures.Matches(file.ContentType, await FileSignatures.ReadHeaderAsync(probe)))
                throw new ValidationException("Nội dung tệp không khớp loại tệp đã chọn.", ["file"]);
        }

        // Minh chứng là dữ liệu nội bộ: lưu Private (Cloudinary private/raw hoặc đĩa cục bộ), chỉ tải qua BE sau kiểm quyền.
        StoredFile stored;
        await using (var content = file.OpenReadStream())
            stored = await storage.SaveAsync(content, file.FileName, file.ContentType, "evidence", StoredFileAccess.Private);
        var id = GuidGenerator.NewId();

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
            StoragePath = stored.Key,
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
        var content = await storage.OpenReadAsync(a.StoragePath)
            ?? throw new NotFoundException("Tệp không còn trên hệ thống lưu trữ.");
        return (content, a.MimeType, a.Filename);
    }

    // Chỉ người tải lên hoặc người thấy được công việc chứa tệp mới được xem/tải minh chứng.
    private async Task EnsureAccessAsync(Attachment a, string actorId)
    {
        if (a.UploadedBy != actorId) await RequireTaskAsync(a.TaskId);
    }
}
