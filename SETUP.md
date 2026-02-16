# Setup Instructions for Campus Reserve

Follow these steps to get the application running:

## Step 1: MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create a free account or sign in
3. Create a new cluster (free tier M0 is sufficient)
4. Click "Database Access" → "Add New Database User"
   - Create a username and password (save these!)
5. Click "Network Access" → "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
6. Click "Connect" on your cluster
7. Choose "Connect your application"
8. Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)

## Step 2: Backend Setup

1. Open terminal and navigate to backend:
```bash
cd "d:\New folder\Campus Reserve\backend"
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file in the backend directory with:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/campus-reserve?retryWrites=true&w=majority
JWT_SECRET=your_generated_secret_here
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
```

**Replace:**
- `YOUR_USERNAME` with your MongoDB username
- `YOUR_PASSWORD` with your MongoDB password
- `YOUR_CLUSTER` with your cluster name
- `your_generated_secret_here` with a random string (run the command below)

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

4. Seed the database:
```bash
npm run seed
```

You should see:
```
✅ Database seeded successfully!

Test Users:
Admin: admin@college.edu / password123
Faculty: sarah@college.edu / password123
Student: alex@student.edu / password123
Department: cs@college.edu / password123
Club: techclub@college.edu / password123
```

5. Start the backend server:
```bash
npm run dev
```

You should see:
```
Server running in development mode on port 5000
MongoDB Connected: cluster0-xxxxx.mongodb.net
```

## Step 3: Frontend Setup

1. Open a NEW terminal and navigate to frontend:
```bash
cd "d:\New folder\Campus Reserve\frontend"
```

2. The `.env` file is already created with the correct settings

3. Start the frontend server:
```bash
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

## Step 4: Test the Application

1. Open your browser to `http://localhost:5173`

2. You'll see the login page

3. Click one of the quick login buttons (Admin, Faculty, Student, Department) or manually enter:
   - Email: `admin@college.edu`
   - Password: `password123`

4. You should be redirected to the dashboard!

## Troubleshooting

### "MongoServerError: bad auth"
- Double-check your MongoDB username and password in `.env`
- Make sure you're using the database user password, not your Atlas account password

### "Network Error" or "Cannot connect to backend"
- Make sure the backend server is running on port 5000
- Check that `VITE_API_URL` in frontend `.env` is `http://localhost:5000/api`

### "User not found" when logging in
- Run `npm run seed` in the backend directory to create demo users

### Backend won't start
- Make sure MongoDB Atlas IP whitelist includes your IP or "Allow from Anywhere"
- Check that all environment variables are set in backend `.env`

## Success Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Backend `.env` file configured with MongoDB URI
- [ ] Backend dependencies installed (`npm install`)
- [ ] Database seeded successfully (`npm run seed`)
- [ ] Backend server running on port 5000
- [ ] Frontend dependencies installed (axios already added)
- [ ] Frontend server running on port 5173
- [ ] Can login with demo accounts
- [ ] Dashboard loads successfully

## Next Steps

Once everything is running:

1. **Test as Admin**: Create resources, view all bookings
2. **Test as Faculty**: Create a booking, view your bookings
3. **Test as Department**: Approve/reject pending bookings
4. **Test as Student**: Request a booking, check status
5. **Test as Club**: Book resources for events

Enjoy using Campus Reserve! 🎓
