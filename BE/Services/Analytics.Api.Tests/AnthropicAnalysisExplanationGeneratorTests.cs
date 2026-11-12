using System.Net;
using System.Text;
using Analytics.Api.Models.Dtos;
using Analytics.Api.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace Analytics.Api.Tests;

public sealed class AnalysisExplanationGeneratorTests
{
    [Fact]
    public async Task GenerateAsync_UsesServerSnapshotIdsAndOnlySendsMinimalAnalysisData()
    {
        string? capturedBody = null;
        string? capturedApiKey = null;
        var client = CreateClient(async (request, _) =>
        {
            capturedBody = await request.Content!.ReadAsStringAsync();
            capturedApiKey = request.Headers.GetValues("x-api-key").Single();
            return JsonResponse(ValidProviderResponse("""
                {"summary":"Cần theo dõi tiến độ.","findings":[{"title":"Có việc trễ hạn","text":"Căn cứ cho thấy nguy cơ cần theo dõi.","metricIds":["m-overdue"],"evidenceIds":["e-task"]}],"recommendations":[{"title":"Rà soát công việc","text":"Mở chi tiết để kiểm tra.","evidenceIds":["e-task"]}],"limitations":[]}
                """));
        });
        var generator = CreateGenerator(client, new Dictionary<string, string?>
        {
            ["Analytics:Anthropic:ApiKey"] = "test-api-key",
            ["Analytics:Anthropic:Model"] = "claude-test-model"
        });

        var explanation = await generator.GenerateAsync(Snapshot(), CancellationToken.None);

        Assert.Equal("analysis-server-id", explanation.AnalysisId);
        Assert.Equal("snapshot-server-id", explanation.SnapshotId);
        Assert.Equal("analytics-v2", explanation.PromptVersion);
        Assert.Equal("Anthropic Claude (claude-test-model)", explanation.ModelDisplayName);
        Assert.Equal("m-overdue", Assert.Single(Assert.Single(explanation.Findings).MetricIds));
        Assert.Equal("TASK_DETAIL", Assert.Single(explanation.Recommendations).Action?.Target);
        Assert.Equal("test-api-key", capturedApiKey);
        var body = Assert.IsType<string>(capturedBody);
        Assert.DoesNotContain("analysis-server-id", body);
        Assert.DoesNotContain("task-secret-id", body);
        Assert.DoesNotContain("person-private-id", body);
        Assert.DoesNotContain("Sensitive project title", body);
        Assert.DoesNotContain("task-action-id", body);
    }

    [Fact]
    public async Task GenerateAsync_UsesGeminiOpenAiCompatibleEndpointAndParsesItsResponse()
    {
        string? capturedBody = null;
        var client = CreateClient(async (request, _) =>
        {
            Assert.Equal(
                "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
                request.RequestUri?.ToString());
            Assert.Equal("Bearer", request.Headers.Authorization?.Scheme);
            Assert.Equal("test-gemini-key", request.Headers.Authorization?.Parameter);
            capturedBody = await request.Content!.ReadAsStringAsync();
            return JsonResponse("""
                {"choices":[{"message":{"content":"{\"summary\":\"Cần theo dõi tiến độ.\",\"findings\":[{\"title\":\"Có việc trễ hạn\",\"text\":\"Căn cứ cho thấy nguy cơ cần theo dõi.\",\"metricIds\":[\"m-overdue\"],\"evidenceIds\":[\"e-task\"]}],\"recommendations\":[{\"title\":\"Rà soát công việc\",\"text\":\"Mở chi tiết để kiểm tra.\",\"evidenceIds\":[\"e-task\"]}],\"limitations\":[]}"},"finish_reason":"stop"}]}
                """);
        });
        var generator = CreateGenerator(client, new Dictionary<string, string?>
        {
            ["Analytics:Provider"] = "Gemini",
            ["Analytics:Gemini:ApiKey"] = "test-gemini-key",
            ["Analytics:Gemini:Model"] = "gemini-test-model"
        });

        var explanation = await generator.GenerateAsync(Snapshot(), CancellationToken.None);

        Assert.Equal("Google Gemini (gemini-test-model)", explanation.ModelDisplayName);
        Assert.Equal("TASK_DETAIL", Assert.Single(explanation.Recommendations).Action?.Target);
        var body = Assert.IsType<string>(capturedBody);
        Assert.Contains("\"role\":\"system\"", body);
        Assert.DoesNotContain("analysis-server-id", body);
        Assert.DoesNotContain("task-secret-id", body);
    }

