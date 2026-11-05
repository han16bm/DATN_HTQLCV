using Microsoft.AspNetCore.Mvc;
using Shared.Commons.Attributes;

namespace Analytics.Api.Controllers;

[Audit]
public class BaseApiController : ControllerBase
{
    protected readonly ILogger<BaseApiController> Logger;

    public BaseApiController(ILogger<BaseApiController> logger)
    {
        Logger = logger;
    }
}
