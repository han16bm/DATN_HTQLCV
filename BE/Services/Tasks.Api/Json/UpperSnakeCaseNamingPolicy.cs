using System.Text;
using System.Text.Json;

namespace Tasks.Api.Json;

/// <summary>Enum JSON phải khớp contract dạng UPPER_SNAKE_CASE (vd IN_PROGRESS), không phải tên C# PascalCase.</summary>
public class UpperSnakeCaseNamingPolicy : JsonNamingPolicy
{
    public static readonly UpperSnakeCaseNamingPolicy Instance = new();

    public override string ConvertName(string name)
    {
        var sb = new StringBuilder();
        for (var i = 0; i < name.Length; i++)
        {
            if (char.IsUpper(name[i]) && i > 0)
                sb.Append('_');
            sb.Append(char.ToUpperInvariant(name[i]));
        }
        return sb.ToString();
    }
}
