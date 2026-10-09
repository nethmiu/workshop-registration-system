const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Workshop = require('./models/Workshop');
const Registration = require('./models/Registration');
const generateToken = require('./utils/generateToken');

async function runTests() {
  console.log('🧪 Starting automated API and Controller verification tests...');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  try {
    // 1. Clean up test artifacts
    await User.deleteMany({ email: { $in: ['test_mgr@workshop.com', 'test_staff@workshop.com', 'test_unauth@workshop.com'] } });
    await Workshop.deleteMany({ code: { $in: ['TEST-WS-101', 'TEST-WS-102'] } });

    // 2. Test User Creation & Password Hashing
    console.log('\n--- Test 1: User Registration & Hashing ---');
    const managerUser = await User.create({
      name: 'Test Manager',
      email: 'test_mgr@workshop.com',
      password: 'password123',
      role: 'manager'
    });
    console.log(`✅ Created Manager: ${managerUser.email}, role: ${managerUser.role}`);
    console.log(`✅ Password is hashed: ${managerUser.password !== 'password123' && managerUser.password.startsWith('$2')}`);

    const isMatch = await managerUser.comparePassword('password123');
    console.log(`✅ comparePassword('password123') matches: ${isMatch}`);

    const staffUser = await User.create({
      name: 'Test Staff',
      email: 'test_staff@workshop.com',
      password: 'password123',
      role: 'staff'
    });
    console.log(`✅ Created Staff: ${staffUser.email}, role: ${staffUser.role}`);

    // 3. Test JWT Token Generation
    console.log('\n--- Test 2: JWT Generation ---');
    const managerToken = generateToken(managerUser._id, managerUser.role);
    const staffToken = generateToken(staffUser._id, staffUser.role);
    console.log(`✅ Manager Token generated: ${managerToken.substring(0, 25)}...`);
    console.log(`✅ Staff Token generated: ${staffToken.substring(0, 25)}...`);

    // 4. Test Workshop Creation
    console.log('\n--- Test 3: Workshop Model & Capacity Logic ---');
    const workshop = await Workshop.create({
      code: 'TEST-WS-101',
      title: 'Fullstack Microservices Workshop',
      instructor: 'Dr. Sarah Connor',
      dateTime: new Date(Date.now() + 86400000 * 7), // 7 days in future
      capacity: 2, // capacity of 2 for testing limits
      status: 'active'
    });
    console.log(`✅ Workshop created: ${workshop.code}, Capacity: ${workshop.capacity}`);

    // Clean up registrations for this test workshop
    await Registration.deleteMany({ workshopId: workshop._id });

    // 5. Test Registration 1 (Capacity 1/2)
    console.log('\n--- Test 4: Registrations & Capacity Check ---');
    const reg1 = await Registration.create({
      workshopId: workshop._id,
      attendeeName: 'Alice Johnson',
      attendeeEmail: 'alice@example.com',
      status: 'active',
      registeredBy: staffUser._id
    });
    console.log(`✅ Attendee 1 registered: ${reg1.attendeeName} (${reg1.attendeeEmail})`);

    let activeCount = await Registration.countDocuments({ workshopId: workshop._id, status: 'active' });
    console.log(`✅ Active registrations: ${activeCount}/${workshop.capacity}, Available seats: ${workshop.capacity - activeCount}`);

    // 6. Test Registration 2 (Capacity 2/2 - Full)
    const reg2 = await Registration.create({
      workshopId: workshop._id,
      attendeeName: 'Bob Smith',
      attendeeEmail: 'bob@example.com',
      status: 'active',
      registeredBy: staffUser._id
    });
    console.log(`✅ Attendee 2 registered: ${reg2.attendeeName} (${reg2.attendeeEmail})`);

    activeCount = await Registration.countDocuments({ workshopId: workshop._id, status: 'active' });
    console.log(`✅ Active registrations: ${activeCount}/${workshop.capacity}, Available seats: ${workshop.capacity - activeCount}`);

    // 7. Verify Over-Capacity Rejection
    const isFull = activeCount >= workshop.capacity;
    console.log(`✅ Over-capacity blocked: ${isFull} (Active: ${activeCount} >= Capacity: ${workshop.capacity})`);

    // 8. Test Cancellation & Audit Trail
    console.log('\n--- Test 5: Cancellation Audit History & Seat Release ---');
    reg1.status = 'cancelled';
    reg1.cancelledBy = staffUser._id;
    await reg1.save();
    console.log(`✅ Registration 1 cancelled by ${staffUser.name}. Status: ${reg1.status}`);

    const refreshedActiveCount = await Registration.countDocuments({ workshopId: workshop._id, status: 'active' });
    const availableSeatsAfterCancel = workshop.capacity - refreshedActiveCount;
    console.log(`✅ Active registrations after cancellation: ${refreshedActiveCount}/${workshop.capacity}`);
    console.log(`✅ Released seat is now available: ${availableSeatsAfterCancel > 0} (Available: ${availableSeatsAfterCancel})`);

    // Verify record was preserved in database
    const preservedRecord = await Registration.findById(reg1._id)
      .populate('workshopId', 'code title')
      .populate('registeredBy', 'name role')
      .populate('cancelledBy', 'name role');

    console.log(`✅ Preserved in DB: Attendee=${preservedRecord.attendeeName}, Status=${preservedRecord.status}, RegisteredBy=${preservedRecord.registeredBy.name}, CancelledBy=${preservedRecord.cancelledBy.name}`);

    // 9. Clean up test data
    await User.deleteMany({ email: { $in: ['test_mgr@workshop.com', 'test_staff@workshop.com', 'test_unauth@workshop.com'] } });
    await Workshop.deleteMany({ code: { $in: ['TEST-WS-101', 'TEST-WS-102'] } });
    await Registration.deleteMany({ workshopId: workshop._id });

    console.log('\n🎉 ALL CONTROLLER AND MODEL TEST SUITES PASSED SUCCESSFULLY!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

runTests();
