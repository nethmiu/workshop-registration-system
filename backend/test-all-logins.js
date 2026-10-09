const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
dotenv.config();

const User = require('./models/User');

const testLogins = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to DB for login verification');

    const accounts = [
      { email: 'admin@gmail.com', pass: 'Admin@123', expectedRole: 'admin' },
      { email: 'nethmiumaya5@gmail.com', pass: 'Password@123', expectedRole: 'admin' },
      { email: 'staff@gmail.com', pass: 'Staff@123', expectedRole: 'staff' },
      { email: 'staff1@gmail.com', pass: 'Password@124', expectedRole: 'staff' },
      { email: 'manager@gmail.com', pass: 'Manager@123', expectedRole: 'manager' },
      { email: 'manager2@gmail.com', pass: 'Password@123', expectedRole: 'manager' }
    ];

    for (const acc of accounts) {
      const user = await User.findOne({ email: acc.email });
      if (!user) {
        console.error(`❌ User not found: ${acc.email}`);
        continue;
      }

      const isMatch = await bcrypt.compare(acc.pass, user.password);
      if (!isMatch) {
        console.error(`❌ Password mismatch for ${acc.email}`);
        continue;
      }

      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      console.log(`✅ [${user.role.toUpperCase()}] ${user.email} (${user.name}) -> Login Success & JWT Valid!`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

testLogins();
