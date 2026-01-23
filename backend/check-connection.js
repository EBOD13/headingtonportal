// check-connection.js
require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔌 Testing MongoDB connection...\n');
console.log('MONGODB_URI:', process.env.MONGODB_URI);

async function testConnection() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📚 Collections in database:');
    collections.forEach(col => {
      console.log(`  - ${col.name}`);
    });
    
    // Check resident collection count
    const residentCount = await mongoose.connection.db.collection('residents').countDocuments();
    console.log(`\n👤 Residents collection count: ${residentCount}`);
    
    if (residentCount > 0) {
      // Get first few residents
      const residents = await mongoose.connection.db.collection('residents').find({}).limit(5).toArray();
      console.log('\n📝 Sample residents:');
      residents.forEach(res => {
        console.log(`  - ${res.name} (Room: ${res.roomNumber})`);
      });
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Connection test complete');
    
  } catch (error) {
    console.error('❌ Connection error:', error.message);
  }
}

testConnection();
