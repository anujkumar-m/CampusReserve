const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars - ADJUST PATH TO BACKEND DIRECTORY
dotenv.config({ path: path.join(__dirname, '.env') });

const Resource = require('./models/Resource');
const Booking = require('./models/Booking');
const User = require('./models/User');

const debug = async () => {
    try {
        console.log('Connecting to:', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        console.log('\n--- Checking Resources (Category Check) ---');
        // Check for resources with missing category
        const missingCategory = await Resource.find({ category: { $exists: false } });
        console.log(`Resources missing category: ${missingCategory.length}`);

        const fixedResources = await Resource.find({ category: { $in: ['department', 'central'] } });
        console.log(`Fixed Resources (Infra): ${fixedResources.length}`);

        const movableResources = await Resource.find({ category: 'movable_asset' });
        console.log(`Movable Resources (IT): ${movableResources.length}`);

        console.log('\n--- Checking Pending Bookings ---');
        const allBookings = await Booking.find({});
        console.log(`Total Bookings in DB: ${allBookings.length}`);

        const pendingBookings = await Booking.find({
            status: { $in: ['pending', 'pending_admin', 'pending_hod'] }
        }).populate('resourceId');

        console.log(`Total "Pending" Bookings: ${pendingBookings.length}`);

        console.log('\n--- Simulating Infra Admin Query ---');
        const fixedRes = await Resource.find({ category: { $in: ['department', 'central'] } }).select('_id');
        console.log(`Found ${fixedRes.length} Fixed Resources`);

        const infraQuery = {
            status: { $in: ['pending_admin', 'pending_hod'] },
            resourceId: { $in: fixedRes.map(r => r._id) }
        };
        console.log('Query:', JSON.stringify(infraQuery));

        const infraBookings = await Booking.find(infraQuery).populate('resourceId', 'name');
        console.log(`Infra Admin would see: ${infraBookings.length} bookings`);
        infraBookings.forEach(b => console.log(`- ${b._id}: ${b.resourceId?.name}`));

    } catch (err) {
        console.error('Debug Error:', err);
    } finally {
        await mongoose.disconnect();
    }
};

debug();
