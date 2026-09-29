const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Check your .env file.');
  }
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, {
    dbName: process.env.MONGODB_DBNAME || 'bellavo_billing'
  });
  console.log(`[db] connected to MongoDB database "${mongoose.connection.name}"`);
}

module.exports = connectDB;
