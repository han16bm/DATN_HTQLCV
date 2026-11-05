using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace Shared.Commons.Extensions;

/// <summary>Query-string binding mặc định của ASP.NET Core khớp enum theo đúng tên member C# (vd "InProgress"),
/// không hiểu UPPER_SNAKE_CASE mà FE gửi (vd "IN_PROGRESS") — gây 422 cho mọi filter enum nhiều từ
/// (WorkTaskStatus.InProgress/PendingReview, SubmissionStatus.RevisionRequested, AlertType.DeadlineRisk...).
/// Chuyển "IN_PROGRESS" -> "InProgress" trước khi parse để khớp đúng contract.</summary>
public class SnakeCaseEnumModelBinderProvider : IModelBinderProvider
{
    public IModelBinder? GetBinder(ModelBinderProviderContext context)
    {
        var type = Nullable.GetUnderlyingType(context.Metadata.ModelType) ?? context.Metadata.ModelType;
        if (!type.IsEnum) return null;
        return new SnakeCaseEnumModelBinder(context.Metadata.ModelType);
    }
}

public class SnakeCaseEnumModelBinder(Type modelType) : IModelBinder
{
    public Task BindModelAsync(ModelBindingContext bindingContext)
    {
        var valueProviderResult = bindingContext.ValueProvider.GetValue(bindingContext.ModelName);
        if (valueProviderResult == ValueProviderResult.None) return Task.CompletedTask;

        bindingContext.ModelState.SetModelValue(bindingContext.ModelName, valueProviderResult);
        var value = valueProviderResult.FirstValue;
        if (string.IsNullOrWhiteSpace(value)) return Task.CompletedTask;

        var enumType = Nullable.GetUnderlyingType(modelType) ?? modelType;
        var parts = value.Split('_', StringSplitOptions.RemoveEmptyEntries);
        var pascalCase = string.Concat(parts.Select(part => char.ToUpperInvariant(part[0]) + part[1..].ToLowerInvariant()));

        if (Enum.TryParse(enumType, pascalCase, ignoreCase: true, out var result))
        {
            bindingContext.Result = ModelBindingResult.Success(result);
        }
        else
        {
            bindingContext.ModelState.TryAddModelError(bindingContext.ModelName, $"Giá trị '{value}' không hợp lệ cho {bindingContext.ModelName}.");
        }
        return Task.CompletedTask;
    }
}
