param([switch]$SemBuild)
$ErrorActionPreference = 'Stop'

# Prefere o JDK local do projeto, sem alterar a configuracao global.
$localJdk = Get-ChildItem (Join-Path $PSScriptRoot '.tools/java') -Directory -ErrorAction SilentlyContinue | Select-Object -First 1
if ($localJdk) {
    $env:JAVA_HOME = $localJdk.FullName
    $env:Path = "$env:JAVA_HOME\bin;$env:Path"
}

# Carrega variaveis do arquivo local sem executar seu conteudo como codigo.
$envFile = Join-Path $PSScriptRoot '.env'
if (Test-Path -LiteralPath $envFile) {
    foreach ($line in Get-Content -LiteralPath $envFile) {
        if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2].Trim(), 'Process')
        }
    }
}
if ([string]::IsNullOrWhiteSpace($env:JWT_SECRET)) {
    throw 'Configure JWT_SECRET no arquivo .env da raiz (pelo menos 32 bytes). Use .env.example como modelo.'
}

Push-Location (Join-Path $PSScriptRoot 'frontend')
try {
    if (-not $SemBuild) {
        if (-not (Test-Path node_modules)) {
            & npm.cmd ci
            if ($LASTEXITCODE -ne 0) { throw 'Falha na instalacao do frontend.' }
        }
        & npm.cmd run build
        if ($LASTEXITCODE -ne 0) { throw 'Falha na compilacao do frontend.' }
    }
    if (-not (Test-Path out/index.html)) { throw 'Frontend nao compilado. Execute sem -SemBuild.' }
} finally { Pop-Location }

Push-Location (Join-Path $PSScriptRoot 'demo')
try {
    & .\mvnw.cmd spring-boot:run
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao iniciar o Spring Boot.' }
} finally { Pop-Location }
