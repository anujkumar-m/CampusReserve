const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const Resource = require('./models/Resource');
const Booking = require('./models/Booking');
const User = require('./models/User');

const debug = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        console.log('\n--- Checking Resources ---');
        const resources = await Resource.find({});
        console.log(`Total Resources: ${resources.length}`);
        resources.forEach(r => {
            console.log(`- ${r.name}: category=${r.category}, type=${r.type}, isMovable=${r.isMovable}`);
        });

        console.log('\n--- Checking Pending Bookings ---');
        const bookings = await Booking.find({ status: { $in: ['pending', 'pending_admin', 'pending_hod'] } })
            .populate('resourceId', 'name category')
            .populate('userId', 'name role');

        console.log(`Total Pending Bookings: ${bookings.length}`);
        bookings.forEach(b => {
            console.log(`- Booking ${b._id}: resource=${b.resourceId?.name} (${b.resourceId?.category}), user=${b.userId?.name} (${b.userId?.role}), status=${b.status}, approvalLevel=${b.approvalLevel}`);
        });

        console.log('\n--- Checking Infra Admin User ---');
        const infraAdmin = await User.findOne({ role: 'infraAdmin' });
        if (infraAdmin) {
            console.log(`Infra Admin found: ${infraAdmin.email}`);
        } else {
            console.log('No Infra Admin found');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

debug();
