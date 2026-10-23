
const dns = require("dns");

// Use public DNS servers for MongoDB Atlas SRV lookups.
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const mongoose = require("mongoose");

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

module.exports = connectDB;
