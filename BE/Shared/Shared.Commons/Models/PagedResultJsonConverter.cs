using System.Text.Json;
using System.Text.Json.Serialization;

namespace Shared.Commons.Models;

/// <summary>Serialize PagedResult&lt;T&gt; thành {items, pagination:{page,pageSize,total}} đúng contract FE (Page&lt;T&gt;) — PagedResult&lt;T&gt; ở phía C# vẫn giữ Page/PageSize/Total phẳng cho tiện dùng trong code.</summary>
public class PagedResultJsonConverterFactory : JsonConverterFactory
{
    public override bool CanConvert(Type typeToConvert)
    {
        if (!typeToConvert.IsGenericType) return false;
        return typeToConvert.GetGenericTypeDefinition() == typeof(PagedResult<>);
    }

    public override JsonConverter CreateConverter(Type typeToConvert, JsonSerializerOptions options)
    {
        var itemType = typeToConvert.GetGenericArguments()[0];
        var converterType = typeof(PagedResultJsonConverter<>).MakeGenericType(itemType);
        return (JsonConverter)Activator.CreateInstance(converterType)!;
    }
}

public class PagedResultJsonConverter<T> : JsonConverter<PagedResult<T>>
{
    public override PagedResult<T>? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        throw new NotSupportedException("PagedResult<T> chỉ dùng để trả response, không nhận làm request body.");
    }

    public override void Write(Utf8JsonWriter writer, PagedResult<T> value, JsonSerializerOptions options)
    {
        writer.WriteStartObject();

        writer.WritePropertyName("items");
        JsonSerializer.Serialize(writer, value.Items, options);

        writer.WritePropertyName("pagination");
        writer.WriteStartObject();
        writer.WriteNumber("page", value.Page);
        writer.WriteNumber("pageSize", value.PageSize);
        writer.WriteNumber("total", value.Total);
        writer.WriteEndObject();

        writer.WriteEndObject();
    }
}
