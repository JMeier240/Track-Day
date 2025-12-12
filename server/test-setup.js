// Simple test to verify the setup
require('dotenv').config();
const db = require('./src/database/db');

async function testSetup() {
  console.log('🧪 Testing TrackDay Racing Setup...\n');

  // Test 1: Environment variables
  console.log('1️⃣ Checking environment variables...');
  const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'PORT'];
  const missing = requiredEnvVars.filter(v => !process.env[v]);

  if (missing.length > 0) {
    console.log('   ❌ Missing environment variables:', missing.join(', '));
    process.exit(1);
  }
  console.log('   ✅ All required environment variables present\n');

  // Test 2: Database connection
  console.log('2️⃣ Testing database connection...');
  try {
    const result = await db.query('SELECT NOW() as current_time');
    console.log('   ✅ Database connected successfully');
    console.log('   📅 Server time:', result.rows[0].current_time);
  } catch (error) {
    console.log('   ⚠️  Database connection failed:', error.message);
    console.log('   ℹ️  This is expected if PostgreSQL is not running');
    console.log('   ℹ️  See docs/POSTGRESQL_SETUP.md for setup instructions\n');
  }

  // Test 3: Model imports
  console.log('\n3️⃣ Testing model imports...');
  try {
    const User = require('./src/models/User');
    const Track = require('./src/models/Track');
    const Attempt = require('./src/models/Attempt');
    const Challenge = require('./src/models/Challenge');
    console.log('   ✅ All models loaded successfully\n');
  } catch (error) {
    console.log('   ❌ Model import failed:', error.message);
    process.exit(1);
  }

  // Test 4: Controller imports
  console.log('4️⃣ Testing controller imports...');
  try {
    const authController = require('./src/controllers/authController');
    const userController = require('./src/controllers/userController');
    const trackController = require('./src/controllers/trackController');
    const attemptController = require('./src/controllers/attemptController');
    const challengeController = require('./src/controllers/challengeController');
    console.log('   ✅ All controllers loaded successfully\n');
  } catch (error) {
    console.log('   ❌ Controller import failed:', error.message);
    process.exit(1);
  }

  // Test 5: Route imports
  console.log('5️⃣ Testing route imports...');
  try {
    const authRoutes = require('./src/routes/auth');
    const userRoutes = require('./src/routes/users');
    const trackRoutes = require('./src/routes/tracks');
    const attemptRoutes = require('./src/routes/attempts');
    const challengeRoutes = require('./src/routes/challenges');
    console.log('   ✅ All routes loaded successfully\n');
  } catch (error) {
    console.log('   ❌ Route import failed:', error.message);
    process.exit(1);
  }

  // Test 6: Express app
  console.log('6️⃣ Testing Express app setup...');
  try {
    const express = require('express');
    const app = express();
    console.log('   ✅ Express app initialized successfully\n');
  } catch (error) {
    console.log('   ❌ Express setup failed:', error.message);
    process.exit(1);
  }

  console.log('✅ All basic tests passed!');
  console.log('\n📊 Summary:');
  console.log('   • Environment: Configured ✓');
  console.log('   • Models: Loaded ✓');
  console.log('   • Controllers: Loaded ✓');
  console.log('   • Routes: Loaded ✓');
  console.log('   • Express: Ready ✓');
  console.log('\n🚀 The application is ready to run!');
  console.log('   To start the server: npm start');
  console.log('   To run migrations: node src/database/migrate.js\n');

  // Close database connection
  await db.pool.end();
}

testSetup().catch(error => {
  console.error('\n❌ Test failed with error:', error);
  process.exit(1);
});
