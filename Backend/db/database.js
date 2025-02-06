const mongoose = require('mongoose');
require('dotenv').config();

const startDatabase = async ()=>{
    try {
        const conn = await mongoose.connect(process.env.MONGO_DB_URI);
        console.log('connected to MongoDB 👨‍💻');
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}

const isConnected = ()=>{
    return mongoose.connection.readyState === 1;
}

module.exports = { startDatabase, isConnected};