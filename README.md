# Campus Reserve - College Resource Booking System

A full-stack web application for managing college resource bookings with role-based access control.

## 🚀 Features

- **Role-Based Access Control**: Admin, Faculty, Student, Department, and Club roles
- **Resource Management**: Manage classrooms, labs, and seminar halls
- **Booking System**: Create, approve, and track resource bookings
- **Conflict Detection**: Automatic detection of booking conflicts
- **Real-time Updates**: React Query for optimistic updates and caching
- **Modern UI**: Built with React, TypeScript, and Tailwind CSS
- **Secure Authentication**: JWT-based authentication

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account (free tier works)
- npm or yarn

## 🛠️ Installation

### 1. Clone the Repository

```bash
cd "d:\New folder\Campus Reserve"
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_atlas_connection_string_here
JWT_SECRET=your_secure_random_jwt_secret_here
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
```

**Getting MongoDB Atlas Connection String:**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Click "Connect" → "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `<database>` with your database name (e.g., `campus-reserve`)

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Seed the database with initial data:

```bash
npm run seed
```

Start the backend server:

```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

The `.env` file is already created with:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend development server:

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## 👥 Demo Accounts

All demo accounts use the password: **password123**

| Role | Email | Access Level |
|------|-------|-------------|
| Admin | admin@college.edu | Full system access |
| Faculty | sarah@college.edu | Book resources, view own bookings |
| Student | alex@student.edu | Request bookings, view status |
| Department | cs@college.edu | Manage department resources, approve bookings |
| Club | techclub@college.edu | Book resources for events |

## 🏗️ Project Structure

```
Campus Reserve/
├── backend/
│   ├── config/          # Database configuration
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Auth & role checking
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── utils/           # Database seeding
│   ├── .env.example     # Environment template
│   ├── server.js        # Express app
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/  # React components
    │   ├── contexts/    # Auth & Booking contexts
    │   ├── pages/       # Page components
    │   ├── services/    # API services
    │   ├── types/       # TypeScript types
    │   └── App.tsx
    ├── .env             # Environment variables
    └── package.json
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Resources
- `GET /api/resources` - Get all resources
- `POST /api/resources` - Create resource (admin/department)
- `PUT /api/resources/:id` - Update resource (admin/department)
- `DELETE /api/resources/:id` - Delete resource (admin)

### Bookings
- `GET /api/bookings` - Get bookings (filtered by role)
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id/status` - Update booking status (admin/department)
- `DELETE /api/bookings/:id` - Cancel booking

### Users
- `GET /api/users` - Get all users (admin)
- `PUT /api/users/:id` - Update user (admin)
- `DELETE /api/users/:id` - Delete user (admin)

## 🧪 Testing

1. **Start both servers** (backend and frontend)
2. **Open browser** to `http://localhost:5173`
3. **Login** with any demo account
4. **Test features** based on role:
   - Admin: Manage resources, view all bookings
   - Faculty: Create bookings, view own bookings
   - Student: Request bookings, check status
   - Department: Approve/reject bookings
   - Club: Book resources for events

## 🔒 Security Features

- Password hashing with bcryptjs
- JWT token authentication
- Role-based authorization
- Protected API routes
- CORS configuration
- Input validation

## 🛠️ Technologies Used

### Backend
- Node.js & Express.js
- MongoDB & Mongoose
- JWT for authentication
- bcryptjs for password hashing

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- React Router for navigation
- React Query for data fetching
- Tailwind CSS for styling
- Axios for HTTP requests
- shadcn/ui components

## 📝 Development Scripts

### Backend
```bash
npm run dev      # Start development server with nodemon
npm start        # Start production server
npm run seed     # Seed database with sample data
```

### Frontend
```bash
npm run dev      # Start Vite dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

## 🐛 Troubleshooting

### Backend won't start
- Check MongoDB Atlas connection string in `.env`
- Ensure IP address is whitelisted in MongoDB Atlas
- Verify database user credentials

### Frontend can't connect to backend
- Ensure backend is running on port 5000
- Check `VITE_API_URL` in frontend `.env`
- Verify CORS settings in backend

### Login fails
- Run `npm run seed` to create demo users
- Check backend console for errors
- Verify JWT_SECRET is set in backend `.env`

## 📄 License

ISC

## 👨‍💻 Author

Built with ❤️ for college resource management
