
// changeAdminPassword();
// ...existing code...
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
dotenv.config();

const User = require('./models/User');

async function createOrUpdateAdmin() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/movie-booking', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@gmail.com';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admingupta123@';
  const ADMIN_PHONE = process.env.ADMIN_PHONE || '9023269693';
  const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin';

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    existing.password = hashedPassword;
    existing.name = ADMIN_NAME;
    existing.isAdmin = true;
    existing.phone = ADMIN_PHONE;
    await existing.save();
    console.log('✅ Admin user updated');
  } else {
    await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: hashedPassword,
      isAdmin: true,
      phone: ADMIN_PHONE,
    });
    console.log('✅ Admin user created');
  }

  await mongoose.disconnect();
  process.exit(0);
}

createOrUpdateAdmin();
// ...existing code...