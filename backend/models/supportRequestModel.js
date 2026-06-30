const mongoose = require('mongoose');

const supportRequestSchema = new mongoose.Schema({
    sourcePage: { type: String, default: 'public', index: true },
    sessionId: { type: String, default: '', index: true },
    ipHash: { type: String, default: '', index: true },
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    message: { type: String, required: true },
    pageContext: { type: String, default: '' },
    lastQuestion: { type: String, default: '' },
    aiStatus: { type: String, default: '' },
    status: {
        type: String,
        enum: ['new', 'in_progress', 'resolved', 'closed'],
        default: 'new',
        index: true,
    },
    adminNote: { type: String, default: '' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: { type: Date, default: null },
}, { timestamps: true });

supportRequestSchema.index({ sourcePage: 1, createdAt: -1 });
supportRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('SupportRequest', supportRequestSchema);
