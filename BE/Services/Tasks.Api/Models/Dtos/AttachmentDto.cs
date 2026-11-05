using Shared.Entities.Enums;

namespace Tasks.Api.Models.Dtos;

public record AttachmentDto
{
    public required string Id { get; init; }
    public required int Version { get; init; }
    public required DateTime CreatedAt { get; init; }
    public required DateTime UpdatedAt { get; init; }
    public required string TaskId { get; init; }
    public required string UploadedBy { get; init; }
    public required string Filename { get; init; }
    public required string MimeType { get; init; }
    public required long SizeBytes { get; init; }
    public required AttachmentStatus Status { get; init; }
}

public record UploadPolicyDto(long MaxBytes, int MaxAttachments, List<string> AllowedMimeTypes);
