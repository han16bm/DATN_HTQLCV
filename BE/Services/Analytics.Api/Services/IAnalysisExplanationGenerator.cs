using Analytics.Api.Models.Dtos;

namespace Analytics.Api.Services;

public interface IAnalysisExplanationGenerator
{
    Task<ExplanationDto> GenerateAsync(AnalysisSnapshotDto snapshot, CancellationToken cancellationToken);
}

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
