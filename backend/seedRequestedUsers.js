const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');

const usersToRegister = [
  // 1. Administrators
  {
    name: 'System Administrator',
    email: 'admin@gmail.com',
    password: 'Admin@123',
    role: 'admin'
  },
  {
    name: 'Nethmi Umaya',
    email: 'nethmiumaya5@gmail.com',
    password: 'Password@123',
    role: 'admin'
  },

  // 2. Frontdesk Staff
  {
    name: 'Frontdesk Staff',
    email: 'staff@gmail.com',
    password: 'Staff@123',
    role: 'staff'
  },
  {
    name: 'Frontdesk Staff 1',
    email: 'staff1@gmail.com',
    password: 'Password@124',
    role: 'staff'
  },

  // 3. Workshop Managers
  {
    name: 'Workshop Manager',
    email: 'manager@gmail.com',
    password: 'Manager@123',
    role: 'manager'
  },
  {
    name: 'Workshop Manager 2',
    email: 'manager2@gmail.com',
    password: 'Password@123',
    role: 'manager'
  }
];

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB for user seeding...');

    for (const u of usersToRegister) {
      const email = u.email.toLowerCase().trim();
      let user = await User.findOne({ email });

      if (user) {
        user.name = u.name;
        user.password = u.password; // hashed by pre-save hook
        user.role = u.role;
        await user.save();
        console.log(`🔄 Updated user: ${email} (${u.role})`);
      } else {
        user = await User.create({
          name: u.name,
          email,
          password: u.password,
          role: u.role
        });
        console.log(`✅ Created user: ${email} (${u.role})`);
      }
    }

    console.log('\n🎉 All 6 requested accounts seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding users:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seedUsers();
