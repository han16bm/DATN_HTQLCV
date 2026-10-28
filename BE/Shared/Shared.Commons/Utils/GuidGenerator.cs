namespace Shared.Commons.Utils;

public static class GuidGenerator
{
    public static string NewId() => Guid.NewGuid().ToString("N");
}
