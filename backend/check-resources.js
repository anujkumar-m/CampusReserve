require('dotenv').config();
const mongoose = require('mongoose');
const Resource = require('./models/Resource');

async function checkResources() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const resources = await Resource.find({});
        console.log(`Total resources in database: ${resources.length}\n`);

        if (resources.length === 0) {
            console.log('❌ No resources found! Please run: node seed-database.js');
        } else {
            console.log('Resources:');
            resources.forEach(r => {
                console.log(`- ${r.name}`);
                console.log(`  Type: ${r.type}, Category: ${r.category}`);
                console.log(`  Department: ${r.department || 'N/A'}`);
                console.log('');
            });
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkResources();
