import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./Models/User.js";
import Member from "./Models/Member.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config(); // load variables from .env

const app = express();
const port = process.env.PORT || 5000;

const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Middleware
app.use(cors());
app.use(express.json());
const SECRET_KEY = process.env.SECRET_KEY;

app.post("/register", async (req, res) => {
  const { name, phone, password } = req.body;

  if (!name || !phone || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create new user
    const newUser = new User({
      name,
      phone,
      password: hashedPassword,
    });

    await newUser.save();

    console.log("New user registered:", newUser);

    return res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

app.post("/login", async (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ message: "Phone and password required" });
  }

  try {
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY, {
      expiresIn: "150d",
    });

    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/users", async (req, res) => {
  const { user, name, phone, imageUrl } = req.body;

  if (!user || !name || !phone || !imageUrl) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const member = new Member({ user, name, phone, imageUrl });
    await member.save();

    console.log("Member added:", member); // logs the saved record
    res.status(201).json(member);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const userId = req.query.user;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const members = await Member.find({ user: userId }).sort({ createdAt: -1 });
    res.json(members);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get member by phone
app.get("/api/members/:phone", async (req, res) => {
  try {
    const member = await Member.findOne({ phone: req.params.phone });
    if (!member) return res.status(404).json({ message: "Member not found" });
    res.json(member);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update member by ID
app.put("/api/members/:id", async (req, res) => {
  try {
    const updated = await Member.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
});

app.listen(5000, "0.0.0.0", () => {
  console.log("Server running on http://0.0.0.0:5000");
});
