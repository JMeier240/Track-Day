# Test TrackDay Racing API with PowerShell

Write-Host "`n🧪 Testing TrackDay Racing API`n" -ForegroundColor Cyan

# Step 1: Register User
Write-Host "1. Creating user..." -ForegroundColor Yellow
try {
    $registerBody = @{
        username = "racer1"
        email = "racer1@trackday.com"
        password = "password123"
        displayName = "Racer One"
    } | ConvertTo-Json

    $registerResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/register" -Method Post -ContentType "application/json" -Body $registerBody
    $token = $registerResponse.token
    
    Write-Host "✓ User created: $($registerResponse.user.username)" -ForegroundColor Green
    Write-Host "  Token: $($token.Substring(0,20))..." -ForegroundColor Gray
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# Step 2: Create Track
Write-Host "`n2. Creating track..." -ForegroundColor Yellow
try {
    $trackBody = @{
        name = "Test Circuit"
        description = "Circular test track"
        waypoints = @(
            @{ lat = 37.7749; lng = -122.4194 }
            @{ lat = 37.7750; lng = -122.4195 }
            @{ lat = 37.7751; lng = -122.4196 }
        )
        activityType = "racing"
        difficulty = "easy"
    } | ConvertTo-Json -Depth 10

    $headers = @{
        Authorization = "Bearer $token"
        "Content-Type" = "application/json"
    }

    $trackResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/tracks" -Method Post -Headers $headers -Body $trackBody
    $trackId = $trackResponse.id
    
    Write-Host "✓ Track created: $($trackResponse.name)" -ForegroundColor Green
    Write-Host "  Track ID: $trackId" -ForegroundColor Gray
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# Step 3: Start Session
Write-Host "`n3. Starting session..." -ForegroundColor Yellow
try {
    $sessionBody = @{
        trackId = $trackId
    } | ConvertTo-Json

    $sessionResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/sessions" -Method Post -Headers $headers -Body $sessionBody
    $sessionId = $sessionResponse.id
    
    Write-Host "✓ Session started" -ForegroundColor Green
    Write-Host "  Session ID: $sessionId" -ForegroundColor Gray
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# Step 4: Send Telemetry (Lap 1)
Write-Host "`n4. Sending telemetry for Lap 1..." -ForegroundColor Yellow
try {
    $telemetryBody = @{
        sessionId = $sessionId
        points = @(
            @{ lat = 37.7749; lng = -122.4194; speed = 45.5; altitude = 10; accuracy = 5; timestamp = 1734614400000 }
            @{ lat = 37.7750; lng = -122.4195; speed = 52.3; altitude = 11; accuracy = 5; timestamp = 1734614402000 }
            @{ lat = 37.7751; lng = -122.4196; speed = 48.7; altitude = 12; accuracy = 5; timestamp = 1734614404000 }
            @{ lat = 37.7749; lng = -122.4194; speed = 50.1; altitude = 10; accuracy = 5; timestamp = 1734614406000 }
        )
    } | ConvertTo-Json -Depth 10

    $lap1Response = Invoke-RestMethod -Uri "http://localhost:3001/api/telemetry/ingest" -Method Post -Headers $headers -Body $telemetryBody
    
    Write-Host "✓ Telemetry ingested: $($lap1Response.pointsIngested) points" -ForegroundColor Green
    if ($lap1Response.lapDetected) {
        Write-Host "  🏁 Lap detected!" -ForegroundColor Cyan
        Write-Host "     Lap #: $($lap1Response.lap.lapNumber)" -ForegroundColor Gray
        Write-Host "     Time: $($lap1Response.lap.lapTime)s" -ForegroundColor Gray
        Write-Host "     Top Speed: $($lap1Response.lap.topSpeed) mph" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 5: Send Telemetry (Lap 2)
Write-Host "`n5. Sending telemetry for Lap 2..." -ForegroundColor Yellow
try {
    $telemetryBody2 = @{
        sessionId = $sessionId
        points = @(
            @{ lat = 37.7750; lng = -122.4195; speed = 55.2; timestamp = 1734614410000 }
            @{ lat = 37.7751; lng = -122.4196; speed = 58.9; timestamp = 1734614412000 }
            @{ lat = 37.7749; lng = -122.4194; speed = 56.7; timestamp = 1734614414000 }
        )
    } | ConvertTo-Json -Depth 10

    $lap2Response = Invoke-RestMethod -Uri "http://localhost:3001/api/telemetry/ingest" -Method Post -Headers $headers -Body $telemetryBody2
    
    Write-Host "✓ Telemetry ingested: $($lap2Response.pointsIngested) points" -ForegroundColor Green
    if ($lap2Response.lapDetected) {
        Write-Host "  🏁 Lap detected!" -ForegroundColor Cyan
        Write-Host "     Lap #: $($lap2Response.lap.lapNumber)" -ForegroundColor Gray
        Write-Host "     Time: $($lap2Response.lap.lapTime)s" -ForegroundColor Gray
        Write-Host "     Top Speed: $($lap2Response.lap.topSpeed) mph" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 6: Check Leaderboard
Write-Host "`n6. Checking leaderboard..." -ForegroundColor Yellow
try {
    $leaderboard = Invoke-RestMethod -Uri "http://localhost:3001/api/leaderboard?trackId=$trackId"
    
    Write-Host "✓ Leaderboard for: $($leaderboard.track.name)" -ForegroundColor Green
    Write-Host "`nRankings:" -ForegroundColor Cyan
    $leaderboard.leaderboard | ForEach-Object {
        Write-Host "  #$($_.rank) - $($_.displayName) - Lap $($_.lapNumber): $($_.lapTime)s (Top: $($_.topSpeed) mph)" -ForegroundColor White
    }
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 7: Get Session Laps
Write-Host "`n7. Getting session laps..." -ForegroundColor Yellow
try {
    $sessionLaps = Invoke-RestMethod -Uri "http://localhost:3001/api/leaderboard/laps/session/$sessionId"
    
    Write-Host "✓ Session completed $($sessionLaps.total) laps" -ForegroundColor Green
    Write-Host "`nAll Laps:" -ForegroundColor Cyan
    $sessionLaps.laps | ForEach-Object {
        Write-Host "  Lap $($_.lapNumber): $($_.lapTime)s (Top: $($_.topSpeed) mph, Avg: $([math]::Round($_.avgSpeed,2)) mph)" -ForegroundColor White
    }
    
    if ($sessionLaps.bestLap) {
        Write-Host "`n🏆 Best Lap: #$($sessionLaps.bestLap.lapNumber) - $($sessionLaps.bestLap.lapTime)s" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n✅ All tests completed!`n" -ForegroundColor Green
