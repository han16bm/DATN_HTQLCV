using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;

namespace Shared.Configuration;

/// <summary>
/// Mã hoá giá trị cấu hình bí mật (ConfigDefinition.Secret) trước khi lưu SystemConfigs: AES-256-GCM,
/// khoá dẫn xuất từ CentralConfig:SecretKey (nếu có) hoặc Jwt:SigningKey — khoá gốc vẫn chỉ nằm ở
/// appsettings.Shared.json/biến môi trường, DB chỉ giữ bản mã "enc:v1:...". Đổi khoá gốc thì phải nhập lại secret.
/// </summary>
public static class ConfigSecretBox
{
    public const string Prefix = "enc:v1:";

    public static string? RootSecret(IConfiguration configuration)
    {
        var root = configuration["CentralConfig:SecretKey"];
        return string.IsNullOrWhiteSpace(root) ? configuration["Jwt:SigningKey"] : root;
    }

    public static bool IsProtected(string? value) => value is not null && value.StartsWith(Prefix, StringComparison.Ordinal);

    public static string Protect(string plain, string rootSecret)
    {
        var key = DeriveKey(rootSecret);
        var nonce = RandomNumberGenerator.GetBytes(12);
        var data = Encoding.UTF8.GetBytes(plain);
        var cipher = new byte[data.Length];
        var tag = new byte[16];
        using (var aes = new AesGcm(key, 16))
            aes.Encrypt(nonce, data, cipher, tag);
        return Prefix + Convert.ToBase64String([.. nonce, .. cipher, .. tag]);
    }

    public static string Unprotect(string value, string rootSecret)
    {
        var raw = Convert.FromBase64String(value[Prefix.Length..]);
        var nonce = raw[..12];
        var tag = raw[^16..];
        var cipher = raw[12..^16];
        var plain = new byte[cipher.Length];
        using (var aes = new AesGcm(DeriveKey(rootSecret), 16))
            aes.Decrypt(nonce, cipher, tag, plain);
        return Encoding.UTF8.GetString(plain);
    }

    private static byte[] DeriveKey(string rootSecret) =>
        HKDF.DeriveKey(HashAlgorithmName.SHA256, Encoding.UTF8.GetBytes(rootSecret), 32, info: "datn-central-config-v1"u8.ToArray());
}
