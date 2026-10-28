using Shared.Commons.Models;

namespace Shared.Commons.Exceptions;

public class NotFoundException(string message) : AppException(message, ErrorCodes.NotFound);
