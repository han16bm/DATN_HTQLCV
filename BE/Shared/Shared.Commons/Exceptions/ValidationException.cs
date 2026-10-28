using Shared.Commons.Models;

namespace Shared.Commons.Exceptions;

public class ValidationException(string message) : AppException(message, ErrorCodes.Validation);
