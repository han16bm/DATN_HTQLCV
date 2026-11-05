using Shared.Commons.Models;

namespace Shared.Commons.Exceptions;

/// <summary>422 BUSINESS_RULE — dữ liệu hợp lệ nhưng thao tác vi phạm ràng buộc an toàn (sysadmin cuối cùng, tự khoá IP...).</summary>
public class UnprocessableRuleException : AppException
{
    public UnprocessableRuleException(string message) : base(message, ErrorCodes.Validation)
    {
        Code = "BUSINESS_RULE";
    }
}
