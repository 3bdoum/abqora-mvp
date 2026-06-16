const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
    projectUrl: { type: String, required: true }, // URL of the project (e.g. Scratch/Code.org link)
    description: { type: String, required: true }, // Student description
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    feedback: { type: String, default: '' }, // Admin/Teacher feedback
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Submission', submissionSchema);
