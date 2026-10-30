using Shared.Commons.Models;

namespace Shared.Commons.Exceptions;

public class UnauthorizedException(string message) : AppException(message, ErrorCodes.Unauthorized);
