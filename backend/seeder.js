const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Workshop = require('./models/Workshop');
const Registration = require('./models/Registration');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB for seeding...');

    // Clear existing collections
    await User.deleteMany();
    await Workshop.deleteMany();
    await Registration.deleteMany();
    console.log('🧹 Existing data cleared.');

    // 1. Seed Users (Admin, Manager, Staff)
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@workshop.com',
      password: 'password123',
      role: 'admin'
    });

    const manager = await User.create({
      name: 'Workshop Manager',
      email: 'manager@workshop.com',
      password: 'password123',
      role: 'manager'
    });

    const staff = await User.create({
      name: 'Frontdesk Staff',
      email: 'staff@workshop.com',
      password: 'password123',
      role: 'staff'
    });

    console.log('👥 Seeded Users:');
    console.log(`   - Admin: admin@workshop.com / password123`);
    console.log(`   - Manager: manager@workshop.com / password123`);
    console.log(`   - Staff: staff@workshop.com / password123`);

    // 2. Seed Sample Workshops
    const workshops = await Workshop.create([
      {
        code: 'REACT-2026',
        title: 'Advanced React 19 & Next.js Architecture',
        instructor: 'Sarah Connor',
        dateTime: new Date(Date.now() + 86400000 * 5), // in 5 days
        capacity: 25,
        status: 'active'
      },
      {
        code: 'NODE-ADV',
        title: 'Microservices with Node.js & RabbitMQ',
        instructor: 'Alex Rivera',
        dateTime: new Date(Date.now() + 86400000 * 10), // in 10 days
        capacity: 15,
        status: 'active'
      },
      {
        code: 'DEVOPS-K8S',
        title: 'Kubernetes & Docker in Production',
        instructor: 'David Kim',
        dateTime: new Date(Date.now() + 86400000 * 15), // in 15 days
        capacity: 20,
        status: 'active'
      },
      {
        code: 'UIUX-FIGMA',
        title: 'Enterprise Design Systems & Figma Tokens',
        instructor: 'Elena Rostova',
        dateTime: new Date(Date.now() + 86400000 * 2), // in 2 days
        capacity: 2, // low capacity to test full state
        status: 'active'
      }
    ]);

    console.log(`📚 Seeded ${workshops.length} sample workshops.`);

    // 3. Seed Sample Registrations
    const reg1 = await Registration.create({
      workshopId: workshops[3]._id,
      attendeeName: 'Emma Watson',
      attendeeEmail: 'emma@example.com',
      status: 'active',
      registeredBy: staff._id
    });

    const reg2 = await Registration.create({
      workshopId: workshops[3]._id,
      attendeeName: 'Michael Chang',
      attendeeEmail: 'michael@example.com',
      status: 'active',
      registeredBy: staff._id
    });

    console.log(`🎟️ Seeded ${2} sample registrations for UIUX-FIGMA (Now full: 2/2).`);

    console.log('\n🌟 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seedData();
