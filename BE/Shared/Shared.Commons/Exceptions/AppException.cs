using Shared.Commons.Models;

namespace Shared.Commons.Exceptions;

public class AppException : Exception
{
    public int ErrorCode { get; }

    public AppException(string message, int errorCode = ErrorCodes.SystemError) : base(message)
    {
        ErrorCode = errorCode;
    }
}
