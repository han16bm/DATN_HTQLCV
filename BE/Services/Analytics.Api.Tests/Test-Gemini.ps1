$ErrorActionPreference = "Stop"

$projectPath = (Resolve-Path (Join-Path $PSScriptRoot "..\Analytics.Api\Analytics.Api.csproj")).Path
$secretLines = & dotnet user-secrets list --project $projectPath 2>&1
if ($LASTEXITCODE -ne 0) {
    throw "Could not read Analytics.Api User Secrets. Verify the .NET SDK and project configuration."
}

$secrets = @{}
foreach ($line in $secretLines) {
    if ("$line" -match '^(Analytics:Gemini:ApiKey|Analytics:Gemini:Model|Analytics:Provider)\s*=\s*(.*)$') {
        $secrets[$Matches[1]] = $Matches[2]
    }
}

$apiKey = $secrets["Analytics:Gemini:ApiKey"]
if ([string]::IsNullOrWhiteSpace($apiKey)) {
    throw 'Gemini API key is missing. Set Analytics:Gemini:ApiKey with dotnet user-secrets.'
}
if ($secrets["Analytics:Provider"] -and $secrets["Analytics:Provider"] -ne "Gemini") {
    Write-Warning "Analytics:Provider is not Gemini; this script will still test Gemini directly."
}

$model = $secrets["Analytics:Gemini:Model"]
if ([string]::IsNullOrWhiteSpace($model)) {
    $model = "gemini-3.5-flash-lite"
}

Add-Type -AssemblyName System.Net.Http
$client = [System.Net.Http.HttpClient]::new()
$client.Timeout = [TimeSpan]::FromSeconds(90)
$request = [System.Net.Http.HttpRequestMessage]::new(
    [System.Net.Http.HttpMethod]::Post,
    "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
)
$request.Headers.Authorization =
    [System.Net.Http.Headers.AuthenticationHeaderValue]::new("Bearer", $apiKey)
$request.Headers.Accept.ParseAdd("application/json")
$body = @{
    model = $model
    max_tokens = 32
    messages = @(
        @{ role = "user"; content = "Reply with exactly: GEMINI_OK" }
    )
} | ConvertTo-Json -Depth 5 -Compress
$request.Content = [System.Net.Http.StringContent]::new(
    $body,
    [System.Text.Encoding]::UTF8,
    "application/json"
)

try {
    Write-Host "Testing Gemini model: $model"
    $response = $client.SendAsync($request).GetAwaiter().GetResult()
    $responseBody = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()

    if (-not $response.IsSuccessStatusCode) {
        $safeBody = $responseBody.Replace($apiKey, "[redacted]")
        Write-Host "Gemini API returned HTTP $([int]$response.StatusCode) $($response.ReasonPhrase)."
        if ($safeBody) {
            Write-Host $safeBody
        }
        exit 1
    }

    $result = $responseBody | ConvertFrom-Json
    $text = $result.choices[0].message.content
    if ([string]::IsNullOrWhiteSpace($text)) {
        throw "Gemini returned HTTP success but no response text."
    }

    Write-Host "Gemini API call succeeded."
    Write-Host "Model: $($result.model)"
    Write-Host "Response: $text"
}
catch [System.Threading.Tasks.TaskCanceledException] {
    throw "Gemini did not respond within 90 seconds. Check network access and try again."
}
finally {
    $request.Dispose()
    $client.Dispose()
    Remove-Variable apiKey, secretLines, secrets -ErrorAction SilentlyContinue
}
