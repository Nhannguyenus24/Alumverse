$ErrorActionPreference = "Stop"

if (-not (Test-Path ".env")) {
    Write-Host ".env not found" -ForegroundColor Red
    exit 1
}


Get-Content .env | Where-Object { $_ -match '=' -and -not $_.StartsWith("#") } | ForEach-Object {
    $name, $value = $_ -split '=', 2
    [System.Environment]::SetEnvironmentVariable($name.Trim(), $value.Trim(), "Process")
    Set-Item "env:\$($name.Trim())" $value.Trim()
}


Write-Host "Starting main service on port $env:SERVER_PORT"

.\mvnw.cmd spring-boot:run
