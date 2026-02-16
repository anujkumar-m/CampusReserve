require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Resource = require('../models/Resource');
const Booking = require('../models/Booking');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const seedData = async () => {
    try {
        await connectDB();

        // Clear existing data
        console.log('Clearing existing data...');
        await User.deleteMany();
        await Resource.deleteMany();
        await Booking.deleteMany();
        console.log('Existing data cleared');

        // Create users
        console.log('Creating users...');
        const users = await User.create([
            {
                name: 'Dr. Admin User',
                email: 'admin@bitsathy.ac.in',
                password: 'admin@123',
                role: 'admin',
            },
            {
                name: 'Prof. Sarah Johnson',
                email: 'sarah@college.edu',
                password: 'password123',
                role: 'faculty',
                department: 'Computer Science',
            },
            {
                name: 'Alex Thompson',
                email: 'alex@student.edu',
                password: 'password123',
                role: 'student',
                department: 'Computer Science',
            },
            {
                name: 'CS Department Head',
                email: 'cs@college.edu',
                password: 'password123',
                role: 'department',
                department: 'Computer Science',
            },
            {
                name: 'Tech Club Representative',
                email: 'techclub@college.edu',
                password: 'password123',
                role: 'club',
                clubName: 'Technology Club',
            },
            {
                name: 'Prof. John Doe',
                email: 'john@college.edu',
                password: 'password123',
                role: 'faculty',
                department: 'Electronics',
            },
        ]);
        console.log(`Created ${users.length} users`);

        // Create resources
        console.log('Creating resources...');
        const resources = await Resource.create([
            // Department resources - Computer Science
            {
                name: 'CS Department Library',
                type: 'department_library',
                category: 'department',
                capacity: 50,
                location: 'CS Building, Floor 1',
                amenities: ['Books', 'Study Tables', 'AC', 'WiFi'],
                department: 'Computer Science',
                isAvailable: true,
            },
            {
                name: 'Lecture Hall A',
                type: 'classroom',
                category: 'department',
                capacity: 120,
                location: 'Building A, Floor 1',
                amenities: ['Projector', 'Whiteboard', 'AC', 'Mic System'],
                department: 'Computer Science',
                isAvailable: true,
            },
            {
                name: 'Computer Lab 101',
                type: 'lab',
                category: 'department',
                capacity: 40,
                location: 'Building B, Floor 2',
                amenities: ['40 PCs', 'Projector', 'AC', 'High-Speed Internet'],
                department: 'Computer Science',
                isAvailable: true,
            },
            {
                name: 'AI Research Lab',
                type: 'lab',
                category: 'department',
                capacity: 25,
                location: 'Building B, Floor 3',
                amenities: ['GPU Workstations', 'Projector', 'AC', 'High-Speed Internet'],
                department: 'Computer Science',
                isAvailable: true,
            },
            {
                name: 'CS Seminar Hall',
                type: 'department_seminar_hall',
                category: 'department',
                capacity: 100,
                location: 'CS Building, Floor 2',
                amenities: ['Projector', 'Sound System', 'AC', 'Video Conferencing'],
                department: 'Computer Science',
                isAvailable: true,
            },
            // Department resources - Other departments
            {
                name: 'Classroom 201',
                type: 'classroom',
                category: 'department',
                capacity: 60,
                location: 'Building A, Floor 2',
                amenities: ['Projector', 'Whiteboard', 'AC'],
                department: 'Electronics',
                isAvailable: true,
            },
            {
                name: 'Physics Lab',
                type: 'lab',
                category: 'department',
                capacity: 30,
                location: 'Science Block, Floor 1',
                amenities: ['Lab Equipment', 'Safety Gear', 'Projector'],
                department: 'Physics',
                isAvailable: false,
            },
            {
                name: 'Lecture Hall C',
                type: 'classroom',
                category: 'department',
                capacity: 80,
                location: 'Building C, Floor 1',
                amenities: ['Projector', 'Whiteboard', 'AC', 'Recording Setup'],
                department: 'Mathematics',
                isAvailable: true,
            },
            // Central resources
            {
                name: 'Main Auditorium',
                type: 'auditorium',
                category: 'central',
                capacity: 500,
                location: 'Main Building, Ground Floor',
                amenities: ['Stage', 'Sound System', 'Lighting', 'AC', 'Video Conferencing', 'Recording'],
                isAvailable: true,
            },
            {
                name: 'Central Seminar Hall',
                type: 'central_seminar_hall',
                category: 'central',
                capacity: 200,
                location: 'Main Building, Floor 1',
                amenities: ['Stage', 'Projector', 'Sound System', 'AC', 'Video Conferencing'],
                isAvailable: true,
            },
            {
                name: 'Conference Room A',
                type: 'conference_room',
                category: 'central',
                capacity: 30,
                location: 'Admin Block, Floor 2',
                amenities: ['Video Conferencing', 'Whiteboard', 'AC', 'Smart TV'],
                isAvailable: true,
            },
            {
                name: 'Conference Room B',
                type: 'conference_room',
                category: 'central',
                capacity: 50,
                location: 'Admin Block, Floor 3',
                amenities: ['Video Conferencing', 'Whiteboard', 'AC', 'Smart TV', 'Recording'],
                isAvailable: true,
            },
            {
                name: 'College Bus 1',
                type: 'bus',
                category: 'central',
                capacity: 50,
                location: 'Parking Area',
                amenities: ['AC', 'First Aid Kit', 'GPS'],
                isAvailable: true,
            },
            {
                name: 'College Bus 2',
                type: 'bus',
                category: 'central',
                capacity: 40,
                location: 'Parking Area',
                amenities: ['AC', 'First Aid Kit'],
                isAvailable: true,
            },
            // Movable assets
            {
                name: 'Professional Projector 1',
                type: 'projector',
                category: 'movable_asset',
                capacity: 1,
                location: 'Equipment Room',
                amenities: ['4K Support', 'HDMI', 'Wireless'],
                isAvailable: true,
            },
            {
                name: 'DSLR Camera Kit',
                type: 'camera',
                category: 'movable_asset',
                capacity: 1,
                location: 'Equipment Room',
                amenities: ['Tripod', 'Lenses', 'Memory Cards'],
                isAvailable: true,
            },
            {
                name: 'Portable Sound System',
                type: 'sound_system',
                category: 'movable_asset',
                capacity: 1,
                location: 'Equipment Room',
                amenities: ['Microphones', 'Speakers', 'Mixer'],
                isAvailable: true,
            },
        ]);
        console.log(`Created ${resources.length} resources`);

        // Create bookings
        console.log('Creating bookings...');
        const bookings = await Booking.create([
            {
                resourceId: resources[1]._id, // Lecture Hall A (CS Department)
                userId: users[1]._id, // Prof. Sarah Johnson
                date: '2026-02-05',
                timeSlot: { start: '09:00', end: '11:00' },
                duration: 2,
                purpose: 'Data Structures Lecture',
                bookingType: 'regular',
                status: 'approved',
                requiresApproval: true,
                approvalLevel: 'hod',
                approvedBy: users[3]._id, // CS Department Head
                department: 'Computer Science',
            },
            {
                resourceId: resources[2]._id, // Computer Lab 101
                userId: users[2]._id, // Alex Thompson (Student)
                date: '2026-02-06',
                timeSlot: { start: '14:00', end: '15:00' },
                duration: 1,
                purpose: 'Programming Practice Session',
                bookingType: 'regular',
                status: 'auto_approved',
                requiresApproval: false,
                approvalLevel: 'none',
                department: 'Computer Science',
            },
            {
                resourceId: resources[9]._id, // Central Seminar Hall
                userId: users[4]._id, // Tech Club
                date: '2026-02-10',
                timeSlot: { start: '15:00', end: '18:00' },
                duration: 3,
                purpose: 'Annual Tech Fest Inauguration',
                bookingType: 'event',
                status: 'pending_admin',
                requiresApproval: true,
                approvalLevel: 'admin',
            },
            {
                resourceId: resources[5]._id, // Classroom 201 (Electronics)
                userId: users[5]._id, // Prof. John Doe
                date: '2026-02-08',
                timeSlot: { start: '11:00', end: '13:00' },
                duration: 2,
                purpose: 'Guest Lecture on IoT',
                bookingType: 'regular',
                status: 'pending_hod',
                requiresApproval: true,
                approvalLevel: 'hod',
                department: 'Electronics',
            },
            {
                resourceId: resources[3]._id, // AI Research Lab
                userId: users[2]._id, // Alex Thompson (Student)
                date: '2026-02-07',
                timeSlot: { start: '10:00', end: '13:00' },
                duration: 3,
                purpose: 'Machine Learning Project Work',
                bookingType: 'project',
                status: 'rejected',
                requiresApproval: true,
                approvalLevel: 'hod',
                rejectedBy: users[3]._id, // CS Department Head
                rejectionReason: 'Lab is reserved for faculty research during this time',
                department: 'Computer Science',
            },
            {
                resourceId: resources[0]._id, // CS Department Library
                userId: users[2]._id, // Alex Thompson (Student)
                date: '2026-02-09',
                timeSlot: { start: '16:00', end: '17:00' },
                duration: 1,
                purpose: 'Group Study Session',
                bookingType: 'regular',
                status: 'auto_approved',
                requiresApproval: false,
                approvalLevel: 'none',
                department: 'Computer Science',
            },
            {
                resourceId: resources[13]._id, // College Bus 1
                userId: users[1]._id, // Prof. Sarah Johnson
                date: '2026-02-15',
                timeSlot: { start: '08:00', end: '18:00' },
                duration: 10,
                purpose: 'Industrial Visit to Tech Park',
                bookingType: 'industrial_visit',
                status: 'pending_admin',
                requiresApproval: true,
                approvalLevel: 'admin',
            },
        ]);
        console.log(`Created ${bookings.length} bookings`);

        console.log('\n✅ Database seeded successfully!');
        console.log('\nTest Users:');
        console.log('Admin: admin@bitsathy.ac.in / admin@123');
        console.log('Faculty: sarah@college.edu / password123');
        console.log('Student: alex@student.edu / password123');
        console.log('Department: cs@college.edu / password123');
        console.log('Club: techclub@college.edu / password123');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedData();
