const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Workshop = require('./models/Workshop');
const Registration = require('./models/Registration');
const User = require('./models/User');

const seedWorkshops = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    let admin = await User.findOne({ email: 'nethmiumaya5@gmail.com' });
    if (!admin) {
      admin = await User.findOne({ role: 'admin' });
    }

    const currentCount = await Workshop.countDocuments();
    if (currentCount === 0) {
      const workshops = await Workshop.create([
        {
          code: 'REACT-2026',
          title: 'Advanced React 19 & Next.js Architecture',
          instructor: 'Dr. Sarah Connor',
          dateTime: new Date(Date.now() + 86400000 * 4), // in 4 days
          capacity: 30,
          status: 'active'
        },
        {
          code: 'NODE-ADV',
          title: 'Microservices with Node.js & RabbitMQ',
          instructor: 'Alex Rivera',
          dateTime: new Date(Date.now() + 86400000 * 8), // in 8 days
          capacity: 20,
          status: 'active'
        },
        {
          code: 'DEVOPS-K8S',
          title: 'Kubernetes & Docker in Production',
          instructor: 'David Kim',
          dateTime: new Date(Date.now() + 86400000 * 12), // in 12 days
          capacity: 25,
          status: 'active'
        },
        {
          code: 'UIUX-FIGMA',
          title: 'Enterprise Design Systems & Figma Tokens',
          instructor: 'Elena Rostova',
          dateTime: new Date(Date.now() + 86400000 * 2), // in 2 days
          capacity: 5,
          status: 'active'
        },
        {
          code: 'AI-LLM-2026',
          title: 'Building AI Agents with LangChain & Gemini',
          instructor: 'Marcus Vance',
          dateTime: new Date(Date.now() + 86400000 * 6), // in 6 days
          capacity: 15,
          status: 'active'
        }
      ]);

      console.log(`✅ Seeded ${workshops.length} rich sample workshops!`);

      if (admin) {
        // Seed 2 sample registrations
        await Registration.create([
          {
            workshopId: workshops[0]._id,
            attendeeName: 'Emma Watson',
            attendeeEmail: 'emma.watson@example.com',
            status: 'active',
            registeredBy: admin._id
          },
          {
            workshopId: workshops[3]._id,
            attendeeName: 'Michael Chang',
            attendeeEmail: 'michael.chang@example.com',
            status: 'active',
            registeredBy: admin._id
          }
        ]);
        console.log('✅ Seeded sample registrations');
      }
    } else {
      console.log(`Workshops already exist (${currentCount})`);
    }
  } catch (error) {
    console.error('Error seeding workshops:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seedWorkshops();
