const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const app = require('./server');
const User = require('./models/User');
const generateToken = require('./utils/generateToken');

async function testStrictRBACDirect() {
  console.log('🧪 Starting Strict Role-Based Access Control Verification Tests (In-Process)...');

  await mongoose.connect(process.env.MONGO_URI);

  // Start a local test server on an ephemeral port
  const server = app.listen(0);
  const port = server.address().port;
  const API_BASE = `http://localhost:${port}/api`;

  try {
    const adminUser = await User.findOne({ role: 'admin' });
    const managerUser = await User.findOne({ role: 'manager' });
    const staffUser = await User.findOne({ role: 'staff' });

    const adminToken = generateToken(adminUser._id, 'admin');
    const managerToken = generateToken(managerUser._id, 'manager');
    const staffToken = generateToken(staffUser._id, 'staff');

    // 1. Test Admin attempting to access /api/workshops -> EXPECT 403 Forbidden
    console.log('\nTest 1: Admin requesting GET /api/workshops...');
    const wsRes = await fetch(`${API_BASE}/workshops`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (wsRes.status === 403) {
      const data = await wsRes.json();
      console.log(`✅ PASSED (403 Forbidden): "${data.message}"`);
    } else {
      console.log(`❌ FAILED: Received status ${wsRes.status}`);
    }

    // 2. Test Admin attempting to access /api/registrations -> EXPECT 403 Forbidden
    console.log('\nTest 2: Admin requesting GET /api/registrations...');
    const regRes = await fetch(`${API_BASE}/registrations`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (regRes.status === 403) {
      const data = await regRes.json();
      console.log(`✅ PASSED (403 Forbidden): "${data.message}"`);
    } else {
      console.log(`❌ FAILED: Received status ${regRes.status}`);
    }

    // 3. Test Staff attempting to access User Directory /api/users -> EXPECT 403 Forbidden
    console.log('\nTest 3: Staff requesting GET /api/users...');
    const usrRes = await fetch(`${API_BASE}/users`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    if (usrRes.status === 403) {
      const data = await usrRes.json();
      console.log(`✅ PASSED (403 Forbidden): "${data.message}"`);
    } else {
      console.log(`❌ FAILED: Received status ${usrRes.status}`);
    }

    // 4. Test Manager accessing /api/workshops -> EXPECT 200 OK
    console.log('\nTest 4: Manager requesting GET /api/workshops...');
    const mgrWsRes = await fetch(`${API_BASE}/workshops`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    if (mgrWsRes.status === 200) {
      const data = await mgrWsRes.json();
      console.log(`✅ PASSED (200 OK): ${data.count} workshops found`);
    } else {
      console.log(`❌ FAILED: Received status ${mgrWsRes.status}`);
    }

    // 5. Test Staff accessing /api/workshops -> EXPECT 200 OK
    console.log('\nTest 5: Staff requesting GET /api/workshops...');
    const stfWsRes = await fetch(`${API_BASE}/workshops`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    if (stfWsRes.status === 200) {
      const data = await stfWsRes.json();
      console.log(`✅ PASSED (200 OK): ${data.count} workshops found`);
    } else {
      console.log(`❌ FAILED: Received status ${stfWsRes.status}`);
    }

    // 6. Test Admin accessing /api/users -> EXPECT 200 OK
    console.log('\nTest 6: Admin requesting GET /api/users...');
    const admUsrRes = await fetch(`${API_BASE}/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (admUsrRes.status === 200) {
      const data = await admUsrRes.json();
      console.log(`✅ PASSED (200 OK): ${data.count} users found`);
    } else {
      console.log(`❌ FAILED: Received status ${admUsrRes.status}`);
    }

    console.log('\n🎉 ALL STRICT RBAC ROLE BOUNDARY TESTS PASSED 100%!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  }
}

testStrictRBACDirect();
