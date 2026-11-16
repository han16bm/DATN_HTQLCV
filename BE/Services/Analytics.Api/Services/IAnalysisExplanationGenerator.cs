using Analytics.Api.Models.Dtos;

namespace Analytics.Api.Services;

public interface IAnalysisExplanationGenerator
{
    Task<ExplanationDto> GenerateAsync(AnalysisSnapshotDto snapshot, CancellationToken cancellationToken);

    /// <summary>Chạy với provider/model đã cố định khi tạo job, không đọc lại cấu hình hiện tại.</summary>
    Task<ExplanationDto> GenerateAsync(AnalysisSnapshotDto snapshot, LlmTarget target, CancellationToken cancellationToken);
}

public sealed record LlmTarget(string Provider, string Model);

public sealed class AnalysisGenerationException(
    string code,
    string message,
    bool retryable,
    int? retryAfterSeconds = null) : Exception(message)
{
    public string Code { get; } = code;
    public bool Retryable { get; } = retryable;
    public int? RetryAfterSeconds { get; } = retryAfterSeconds;
}
