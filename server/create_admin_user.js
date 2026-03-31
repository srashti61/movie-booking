const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

dotenv.config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/movie-booking');
        console.log('✅ MongoDB connected');

        const ADMIN_EMAIL = 'admin@gmail.com';
        const ADMIN_PASSWORD = 'admin123@'; // Default password
        const ADMIN_PHONE = '9999999999';
        const ADMIN_NAME = 'Admin';

        // Check if admin exists
        const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });

        if (existingAdmin) {
            console.log('ℹ️ Admin user already exists. Updating...');
            // Update existing admin
            if (!existingAdmin.isAdmin) {
                existingAdmin.isAdmin = true;
                console.log('  - Promoted to Admin');
            }
            // Reset password to ensure they can login
            existingAdmin.password = ADMIN_PASSWORD; // Will be hashed by pre-save
            console.log(`  - Password reset to: ${ADMIN_PASSWORD}`);

            await existingAdmin.save();
            console.log('✅ Admin user updated successfully');
        } else {
            console.log('ℹ️ Admin user does not exist. Creating...');
            // Create new admin
            // Note: User model pre-save hook handles hashing usually, but let's check. 
            // User.js has a pre-save hook to hash password.

            const newAdmin = new User({
                name: ADMIN_NAME,
                email: ADMIN_EMAIL,
                password: ADMIN_PASSWORD, // Will be hashed by pre-save hook
                phone: ADMIN_PHONE,
                isAdmin: true,
                status: 'active'
            });

            await newAdmin.save();
            console.log('✅ Admin user created successfully');
        }

        console.log('\n=========================================');
        console.log('🔑 Admin Credentials:');
        console.log(`📧 Email:    ${ADMIN_EMAIL}`);
        console.log(`🔒 Password: ${ADMIN_PASSWORD}`);
        console.log('=========================================\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin:', error);
        process.exit(1);
    }
};

createAdmin();
