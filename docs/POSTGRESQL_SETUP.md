# PostgreSQL Setup Guide

## Option 1: Local PostgreSQL (Recommended for Development)

### Windows

1. **Download PostgreSQL:**
   - Visit [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
   - Download the installer (PostgreSQL 16 recommended)
   - Run installer and follow wizard

2. **During Installation:**
   - Remember your password for user `postgres`
   - Default port: 5432
   - Locale: Use default

3. **Create Database:**
   ```powershell
   # Open Command Prompt or PowerShell
   psql -U postgres
   # Enter your password when prompted

   # In psql:
   CREATE DATABASE trackday;
   \q
   ```

4. **Update .env:**
   ```
   DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/trackday
   ```

### Mac

1. **Install via Homebrew:**
   ```bash
   brew install postgresql@16
   brew services start postgresql@16
   ```

2. **Create Database:**
   ```bash
   createdb trackday
   ```

3. **Update .env:**
   ```
   DATABASE_URL=postgresql://localhost:5432/trackday
   ```

### Linux

1. **Install PostgreSQL:**
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib

   # Start service
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   ```

2. **Create Database:**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE trackday;
   \q
   ```

3. **Update .env:**
   ```
   DATABASE_URL=postgresql://postgres:password@localhost:5432/trackday
   ```

---

## Option 2: Docker (Cross-Platform)

1. **Install Docker:**
   - Windows/Mac: [Docker Desktop](https://www.docker.com/products/docker-desktop)
   - Linux: `sudo apt install docker.io`

2. **Run PostgreSQL Container:**
   ```bash
   docker run --name trackday-postgres \
     -e POSTGRES_PASSWORD=mysecretpassword \
     -e POSTGRES_DB=trackday \
     -p 5432:5432 \
     -d postgres:16
   ```

3. **Update .env:**
   ```
   DATABASE_URL=postgresql://postgres:mysecretpassword@localhost:5432/trackday
   ```

4. **Manage Container:**
   ```bash
   # Start container
   docker start trackday-postgres

   # Stop container
   docker stop trackday-postgres

   # View logs
   docker logs trackday-postgres
   ```

---

## Option 3: Free Cloud Database

### Supabase (Free Tier)

1. **Sign up:**
   - Visit [https://supabase.com](https://supabase.com)
   - Create free account

2. **Create Project:**
   - New Project → Choose region → Set password

3. **Get Connection String:**
   - Settings → Database → Connection String
   - Copy the URI format

4. **Update .env:**
   ```
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
   ```

**Free Tier Limits:**
- 500MB database
- Unlimited API requests
- Perfect for development/MVP

### Neon (Free Tier)

1. **Sign up:**
   - Visit [https://neon.tech](https://neon.tech)
   - Create free account

2. **Create Project:**
   - New Project → Name your project

3. **Copy Connection String:**
   - Connection Details → Copy connection string

4. **Update .env:**
   ```
   DATABASE_URL=[YOUR-CONNECTION-STRING]
   ```

**Free Tier Limits:**
- 3GB storage
- 1 project
- Perfect for development

---

## Running Migrations

Once you have PostgreSQL set up:

1. **Copy environment file:**
   ```bash
   cd server
   cp .env.example .env
   ```

2. **Edit .env and add your DATABASE_URL**

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Run migration:**
   ```bash
   npm run migrate
   ```

   You should see:
   ```
   🔄 Starting database migration...
   📝 Creating tables and indexes...
   ✅ Database schema created successfully!
   🏆 Creating default achievements...
   ✅ Migration completed successfully!
   🎉 Your database is ready to use!
   ```

5. **Start the server:**
   ```bash
   npm run dev
   ```

---

## Troubleshooting

### Connection Refused
- Ensure PostgreSQL is running
- Check port 5432 is not blocked
- Verify connection string is correct

### Authentication Failed
- Double-check username/password
- Ensure database exists
- Check DATABASE_URL format

### Migration Errors
- Ensure database is empty or drop existing tables
- Check PostgreSQL version (16+ recommended)
- Verify SQL syntax compatibility

### Docker Issues
- Ensure Docker is running
- Check port 5432 isn't already in use
- Try `docker ps` to see running containers

---

## GUI Tools (Optional)

### pgAdmin (Free, Cross-Platform)
- Download: [https://www.pgadmin.org/](https://www.pgadmin.org/)
- Full-featured PostgreSQL management

### DBeaver (Free, Cross-Platform)
- Download: [https://dbeaver.io/](https://dbeaver.io/)
- Universal database tool

### TablePlus (Free/Paid, Mac/Windows)
- Download: [https://tableplus.com/](https://tableplus.com/)
- Modern, clean interface

---

## Security Best Practices

1. **Never commit .env files**
   - Already in .gitignore
   - Use .env.example for templates

2. **Use strong passwords**
   - Generate random JWT_SECRET
   - Use different passwords for each environment

3. **Production setup**
   - Use environment variables
   - Enable SSL connections
   - Use connection pooling
   - Set up database backups

4. **Development vs Production**
   - Development: Local PostgreSQL or Docker
   - Production: Managed services (Supabase, Railway, Render, etc.)

---

## Next Steps

Once migration is complete:
1. Test the API endpoints
2. Create your first user
3. Start building Phase 2 features!

For questions, check the main [Getting Started Guide](GETTING_STARTED.md).
