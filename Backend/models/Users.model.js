const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    userId: { type: String, unique: true, required: true }, // Firebase UID
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String }, // Only for email/password signups
    provider: { type: String, required: true }, // google, facebook, apple, email
}, { timestamps: true });

module.exports = mongoose.model('Users', UserSchema);
