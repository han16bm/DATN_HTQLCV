using System.Net;

namespace Shared.Entities.Authorization;

/// <summary>So khớp IP client với entry whitelist dạng IP đơn ("203.113.1.5") hoặc CIDR ("10.0.0.0/24", "::1/128").</summary>
public static class IpRules
{
    public static IPAddress? Normalize(IPAddress? ip)
    {
        return ip is not null && ip.IsIPv4MappedToIPv6 ? ip.MapToIPv4() : ip;
    }

    /// <summary>Trả dạng chuẩn để lưu; null khi không hợp lệ (CIDR có bit host khác 0 cũng bị coi là không hợp lệ).</summary>
    public static string? TryNormalizeCidr(string? raw)
    {
        var value = raw?.Trim();
        if (string.IsNullOrEmpty(value))
            return null;
        if (!value.Contains('/'))
            return IPAddress.TryParse(value, out var single) ? Normalize(single)!.ToString() : null;
        return IPNetwork.TryParse(value, out var network) ? network.ToString() : null;
    }

    public static bool Matches(string cidr, IPAddress? ip)
    {
        var client = Normalize(ip);
        if (client is null)
            return false;
        if (!cidr.Contains('/'))
            return IPAddress.TryParse(cidr, out var single) && Normalize(single)!.Equals(client);
        return IPNetwork.TryParse(cidr, out var network) && network.Contains(client);
    }

    public static bool AnyMatches(IEnumerable<string> cidrs, IPAddress? ip)
    {
        return cidrs.Any(c => Matches(c, ip));
    }
}
