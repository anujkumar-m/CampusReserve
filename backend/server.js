// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const passport = require('passport');
// const connectDB = require('./config/db');

// // Route imports
// const authRoutes = require('./routes/auth');
// const userRoutes = require('./routes/users');
// const resourceRoutes = require('./routes/resources');
// const bookingRoutes = require('./routes/bookings');
// const roleRoutes = require('./routes/roles');

// // Connect to database
// connectDB();

// const app = express();

// // Middleware
// app.use(cors({
//     origin: [
//         process.env.FRONTEND_URL || 'http://localhost:5173',
//         'http://localhost:8080'
//     ],
//     credentials: true,
// }));
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(passport.initialize());

// // Debug middleware - log all requests
// app.use((req, res, next) => {
//     console.log(`📥 ${req.method} ${req.path}`);
//     if (req.body && Object.keys(req.body).length > 0) {
//         console.log('   Body:', JSON.stringify(req.body, null, 2));
//     }
//     next();
// });

// // Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/resources', resourceRoutes);
// app.use('/api/bookings', bookingRoutes);
// app.use('/api/roles', roleRoutes);

// // Health check route
// app.get('/api/health', (req, res) => {
//     res.status(200).json({
//         success: true,
//         message: 'Server is running',
//     });
// });

// // Error handling middleware
// app.use((err, req, res, next) => {
//     console.error(err.stack);
//     res.status(err.status || 500).json({
//         success: false,
//         message: err.message || 'Server Error',
//     });
// });

// // 404 handler
// app.use((req, res) => {
//     res.status(404).json({
//         success: false,
//         message: 'Route not found',
//     });
// });

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//     console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
// });

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const passport = require("passport");

// ✅ Import DB connection function
const connectDB = require("./config/db");

// Route imports
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const resourceRoutes = require("./routes/resources");
const bookingRoutes = require("./routes/bookings");
const roleRoutes = require("./routes/roles");

const app = express();


// ✅ Connect to MongoDB
connectDB();


// ✅ CORS
// app.use(
//   cors({
//     origin: [
//       process.env.FRONTEND_URL || "http://localhost:5173",
//       "http://localhost:8080",
//     ],
//     credentials: true,
//   })
// );
app.use(cors({ origin: "*" }));


// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());


// ✅ Debug logger
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  next();
});


// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/infra", require("./routes/infrastructure"));
app.use("/api/it", require("./routes/itService"));


// ✅ Health route
app.get("/", (req, res) => {
  res.send("Campus Reserve API is LIVE 🚀");
});


// ✅ Run locally only
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running locally on port ${PORT}`);
  });
}


// ✅ Export for deployment
module.exports = app;