const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Workshop = require('./models/Workshop');
const Registration = require('./models/Registration');
const User = require('./models/User');

const seedFullWorkshops = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB for adding full workshops...');

    // Find staff or manager user to associate registrations with
    let staffUser = await User.findOne({ role: 'staff' });
    let managerUser = await User.findOne({ role: 'manager' });
    let fallbackUser = staffUser || managerUser || (await User.findOne());

    if (!fallbackUser) {
      console.error('❌ No user found in database. Please seed users first.');
      process.exit(1);
    }

    const registratorId = staffUser ? staffUser._id : fallbackUser._id;

    // 1. Create Fully Booked Workshop 1: AI-ETHICS-2026 (Capacity: 3)
    let ws1 = await Workshop.findOne({ code: 'AI-ETHICS-2026' });
    if (!ws1) {
      ws1 = await Workshop.create({
        code: 'AI-ETHICS-2026',
        title: 'AI Safety, Ethics & Governance Summit',
        instructor: 'Dr. Maya Patel',
        dateTime: new Date(Date.now() + 86400000 * 3), // in 3 days
        capacity: 3,
        status: 'active'
      });
      console.log('✅ Created workshop AI-ETHICS-2026 (Capacity: 3)');
    }

    // Register 3 attendees for AI-ETHICS-2026
    const ws1Attendees = [
      { name: 'Emily Blunt', email: 'emily.blunt@example.com' },
      { name: 'Liam Nelson', email: 'liam.nelson@example.com' },
      { name: 'Sophie Turner', email: 'sophie.turner@example.com' }
    ];

    for (const att of ws1Attendees) {
      const exists = await Registration.findOne({
        workshopId: ws1._id,
        attendeeEmail: att.email.toLowerCase()
      });
      if (!exists) {
        await Registration.create({
          workshopId: ws1._id,
          attendeeName: att.name,
          attendeeEmail: att.email.toLowerCase(),
          status: 'active',
          registeredBy: registratorId
        });
      }
    }
    console.log('✅ Registered 3 attendees for AI-ETHICS-2026 (Now 3/3 Full - 0 seats left)');

    // 2. Create Fully Booked Workshop 2: CYBER-SOC-2026 (Capacity: 4)
    let ws2 = await Workshop.findOne({ code: 'CYBER-SOC-2026' });
    if (!ws2) {
      ws2 = await Workshop.create({
        code: 'CYBER-SOC-2026',
        title: 'Advanced Threat Hunting & SOC Defense',
        instructor: 'Robert Vance',
        dateTime: new Date(Date.now() + 86400000 * 7), // in 7 days
        capacity: 4,
        status: 'active'
      });
      console.log('✅ Created workshop CYBER-SOC-2026 (Capacity: 4)');
    }

    // Register 4 attendees for CYBER-SOC-2026
    const ws2Attendees = [
      { name: 'David Miller', email: 'david.miller@example.com' },
      { name: 'Chris Evans', email: 'chris.evans@example.com' },
      { name: 'Natasha Romanoff', email: 'natasha.r@example.com' },
      { name: 'Bruce Banner', email: 'bruce.banner@example.com' }
    ];

    for (const att of ws2Attendees) {
      const exists = await Registration.findOne({
        workshopId: ws2._id,
        attendeeEmail: att.email.toLowerCase()
      });
      if (!exists) {
        await Registration.create({
          workshopId: ws2._id,
          attendeeName: att.name,
          attendeeEmail: att.email.toLowerCase(),
          status: 'active',
          registeredBy: registratorId
        });
      }
    }
    console.log('✅ Registered 4 attendees for CYBER-SOC-2026 (Now 4/4 Full - 0 seats left)');

    // 3. Create Fully Booked Workshop 3: FINTECH-BLOCK (Capacity: 2)
    let ws3 = await Workshop.findOne({ code: 'FINTECH-BLOCK' });
    if (!ws3) {
      ws3 = await Workshop.create({
        code: 'FINTECH-BLOCK',
        title: 'Decentralized Finance & Smart Contract Auditing',
        instructor: 'Satoshi Vance',
        dateTime: new Date(Date.now() + 86400000 * 10), // in 10 days
        capacity: 2,
        status: 'active'
      });
      console.log('✅ Created workshop FINTECH-BLOCK (Capacity: 2)');
    }

    const ws3Attendees = [
      { name: 'Alex Turing', email: 'alex.turing@example.com' },
      { name: 'Grace Hopper', email: 'grace.hopper@example.com' }
    ];

    for (const att of ws3Attendees) {
      const exists = await Registration.findOne({
        workshopId: ws3._id,
        attendeeEmail: att.email.toLowerCase()
      });
      if (!exists) {
        await Registration.create({
          workshopId: ws3._id,
          attendeeName: att.name,
          attendeeEmail: att.email.toLowerCase(),
          status: 'active',
          registeredBy: registratorId
        });
      }
    }
    console.log('✅ Registered 2 attendees for FINTECH-BLOCK (Now 2/2 Full - 0 seats left)');

    // 4. Also fill up UIUX-FIGMA if it exists to be 5/5 full
    const figmaWs = await Workshop.findOne({ code: 'UIUX-FIGMA' });
    if (figmaWs) {
      const currentRegs = await Registration.countDocuments({ workshopId: figmaWs._id, status: 'active' });
      const needed = figmaWs.capacity - currentRegs;
      if (needed > 0) {
        const extraAttendees = [
          { name: 'Oliver Queen', email: 'oliver.queen@example.com' },
          { name: 'Diana Prince', email: 'diana.prince@example.com' },
          { name: 'Barry Allen', email: 'barry.allen@example.com' },
          { name: 'Clark Kent', email: 'clark.kent@example.com' },
          { name: 'Arthur Curry', email: 'arthur.curry@example.com' }
        ];

        for (let i = 0; i < needed && i < extraAttendees.length; i++) {
          await Registration.create({
            workshopId: figmaWs._id,
            attendeeName: extraAttendees[i].name,
            attendeeEmail: extraAttendees[i].email.toLowerCase(),
            status: 'active',
            registeredBy: registratorId
          });
        }
        console.log(`✅ Filled remaining seats for UIUX-FIGMA (${figmaWs.capacity}/${figmaWs.capacity} Full)`);
      }
    }

    console.log('\n🎉 Successfully added fully booked (seats exhausted) workshops and attendee registrations!');
  } catch (error) {
    console.error('❌ Error seeding full workshops:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seedFullWorkshops();
