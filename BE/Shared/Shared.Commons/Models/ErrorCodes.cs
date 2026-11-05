namespace Shared.Commons.Models;

public static class ErrorCodes
{
    public const int Success = 100200;
    public const int Validation = 100422;
    public const int Unauthorized = 100401;
    public const int Forbidden = 100403;
    public const int NotFound = 100404;
    public const int Conflict = 100409;
    public const int PreconditionRequired = 100428;
    public const int PreconditionFailed = 100412;
    public const int RateLimited = 100429;
    public const int SystemError = 100500;
}
