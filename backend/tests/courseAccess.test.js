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
const AiTutorExchange = require('../models/aiTutorExchangeModel');
const { backfillLegacyProgress, seedData } = require('../utils/seed');

let mongo;

const tokenFor = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
const auth = (token) => ({ Authorization: `Bearer ${token}` });

const clearDatabase = async () => {
    await Promise.all([
        User.deleteMany({}), Course.deleteMany({}), Lesson.deleteMany({}), Progress.deleteMany({}),
        TeacherStudentAssignment.deleteMany({}), ProgressAuditLog.deleteMany({}), Quiz.deleteMany({}),
        Submission.deleteMany({}), Certificate.deleteMany({}), AiTutorExchange.deleteMany({}),
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

test('teacher course detail includes lesson content readiness', async () => {
    const data = await setupScenario();
    await Lesson.updateOne(
        { _id: data.lessons[0]._id },
        { $set: { videoUrls: [{ title: 'شرح', url: 'https://www.youtube.com/watch?v=abc123' }] } }
    );
    await Quiz.create({
        lesson: data.lessons[0]._id,
        title: 'اختبار جاهزية',
        questions: [{
            questionText: 'ما الهدف؟',
            options: ['التعلم', 'التخمين'],
            correctIndex: 0,
        }],
    });

    const response = await request(app)
        .get(`/api/teacher/students/${data.student._id}/courses/${data.course._id}`)
        .set(auth(data.tokens.teacher));

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.course.lessons[0].contentReady, {
        hasVideos: true,
        hasCodeOrgLink: true,
        hasQuiz: true,
    });
    assert.deepEqual(response.body.course.lessons[1].contentReady, {
        hasVideos: false,
        hasCodeOrgLink: true,
        hasQuiz: false,
    });
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

test('admin lesson catalog includes quiz readiness', async () => {
    const data = await setupScenario();
    await Quiz.create({
        lesson: data.lessons[0]._id,
        title: 'اختبار جاهزية',
        questions: [{
            questionText: 'ما الهدف؟',
            options: ['التعلم', 'التخمين'],
            correctIndex: 0,
        }],
    });

    const response = await request(app)
        .get(`/api/lessons/course/${data.course._id}`)
        .set(auth(data.tokens.admin));

    assert.equal(response.status, 200);
    assert.equal(response.body[0].hasQuiz, true);
    assert.equal(response.body[1].hasQuiz, false);
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

test('student cannot use AI tutor for a locked lesson', async () => {
    const data = await setupScenario();
    const response = await request(app)
        .post('/api/ai/tutor')
        .set(auth(data.tokens.student))
        .send({ lessonId: data.lessons[1]._id, message: 'ساعدني في هذا الدرس' });

    assert.equal(response.status, 403);
});

test('AI tutor reports configuration issue when OpenAI key is missing', async () => {
    const data = await setupScenario();
    const previousApiKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    try {
        const response = await request(app)
            .post('/api/ai/tutor')
            .set(auth(data.tokens.student))
            .send({ lessonId: data.lessons[0]._id, message: 'اشرح لي المطلوب ببساطة' });

        assert.equal(response.status, 503);
        assert.equal(response.body.code, 'AI_NOT_CONFIGURED');
    } finally {
        if (previousApiKey) process.env.OPENAI_API_KEY = previousApiKey;
    }
});

test('AI tutor answers available lessons and stores the exchange', async () => {
    const data = await setupScenario();
    const previousApiKey = process.env.OPENAI_API_KEY;
    const previousFetch = global.fetch;
    process.env.OPENAI_API_KEY = 'test-openai-key';
    global.fetch = async (url, options) => {
        assert.equal(url, 'https://api.openai.com/v1/responses');
        const body = JSON.parse(options.body);
        assert.equal(body.model, 'gpt-4.1-mini');
        assert.match(body.input[0].content, /مساعد عبقورا الذكي/);
        assert.match(body.input[1].content, /اشرح لي المطلوب/);
        return {
            ok: true,
            json: async () => ({ output_text: 'ابدأ بمشاهدة الفيديو، ثم جرّب خطوة صغيرة واسأل نفسك: ماذا يجب أن يحدث أولاً؟' }),
        };
    };

    try {
        const response = await request(app)
            .post('/api/ai/tutor')
            .set(auth(data.tokens.student))
            .send({ lessonId: data.lessons[0]._id, message: 'اشرح لي المطلوب' });

        assert.equal(response.status, 200);
        assert.equal(response.body.status, 'answered');
        assert.match(response.body.message, /ابدأ بمشاهدة الفيديو/);

        const exchanges = await AiTutorExchange.find({ student: data.student._id, lesson: data.lessons[0]._id });
        assert.equal(exchanges.length, 1);
        assert.equal(exchanges[0].status, 'answered');
    } finally {
        if (previousApiKey) {
            process.env.OPENAI_API_KEY = previousApiKey;
        } else {
            delete process.env.OPENAI_API_KEY;
        }
        global.fetch = previousFetch;
    }
});

test('teacher AI tutor review is limited to assigned students', async () => {
    const data = await setupScenario();
    await AiTutorExchange.create({
        student: data.student._id,
        course: data.course._id,
        lesson: data.lessons[0]._id,
        lessonState: 'available',
        userMessage: 'ما المطلوب في الدرس؟',
        assistantMessage: 'شاهد الفيديو ثم جرّب خطوة واحدة.',
        status: 'answered',
    });

    const assignedView = await request(app)
        .get('/api/teacher/ai-tutor')
        .set(auth(data.tokens.teacher));
    assert.equal(assignedView.status, 200);
    assert.equal(assignedView.body.summary.total, 1);
    assert.equal(assignedView.body.exchanges[0].student.email, data.student.email);

    const otherTeacherView = await request(app)
        .get('/api/teacher/ai-tutor')
        .set(auth(data.tokens.otherTeacher));
    assert.equal(otherTeacherView.status, 200);
    assert.equal(otherTeacherView.body.summary.total, 0);

    const directUnassignedAttempt = await request(app)
        .get(`/api/teacher/ai-tutor?studentId=${data.student._id}`)
        .set(auth(data.tokens.otherTeacher));
    assert.equal(directUnassignedAttempt.status, 403);
});

test('admin AI tutor review can inspect all students', async () => {
    const data = await setupScenario();
    const secondStudent = await makeUser('second-student@test.local', 'student');
    await AiTutorExchange.create([
        {
            student: data.student._id,
            course: data.course._id,
            lesson: data.lessons[0]._id,
            lessonState: 'available',
            userMessage: 'أريد تلميحًا',
            assistantMessage: 'ابدأ بالسؤال: ما الخطوة الأولى؟',
            status: 'answered',
        },
        {
            student: secondStudent._id,
            course: data.course._id,
            lesson: data.lessons[0]._id,
            lessonState: 'available',
            userMessage: 'اكتب الحل كامل',
            assistantMessage: 'أعطي تلميحات فقط، لا الحل الكامل.',
            status: 'blocked',
        },
    ]);

    const response = await request(app)
        .get('/api/teacher/ai-tutor')
        .set(auth(data.tokens.admin));

    assert.equal(response.status, 200);
    assert.equal(response.body.summary.total, 2);
    assert.equal(response.body.summary.blocked, 1);
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
