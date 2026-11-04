namespace Analytics.Api.Interfaces;

public record AlertGenerationSummary(int Created, int Updated, int Deactivated);

public interface IAlertGenerationService
{
    Task<AlertGenerationSummary> GenerateAsync(CancellationToken cancellationToken);
}
