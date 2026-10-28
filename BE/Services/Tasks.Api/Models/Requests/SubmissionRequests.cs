namespace Tasks.Api.Models.Requests;

public record CreateSubmissionRequest(string Summary, List<string> Links, List<string> AttachmentIds);

public record ApproveSubmissionRequest(string? Comment);

public record RequestSubmissionRevisionRequest(string Reason, string RequestedChanges);
