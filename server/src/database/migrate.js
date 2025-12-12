require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('./db');

async function migrate() {
  console.log('🔄 Starting database migration...\n');

  try {
    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute schema
    console.log('📝 Creating tables and indexes...');
    await db.query(schema);

    console.log('✅ Database schema created successfully!\n');

    // Insert default achievements
    console.log('🏆 Creating default achievements...');
    await seedAchievements();

    console.log('✅ Migration completed successfully!\n');
    console.log('🎉 Your database is ready to use!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

async function seedAchievements() {
  const achievements = [
    {
      code: 'first_track',
      name: 'Track Pioneer',
      description: 'Create your first track',
      tier: 'bronze',
      points: 10,
    },
    {
      code: 'first_race',
      name: 'First Lap',
      description: 'Complete your first race',
      tier: 'bronze',
      points: 10,
    },
    {
      code: 'ten_races',
      name: 'Regular Racer',
      description: 'Complete 10 races',
      tier: 'silver',
      points: 50,
    },
    {
      code: 'fifty_races',
      name: 'Racing Veteran',
      description: 'Complete 50 races',
      tier: 'gold',
      points: 200,
    },
    {
      code: 'hundred_races',
      name: 'Century Club',
      description: 'Complete 100 races',
      tier: 'platinum',
      points: 500,
    },
    {
      code: 'personal_best',
      name: 'New Record',
      description: 'Set a new personal best',
      tier: 'bronze',
      points: 10,
    },
    {
      code: 'track_master',
      name: 'Track Master',
      description: 'Hold #1 position on a leaderboard',
      tier: 'gold',
      points: 100,
    },
    {
      code: 'social_butterfly',
      name: 'Social Butterfly',
      description: 'Follow 10 other racers',
      tier: 'silver',
      points: 25,
    },
    {
      code: 'track_creator',
      name: 'Track Designer',
      description: 'Create 5 tracks',
      tier: 'silver',
      points: 50,
    },
    {
      code: 'speed_demon',
      name: 'Speed Demon',
      description: 'Reach 60+ mph average speed',
      tier: 'gold',
      points: 150,
    },
  ];

  for (const achievement of achievements) {
    await db.query(
      `INSERT INTO achievements (code, name, description, tier, points)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (code) DO NOTHING`,
      [achievement.code, achievement.name, achievement.description, achievement.tier, achievement.points]
    );
  }

  console.log(`   ✓ Created ${achievements.length} achievements`);
}

// Run migration
migrate();
