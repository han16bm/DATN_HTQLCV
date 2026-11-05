using Shared.Commons.Models;

namespace Shared.Commons.Exceptions;

/// <summary>API yêu cầu If-Match nhưng request không gửi kèm.</summary>
public class PreconditionRequiredException(string message) : AppException(message, ErrorCodes.PreconditionRequired);
