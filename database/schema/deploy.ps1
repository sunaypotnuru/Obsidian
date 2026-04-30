# ============================================================
# NETRA AI - AUTOMATED DATABASE DEPLOYMENT
# Purpose: Deploy database schema into a Docker Postgres container
# Target: Plain PostgreSQL (Docker container)
# ============================================================

param(
    [string]$ContainerName = "netra-postgres-primary",
    [string]$DatabaseName = "netra_ai_2026",
    [string]$DbUser = $env:DB_USER
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($DbUser)) {
    $DbUser = "postgres"
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "NETRA AI - DATABASE DEPLOYMENT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
$dockerRunning = docker ps 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker is running" -ForegroundColor Green
Write-Host ""

# Check if Postgres container exists
Write-Host "Checking Postgres container '$ContainerName'..." -ForegroundColor Yellow
$containerExists = docker ps -a --filter "name=$ContainerName" --format "{{.Names}}"
if (-not $containerExists) {
    Write-Host "❌ Container not found: $ContainerName" -ForegroundColor Red
    Write-Host "Please start the container first." -ForegroundColor Red
    exit 1
}

# Check if container is running
$containerRunning = docker ps --filter "name=$ContainerName" --format "{{.Names}}"
if (-not $containerRunning) {
    Write-Host "Container exists but not running. Starting..." -ForegroundColor Yellow
    docker start $ContainerName | Out-Null
    Start-Sleep -Seconds 3
}
Write-Host "✅ Container is running" -ForegroundColor Green
Write-Host ""

Write-Host "Copying MASTER_DATABASE_SCHEMA.sql to container..." -ForegroundColor Yellow
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$schemaPath = Join-Path $repoRoot "infrastructure\database\MASTER_DATABASE_SCHEMA.sql"
if (-not (Test-Path $schemaPath)) {
    throw "Schema file not found: $schemaPath"
}
docker cp "$schemaPath" "$ContainerName`:/tmp/MASTER_DATABASE_SCHEMA.sql" | Out-Null
Write-Host "✅ Schema copied" -ForegroundColor Green
Write-Host ""

# Execute deployment (schema only)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "EXECUTING DEPLOYMENT..." -ForegroundColor Cyan
Write-Host "This will take 2-3 minutes..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

docker exec -i $ContainerName psql -v ON_ERROR_STOP=1 -U $DbUser -d $DatabaseName -f /tmp/MASTER_DATABASE_SCHEMA.sql | Out-Host

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  - If you need a full reset (drop+recreate DB), run: scripts\reset_db_docker.ps1" -ForegroundColor White
Write-Host "  - Then start the app stack and smoke-test portals." -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
