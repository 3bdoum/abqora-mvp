const mongoose = require('mongoose');

const aiPublicConversationSchema = new mongoose.Schema({
    sourcePage: { type: String, default: 'public', index: true },
    sessionId: { type: String, default: '', index: true },
    ipHash: { type: String, default: '', index: true },
    userAgent: { type: String, default: '' },
    pageContext: { type: String, default: '' },
    userMessage: { type: String, required: true },
    assistantMessage: { type: String, default: '' },
    provider: { type: String, default: '' },
    model: { type: String, default: '' },
    status: {
        type: String,
        enum: ['answered', 'blocked', 'error', 'setup_needed'],
        default: 'answered',
        index: true,
    },
    errorCode: { type: String, default: '' },
    reviewStatus: {
        type: String,
        enum: ['unreviewed', 'useful', 'needs_improvement'],
        default: 'unreviewed',
        index: true,
    },
    adminNote: { type: String, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
}, { timestamps: true });

aiPublicConversationSchema.index({ sourcePage: 1, createdAt: -1 });
aiPublicConversationSchema.index({ reviewStatus: 1, createdAt: -1 });

module.exports = mongoose.model('AiPublicConversation', aiPublicConversationSchema);
