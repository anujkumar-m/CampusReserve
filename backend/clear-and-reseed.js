// Script to clear old users and reseed with correct roles
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const clearAndReseed = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Delete all users
        const deleteResult = await User.deleteMany({});
        console.log(`🗑️  Deleted ${deleteResult.deletedCount} users\n`);

        // Create new users with correct roles
        const users = [
            {
                name: 'Infrastructure Admin',
                email: 'infraadmin@bitsathy.ac.in',
                password: 'admin@123',
                role: 'infraAdmin',
                authProvider: 'local',
            },
            {
                name: 'IT Service Admin',
                email: 'itadmin@bitsathy.ac.in',
                password: 'admin@123',
                role: 'itAdmin',
                authProvider: 'local',
            },
            {
                name: 'Dr. Sarah Johnson',
                email: 'sarah@college.edu',
                password: 'password123',
                role: 'faculty',
                department: 'CS',
                authProvider: 'local',
            },
            {
                name: 'CS Department HOD',
                email: 'cs@college.edu',
                password: 'password123',
                role: 'department',
                department: 'CS',
                authProvider: 'local',
            },
            {
                name: 'IT Department HOD',
                email: 'it@college.edu',
                password: 'password123',
                role: 'department',
                department: 'IT',
                authProvider: 'local',
            },
            {
                name: 'Tech Club',
                email: 'techclub@college.edu',
                password: 'password123',
                role: 'club',
                clubName: 'Tech Club',
                authProvider: 'local',
            },
            {
                name: 'Infrastructure Manager',
                email: 'infra@college.edu',
                password: 'password123',
                role: 'infrastructure',
                authProvider: 'local',
            },
            {
                name: 'IT Service Manager',
                email: 'itservice@college.edu',
                password: 'password123',
                role: 'itService',
                authProvider: 'local',
            },
        ];

        for (const userData of users) {
            await User.create(userData);
            console.log(`  ✅ Created user: ${userData.email} (${userData.role})`);
        }

        console.log('\n🎉 Database cleared and reseeded successfully!');
        console.log(`\n📊 Total users: ${await User.countDocuments()}`);

        console.log('\n🔐 Login credentials:');
        console.log('  Infrastructure Admin: infraadmin@bitsathy.ac.in / admin@123');
        console.log('  IT Service Admin: itadmin@bitsathy.ac.in / admin@123');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

clearAndReseed();
