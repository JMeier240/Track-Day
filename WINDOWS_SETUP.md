# 🪟 Windows Setup Guide for TrackDay

This guide will help you set up TrackDay on Windows.

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database (see options below)
- Git

## PostgreSQL Setup Options

You have three options for running PostgreSQL on Windows:

### Option 1: Docker (Recommended for Development) ⭐

**Easiest and cleanest option - no Windows installation needed!**

1. Install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)

2. Run PostgreSQL in a container:
```powershell
docker run --name trackday-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=trackday -p 5432:5432 -d postgres:15
```

3. To stop the container:
```powershell
docker stop trackday-postgres
```

4. To start it again later:
```powershell
docker start trackday-postgres
```

5. Your `DATABASE_URL` in `.env` should be:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/trackday
```

### Option 2: Cloud Database (Free Tier)

**No local installation needed!**

Choose one of these free cloud providers:

- **[Neon](https://neon.tech/)** - Free tier: 10 GB storage
- **[Supabase](https://supabase.com/)** - Free tier: 500 MB database
- **[ElephantSQL](https://www.elephantsql.com/)** - Free tier: 20 MB

After signing up:
1. Create a new PostgreSQL database
2. Copy the connection string
3. Update `DATABASE_URL` in `server/.env` with your connection string

### Option 3: Install PostgreSQL on Windows

1. Download PostgreSQL installer from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Run the installer (use default port 5432)
3. Remember the password you set for the `postgres` user
4. Add PostgreSQL bin directory to your PATH:
   - Default: `C:\Program Files\PostgreSQL\15\bin`

5. Create the database using PowerShell:
```powershell
# Connect to PostgreSQL
psql -U postgres

# In the PostgreSQL prompt:
CREATE DATABASE trackday;
\q
```

6. Update `DATABASE_URL` in `server/.env`:
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/trackday
```

## Project Setup

1. **Navigate to the project directory:**
```powershell
cd C:\Users\jonat\Documents\GitHub\Track-Day
```

2. **Install server dependencies:**
```powershell
cd server
npm install
```

3. **Run database migrations:**
```powershell
npm run migrate
```

4. **Start the development server:**
```powershell
npm run dev
```

5. **Open the frontend** (in a new PowerShell window):
```powershell
cd C:\Users\jonat\Documents\GitHub\Track-Day\frontend
# Open index.html in your browser
start index.html
```

## Troubleshooting

### "pg_isready is not recognized"

This error means PostgreSQL command-line tools aren't installed or not in your PATH.

**Solutions:**
- Use Docker (Option 1) - no PATH configuration needed
- Use a cloud database (Option 2) - no local installation needed
- Add PostgreSQL bin directory to your Windows PATH (Option 3)

### "Connection refused" or "ECONNREFUSED"

Your PostgreSQL server isn't running.

**Solutions:**
- **Docker:** Run `docker start trackday-postgres`
- **Windows Service:** Open Services app and start "postgresql-x64-15"
- **Cloud:** Check your internet connection and connection string

### "Database does not exist"

You need to create the database.

**Solutions:**
- **Docker:** Recreate container with `-e POSTGRES_DB=trackday`
- **Local:** Run `createdb -U postgres trackday` or use psql
- **Cloud:** Create database in your cloud provider's dashboard

### Port 5432 already in use

Another PostgreSQL instance is running.

**Solutions:**
```powershell
# Find what's using port 5432
netstat -ano | findstr :5432

# Kill the process (replace PID with the number from above)
taskkill /PID <PID> /F
```

## Quick Start Script

Save this as `setup.ps1` in the project root:

```powershell
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
```

To use the script:
```powershell
powershell -ExecutionPolicy Bypass -File setup.ps1
```

## Next Steps

Once the server is running:
1. Open http://localhost:3000 in your browser
2. The API should respond with server info
3. Open `frontend/index.html` to use the app

For more information, see the main [README.md](README.md) and [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md).
