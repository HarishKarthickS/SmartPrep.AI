const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { startDatabase, isConnected } = require('./db/database');

dotenv.config();
const authRoutes = require('./routes/AuthServer');
const AiRoutes = require('./routes/AiServer');
const QuizRoutes = require('./routes/QuizServer');
const app = express();
app.use(
  cors({
    origin: "http://localhost:5173", // 🔹 Allow only your frontend domain
    credentials: true, // 🔹 Allow cookies, sessions, and authentication headers
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
  })
);
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/api/chat/', AiRoutes);
app.use('/quiz', QuizRoutes);
console.log(process.env.OPENROUTER_API_KEY)
startDatabase()
.then(()=>{
  app.listen(5000,async()=>{
    console.log('Starting server ...🚀')
    console.log('Server running on port 5000 🏃')
    console.log(process.env.OPENROUTER_API_KEY)
})
})
