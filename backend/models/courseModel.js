const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    slug: { type: String, unique: true, sparse: true, trim: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    language: { type: String, default: 'Arabic' },
    level: { type: String, default: 'Beginner' },
    ageRange: { type: String, default: '' },
    artwork: { type: String, default: '/images/avatar.png' },
    referenceUrl: { type: String, default: '' },
    published: { type: Boolean, default: true },
    lessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Course', courseSchema);
