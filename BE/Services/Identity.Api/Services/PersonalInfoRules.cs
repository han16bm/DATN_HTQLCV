using System.Globalization;
using System.Text.RegularExpressions;
using Shared.Commons.Exceptions;
using Shared.Entities.Entities;

namespace Identity.Api.Services;

/// <summary>
/// Thông tin cá nhân (Users.PersonalInfoDTO, FE users/schemas/personal-info.schema.ts): mọi trường tùy chọn,
/// chuỗi rỗng = xóa (null), trim nội dung. Dùng chung cho hồ sơ cá nhân và màn quản trị tài khoản.
/// </summary>
public static partial class PersonalInfoRules
{
    public static readonly string[] Fields = ["gender", "birthDate", "phone", "permanentAddress", "temporaryAddress"];

    /// <summary>Gán một trường theo tên camelCase; giá trị đã chuẩn hóa/kiểm tra.</summary>
    public static void Apply(User user, string field, string? raw)
    {
        switch (field)
        {
            case "gender": user.Gender = Gender(raw); break;
            case "birthDate": user.BirthDate = BirthDate(raw); break;
            case "phone": user.Phone = Phone(raw); break;
            case "permanentAddress": user.PermanentAddress = Address(raw, field); break;
            case "temporaryAddress": user.TemporaryAddress = Address(raw, field); break;
            default: throw new ArgumentOutOfRangeException(nameof(field), field, null);
        }
    }

    public static object Snapshot(User u) => new { u.Gender, u.BirthDate, u.Phone, u.PermanentAddress, u.TemporaryAddress };

    private static string? Gender(string? raw)
    {
        var value = Clean(raw);
        if (value is null) return null;
        return value is "MALE" or "FEMALE" or "OTHER"
            ? value
            : throw new ValidationException("Giới tính không hợp lệ.", ["gender"]);
    }

    private static DateOnly? BirthDate(string? raw)
    {
        var value = Clean(raw);
        if (value is null) return null;
        if (!DateOnly.TryParseExact(value, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
            throw new ValidationException("Ngày sinh không hợp lệ.", ["birthDate"]);
        // Ngày theo giờ Việt Nam (UTC+7) như FE.
        if (date > DateOnly.FromDateTime(DateTime.UtcNow.AddHours(7)))
            throw new ValidationException("Ngày sinh không được ở tương lai.", ["birthDate"]);
        return date;
    }

    private static string? Phone(string? raw)
    {
        var value = Clean(raw);
        if (value is null) return null;
        var digits = value.Count(char.IsAsciiDigit);
        if (value.Length > 32 || !PhonePattern().IsMatch(value) || digits is < 7 or > 15)
            throw new ValidationException("Vui lòng nhập số điện thoại hợp lệ (7–15 chữ số).", ["phone"]);
        return value;
    }

    private static string? Address(string? raw, string field)
    {
        var value = Clean(raw);
        if (value is { Length: > 500 })
            throw new ValidationException("Địa chỉ tối đa 500 ký tự.", [field]);
        return value;
    }

    private static string? Clean(string? raw) => string.IsNullOrWhiteSpace(raw) ? null : raw.Trim();

    [GeneratedRegex(@"^\+?[\d\s().-]+$")]
    private static partial Regex PhonePattern();
}
