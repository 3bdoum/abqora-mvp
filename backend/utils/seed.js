const bcrypt = require('bcryptjs');
require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/userModel');
const Course = require('../models/courseModel');
const Lesson = require('../models/lessonModel');
const Quiz = require('../models/quizModel');
const Progress = require('../models/progressModel');
const Certificate = require('../models/certificateModel');
const Submission = require('../models/submissionModel');
const { preExpressCourse, preExpressLessons } = require('../data/preExpressCourse');

const run = async () => {
    try {
        if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PRODUCTION_SEED !== 'true') {
            console.error('Refusing to seed in production without ALLOW_PRODUCTION_SEED=true.');
            process.exit(1);
        }

        await connectDB();

        await User.deleteMany({});
        await Course.deleteMany({});
        await Lesson.deleteMany({});
        await Quiz.deleteMany({});
        await Progress.deleteMany({});
        await Certificate.deleteMany({});
        await Submission.deleteMany({});

        console.log('Cleared all collections.');

        const hashedAdmin = await bcrypt.hash('admin123', 10);
        const admin = await User.create({
            name: 'معلم عبقورة',
            email: 'admin@abqora.com',
            password: hashedAdmin,
            role: 'admin',
            ageGroup: 'none'
        });
        console.log('Created admin account:', admin.email);

        const hashedStudent = await bcrypt.hash('student123', 10);
        const student = await User.create({
            name: 'عمر أحمد',
            email: 'student@abqora.com',
            password: hashedStudent,
            role: 'student',
            ageGroup: '9-12'
        });
        console.log('Created student account:', student.email);

        const hashedParent = await bcrypt.hash('parent123', 10);
        const parent = await User.create({
            name: 'أحمد علي',
            email: 'parent@abqora.com',
            password: hashedParent,
            role: 'parent',
            ageGroup: 'none',
            children: [student._id]
        });
        console.log('Created parent account:', parent.email);

        student.parent = parent._id;
        await student.save();

        const course = await Course.create(preExpressCourse);
        console.log('Created course:', course.title);

        const lessonIds = [];

        for (const data of preExpressLessons) {
            const lesson = await Lesson.create({
                title: data.title,
                content: data.content,
                videoUrl: data.videoUrl,
                codeOrgLink: data.codeOrgLink,
                course: course._id,
                order: data.order
            });
            console.log('Created Lesson:', lesson.title);
            lessonIds.push(lesson._id);

            await Quiz.create({
                lesson: lesson._id,
                title: data.quiz.title,
                questions: data.quiz.questions,
                passingScore: 70
            });
            console.log('Created Quiz for:', lesson.title);
        }

        course.lessons = lessonIds;
        await course.save();

        console.log('Successfully seeded database with Course, 11 Lessons, 11 Quizzes, Admin, Student, and Parent accounts.');
        process.exit(0);
    } catch (err) {
        console.error('Seed error:', err);
        process.exit(1);
    }
};

run();
