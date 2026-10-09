const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');

const createAdminUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const email = 'nethmiumaya5@gmail.com'.toLowerCase().trim();
    const password = 'Password@123';
    const name = 'Nethmi Umaya';
    const role = 'admin';

    let user = await User.findOne({ email });

    if (user) {
      console.log(`ℹ️ User with email ${email} already exists. Updating to Admin role and resetting password...`);
      user.name = name;
      user.password = password; // Will be hashed via pre-save hook
      user.role = role;
      await user.save();
      console.log(`✅ User ${email} successfully updated to role: ${user.role}`);
    } else {
      user = await User.create({
        name,
        email,
        password, // Will be hashed via pre-save hook
        role
      });
      console.log(`✅ Admin user created successfully: ${user.email} (Role: ${user.role})`);
    }

    console.log('\n--- Admin Credentials ---');
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${password}`);
    console.log(`Role: ${user.role}`);
  } catch (error) {
    console.error('❌ Error registering admin:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

createAdminUser();
