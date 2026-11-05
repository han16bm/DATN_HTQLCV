using Identity.Api.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Identity.Api.Controllers;

/// <summary>
/// Ảnh đại diện lưu cục bộ (khi chưa cấu hình Cloudinary). Công khai như ảnh CDN vì thẻ img không gửi token;
/// tên tệp ngẫu nhiên, ảnh mới luôn có tên mới nên cache lâu được.
/// </summary>
[ApiController]
[Route("api/avatars")]
public class AvatarsController(ILogger<BaseApiController> logger, IProfileService profileService) : BaseApiController(logger)
{
    [HttpGet("{name}")]
    [AllowAnonymous]
    public async Task<IActionResult> Get(string name)
    {
        var (content, contentType) = await profileService.OpenAvatarAsync(name);
        Response.Headers.CacheControl = "public, max-age=31536000, immutable";
        Response.Headers.XContentTypeOptions = "nosniff";
        return File(content, contentType);
    }
}
