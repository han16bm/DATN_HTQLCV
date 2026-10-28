namespace Tasks.Api.Models.Requests;

public record CreateTimeLogRequest(DateOnly WorkDate, int Minutes, string Description);

public record UpdateTimeLogRequest(DateOnly? WorkDate, int? Minutes, string? Description, string Reason);

public record VoidTimeLogRequest(string Reason);
