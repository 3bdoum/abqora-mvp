const mongoose = require('mongoose');

const advertisementSchema = new mongoose.Schema({
    placement: {
        type: String,
        enum: ['home'],
        default: 'home',
        index: true,
    },
    badge: { type: String, default: '' },
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, default: '📣' },
    ctaLabel: { type: String, default: '' },
    ctaHref: { type: String, default: '' },
    audience: {
        type: String,
        enum: ['all', 'students', 'parents', 'teachers'],
        default: 'all',
        index: true,
    },
    active: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 1, index: true },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

advertisementSchema.index({ placement: 1, active: 1, order: 1 });

module.exports = mongoose.model('Advertisement', advertisementSchema);
