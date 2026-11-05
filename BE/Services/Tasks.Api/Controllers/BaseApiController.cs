using Microsoft.AspNetCore.Mvc;
using Shared.Commons.Attributes;
using Shared.Commons.Exceptions;

namespace Tasks.Api.Controllers;

[Audit]
public class BaseApiController(ILogger<BaseApiController> logger) : ControllerBase
{
    protected readonly ILogger<BaseApiController> Logger = logger;

    protected string ActorId => User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
        ?? throw new Shared.Commons.Exceptions.ValidationException("Thiếu định danh người dùng trong phiên.");

    protected int RequireIfMatch()
    {
        if (!Request.Headers.TryGetValue("If-Match", out var value) || !int.TryParse(value.ToString().Trim('"'), out var version))
            throw new PreconditionRequiredException("Thiếu header If-Match.");
        return version;
    }
}
