const mongoose = require('mongoose');

const explanationVideoSchema = new mongoose.Schema({
    title: { type: String, trim: true },
    url: { type: String, trim: true, required: true },
    description: { type: String, trim: true },
    duration: { type: String, trim: true },
}, { _id: false });

const lessonSchema = new mongoose.Schema({
    stableId: { type: String, unique: true, sparse: true, trim: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    videoUrl: { type: String },
    videoUrls: { type: [explanationVideoSchema], default: [] },
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
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Lesson', lessonSchema);
