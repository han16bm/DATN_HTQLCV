using System.Text;

namespace Shared.Commons.Storage;

/// <summary>
/// So khớp chữ ký đầu tệp với loại MIME khai báo — chặn tệp đổi đuôi/khai sai loại (ví dụ HTML khai là image/png).
/// </summary>
public static class FileSignatures
{
    public const int HeaderLength = 512;

    public static async Task<byte[]> ReadHeaderAsync(Stream stream, CancellationToken cancellationToken = default)
    {
        var buffer = new byte[HeaderLength];
        var read = 0;
        while (read < buffer.Length)
        {
            var n = await stream.ReadAsync(buffer.AsMemory(read), cancellationToken);
            if (n == 0) break;
            read += n;
        }
        return buffer[..read];
    }

    public static bool Matches(string contentType, ReadOnlySpan<byte> header)
    {
        return contentType switch
        {
            "image/png" => header.StartsWith(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }),
            "image/jpeg" => header.StartsWith(new byte[] { 0xFF, 0xD8, 0xFF }),
            "image/webp" => header.Length >= 12 && Encoding.ASCII.GetString(header[..4]) == "RIFF"
                && Encoding.ASCII.GetString(header[8..12]) == "WEBP",
            "application/pdf" => header.StartsWith("%PDF-"u8),
            // .docx là gói ZIP (OOXML)
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" =>
                header.StartsWith(new byte[] { 0x50, 0x4B, 0x03, 0x04 }),
            // Văn bản thuần: không chứa byte NUL ở phần đầu
            "text/plain" => !header.Contains((byte)0),
            _ => false
        };
    }
}
