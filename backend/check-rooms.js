// check-rooms.js
require('dotenv').config();
const mongoose = require('mongoose');
const Resident = require('./models/residentModel');

async function checkRooms() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Get all unique room numbers
  const rooms = await Resident.distinct('roomNumber');
  
  console.log('🏢 Rooms in database:');
  console.log('====================');
  
  // Sort and display
  rooms.sort().forEach((room, index) => {
    console.log(`${index + 1}. ${room}`);
  });
  
  console.log(`\nTotal: ${rooms.length} rooms`);
  
  await mongoose.disconnect();
}

checkRooms().catch(console.error);