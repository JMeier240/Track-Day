# TrackDay Windows Setup Script
Write-Host "🏁 Setting up TrackDay..." -ForegroundColor Green

# Check if Docker is running
$dockerRunning = docker info 2>$null
if ($dockerRunning) {
    Write-Host "✅ Docker detected" -ForegroundColor Green

    # Check if container exists
    $containerExists = docker ps -a --filter "name=trackday-postgres" --format "{{.Names}}"

    if ($containerExists) {
        Write-Host "Starting existing PostgreSQL container..." -ForegroundColor Yellow
        docker start trackday-postgres
    } else {
        Write-Host "Creating new PostgreSQL container..." -ForegroundColor Yellow
        docker run --name trackday-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=trackday -p 5432:5432 -d postgres:15
    }

    # Wait for PostgreSQL to be ready
    Write-Host "Waiting for PostgreSQL to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
} else {
    Write-Host "⚠️  Docker not detected. Make sure PostgreSQL is running manually." -ForegroundColor Yellow
}

# Install dependencies
Write-Host "`n📦 Installing dependencies..." -ForegroundColor Green
Set-Location server
npm install

# Run migrations
Write-Host "`n🗄️  Running database migrations..." -ForegroundColor Green
npm run migrate

# Start server
Write-Host "`n🚀 Starting development server..." -ForegroundColor Green
Write-Host "Server will be available at http://localhost:3000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server`n" -ForegroundColor Yellow
npm run dev
