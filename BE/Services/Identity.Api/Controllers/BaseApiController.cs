using Microsoft.AspNetCore.Mvc;
using Shared.Commons.Attributes;

namespace Identity.Api.Controllers;

[Audit]
public class BaseApiController(ILogger<BaseApiController> logger) : ControllerBase
{
    protected readonly ILogger<BaseApiController> Logger = logger;
}
