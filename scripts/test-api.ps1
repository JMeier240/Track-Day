@"
# Test TrackDay Racing API
Write-Host 'Testing TrackDay Racing API' -ForegroundColor Cyan

# 1. Register User
Write-Host '1. Creating user...' -ForegroundColor Yellow
`$body = @{username='racer1';email='racer1@trackday.com';password='password123';displayName='Racer One'} | ConvertTo-Json
`$user = Invoke-RestMethod -Uri 'http://localhost:3001/api/auth/register' -Method Post -ContentType 'application/json' -Body `$body
`$token = `$user.token
Write-Host "User created: `$(`$user.user.username)" -ForegroundColor Green

# 2. Create Track
Write-Host '2. Creating track...' -ForegroundColor Yellow
`$track = @{name='Test Circuit';description='test';waypoints=@(@{lat=37.7749;lng=-122.4194},@{lat=37.7750;lng=-122.4195},@{lat=37.7751;lng=-122.4196});activityType='racing';difficulty='easy'} | ConvertTo-Json -Depth 10
`$headers = @{Authorization="Bearer `$token";'Content-Type'='application/json'}
`$trackRes = Invoke-RestMethod -Uri 'http://localhost:3001/api/tracks' -Method Post -Headers `$headers -Body `$track
`$trackId = `$trackRes.id
Write-Host "Track created: `$(`$trackRes.name)" -ForegroundColor Green

# 3. Start Session
Write-Host '3. Starting session...' -ForegroundColor Yellow
`$session = @{trackId=`$trackId} | ConvertTo-Json
`$sessRes = Invoke-RestMethod -Uri 'http://localhost:3001/api/sessions' -Method Post -Headers `$headers -Body `$session
`$sessionId = `$sessRes.id
Write-Host "Session started: `$sessionId" -ForegroundColor Green

# 4. Send Telemetry
Write-Host '4. Sending telemetry...' -ForegroundColor Yellow
`$telem = @{sessionId=`$sessionId;points=@(@{lat=37.7749;lng=-122.4194;speed=45.5;altitude=10;accuracy=5;timestamp=1734614400000},@{lat=37.7750;lng=-122.4195;speed=52.3;altitude=11;accuracy=5;timestamp=1734614402000},@{lat=37.7751;lng=-122.4196;speed=48.7;altitude=12;accuracy=5;timestamp=1734614404000},@{lat=37.7749;lng=-122.4194;speed=50.1;altitude=10;accuracy=5;timestamp=1734614406000})} | ConvertTo-Json -Depth 10
`$lap = Invoke-RestMethod -Uri 'http://localhost:3001/api/telemetry/ingest' -Method Post -Headers `$headers -Body `$telem
Write-Host "Lap detected: #`$(`$lap.lap.lapNumber) - `$(`$lap.lap.lapTime)s @ `$(`$lap.lap.topSpeed) mph" -ForegroundColor Cyan

# 5. Check Leaderboard
Write-Host '5. Checking leaderboard...' -ForegroundColor Yellow
`$lb = Invoke-RestMethod -Uri "http://localhost:3001/api/leaderboard?trackId=`$trackId"
Write-Host "Leaderboard:" -ForegroundColor Green
`$lb.leaderboard | ForEach-Object { Write-Host "  #`$(`$_.rank) - `$(`$_.displayName): `$(`$_.lapTime)s" -ForegroundColor White }

Write-Host 'All tests completed!' -ForegroundColor Green
"@ | Out-File -FilePath test-api-simple.ps1 -Encoding UTF8
