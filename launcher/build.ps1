# Monta a versão para PC do LockShopDown (pasta + ZIP para compartilhar)
# e a versão para navegador (itch.io).
# Uso: powershell -ExecutionPolicy Bypass -File launcher\build.ps1
# Precisa só do que já vem no Windows (compilador C# e ZipFile do .NET Framework).
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $root 'LockShopDown-PC'
$zip = Join-Path $root 'LockShopDown-PC.zip'
$web = Join-Path $root 'LockShopDown-Web.zip'
$csc = 'C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe'

# Cria um ZIP com o conteúdo da pasta na raiz, arquivo por arquivo, nomeando cada
# entrada com barra normal (css/style.css). O Compress-Archive e o ZipFile do
# Windows PowerShell gravam com barra invertida (css\style.css), e servidores como
# o do itch.io tratam isso como um nome de arquivo e não encontram as pastas.
function New-Zip([string]$src, [string]$dst) {
    if (Test-Path $dst) { Remove-Item $dst -Force }
    $base = (Resolve-Path $src).Path.TrimEnd('\') + '\'
    $archive = [System.IO.Compression.ZipFile]::Open($dst, [System.IO.Compression.ZipArchiveMode]::Create)
    try {
        Get-ChildItem $src -Recurse -File | ForEach-Object {
            $name = $_.FullName.Substring($base.Length).Replace('\', '/')
            [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $_.FullName, $name, [System.IO.Compression.CompressionLevel]::Optimal)
        }
    } finally { $archive.Dispose() }
}

# 1. compila o inicializador
& $csc /nologo /target:winexe /optimize+ "/win32icon:$PSScriptRoot\icon.ico" /r:System.Windows.Forms.dll "/out:$PSScriptRoot\LockShopDown.exe" "$PSScriptRoot\Launcher.cs"
if ($LASTEXITCODE -ne 0) { throw 'Falha ao compilar o inicializador.' }

# 2. monta a pasta da versão para PC
if (Test-Path $out) { Remove-Item $out -Recurse -Force }
New-Item -ItemType Directory -Path $out | Out-Null
Copy-Item (Join-Path $PSScriptRoot 'LockShopDown.exe') $out
Copy-Item (Join-Path $PSScriptRoot 'LEIA-ME.txt') $out
Copy-Item (Join-Path $root 'LockShopDown') (Join-Path $out 'game') -Recurse

# 3. ZIP para PC
New-Zip $out $zip
Write-Host ("Pronto: {0} ({1} KB)" -f $zip, [math]::Round((Get-Item $zip).Length / 1KB))

# 4. ZIP para navegador (itch.io e afins): index.html na raiz
New-Zip (Join-Path $root 'LockShopDown') $web
Write-Host ("Pronto: {0} ({1} KB)" -f $web, [math]::Round((Get-Item $web).Length / 1KB))