    [Fact]
    public async Task GenerateAsync_RejectsCitationsOutsideTheSnapshot()
    {
        var client = CreateClient((_, _) => Task.FromResult(JsonResponse(ValidProviderResponse("""
            {"summary":"Cần theo dõi.","findings":[{"title":"Không có căn cứ","text":"Thông tin không thuộc snapshot.","metricIds":["m-forged"],"evidenceIds":[]}],"recommendations":[],"limitations":[]}
            """))));
        var generator = CreateGenerator(client, new Dictionary<string, string?>
        {
            ["Analytics:Anthropic:ApiKey"] = "test-api-key"
        });

        var exception = await Assert.ThrowsAsync<AnalysisGenerationException>(
            () => generator.GenerateAsync(Snapshot(), CancellationToken.None));

        Assert.Equal("OUTPUT_INVALID", exception.Code);
    }

    [Fact]
    public async Task GenerateAsync_RejectsNumericClaimsInNarrative()
    {
        var client = CreateClient((_, _) => Task.FromResult(JsonResponse(ValidProviderResponse("""
            {"summary":"Tỷ lệ đạt 90%.","findings":[{"title":"Có việc trễ hạn","text":"Căn cứ cần theo dõi.","metricIds":["m-overdue"],"evidenceIds":[]}],"recommendations":[],"limitations":[]}
            """))));
        var generator = CreateGenerator(client, new Dictionary<string, string?>
        {
            ["Analytics:Anthropic:ApiKey"] = "test-api-key"
        });

        var exception = await Assert.ThrowsAsync<AnalysisGenerationException>(
            () => generator.GenerateAsync(Snapshot(), CancellationToken.None));

        Assert.Equal("OUTPUT_INVALID", exception.Code);
    }

    [Fact]
    public async Task GenerateAsync_SendsTheViolationBackOnceAndAcceptsTheRepairedOutput()
    {
        var bodies = new List<string>();
        var client = CreateClient(async (request, _) =>
        {
            bodies.Add(await request.Content!.ReadAsStringAsync());
            return JsonResponse(ValidProviderResponse(bodies.Count == 1
                ? """
                  {"summary":"Có 3 việc trễ hạn.","findings":[{"title":"Có việc trễ hạn","text":"Cần theo dõi.","metricIds":["m-overdue"],"evidenceIds":[]}],"recommendations":[],"limitations":[]}
                  """
                : """
                  {"summary":"Có việc trễ hạn cần theo dõi.","findings":[{"title":"Có việc trễ hạn","text":"Cần theo dõi.","metricIds":["m-overdue"],"evidenceIds":[]}],"recommendations":[],"limitations":[]}
                  """));
        });
        var generator = CreateGenerator(client, new Dictionary<string, string?>
        {
            ["Analytics:Anthropic:ApiKey"] = "test-api-key"
        });

        var explanation = await generator.GenerateAsync(Snapshot(), CancellationToken.None);

        Assert.Equal("Có việc trễ hạn cần theo dõi.", explanation.Summary);
        Assert.Equal(2, bodies.Count);
        using var retry = System.Text.Json.JsonDocument.Parse(bodies[1]);
        var turn = Assert.Single(retry.RootElement.GetProperty("messages").EnumerateArray());
        Assert.Equal("user", turn.GetProperty("role").GetString());
        var content = turn.GetProperty("content").GetString()!;
        Assert.Contains("Có 3 việc trễ hạn.", content);
        Assert.Contains("chữ số", content);
        Assert.Contains("m-overdue", content);
        Assert.DoesNotContain("analysis-server-id", bodies[1]);
    }

    [Fact]
    public async Task GenerateAsync_StopsAfterOneFailedRepair()
    {
        var calls = 0;
        var client = CreateClient((_, _) =>
        {
            calls++;
            return Task.FromResult(JsonResponse(ValidProviderResponse("not json")));
        });
        var generator = CreateGenerator(client, new Dictionary<string, string?>
        {
            ["Analytics:Anthropic:ApiKey"] = "test-api-key"
        });

        var exception = await Assert.ThrowsAsync<AnalysisGenerationException>(
            () => generator.GenerateAsync(Snapshot(), CancellationToken.None));

        Assert.Equal("OUTPUT_INVALID", exception.Code);
        Assert.Equal(2, calls);
    }

