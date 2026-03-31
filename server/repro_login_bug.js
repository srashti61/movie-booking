const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

dotenv.config();

const runTest = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/movie-booking');
        console.log('✅ MongoDB connected');

        const email = 'admin@gmail.com';
        const rawPassword = 'admin123@';

        // 1. Reset Password first to known state
        const user = await User.findOne({ email });
        if (!user) {
            console.log('❌ User not found');
            process.exit(1);
        }

        user.password = rawPassword;
        await user.save();
        console.log('1️⃣ Password reset to "admin123@" and saved.');

        // 2. Verify immediately
        const user2 = await User.findOne({ email }).select('+password');
        const match1 = await bcrypt.compare(rawPassword, user2.password);
        console.log(`2️⃣ Immediate Login Verification: ${match1 ? '✅ SUCCESS' : '❌ FAILED'}`);

        if (!match1) process.exit(1);

        // 3. Simulate "Login" (Just finding user, no save)
        // Nothing changes in DB.

        // 4. Simulate "User Update" (e.g. updating profile stats) WITHOUT loading password
        // This simulates what happenes in some controllers
        const user3 = await User.findOne({ email }); // Password NOT selected
        user3.phone = '9999999999'; // Dummy update
        await user3.save();
        console.log('3️⃣ Saved user document (phone update) WITHOUT loading password.');

        const user4 = await User.findOne({ email }).select('+password');
        const match2 = await bcrypt.compare(rawPassword, user4.password);
        console.log(`4️⃣ Login Verification after partial save: ${match2 ? '✅ SUCCESS' : '❌ FAILED (Password corrupted)'}`);

        // 5. Simulate Loading WITH password and saving (Rare but possible)
        const user5 = await User.findOne({ email }).select('+password');
        // user5.password is the HASH now.
        user5.name = user5.name; // Touch something
        await user5.save();
        console.log('5️⃣ Saved user document WITH password loaded (no change to password field).');

        const user6 = await User.findOne({ email }).select('+password');
        const match3 = await bcrypt.compare(rawPassword, user6.password);
        console.log(`6️⃣ Login Verification after full save: ${match3 ? '✅ SUCCESS' : '❌ FAILED (Double Hashing detected)'}`);

        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

runTest();
