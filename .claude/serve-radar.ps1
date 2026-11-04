# Serves the repo (so live-radar/ can also read ../shows.json) and adds a /proxy route
# that relays requests to the music APIs, for the ones that block direct browser calls (CORS).
$root = "C:\Users\mdelr\COding CLaude"
$port = if ($env:PORT) { $env:PORT } else { "5600" }
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Serving $root on http://localhost:$port/live-radar/ (Mario's Local Live Music)"

$mimeTypes = @{
  ".html" = "text/html; charset=utf-8"
  ".css"  = "text/css"
  ".js"   = "application/javascript"
  ".json" = "application/json"
  ".png"  = "image/png"
  ".webmanifest" = "application/manifest+json"
}

# Only these hosts can be reached through the proxy.
$allowedHosts = @(
  "app.ticketmaster.com",
  "api.seatgeek.com",
  "api.data.jambase.com",
  "rest.bandsintown.com",
  "nominatim.openstreetmap.org"
)

Add-Type -AssemblyName System.Net.Http
$http = New-Object System.Net.Http.HttpClient
$http.DefaultRequestHeaders.UserAgent.ParseAdd("MariosLocalLiveMusic/1.0 (personal use)")

function Send-Bytes($response, $status, $contentType, $bytes) {
  $response.StatusCode = $status
  $response.ContentType = $contentType
  $response.Headers.Add("Cache-Control", "no-cache, no-store, must-revalidate")
  $response.ContentLength64 = $bytes.Length
  $response.OutputStream.Write($bytes, 0, $bytes.Length)
}

while ($listener.IsListening) {
  $context = $listener.GetContext()
  $request = $context.Request
  $response = $context.Response

  try {
    $path = $request.Url.LocalPath
    if ($path -eq "/proxy") {
      $target = $request.QueryString["url"]
      $uri = $null
      if ($target -and [System.Uri]::TryCreate($target, "Absolute", [ref]$uri) -and
          $uri.Scheme -eq "https" -and $allowedHosts -contains $uri.Host) {
        $msg = New-Object System.Net.Http.HttpRequestMessage("GET", $uri)
        $auth = $request.Headers["Authorization"]
        if ($auth) { [void]$msg.Headers.TryAddWithoutValidation("Authorization", $auth) }
        $upstream = $http.SendAsync($msg).Result
        $bytes = $upstream.Content.ReadAsByteArrayAsync().Result
        Send-Bytes $response ([int]$upstream.StatusCode) "application/json" $bytes
      } else {
        Send-Bytes $response 400 "text/plain" ([System.Text.Encoding]::UTF8.GetBytes("Host not allowed"))
      }
    } else {
      if ($path.EndsWith("/")) { $path += "index.html" }
      $filePath = Join-Path $root ($path.TrimStart("/"))
      if ((Test-Path $filePath -PathType Container)) {
        $response.Redirect($path + "/")
      } elseif (Test-Path $filePath -PathType Leaf) {
        $ext = [System.IO.Path]::GetExtension($filePath)
        $contentType = $mimeTypes[$ext]
        if (-not $contentType) { $contentType = "application/octet-stream" }
        Send-Bytes $response 200 $contentType ([System.IO.File]::ReadAllBytes($filePath))
      } else {
        Send-Bytes $response 404 "text/plain" ([System.Text.Encoding]::UTF8.GetBytes("404 Not Found"))
      }
    }
  } catch {
    try { Send-Bytes $response 502 "text/plain" ([System.Text.Encoding]::UTF8.GetBytes("Proxy error: $_")) } catch {}
  }
  $response.OutputStream.Close()
}
