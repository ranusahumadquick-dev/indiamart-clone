const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'server', '.env') });
const mongoose = require('mongoose');

(async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/bazaarconnect';
    console.log('Connecting to', uri);
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.error('ADMIN_EMAIL is not set in server/.env');
      process.exit(1);
    }

    const user = await User.findOne({ email: adminEmail }).lean();
    if (user) {
      console.log('Admin user found:');
      console.log(JSON.stringify(user, null, 2));
    } else {
      console.log('Admin user not found for email:', adminEmail);
    }
  } catch (err) {
    console.error('Error checking admin user:', err);
    process.exit(2);
  } finally {
    try { await mongoose.disconnect(); } catch (e) {}
  }
})();
