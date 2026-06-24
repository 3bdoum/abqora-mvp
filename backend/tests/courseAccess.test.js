const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');

process.env.JWT_SECRET = 'test-only-secret';
process.env.NODE_ENV = 'test';

const app = require('../app');
const User = require('../models/userModel');
const Course = require('../models/courseModel');
const Lesson = require('../models/lessonModel');
const Progress = require('../models/progressModel');
const TeacherStudentAssignment = require('../models/teacherStudentAssignmentModel');
const ProgressAuditLog = require('../models/progressAuditLogModel');
const Quiz = require('../models/quizModel');
const Submission = require('../models/submissionModel');
const Certificate = require('../models/certificateModel');
const { backfillLegacyProgress, seedData } = require('../utils/seed');

let mongo;

const tokenFor = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
const auth = (token) => ({ Authorization: `Bearer ${token}` });

const clearDatabase = async () => {
    await Promise.all([
        User.deleteMany({}), Course.deleteMany({}), Lesson.deleteMany({}), Progress.deleteMany({}),
        TeacherStudentAssignment.deleteMany({}), ProgressAuditLog.deleteMany({}), Quiz.deleteMany({}),
        Submission.deleteMany({}), Certificate.deleteMany({}),
    ]);
};

const makeUser = async (email, role) => User.create({
    name: email.split('@')[0],
    email,
    password: await bcrypt.hash('password123', 4),
    role,
    ageGroup: role === 'student' ? '9-12' : 'none',
});

const setupScenario = async () => {
    const [student, teacher, otherTeacher, admin] = await Promise.all([
        makeUser('student@test.local', 'student'),
        makeUser('teacher@test.local', 'teacher'),
        makeUser('other@test.local', 'teacher'),
        makeUser('admin@test.local', 'admin'),
    ]);
    const course = await Course.create({
        slug: 'test-course', title: 'Test Course', description: 'Test course', language: 'العربية', level: 'مبتدئ'
    });
    const lessons = [];
    for (let order = 1; order <= 3; order += 1) {
        lessons.push(await Lesson.create({
            stableId: `test-l${order}`,
            title: `الدرس ${order}`,
            content: 'محتوى تجريبي',
            course: course._id,
            order,
            requiresApproval: true,
            codeOrgLink: `https://studio.code.org/courses/express-2025/units/1/lessons/${order}/levels/1`,
            videoUrls: [],
        }));
    }
    course.lessons = lessons.map((lesson) => lesson._id);
    await course.save();
    await Progress.create({ user: student._id, course: course._id, completedLessons: [], lessonProgress: [] });
    await TeacherStudentAssignment.create({ teacher: teacher._id, student: student._id, assignedBy: admin._id });

    return {
        student, teacher, otherTeacher, admin, course, lessons,
        tokens: {
            student: tokenFor(student), teacher: tokenFor(teacher),
            otherTeacher: tokenFor(otherTeacher), admin: tokenFor(admin),
        },
    };
};

test.before(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
    await Promise.all([User.init(), Course.init(), Lesson.init(), Progress.init(), TeacherStudentAssignment.init()]);
});

test.beforeEach(clearDatabase);

test.after(async () => {
    await mongoose.disconnect();
    await mongo.stop();
});

test('student cannot access a locked lesson', async () => {
    const data = await setupScenario();
    const response = await request(app)
        .get(`/api/lessons/${data.lessons[1]._id}`)
        .set(auth(data.tokens.student));
    assert.equal(response.status, 403);

    const course = await request(app)
        .get(`/api/courses/${data.course._id}`)
        .set(auth(data.tokens.student));
    assert.equal(course.body.lessons[1].studentState, 'locked');
    assert.equal(course.body.lessons[1].codeOrgLink, '');
    assert.deepEqual(course.body.lessons[1].videoUrls, []);
});

