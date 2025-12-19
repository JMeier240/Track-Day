require('dotenv').config();

console.log('Environment variables test:');
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('DATABASE_URL type:', typeof process.env.DATABASE_URL);
console.log('DATABASE_URL length:', process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 'undefined');

// Try to parse the connection string
if (process.env.DATABASE_URL) {
  const url = new URL(process.env.DATABASE_URL);
  console.log('\nParsed connection:');
  console.log('Protocol:', url.protocol);
  console.log('Username:', url.username);
  console.log('Password:', url.password);
  console.log('Password type:', typeof url.password);
  console.log('Host:', url.hostname);
  console.log('Port:', url.port);
  console.log('Database:', url.pathname.substring(1));
}
