# Monta a versão para PC do LockShopDown (pasta + ZIP para compartilhar).
# Uso: powershell -ExecutionPolicy Bypass -File launcher\build.ps1
# Precisa só do que já vem no Windows (compilador C# do .NET Framework).
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $root 'LockShopDown-PC'
$zip = Join-Path $root 'LockShopDown-PC.zip'
$csc = 'C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe'

# 1. compila o inicializador
& $csc /nologo /target:winexe /optimize+ "/win32icon:$PSScriptRoot\icon.ico" /r:System.Windows.Forms.dll "/out:$PSScriptRoot\LockShopDown.exe" "$PSScriptRoot\Launcher.cs"
if ($LASTEXITCODE -ne 0) { throw 'Falha ao compilar o inicializador.' }

# 2. monta a pasta
if (Test-Path $out) { Remove-Item $out -Recurse -Force }
New-Item -ItemType Directory -Path $out | Out-Null
Copy-Item (Join-Path $PSScriptRoot 'LockShopDown.exe') $out
Copy-Item (Join-Path $PSScriptRoot 'LEIA-ME.txt') $out
Copy-Item (Join-Path $root 'LockShopDown') (Join-Path $out 'game') -Recurse

# 3. compacta
if (Test-Path $zip) { Remove-Item $zip -Force }
Compress-Archive -Path (Join-Path $out '*') -DestinationPath $zip
$kb = [math]::Round((Get-Item $zip).Length / 1KB)
Write-Host "Pronto: $zip ($kb KB)"
