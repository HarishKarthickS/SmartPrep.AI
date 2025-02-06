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

redisClient.connect().catch(console.error);

// Generate JWT Token for API authentication
function generateJwtToken(user) {
    return jwt.sign({ userId: user.userId, email: user.email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '24h' });
}

// Middleware: Check if Token is Blacklisted
async function checkBlacklistedToken(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const isBlacklisted = await redisClient.get(token);
    if (isBlacklisted) {
        return res.status(403).json({ error: "Token is blacklisted. Please login again." });
    }
    next();
}

// 📨 Email & Password Signup
router.post('/signup-email', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: "Email & Password required" });

        const existingUser = await userModel.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "User already exists" });

        const firebaseUser = await admin.auth().createUser({ email, password, displayName: name });
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
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔑 Email & Password Login
router.post('/login-email', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: "Email & Password required" });

        const user = await userModel.findOne({ email });
        if (!user || !user.password) return res.status(400).json({ error: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Wrong password" });

        const token = generateJwtToken(user);
        res.json({ token, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🌐 Social Login (Google, Facebook, Apple)
router.post('/social-login', async (req, res) => {
    try {
        const { firebaseToken } = req.body;
        if (!firebaseToken) return res.status(401).json({ error: "Token required" });

        const decodedUser = await verifyFirebaseToken(firebaseToken);
        if (!decodedUser) return res.status(403).json({ error: "Invalid token" });

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
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🚪 Logout Route - Add Token to Blacklist
router.post('/logout', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(400).json({ error: "Token required" });

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const expiryTime = decoded.exp - Math.floor(Date.now() / 1000);

        if (expiryTime > 0) {
            await redisClient.set(token, "blacklisted", { EX: expiryTime });
        }

        res.json({ message: "Logged out successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔒 Protected Route Example (Requires Authentication)
router.get('/protected', checkBlacklistedToken, async (req, res) => {
    res.json({ message: "You have access to this protected route." });
});

module.exports = router;
