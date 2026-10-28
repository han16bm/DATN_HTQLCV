using Shared.Commons.Models;

namespace Shared.Commons.Exceptions;

public class ForbiddenException(string message) : AppException(message, ErrorCodes.Forbidden);
