const TeacherStudentAssignment = require('../models/teacherStudentAssignmentModel');

const canManageStudent = async (actor, studentId) => {
    if (actor.role === 'admin') return true;
    if (actor.role !== 'teacher') return false;
    return Boolean(await TeacherStudentAssignment.exists({
        teacher: actor._id,
        student: studentId,
        active: true,
    }));
};

module.exports = { canManageStudent };
