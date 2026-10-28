using Microsoft.AspNetCore.Mvc;
using Shared.Commons.Attributes;

namespace Projects.Api.Controllers;

[Audit]
public abstract class BaseApiController(ILogger<BaseApiController> logger) : ControllerBase
{
    protected readonly ILogger<BaseApiController> Logger = logger;
}
