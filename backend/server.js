require("dotenv").config();
const express = require("express");
const cors = require("cors");
const passport = require("passport");

const connectDB = require("./config/db");

// Route imports
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const resourceRoutes = require("./routes/resources");
const bookingRoutes = require("./routes/bookings");
const roleRoutes = require("./routes/roles");

const app = express();

// Connect to MongoDB
connectDB();

// CORS
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map(o => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/infra", require("./routes/infrastructure"));
app.use("/api/it", require("./routes/itService"));

// Health route
app.get("/", (req, res) => {
  res.send("Campus Reserve API is LIVE 🚀");
});

// Run locally only
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running locally on port ${PORT}`);
  });
}

// Export for deployment
module.exports = app;