const mongoose = require('mongoose');

const lessonProgressSchema = new mongoose.Schema({
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
    status: {
        type: String,
        enum: ['not_started', 'in_progress', 'awaiting_approval', 'completed'],
        default: 'not_started'
    },
    accessOverride: {
        type: String,
        enum: ['default', 'unlocked', 'locked'],
        default: 'default'
    },
    feedback: { type: String, default: '' },
    submittedAt: Date,
    reviewedAt: Date,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    completedAt: Date,
    updatedAt: { type: Date, default: Date.now },
}, { _id: false });

const progressSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    completedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
    lessonProgress: [lessonProgressSchema],
    quizResults: [
        {
            quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
            score: Number,
            total: Number,
            completedAt: Date,
        }
    ],
    certificateUrl: { type: String },
    enrolledAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Progress', progressSchema);
