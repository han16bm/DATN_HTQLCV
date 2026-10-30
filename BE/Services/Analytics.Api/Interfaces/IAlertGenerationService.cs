namespace Analytics.Api.Interfaces;

public interface IAlertGenerationService
{
    Task GenerateAsync(CancellationToken cancellationToken);
}
