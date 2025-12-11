# Windows Setup Guide

## Issue: better-sqlite3 Native Module Build Error

The `better-sqlite3` package requires compilation on Windows, which needs Python and build tools.

## Solution 1: Install Build Tools (Recommended)

### Step 1: Install Windows Build Tools
Open PowerShell as Administrator and run:

```powershell
npm install --global --production windows-build-tools
```

This installs:
- Python 2.7
- Visual Studio Build Tools
- All required dependencies

### Step 2: Install in Server Directory
After build tools are installed:

```bash
cd server
npm install
```

---

## Solution 2: Use Prebuilt Binaries (Easier)

If you want to avoid build tools, use a prebuilt version:

```bash
cd server
npm install better-sqlite3 --build-from-source=false
```

---

## Solution 3: Use Pure JavaScript Database (Fastest)

Replace better-sqlite3 with sql.js (no compilation needed).

### Changes needed:

1. Install sql.js:
```bash
cd server
npm uninstall better-sqlite3
npm install sql.js
```

2. Update `server/src/models/database.js` (see instructions below)

---

## Verification

After any solution, test with:

```bash
cd server
npm run dev
```

You should see:
```
🏁 TrackDay Racing API running on http://localhost:3000
📊 Database: ./data/trackday.db
```

---

## Common Issues

### Python Not Found
- Install Python 3.x from python.org
- Add Python to PATH during installation
- Restart terminal after installation

### Build Tools Failed
- Run PowerShell as Administrator
- Ensure you have space on C: drive
- Try installing Visual Studio Build Tools manually

### Still Not Working?
Use Solution 3 (Pure JavaScript Database) for immediate development.
