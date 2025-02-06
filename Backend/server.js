const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { startDatabase, isConnected } = require('./db/database');

dotenv.config();
const authRoutes = require('./routes/AuthServer');
const AiRoutes = require('./routes/AiServer');
const app = express();
app.use(express.json());
app.use(cors());
app.use('/auth', authRoutes);
app.use('/ai', AiRoutes);
startDatabase()
.then(()=>{
  app.listen(5000,async()=>{
    console.log('Starting server ...🚀')
    console.log('Server running on port 5000 🏃')
})
})
