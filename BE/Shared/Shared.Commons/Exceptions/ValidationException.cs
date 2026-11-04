using Shared.Commons.Models;

namespace Shared.Commons.Exceptions;

public class ValidationException : AppException
{
    public ValidationException(string message) : base(message, ErrorCodes.Validation)
    {
    }

    public ValidationException(string message, List<string> path) : base(message, ErrorCodes.Validation)
    {
        FieldErrors = [new FieldErrorItem(path, message)];
    }
}
