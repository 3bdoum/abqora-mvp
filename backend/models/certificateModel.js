const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    certificateId: { type: String, required: true, unique: true }, // e.g. ABQ-XXXX-XXXX
    issueDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Certificate', certificateSchema);
