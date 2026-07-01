const mongoose = require('mongoose');

const publicAnalyticsEventSchema = new mongoose.Schema({
    sourcePage: { type: String, default: 'public', index: true },
    eventName: {
        type: String,
        enum: [
            'page_view',
            'service_click',
            'official_link_click',
            'calculator_used',
            'analysis_track_selected',
            'ai_open',
            'support_cta_click',
            'support_request_sent',
        ],
        required: true,
        index: true,
    },
    target: { type: String, default: '', index: true },
    sessionId: { type: String, default: '', index: true },
    ipHash: { type: String, default: '', index: true },
    userAgent: { type: String, default: '' },
    metadata: {
        percentageBand: { type: String, default: '' },
        track: { type: String, default: '' },
        degreeSystem: { type: String, default: '' },
    },
    createdAt: { type: Date, default: Date.now, index: true },
});

publicAnalyticsEventSchema.index({ sourcePage: 1, eventName: 1, createdAt: -1 });
publicAnalyticsEventSchema.index({ sourcePage: 1, target: 1, createdAt: -1 });

module.exports = mongoose.model('PublicAnalyticsEvent', publicAnalyticsEventSchema);
