# Campus Reserve Backend

Backend API for the College Resource Booking System built with Node.js, Express, and MongoDB.

## Features

- JWT-based authentication
- Role-based access control (Admin, Faculty, Student, Department, Club)
- Resource management (Classrooms, Labs, Seminar Halls)
- Booking system with conflict detection
- RESTful API design

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- npm or yarn

## Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```bash
cp .env.example .env
```

4. Update the `.env` file with your MongoDB Atlas connection string and other configurations:
```
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
```

## Database Setup

Seed the database with initial data:
```bash
npm run seed
```

This will create:
- 5 test users (one for each role)
- 8 sample resources
- 5 sample bookings

### Test User Credentials

All test users have the password: `password123`

- **Admin**: admin@college.edu
- **Faculty**: sarah@college.edu
- **Student**: alex@student.edu
- **Department**: cs@college.edu
- **Club**: techclub@college.edu

## Running the Server

Development mode (with auto-restart):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)

### Resources
- `GET /api/resources` - Get all resources (with filters)
- `GET /api/resources/:id` - Get resource by ID
- `POST /api/resources` - Create resource (admin/department)
- `PUT /api/resources/:id` - Update resource (admin/department)
- `DELETE /api/resources/:id` - Delete resource (admin only)

### Bookings
- `GET /api/bookings` - Get bookings (filtered by role)
- `GET /api/bookings/pending` - Get pending bookings (admin/department)
- `GET /api/bookings/:id` - Get booking by ID
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id/status` - Update booking status (admin/department)
- `DELETE /api/bookings/:id` - Delete booking

## Project Structure

```
backend/
├── config/
│   └── db.js                 # Database connection
├── controllers/
│   ├── authController.js     # Authentication logic
│   ├── userController.js     # User CRUD operations
│   ├── resourceController.js # Resource CRUD operations
│   └── bookingController.js  # Booking CRUD operations
├── middleware/
│   ├── auth.js              # JWT authentication middleware
│   └── roleCheck.js         # Role-based authorization
├── models/
│   ├── User.js              # User schema
│   ├── Resource.js          # Resource schema
│   └── Booking.js           # Booking schema
├── routes/
│   ├── auth.js              # Auth routes
│   ├── users.js             # User routes
│   ├── resources.js         # Resource routes
│   └── bookings.js          # Booking routes
├── utils/
│   └── seedDatabase.js      # Database seeding script
├── .env.example             # Environment variables template
├── .gitignore
├── package.json
└── server.js                # Main application file
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| NODE_ENV | Environment mode | development |
| MONGODB_URI | MongoDB connection string | - |
| JWT_SECRET | Secret key for JWT | - |
| JWT_EXPIRE | JWT expiration time | 7d |
| FRONTEND_URL | Frontend URL for CORS | http://localhost:5173 |

## License

ISC
