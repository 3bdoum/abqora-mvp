const mongoose = require('mongoose');

const aiTutorExchangeSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true, index: true },
    lessonState: { type: String, default: '' },
    model: { type: String, default: '' },
    userMessage: { type: String, required: true },
    assistantMessage: { type: String, default: '' },
    status: {
        type: String,
        enum: ['answered', 'blocked', 'error'],
        default: 'answered',
    },
    safetyFlags: [{
        type: { type: String, default: '' },
        message: { type: String, default: '' },
    }],
    createdAt: { type: Date, default: Date.now, index: true },
});

aiTutorExchangeSchema.index({ student: 1, lesson: 1, createdAt: -1 });

module.exports = mongoose.model('AiTutorExchange', aiTutorExchangeSchema);
