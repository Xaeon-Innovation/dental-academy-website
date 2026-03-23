# Run Stripe webhook forwarding without relying on PATH (Windows / winget install).
# Usage: from web/ folder: .\scripts\stripe-listen.ps1
# Optional: .\scripts\stripe-listen.ps1 3001   (if dev server uses another port)

$port = if ($args[0]) { $args[0] } else { "3000" }
$forward = "localhost:$port/api/webhooks/stripe"

$stripeExe = $null
$cmdStripe = Get-Command stripe -ErrorAction SilentlyContinue
if ($cmdStripe -and $cmdStripe.Source -and (Test-Path -LiteralPath $cmdStripe.Source)) {
    $stripeExe = $cmdStripe.Source
}
if (-not $stripeExe) {
    $wingetPath = Join-Path $env:LOCALAPPDATA "Microsoft\WinGet\Packages\Stripe.StripeCli_Microsoft.Winget.Source_8wekyb3d8bbwe\stripe.exe"
    if (Test-Path -LiteralPath $wingetPath) {
        $stripeExe = $wingetPath
    }
}
if (-not $stripeExe) {
    $pkg = Get-ChildItem (Join-Path $env:LOCALAPPDATA "Microsoft\WinGet\Packages") -Directory -Filter "Stripe.StripeCli_*" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($pkg) {
        $stripeExe = Join-Path $pkg.FullName "stripe.exe"
    }
}
if (-not $stripeExe -or -not (Test-Path -LiteralPath $stripeExe)) {
    Write-Error "stripe.exe not found. Install with: winget install Stripe.StripeCli"
    exit 1
}

Write-Host "Using: $stripeExe"
Write-Host "Forwarding to: http://$forward"
& $stripeExe listen --forward-to "http://$forward"