test('approval completes one lesson and unlocks only the correct next lesson', async () => {
    const data = await setupScenario();
    const submitted = await request(app)
        .post('/api/progress/lesson')
        .set(auth(data.tokens.student))
        .send({ courseId: data.course._id, lessonId: data.lessons[0]._id });
    assert.equal(submitted.status, 200);
    assert.equal(submitted.body.studentState, 'awaiting_approval');

    const approved = await request(app)
        .patch(`/api/teacher/students/${data.student._id}/lessons/${data.lessons[0]._id}`)
        .set(auth(data.tokens.teacher))
        .send({ action: 'approve', feedback: 'أحسنت' });
    assert.equal(approved.status, 200);

    const course = await request(app)
        .get(`/api/courses/${data.course._id}`)
        .set(auth(data.tokens.student));
    assert.deepEqual(course.body.lessons.map((lesson) => lesson.studentState), [
        'completed', 'available', 'locked'
    ]);
});

test('second Code.org practice lesson unlocks only after the first approved lesson', async () => {
    const data = await setupScenario();

    const lockedAttempt = await request(app)
        .post('/api/progress/lesson')
        .set(auth(data.tokens.student))
        .send({ courseId: data.course._id, lessonId: data.lessons[1]._id });
    assert.equal(lockedAttempt.status, 403);

    await request(app)
        .post('/api/progress/lesson')
        .set(auth(data.tokens.student))
        .send({ courseId: data.course._id, lessonId: data.lessons[0]._id });

    await request(app)
        .patch(`/api/teacher/students/${data.student._id}/lessons/${data.lessons[0]._id}`)
        .set(auth(data.tokens.teacher))
        .send({ action: 'approve', feedback: 'أحسنت' });

    const submitted = await request(app)
        .post('/api/progress/lesson')
        .set(auth(data.tokens.student))
        .send({ courseId: data.course._id, lessonId: data.lessons[1]._id });
    assert.equal(submitted.status, 200);
    assert.equal(submitted.body.studentState, 'awaiting_approval');

    const course = await request(app)
        .get(`/api/courses/${data.course._id}`)
        .set(auth(data.tokens.student));
    assert.deepEqual(course.body.lessons.map((lesson) => lesson.studentState), [
        'completed', 'awaiting_approval', 'locked'
    ]);
});

test('student cannot approve their own submission', async () => {
    const data = await setupScenario();
    const response = await request(app)
        .patch(`/api/teacher/students/${data.student._id}/lessons/${data.lessons[0]._id}`)
        .set(auth(data.tokens.student))
        .send({ action: 'approve' });
    assert.equal(response.status, 403);
});

test('teacher can manage an assigned student', async () => {
    const data = await setupScenario();
    const response = await request(app)
        .patch(`/api/teacher/students/${data.student._id}/lessons/${data.lessons[1]._id}`)
        .set(auth(data.tokens.teacher))
        .send({ action: 'unlock', feedback: 'فتح استثنائي' });
    assert.equal(response.status, 200);
    assert.equal(response.body.studentState, 'available');
});

test('teacher cannot manage an unassigned student', async () => {
    const data = await setupScenario();
    const response = await request(app)
        .patch(`/api/teacher/students/${data.student._id}/lessons/${data.lessons[1]._id}`)
        .set(auth(data.tokens.otherTeacher))
        .send({ action: 'unlock' });
    assert.equal(response.status, 403);
});

test('admin can manage all students', async () => {
    const data = await setupScenario();
    const response = await request(app)
        .patch(`/api/teacher/students/${data.student._id}/lessons/${data.lessons[1]._id}`)
        .set(auth(data.tokens.admin))
        .send({ action: 'unlock' });
    assert.equal(response.status, 200);
});

