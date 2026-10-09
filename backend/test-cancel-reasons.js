const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Workshop = require('./models/Workshop');
const Registration = require('./models/Registration');
const User = require('./models/User');

const test = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find any cancelled registrations or workshops to verify fields
    const cancelledReg = await Registration.findOne({ status: 'cancelled' }).populate('cancelledBy', 'name email role');
    console.log('Cancelled Reg sample:', cancelledReg);

    const cancelledWs = await Workshop.findOne({ status: 'cancelled' }).populate('cancelledBy', 'name email role');
    console.log('Cancelled Workshop sample:', cancelledWs);
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

test();
