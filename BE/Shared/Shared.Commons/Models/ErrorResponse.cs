using System.Text.Json.Serialization;

namespace Shared.Commons.Models;

public record FieldErrorItem(List<string> Path, string Message);

public record ErrorResponse(
    string Code,
    string Message,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] List<FieldErrorItem>? FieldErrors = null,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] object? Details = null);
