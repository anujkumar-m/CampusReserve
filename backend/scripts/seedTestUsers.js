/**
 * Seed script to create test users for all roles and departments
 * Run with: node backend/scripts/seedTestUsers.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const testUsers = [
    // Students - One per department
    { name: 'Anuj', email: 'anuj.cs23@bitsathy.ac.in', password: 'Test@123', role: 'student', department: 'CS', year: '2023', authProvider: 'local' },
    { name: 'Priya', email: 'priya.al24@bitsathy.ac.in', password: 'Test@123', role: 'student', department: 'AL', year: '2024', authProvider: 'local' },
    { name: 'Rahul', email: 'rahul.ad23@bitsathy.ac.in', password: 'Test@123', role: 'student', department: 'AD', year: '2023', authProvider: 'local' },
    { name: 'Sneha', email: 'sneha.it22@bitsathy.ac.in', password: 'Test@123', role: 'student', department: 'IT', year: '2022', authProvider: 'local' },
    { name: 'Karthik', email: 'karthik.mz23@bitsathy.ac.in', password: 'Test@123', role: 'student', department: 'MZ', year: '2023', authProvider: 'local' },
    { name: 'Divya', email: 'divya.me24@bitsathy.ac.in', password: 'Test@123', role: 'student', department: 'ME', year: '2024', authProvider: 'local' },
    { name: 'Arun', email: 'arun.ee23@bitsathy.ac.in', password: 'Test@123', role: 'student', department: 'EE', year: '2023', authProvider: 'local' },
    { name: 'Meera', email: 'meera.ec22@bitsathy.ac.in', password: 'Test@123', role: 'student', department: 'EC', year: '2022', authProvider: 'local' },
    { name: 'Vijay', email: 'vijay.ei23@bitsathy.ac.in', password: 'Test@123', role: 'student', department: 'EI', year: '2023', authProvider: 'local' },
    { name: 'Lakshmi', email: 'lakshmi.ce24@bitsathy.ac.in', password: 'Test@123', role: 'student', department: 'CE', year: '2024', authProvider: 'local' },
    { name: 'Pooja', email: 'pooja.fd23@bitsathy.ac.in', password: 'Test@123', role: 'student', department: 'FD', year: '2023', authProvider: 'local' },
    { name: 'Ravi', email: 'ravi.ft22@bitsathy.ac.in', password: 'Test@123', role: 'student', department: 'FT', year: '2022', authProvider: 'local' },
    { name: 'Nisha', email: 'nisha.bt23@bitsathy.ac.in', password: 'Test@123', role: 'student', department: 'BT', year: '2023', authProvider: 'local' },

    // Faculty - Sample
    { name: 'Dr. Kumar', email: 'dr.kumar@bitsathy.ac.in', password: 'Faculty@123', role: 'faculty', department: 'CS', authProvider: 'local' },
    { name: 'Prof. Sharma', email: 'prof.sharma@bitsathy.ac.in', password: 'Faculty@123', role: 'faculty', department: 'IT', authProvider: 'local' },
    { name: 'Dr. Patel', email: 'dr.patel@bitsathy.ac.in', password: 'Faculty@123', role: 'faculty', department: 'EC', authProvider: 'local' },
    { name: 'Prof. Reddy', email: 'prof.reddy@bitsathy.ac.in', password: 'Faculty@123', role: 'faculty', department: 'ME', authProvider: 'local' },

    // HODs - All departments
    { name: 'HOD CS', email: 'hodcs@bitsathy.ac.in', password: 'HOD@123', role: 'department', department: 'CS', authProvider: 'local' },
    { name: 'HOD AL', email: 'hodal@bitsathy.ac.in', password: 'HOD@123', role: 'department', department: 'AL', authProvider: 'local' },
    { name: 'HOD AD', email: 'hodad@bitsathy.ac.in', password: 'HOD@123', role: 'department', department: 'AD', authProvider: 'local' },
    { name: 'HOD IT', email: 'hodit@bitsathy.ac.in', password: 'HOD@123', role: 'department', department: 'IT', authProvider: 'local' },
    { name: 'HOD MZ', email: 'hodmz@bitsathy.ac.in', password: 'HOD@123', role: 'department', department: 'MZ', authProvider: 'local' },
    { name: 'HOD ME', email: 'hodme@bitsathy.ac.in', password: 'HOD@123', role: 'department', department: 'ME', authProvider: 'local' },
    { name: 'HOD EE', email: 'hodee@bitsathy.ac.in', password: 'HOD@123', role: 'department', department: 'EE', authProvider: 'local' },
    { name: 'HOD EC', email: 'hodec@bitsathy.ac.in', password: 'HOD@123', role: 'department', department: 'EC', authProvider: 'local' },
    { name: 'HOD EI', email: 'hodei@bitsathy.ac.in', password: 'HOD@123', role: 'department', department: 'EI', authProvider: 'local' },
    { name: 'HOD CE', email: 'hodce@bitsathy.ac.in', password: 'HOD@123', role: 'department', department: 'CE', authProvider: 'local' },
    { name: 'HOD FD', email: 'hodfd@bitsathy.ac.in', password: 'HOD@123', role: 'department', department: 'FD', authProvider: 'local' },
    { name: 'HOD FT', email: 'hodft@bitsathy.ac.in', password: 'HOD@123', role: 'department', department: 'FT', authProvider: 'local' },
    { name: 'HOD BT', email: 'hodbt@bitsathy.ac.in', password: 'HOD@123', role: 'department', department: 'BT', authProvider: 'local' },

    // Clubs
    { name: 'NSS', email: 'nss@bitsathy.ac.in', password: 'Club@123', role: 'club', clubName: 'NSS', authProvider: 'local' },
    { name: 'NCC', email: 'ncc@bitsathy.ac.in', password: 'Club@123', role: 'club', clubName: 'NCC', authProvider: 'local' },
    { name: 'Rotaract', email: 'rotaract@bitsathy.ac.in', password: 'Club@123', role: 'club', clubName: 'Rotaract', authProvider: 'local' },

    // Admin
    { name: 'Admin', email: 'admin@bitsathy.ac.in', password: 'Admin@123', role: 'admin', authProvider: 'local' },
];

const seedUsers = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected');

        // Clear existing test users (optional - comment out if you want to keep existing data)
        // await User.deleteMany({ email: { $regex: '@bitsathy.ac.in$' } });
        // console.log('🗑️  Cleared existing test users');

        // Create users
        let created = 0;
        let skipped = 0;

        for (const userData of testUsers) {
            const existingUser = await User.findOne({ email: userData.email });

            if (existingUser) {
                console.log(`⏭️  Skipped: ${userData.email} (already exists)`);
                skipped++;
                continue;
            }

            await User.create(userData);
            console.log(`✅ Created: ${userData.email} (${userData.role})`);
            created++;
        }

        console.log(`\n📊 Summary:`);
        console.log(`   Created: ${created} users`);
        console.log(`   Skipped: ${skipped} users`);
        console.log(`\n🎉 Seed completed successfully!`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding users:', error);
        process.exit(1);
    }
};

seedUsers();
