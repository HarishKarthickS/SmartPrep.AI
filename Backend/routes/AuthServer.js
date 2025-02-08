const express = require('express');
const { verifyFirebaseToken, admin } = require('../config/firebase');
const userModel = require('../models/Users.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const redis = require('redis');
const dotenv = require('dotenv');

dotenv.config();
const router = express.Router();
const redisClient = redis.createClient(); // Initialize Redis

redisClient.connect().catch((err) => {
  console.error("Error connecting to Redis:", err);
});

// Helper: Wrap async functions to catch errors and forward them to next()
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Generate JWT Token for API authentication
function generateJwtToken(user) {
  return jwt.sign(
    { userId: user.userId, email: user.email },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '24h' }
  );
}

// Middleware: Check if Token is Blacklisted
const checkBlacklistedToken = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    console.error("Authorization token missing");
    return res.status(401).json({ error: "Unauthorized" });
  }

  const isBlacklisted = await redisClient.get(token);
  if (isBlacklisted) {
    console.warn("Blacklisted token used:", token);
    return res.status(403).json({ error: "Token is blacklisted. Please login again." });
  }
  next();
});

// 📨 Email & Password Signup
router.post('/signup-email', asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password) {
    console.error("Signup error: Email & Password required");
    return res.status(400).json({ error: "Email & Password required" });
  }

  const existingUser = await userModel.findOne({ email });
  if (existingUser) {
    console.error("Signup error: User already exists with email", email);
    return res.status(400).json({ error: "User already exists" });
  }

  let firebaseUser;
  try {
    firebaseUser = await admin.auth().createUser({ email, password, displayName: name });
  } catch (err) {
    console.error("Firebase user creation error:", err);
    throw new Error("Error creating user in Firebase: " + err.message);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await userModel.create({
    userId: firebaseUser.uid,
    name,
    email,
    password: hashedPassword,
    provider: "email"
  });

  const token = generateJwtToken(newUser);
  res.json({ token, user: newUser });
}));

// 🔑 Email & Password Login
router.post('/login-email', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    console.error("Login error: Email & Password required");
    return res.status(400).json({ error: "Email & Password required" });
  }

  const user = await userModel.findOne({ email });
  if (!user || !user.password) {
    console.error("Login error: User not found for email", email);
    return res.status(400).json({ error: "User not found" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    console.error("Login error: Wrong password for email", email);
    return res.status(400).json({ error: "Wrong password" });
  }

  const token = generateJwtToken(user);
  res.json({ token, user });
}));

// 🌐 Social Login (Google, Facebook, Apple)
router.post('/social-login', asyncHandler(async (req, res) => {
  const { firebaseToken } = req.body;
  if (!firebaseToken) {
    console.error("Social login error: Firebase token required");
    return res.status(401).json({ error: "Token required" });
  }

  const decodedUser = await verifyFirebaseToken(firebaseToken);
  if (!decodedUser) {
    console.error("Social login error: Invalid Firebase token");
    return res.status(403).json({ error: "Invalid token" });
  }

  let user = await userModel.findOne({ userId: decodedUser.uid });
  if (!user) {
    user = await userModel.create({
      userId: decodedUser.uid,
      name: decodedUser.name || "Anonymous",
      email: decodedUser.email,
      provider: decodedUser.firebase.sign_in_provider,
    });
  }

  const token = generateJwtToken(user);
  res.json({ token, user });
}));

// 🚪 Logout Route - Add Token to Blacklist
router.post('/logout', asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    console.error("Logout error: Token missing");
    return res.status(400).json({ error: "Token required" });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (err) {
    console.error("Logout error: Invalid token", err);
    return res.status(400).json({ error: "Invalid token" });
  }

  const expiryTime = decoded.exp - Math.floor(Date.now() / 1000);
  if (expiryTime > 0) {
    await redisClient.set(token, "blacklisted", { EX: expiryTime });
    console.log("Token blacklisted for logout:", token);
  }

  res.json({ message: "Logged out successfully" });
}));

// 🔒 Protected Route Example (Requires Authentication)
router.get('/protected', checkBlacklistedToken, asyncHandler(async (req, res) => {
  res.json({ message: "You have access to this protected route." });
}));

// Global Error Handling Middleware
router.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: err.message || "An unexpected error occurred",
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
});

module.exports = router;
