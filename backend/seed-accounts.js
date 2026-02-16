require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const accounts = [
    // Faculty Accounts
    { name: 'John Doe', email: 'john.doe@bitsathy.ac.in', password: 'Faculty@123', role: 'faculty', authProvider: 'local' },
    { name: 'Kumar', email: 'kumar@bitsathy.ac.in', password: 'Faculty@123', role: 'faculty', authProvider: 'local' },
    { name: 'Dr. Sharma', email: 'dr.sharma@bitsathy.ac.in', password: 'Faculty@123', role: 'faculty', authProvider: 'local' },
    { name: 'Prof. Wilson', email: 'prof.wilson@bitsathy.ac.in', password: 'Faculty@123', role: 'faculty', authProvider: 'local' },

    // HOD Accounts
    { name: 'CS HOD', email: 'hodcs@bitsathy.ac.in', password: 'HOD@123', role: 'department', department: 'CS', authProvider: 'local' },
    { name: 'AL HOD', email: 'hodal@bitsathy.ac.in', password: 'HOD@123', role: 'department', department: 'AL', authProvider: 'local' },
    { name: 'AD HOD', email: 'hodad@bitsathy.ac.in', password: 'HOD@123', role: 'department', department: 'AD', authProvider: 'local' },
    { name: 'IT HOD', email: 'hodit@bitsathy.ac.in', password: 'HOD@123', role: 'department', department: 'IT', authProvider: 'local' },
    { name: 'MZ HOD', email: 'hodmz@bitsathy.ac.in', password: 'HOD@123', role: 'department', department: 'MZ', authProvider: 'local' },
    { name: 'ME HOD', email: 'hodme@bitsathy.ac.in', password: 'HOD@123', role: 'department', department: 'ME', authProvider: 'local' },
    { name: 'EE HOD', email: 'hodee@bitsathy.ac.in', password: 'HOD@123', role: 'department', department: 'EE', authProvider: 'local' },
    { name: 'EC HOD', email: 'hodec@bitsathy.ac.in', password: 'HOD@123', role: 'department', department: 'EC', authProvider: 'local' },
    { name: 'EI HOD', email: 'hodei@bitsathy.ac.in', password: 'HOD@123', role: 'department', department: 'EI', authProvider: 'local' },
    { name: 'CE HOD', email: 'hodce@bitsathy.ac.in', password: 'HOD@123', role: 'department', department: 'CE', authProvider: 'local' },
    { name: 'FD HOD', email: 'hodfd@bitsathy.ac.in', password: 'HOD@123', role: 'department', department: 'FD', authProvider: 'local' },
    { name: 'FT HOD', email: 'hodft@bitsathy.ac.in', password: 'HOD@123', role: 'department', department: 'FT', authProvider: 'local' },
    { name: 'BT HOD', email: 'hodbt@bitsathy.ac.in', password: 'HOD@123', role: 'department', department: 'BT', authProvider: 'local' },

    // Club Accounts
    { name: 'NSS Club', email: 'nss@bitsathy.ac.in', password: 'Club@123', role: 'club', clubName: 'NSS', authProvider: 'local' },
    { name: 'NCC Club', email: 'ncc@bitsathy.ac.in', password: 'Club@123', role: 'club', clubName: 'NCC', authProvider: 'local' },
    { name: 'Rotaract Club', email: 'rotaract@bitsathy.ac.in', password: 'Club@123', role: 'club', clubName: 'Rotaract', authProvider: 'local' },
];

const seedAccounts = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        for (const account of accounts) {
            const existing = await User.findOne({ email: account.email });
            if (existing) {
                // Update existing user to ensure correct role/dept/password
                Object.assign(existing, account);
                await existing.save();
                console.log(`  🔄 Updated account: ${account.email}`);
            } else {
                await User.create(account);
                console.log(`  ✅ Created account: ${account.email}`);
            }
        }

        console.log('\n🎉 All accounts seeded/updated successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding accounts:', error.message);
        process.exit(1);
    }
};

seedAccounts();
