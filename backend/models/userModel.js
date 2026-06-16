const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'parent', 'admin'], default: 'student' },
    ageGroup: { type: String, enum: ['5-8', '9-12', '13-16', 'none'], default: 'none' },
    children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    registeredAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
