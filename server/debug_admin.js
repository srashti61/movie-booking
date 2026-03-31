const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

dotenv.config();

const debugAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/movie-booking');
        console.log('✅ MongoDB connected');

        const email = 'admin@gmail.com';
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            console.log('❌ Admin user NOT found!');
        } else {
            console.log('✅ Admin user found:');
            console.log(`- ID: ${user._id}`);
            console.log(`- Email: ${user.email}`);
            console.log(`- IsAdmin: ${user.isAdmin}`);
            console.log(`- Password (hashed?): ${user.password}`);

            const isHashed = user.password && user.password.startsWith('$2');
            console.log(`- Is Hash Format Correct?: ${isHashed ? 'Yes' : 'No'}`);

            // Test compare
            const testPass = 'admin123@';
            const isMatch = await bcrypt.compare(testPass, user.password);
            console.log(`- Password '${testPass}' Matches?: ${isMatch ? 'YES' : 'NO'}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

debugAdmin();
