const mongoose = require('mongoose');

const nativeActivitySchema = new mongoose.Schema({
    enabled: { type: Boolean, default: false },
    kind: { type: String, enum: ['sequence_maze'] },
    version: { type: Number, default: 1 },
    config: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { _id: false });

const lessonSchema = new mongoose.Schema({
    stableId: { type: String, unique: true, sparse: true, trim: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    videoUrl: { type: String },
    codeOrgLink: { type: String },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    order: { type: Number, default: 0 },
    type: {
        type: String,
        enum: ['activity', 'video', 'project', 'quiz', 'mixed'],
        default: 'activity'
    },
    requiresApproval: { type: Boolean, default: true },
    isPlaceholder: { type: Boolean, default: false },
    nativeActivity: { type: nativeActivitySchema, default: undefined },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Lesson', lessonSchema);