test('admin can update lesson explanation videos', async () => {
    const data = await setupScenario();

    const teacherAttempt = await request(app)
        .put(`/api/lessons/${data.lessons[0]._id}`)
        .set(auth(data.tokens.teacher))
        .send({
            videoUrls: [{ title: 'شرح', url: 'https://www.youtube.com/watch?v=abc123' }],
        });
    assert.equal(teacherAttempt.status, 403);

    const invalidVideo = await request(app)
        .put(`/api/lessons/${data.lessons[0]._id}`)
        .set(auth(data.tokens.admin))
        .send({
            videoUrls: [{ title: 'رابط غير آمن', url: 'http://example.com/video' }],
        });
    assert.equal(invalidVideo.status, 400);

    const response = await request(app)
        .put(`/api/lessons/${data.lessons[0]._id}`)
        .set(auth(data.tokens.admin))
        .send({
            title: 'درس محدث',
            content: 'محتوى محدث للشرح قبل التطبيق',
            videoUrls: [
                {
                    title: 'شرح الهدف',
                    url: 'https://www.youtube.com/watch?v=abc123',
                    description: 'فيديو قصير يشرح المطلوب من التمرين',
                    duration: '03:20',
                },
                {
                    title: 'أخطاء شائعة',
                    url: 'https://youtu.be/def456',
                },
            ],
        });
    assert.equal(response.status, 200);
    assert.equal(response.body.title, 'درس محدث');
    assert.equal(response.body.videoUrl, 'https://www.youtube.com/watch?v=abc123');
    assert.equal(response.body.videoUrls.length, 2);
    assert.equal(response.body.videoUrls[0].description, 'فيديو قصير يشرح المطلوب من التمرين');

    const lesson = await Lesson.findById(data.lessons[0]._id);
    assert.equal(lesson.videoUrls.length, 2);
    assert.equal(lesson.videoUrls[1].url, 'https://youtu.be/def456');
});

test('direct API requests cannot bypass lesson prerequisites', async () => {
    const data = await setupScenario();
    const response = await request(app)
        .post('/api/progress/lesson')
        .set(auth(data.tokens.student))
        .send({ courseId: data.course._id, lessonId: data.lessons[2]._id });
    assert.equal(response.status, 403);

    const progress = await Progress.findOne({ user: data.student._id, course: data.course._id });
    assert.equal(progress.completedLessons.length, 0);
    assert.equal(progress.lessonProgress.length, 0);
});

test('legacy completed lesson progress is preserved and backfilled', async () => {
    const data = await setupScenario();
    const progress = await Progress.findOne({ user: data.student._id, course: data.course._id });
    progress.completedLessons = [data.lessons[0]._id];
    progress.lessonProgress = [];
    await progress.save();

    await backfillLegacyProgress();
    const migrated = await Progress.findById(progress._id);
    assert.equal(migrated.completedLessons.length, 1);
    assert.equal(String(migrated.completedLessons[0]), String(data.lessons[0]._id));
    assert.equal(migrated.lessonProgress[0].status, 'completed');
});

test('seed scripts are idempotent', async () => {
    await seedData();
    const first = {
        users: await User.countDocuments(),
        courses: await Course.countDocuments(),
        lessons: await Lesson.countDocuments(),
        assignments: await TeacherStudentAssignment.countDocuments(),
        progress: await Progress.countDocuments(),
    };
    await seedData();
    const second = {
        users: await User.countDocuments(),
        courses: await Course.countDocuments(),
        lessons: await Lesson.countDocuments(),
        assignments: await TeacherStudentAssignment.countDocuments(),
        progress: await Progress.countDocuments(),
    };
    assert.deepEqual(second, first);
    assert.deepEqual(second, { users: 4, courses: 2, lessons: 42, assignments: 1, progress: 1 });

    const expressCourse = await Course.findOne({ slug: 'cs-fundamentals-express-course' }).populate('lessons');
    assert.equal(expressCourse.lessons.length, 31);
    expressCourse.lessons.forEach((lesson, index) => {
        assert.equal(lesson.isPlaceholder, false);
        assert.equal(lesson.nativeActivity, undefined);
        assert.equal(Array.isArray(lesson.videoUrls), true);
        assert.equal(
            lesson.codeOrgLink,
            `https://studio.code.org/courses/express-2025/units/1/lessons/${index + 1}/levels/1`
        );
    });
});
