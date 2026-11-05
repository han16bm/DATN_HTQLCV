using Shared.Commons.Models;

namespace Shared.Commons.Exceptions;

/// <summary>Vi phạm điều kiện nghiệp vụ hợp lệ về mặt dữ liệu (sai trạng thái, sai điều kiện chuyển bước...).</summary>
public class BusinessRuleException(string message) : AppException(message, ErrorCodes.Conflict);
