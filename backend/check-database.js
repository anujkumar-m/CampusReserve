// Verify database has users
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const checkDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Count all users
        const userCount = await User.countDocuments();
        console.log(`📊 Total users in database: ${userCount}\n`);

        // List all users
        const users = await User.find({}).select('name email role');
        console.log('👥 Users in database:');
        users.forEach(user => {
            console.log(`  - ${user.email} (${user.role}) - ${user.name}`);
        });

        // Check for admin user specifically
        console.log('\n🔍 Checking for admin@college.edu...');
        const adminUser = await User.findOne({ email: 'admin@college.edu' }).select('+password');
        if (adminUser) {
            console.log('✅ Admin user found!');
            console.log('   Name:', adminUser.name);
            console.log('   Email:', adminUser.email);
            console.log('   Role:', adminUser.role);
            console.log('   Has password:', !!adminUser.password);
            console.log('   Password length:', adminUser.password?.length);
        } else {
            console.log('❌ Admin user NOT found in database!');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

checkDatabase();
