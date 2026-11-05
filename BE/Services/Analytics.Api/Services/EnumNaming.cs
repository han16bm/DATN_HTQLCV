using System.Text;

namespace Analytics.Api.Services;

/// <summary>PascalCase enum name -> UPPER_SNAKE_CASE để khớp đúng string enum trong DTO_MODELS.md.</summary>
internal static class EnumNaming
{
    public static string ToUpperSnake(this Enum value)
    {
        var name = value.ToString();
        var sb = new StringBuilder();
        for (var i = 0; i < name.Length; i++)
        {
            if (i > 0 && char.IsUpper(name[i])) sb.Append('_');
            sb.Append(char.ToUpperInvariant(name[i]));
        }
        return sb.ToString();
    }
}
