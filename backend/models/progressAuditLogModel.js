const mongoose = require('mongoose');

const progressAuditLogSchema = new mongoose.Schema({
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
    action: {
        type: String,
        enum: ['submitted', 'approved', 'rejected', 'unlocked', 'relocked'],
        required: true
    },
    fromStatus: { type: String, default: '' },
    toStatus: { type: String, default: '' },
    note: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
});

progressAuditLogSchema.index({ student: 1, course: 1, createdAt: -1 });

module.exports = mongoose.model('ProgressAuditLog', progressAuditLogSchema);
