param(
    [string] $Endpoint = "http://127.0.0.1:19455/bridge",
    [string] $ClientId = "82de61b8579f472c84e643baf8a20e76",
    [string] $SharedSecret = "HNanie2ToLicWyhZ4sXcaBDHE0888GEqhIstu8d4uIs="
)

function CreateHmac($request, $sharedSecret) {
    $canonical = "$($request.ProtocolVersion)`n$($request.Method)`n$($request.RequestId)`n$($request.TimestampUtcMs)`n$($request.Origin)`n$($request.ClientId)`n$($request.Payload)"
    $key = [System.Text.Encoding]::UTF8.GetBytes($sharedSecret)
    $data = [System.Text.Encoding]::UTF8.GetBytes($canonical)
    $hmac = New-Object System.Security.Cryptography.HMACSHA256 -ArgumentList @($key)
    $hash = $hmac.ComputeHash($data)
    return [System.Convert]::ToBase64String($hash)
}

function SendRequest($method, $payload = "{}") {
    $timestamp = [long](Get-Date -UFormat %s) * 1000
    $request = @{
        ProtocolVersion = 1
        Method = $method
        RequestId = [Guid]::NewGuid().ToString("N")
        TimestampUtcMs = $timestamp
        Origin = "chrome-extension://abcdefghijklmnopabcdefghijklmnop"
        ClientId = $ClientId
        Payload = $payload
    }
    
    $request.Authentication = CreateHmac $request $SharedSecret
    
    $json = $request | ConvertTo-Json -Depth 10
    Write-Host "Request: $json"
    
    $response = curl -X POST $Endpoint -H "Content-Type: application/json" -d $json
    Write-Host "Response: $response"
    return $response
}

Write-Host "Testing KeePassBrowserBridge Plugin"
Write-Host "====================================="
Write-Host ""

Write-Host "1. Testing hello..."
SendRequest "hello"
Write-Host ""

Write-Host "2. Testing client.status..."
SendRequest "client.status" "{}"
Write-Host ""

Write-Host "3. Testing clients.list..."
SendRequest "clients.list" "{}"
Write-Host ""

Write-Host "4. Testing logins.query..."
SendRequest "logins.query" '{"Url":"https://example.com"}'
Write-Host ""

Write-Host "5. Testing pair.begin..."
SendRequest "pair.begin" '{"ClientName":"TestBrowser"}'
Write-Host ""

Write-Host "Plugin test completed."
