const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Workshop = require('./models/Workshop');
const Registration = require('./models/Registration');

const check = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const workshops = await Workshop.find().lean();
    console.log(`Total workshops in DB: ${workshops.length}`);

    for (const ws of workshops) {
      const activeRegs = await Registration.countDocuments({ workshopId: ws._id, status: 'active' });
      const available = Math.max(0, ws.capacity - activeRegs);
      const isFull = available === 0;
      console.log(`- [${ws.code}] ${ws.title}: ${activeRegs}/${ws.capacity} Booked | ${available} Available | Status: ${ws.status} ${isFull ? '🔴 FULL (SOLD OUT)' : '🟢 SEATS AVAILABLE'}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

check();
