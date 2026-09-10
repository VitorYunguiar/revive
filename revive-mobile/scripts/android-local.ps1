param(
    [ValidateSet('setup', 'dev', 'apk', 'bundle', 'studio')]
    [string]$Action = 'setup'
)
$ErrorActionPreference = 'Stop'
$projectDir = Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $projectDir

function Invoke-Checked {
    param([string]$Program, [string[]]$Arguments)
    & $Program @Arguments
    if ($LASTEXITCODE -ne 0) { throw "Falha em $Program (codigo $LASTEXITCODE)." }
}

$sdkCandidates = @($env:ANDROID_HOME, $env:ANDROID_SDK_ROOT, "$env:LOCALAPPDATA\Android\Sdk")
$sdkDir = $sdkCandidates | Where-Object { $_ -and (Test-Path -LiteralPath "$_\platform-tools\adb.exe") } | Select-Object -First 1
if (!$sdkDir) { throw 'Instale o Android SDK pelo SDK Manager do Android Studio.' }
$javaCandidates = @($env:REVIVE_JAVA_HOME, 'C:\Program Files\Java\jdk-17', $env:JAVA_HOME, 'C:\Program Files\Android\Android Studio\jbr')
$javaDir = $javaCandidates | Where-Object { $_ -and (Test-Path -LiteralPath "$_\bin\javac.exe") } | Select-Object -First 1
if (!$javaDir) { throw 'Instale JDK 17 ou defina REVIVE_JAVA_HOME para seu JDK.' }
$env:JAVA_HOME = $javaDir
$env:ANDROID_HOME = $sdkDir
$env:ANDROID_SDK_ROOT = $sdkDir
$env:PATH = "$javaDir\bin;$sdkDir\platform-tools;$env:PATH"
$env:EXPO_PUBLIC_APP_ENV = if ($Action -eq 'dev') { 'development' } else { 'preview' }
$env:NODE_ENV = if ($Action -eq 'dev') { 'development' } else { 'production' }
$expoCli = Join-Path $projectDir 'node_modules\expo\bin\cli'
if (!(Test-Path -LiteralPath $expoCli)) { throw 'Execute npm ci antes de preparar o Android.' }

if ($Action -ne 'dev' -or !(Test-Path -LiteralPath "$projectDir\android\gradlew.bat")) {
    Invoke-Checked 'node' @($expoCli, 'prebuild', '--platform', 'android', '--no-install', '--no-clean')
}
$utf8 = New-Object System.Text.UTF8Encoding($false)
[IO.File]::WriteAllText("$projectDir\android\local.properties", "sdk.dir=$($sdkDir.Replace('\', '/'))`n", $utf8)
New-Item -ItemType Directory -Force -Path "$projectDir\android\.gradle" | Out-Null
[IO.File]::WriteAllText("$projectDir\android\.gradle\config.properties", "java.home=$($javaDir.Replace('\', '/'))`n", $utf8)
Write-Host "Android pronto: $projectDir\android"

switch ($Action) {
    'dev' {
        Invoke-Checked 'node' @($expoCli, 'run:android', '--app-id', 'com.reviveapp.revive.dev')
    }
    { $_ -in 'apk', 'bundle' } {
        if (!(Test-Path -LiteralPath "$projectDir\credentials.json")) {
            throw 'Baixe a assinatura existente: eas credentials -p android > credentials.json > Download.'
        }
        $gradleTask = if ($Action -eq 'apk') { ':app:assembleRelease' } else { ':app:bundleRelease' }
        Push-Location -LiteralPath "$projectDir\android"
        try { Invoke-Checked '.\gradlew.bat' @($gradleTask, '--console=plain', '--max-workers=2') }
        finally { Pop-Location }
        $sourceFile = if ($Action -eq 'apk') { 'android\app\build\outputs\apk\release\app-release.apk' } else { 'android\app\build\outputs\bundle\release\app-release.aab' }
        New-Item -ItemType Directory -Force -Path "$projectDir\output" | Out-Null
        $extension = if ($Action -eq 'apk') { 'apk' } else { 'aab' }
        $destination = "$projectDir\output\revive-local.$extension"
        Copy-Item -LiteralPath "$projectDir\$sourceFile" -Destination $destination -Force
        Write-Host "Arquivo pronto: $destination"
    }
    'studio' {
        $studioPath = 'C:\Program Files\Android\Android Studio\bin\studio64.exe'
        if (!(Test-Path -LiteralPath $studioPath)) { throw 'Abra a pasta android pelo Android Studio instalado em seu computador.' }
        Start-Process -FilePath $studioPath -ArgumentList ('"' + "$projectDir\android" + '"') -WindowStyle Hidden
    }
}
