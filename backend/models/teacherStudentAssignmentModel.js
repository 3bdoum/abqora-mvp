const mongoose = require('mongoose');

const teacherStudentAssignmentSchema = new mongoose.Schema({
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    active: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
});

teacherStudentAssignmentSchema.index({ teacher: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('TeacherStudentAssignment', teacherStudentAssignmentSchema);