    [Fact]
    public async Task GenerateAsync_DoesNotRepeatProviderFailures()
    {
        var calls = 0;
        var client = CreateClient((_, _) =>
        {
            calls++;
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.TooManyRequests));
        });
        var generator = CreateGenerator(client, new Dictionary<string, string?>
        {
            ["Analytics:Anthropic:ApiKey"] = "test-api-key"
        });

        var exception = await Assert.ThrowsAsync<AnalysisGenerationException>(
            () => generator.GenerateAsync(Snapshot(), CancellationToken.None));

        Assert.Equal("PROVIDER_RATE_LIMIT", exception.Code);
        Assert.Equal(1, calls);
    }

    [Fact]
    public async Task GenerateAsync_RequestsStructuredOutputAndServerFallbackOnTheDefaultClaudeModel()
    {
        HttpRequestMessage? captured = null;
        string? body = null;
        var client = CreateClient(async (request, _) =>
        {
            captured = request;
            body = await request.Content!.ReadAsStringAsync();
            return JsonResponse(ValidProviderResponse(ValidOutput, model: "claude-opus-4-8"));
        });
        var generator = CreateGenerator(client, new Dictionary<string, string?>
        {
            ["Analytics:Anthropic:ApiKey"] = "test-api-key"
        });

        var explanation = await generator.GenerateAsync(Snapshot(), CancellationToken.None);

        using var json = System.Text.Json.JsonDocument.Parse(body!);
        Assert.Equal("claude-opus-5-5", json.RootElement.GetProperty("model").GetString());
        var format = json.RootElement.GetProperty("output_config").GetProperty("format");
        Assert.Equal("json_schema", format.GetProperty("type").GetString());
        Assert.False(format.GetProperty("schema").GetProperty("additionalProperties").GetBoolean());
        Assert.Equal("default", json.RootElement.GetProperty("fallbacks").GetString());
        Assert.Contains("server-side-fallback-2026-07-01", captured!.Headers.GetValues("anthropic-beta"));
        Assert.Equal("Anthropic Claude (claude-opus-4-8)", explanation.ModelDisplayName);
    }

    [Fact]
    public async Task GenerateAsync_UsesThePinnedTargetAndCanTurnStructuredOutputOff()
    {
        string? body = null;
        var client = CreateClient(async (request, _) =>
        {
            body = await request.Content!.ReadAsStringAsync();
            return JsonResponse(ValidProviderResponse(ValidOutput));
        });
        var generator = CreateGenerator(client, new Dictionary<string, string?>
        {
            ["Analytics:Anthropic:ApiKey"] = "test-api-key",
            ["Analytics:Anthropic:Model"] = "claude-current-config",
            ["Analytics:StructuredOutput"] = "false"
        });

        await generator.GenerateAsync(Snapshot(), new LlmTarget("Anthropic", "claude-pinned-model"), CancellationToken.None);

        using var json = System.Text.Json.JsonDocument.Parse(body!);
        Assert.Equal("claude-pinned-model", json.RootElement.GetProperty("model").GetString());
        Assert.False(json.RootElement.TryGetProperty("output_config", out _));
        Assert.False(json.RootElement.TryGetProperty("fallbacks", out _));
    }

    [Fact]
    public async Task GenerateAsync_SendsAJsonSchemaResponseFormatToGemini()
    {
        string? body = null;
        var client = CreateClient(async (request, _) =>
        {
            body = await request.Content!.ReadAsStringAsync();
            return JsonResponse(System.Text.Json.JsonSerializer.Serialize(new
            {
                model = "gemini-test-model",
                choices = new[] { new { message = new { content = ValidOutput }, finish_reason = "stop" } }
            }));
        });
        var generator = CreateGenerator(client, new Dictionary<string, string?>
        {
            ["Analytics:Provider"] = "Gemini",
            ["Analytics:Gemini:ApiKey"] = "test-gemini-key"
        });

        await generator.GenerateAsync(Snapshot(), CancellationToken.None);

        using var json = System.Text.Json.JsonDocument.Parse(body!);
        var format = json.RootElement.GetProperty("response_format");
        Assert.Equal("json_schema", format.GetProperty("type").GetString());
        Assert.Equal("analysis_explanation", format.GetProperty("json_schema").GetProperty("name").GetString());
        Assert.False(json.RootElement.TryGetProperty("fallbacks", out _));
    }

    [Fact]
    public async Task GenerateAsync_DoesNotRepairATruncatedResponse()
    {
        var calls = 0;
        var client = CreateClient((_, _) =>
        {
            calls++;
            return Task.FromResult(JsonResponse(ValidProviderResponse("{\"summary\":\"Cần", stopReason: "max_tokens")));
        });
        var generator = CreateGenerator(client, new Dictionary<string, string?>
        {
            ["Analytics:Anthropic:ApiKey"] = "test-api-key"
        });

        var exception = await Assert.ThrowsAsync<AnalysisGenerationException>(
            () => generator.GenerateAsync(Snapshot(), CancellationToken.None));

        Assert.Equal("OUTPUT_INVALID", exception.Code);
        Assert.Equal(1, calls);
    }

    [Fact]
    public async Task GenerateAsync_ReportsARefusalFromTheStopReason()
    {
        var client = CreateClient((_, _) =>
            Task.FromResult(JsonResponse(ValidProviderResponse(ValidOutput, stopReason: "refusal"))));
        var generator = CreateGenerator(client, new Dictionary<string, string?>
        {
            ["Analytics:Anthropic:ApiKey"] = "test-api-key"
        });

        var exception = await Assert.ThrowsAsync<AnalysisGenerationException>(
            () => generator.GenerateAsync(Snapshot(), CancellationToken.None));

        Assert.Equal("REFUSED", exception.Code);
    }

    private const string ValidOutput = """
        {"summary":"Cần theo dõi tiến độ.","findings":[{"title":"Có việc trễ hạn","text":"Căn cứ cho thấy nguy cơ cần theo dõi.","metricIds":["m-overdue"],"evidenceIds":["e-task"]}],"recommendations":[{"title":"Rà soát công việc","text":"Mở chi tiết để kiểm tra.","evidenceIds":["e-task"]}],"limitations":[]}
        """;

    [Fact]
    public async Task GenerateAsync_FailsExplicitlyWhenApiKeyIsMissing()
    {
        var generator = CreateGenerator(CreateClient((_, _) =>
            throw new InvalidOperationException("The provider must not be called.")), new Dictionary<string, string?>());

        var exception = await Assert.ThrowsAsync<AnalysisGenerationException>(
            () => generator.GenerateAsync(Snapshot(), CancellationToken.None));

        Assert.Equal("LLM_NOT_CONFIGURED", exception.Code);
    }

    private static AnalysisSnapshotDto Snapshot()
    {
        return new AnalysisSnapshotDto(
            "snapshot-server-id",
            "analysis-server-id",
            "RISK",
            "Sensitive project title",
            AnalysisSubjectDto.Person("person-private-id"),
            new AnalysisScopeDto(new DateOnly(2026, 11, 1), new DateOnly(2026, 11, 5)),
            DateTime.UtcNow,
            new QualityDto("SUFFICIENT"),
            [new MeasureDto("m-overdue", "Công việc quá hạn", 1, "TASK", "Số việc hiện quá hạn.")],
            [],
            [],
            [new EvidenceDto("e-task", "Hạn hoàn thành đã qua", null,
                new DomainActionDto("TASK_DETAIL", "task-secret-id", null, "task-action-id"))]);
    }

    private static AnalysisExplanationGenerator CreateGenerator(
        HttpClient client,
        Dictionary<string, string?> settings)
    {
        return new AnalysisExplanationGenerator(
            new TestHttpClientFactory(client),
            new ConfigurationBuilder().AddInMemoryCollection(settings).Build(),
            NullLogger<AnalysisExplanationGenerator>.Instance);
    }

    private static HttpClient CreateClient(
        Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> send)
    {
        return new HttpClient(new TestMessageHandler(send));
    }

    private static HttpResponseMessage JsonResponse(string json)
    {
        return new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json")
        };
    }

    private static string ValidProviderResponse(string text, string? model = null, string stopReason = "end_turn")
    {
        return System.Text.Json.JsonSerializer.Serialize(new
        {
            id = "msg-test",
            type = "message",
            role = "assistant",
            model,
            content = new[] { new { type = "text", text } },
            stop_reason = stopReason,
            stop_sequence = (string?)null,
            usage = new { input_tokens = 1, output_tokens = 1 }
        });
    }

    private sealed class TestHttpClientFactory(HttpClient client) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => client;
    }

    private sealed class TestMessageHandler(
        Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> send) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            return send(request, cancellationToken);
        }
    }
}
