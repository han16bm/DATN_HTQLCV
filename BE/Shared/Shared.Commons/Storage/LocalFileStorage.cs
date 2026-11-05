using Shared.Commons.Utils;

namespace Shared.Commons.Storage;

/// <summary>Lưu đĩa cục bộ dưới {ContentRoot}/{LocalRoot}; tệp Public phục vụ qua /api/{folder}/{name} của service sở hữu.</summary>
internal sealed class LocalFileStorage(string root, string publicBaseUrl)
{
    private const string Prefix = "local:";
    private readonly string _root = Path.GetFullPath(root);

    public async Task<StoredFile> SaveAsync(Stream content, string fileName, string contentType, string folder,
        StoredFileAccess access, CancellationToken cancellationToken)
    {
        var name = GuidGenerator.NewId() + FileNames.ExtensionFor(contentType, fileName);
        var directory = Path.Combine(_root, folder);
        Directory.CreateDirectory(directory);
        var path = Path.Combine(directory, name);
        await using (var file = File.Create(path))
            await content.CopyToAsync(file, cancellationToken);

        var url = access == StoredFileAccess.Public ? $"{publicBaseUrl.TrimEnd('/')}/api/{folder}/{name}" : null;
        return new StoredFile($"{Prefix}{folder}/{name}", url, new FileInfo(path).Length);
    }

    public Stream? OpenRead(string key)
    {
        var path = Resolve(key);
        return path is not null && File.Exists(path) ? File.OpenRead(path) : null;
    }

    public void Delete(string key)
    {
        var path = Resolve(key);
        if (path is not null && File.Exists(path)) File.Delete(path);
    }

    private string? Resolve(string key)
    {
        if (key.StartsWith(Prefix, StringComparison.Ordinal))
        {
            // Chặn path traversal: đường dẫn phải nằm trong thư mục gốc.
            var full = Path.GetFullPath(Path.Combine(_root, key[Prefix.Length..]));
            return full.StartsWith(_root + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase) ? full : null;
        }

        // Khoá cũ: đường dẫn tuyệt đối do bản base/DataSeeder ghi (wwwroot/uploads/{id}).
        return Path.IsPathRooted(key) ? key : null;
    }
}

internal static class FileNames
{
    private static readonly Dictionary<string, string> Extensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ["image/png"] = ".png",
        ["image/jpeg"] = ".jpg",
        ["image/webp"] = ".webp",
        ["application/pdf"] = ".pdf",
        ["text/plain"] = ".txt",
        ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"] = ".docx"
    };

    public static string ExtensionFor(string contentType, string fileName)
    {
        if (Extensions.TryGetValue(contentType, out var known)) return known;
        var ext = Path.GetExtension(fileName);
        return ext.Length is > 1 and <= 10 && ext[1..].All(char.IsAsciiLetterOrDigit) ? ext.ToLowerInvariant() : string.Empty;
    }
}
