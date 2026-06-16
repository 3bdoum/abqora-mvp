const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    completedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
    quizResults: [
        {
            quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
            score: Number,
            total: Number,
            completedAt: Date,
        }
    ],
    certificateUrl: { type: String },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Progress', progressSchema);
