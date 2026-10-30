# Rebuilds the PDF and images in site/assets from the HTML files in this folder.
# Run from the project folder:  powershell -ExecutionPolicy Bypass -File tools\build-assets.ps1
$ErrorActionPreference = "Stop"
$root   = Split-Path -Parent $PSScriptRoot
$tools  = Join-Path $root "tools"
$assets = Join-Path $root "site\assets"

$chrome = @(
  "C:\Program Files\Google\Chrome\Application\chrome.exe",
  "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $chrome) { throw "Chrome or Edge not found." }

function Url($name) { "file:///" + ((Join-Path $tools $name) -replace '\\','/') }

& $chrome --headless=new --disable-gpu --no-pdf-header-footer `
  "--print-to-pdf=$(Join-Path $assets 'latin-declension-conjugation-id-sheet.pdf')" (Url "id-sheet.html") | Out-Null
& $chrome --headless=new --disable-gpu --hide-scrollbars --window-size=1200,630 `
  "--screenshot=$(Join-Path $assets 'og-image.png')" (Url "og-image.html") | Out-Null
& $chrome --headless=new --disable-gpu --hide-scrollbars --window-size=180,180 `
  "--screenshot=$(Join-Path $assets 'apple-touch-icon.png')" (Url "apple-touch-icon.html") | Out-Null

Get-ChildItem $assets | Select-Object Name, Length
