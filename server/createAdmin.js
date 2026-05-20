require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

(async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/bazaarconnect';
    console.log('Connecting to', uri);
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminPhone = process.env.ADMIN_PHONE || `admin_${Date.now()}`;

    if (!adminEmail || !adminPassword) {
      console.error('ADMIN_EMAIL or ADMIN_PASSWORD not set in .env');
      process.exit(1);
    }

    const existing = await User.findOne({ email: adminEmail });
    if (existing) {
      console.log('Admin user already exists:', existing.email);
    } else {
      const admin = new User({ name: 'Super Admin', email: adminEmail, password: adminPassword, role: 'admin', phone: adminPhone });
      await admin.save();
      console.log('Admin user created:', admin.email);
    }
  } catch (err) {
    console.error('Error creating admin user:', err);
    process.exit(2);
  } finally {
    try { await mongoose.disconnect(); } catch (e) {}
  }
})();
