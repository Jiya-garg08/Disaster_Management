require("dotenv").config();

const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../src/models/user");

async function createControlRoom() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const username = process.env.STAFF_USERNAME;
    const password = process.env.STAFF_PASSWORD;
    const email = process.env.STAFF_EMAIL;

    if (!username || !password || !email) {
      throw new Error(
        "Set STAFF_USERNAME, STAFF_PASSWORD, and STAFF_EMAIL in .env"
      );
    }

    if (password.length < 8) {
      throw new Error("Control Room password must be at least 8 characters.");
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { name: username }]
    });

    if (existingUser) {
      console.log("A matching account already exists. No changes made.");
      return;
    }

    await User.create({
      name: username,
      email: email.toLowerCase(),
      password,
      phone: "0000000000",
      role: "control_room",
      isVerified: true,
      isActive: true
    });

    console.log("Control Room account created successfully.");
  } catch (error) {
    console.error("Setup failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

createControlRoom();
