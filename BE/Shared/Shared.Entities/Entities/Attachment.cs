using Shared.Entities.Enums;

namespace Shared.Entities.Entities;

public class Attachment
{
    public string Id { get; set; } = null!;
    public int Version { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public string TaskId { get; set; } = null!;
    public string UploadedBy { get; set; } = null!;
    public string Filename { get; set; } = null!;
    public string MimeType { get; set; } = null!;
    public long SizeBytes { get; set; }
    public string StoragePath { get; set; } = null!;
    public AttachmentStatus Status { get; set; }

    public WorkTask? Task { get; set; }
}
