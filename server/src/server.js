
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const requestRoutes = require("./routes/requestRoutes");
const ngoRoutes = require("./routes/ngoRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Relief Resolver API is running"
  });
});

// Authentication routes
app.use("/api/auth", authRoutes);

// Request routes
app.use("/api/requests", requestRoutes);

// NGO routes
app.use("/api/ngos", ngoRoutes);

// Complaint routes
app.use("/api/complaints", complaintRoutes);

// Start server after connecting to MongoDB
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
