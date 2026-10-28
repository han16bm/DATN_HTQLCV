using Shared.Commons.Models;

namespace Shared.Commons.Exceptions;

/// <summary>If-Match không khớp version hiện tại — entity vừa bị người khác sửa.</summary>
public class PreconditionFailedException(string message) : AppException(message, ErrorCodes.PreconditionFailed);
