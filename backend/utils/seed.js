const bcrypt = require('bcryptjs');
require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/userModel');
const Course = require('../models/courseModel');
const Lesson = require('../models/lessonModel');
const Quiz = require('../models/quizModel');
const Progress = require('../models/progressModel');
const TeacherStudentAssignment = require('../models/teacherStudentAssignmentModel');
const { preExpressCourse, preExpressLessons } = require('../data/preExpressCourse');
const { expressCourse, expressLessons } = require('../data/expressCourse');

const upsertUser = async ({ name, email, password, role, ageGroup }) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    return User.findOneAndUpdate(
        { email },
        {
            $set: { name, role, ageGroup },
            $setOnInsert: { email, password: hashedPassword, registeredAt: new Date() },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
};

const upsertCourse = async (courseData, lessonsData, legacyTitles = []) => {
    let course = await Course.findOne({
        $or: [{ slug: courseData.slug }, { title: { $in: [courseData.title, ...legacyTitles] } }]
    });
    if (!course) course = new Course();
    Object.assign(course, courseData);
    await course.save();

    const lessonIds = [];
    for (const lessonData of lessonsData) {
        let lesson = await Lesson.findOne({
            $or: [
                { stableId: lessonData.stableId },
                { course: course._id, order: lessonData.order },
            ]
        });
        if (!lesson) lesson = new Lesson();
        Object.assign(lesson, {
            stableId: lessonData.stableId,
            title: lessonData.title,
            content: lessonData.content,
            videoUrl: lessonData.videoUrl || '',
            videoUrls: lessonData.videoUrls || [],
            codeOrgLink: lessonData.codeOrgLink || '',
            course: course._id,
            order: lessonData.order,
            type: lessonData.type || 'activity',
            requiresApproval: lessonData.requiresApproval !== false,
            isPlaceholder: Boolean(lessonData.isPlaceholder),
        });
        await lesson.save();
        await Lesson.collection.updateOne({ _id: lesson._id }, { $unset: { nativeActivity: '' } });
        lessonIds.push(lesson._id);

        if (lessonData.quiz) {
            await Quiz.findOneAndUpdate(
                { lesson: lesson._id },
                {
                    $set: {
                        title: lessonData.quiz.title,
                        questions: lessonData.quiz.questions,
                        passingScore: 70,
                    }
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
        }
    }

    course.lessons = lessonIds;
    await course.save();
    return course;
};

const backfillLegacyProgress = async () => {
    const progresses = await Progress.find();
    for (const progress of progresses) {
        let changed = false;
        for (const lessonId of progress.completedLessons || []) {
            const exists = progress.lessonProgress.some((entry) => String(entry.lesson) === String(lessonId));
            if (!exists) {
                progress.lessonProgress.push({
                    lesson: lessonId,
                    status: 'completed',
                    accessOverride: 'default',
                    completedAt: progress.createdAt || new Date(),
                    updatedAt: new Date(),
                });
                changed = true;
            }
        }
        if (changed) await progress.save();
    }
};

const seedData = async () => {
    const admin = await upsertUser({
        name: 'مدير عبقورا', email: 'admin@abqora.com', password: 'admin123', role: 'admin', ageGroup: 'none'
    });
    const teacher = await upsertUser({
        name: 'المعلمة سارة', email: 'teacher@abqora.com', password: 'teacher123', role: 'teacher', ageGroup: 'none'
    });
    const student = await upsertUser({
        name: 'عمر أحمد', email: 'student@abqora.com', password: 'student123', role: 'student', ageGroup: '9-12'
    });
    const parent = await upsertUser({
        name: 'أحمد علي', email: 'parent@abqora.com', password: 'parent123', role: 'parent', ageGroup: 'none'
    });

    await User.updateOne({ _id: parent._id }, { $addToSet: { children: student._id } });
    await User.updateOne({ _id: student._id }, { $set: { parent: parent._id } });

    const preCourse = await upsertCourse(
        preExpressCourse,
        preExpressLessons,
        ['منشئ الألعاب مع Code.org']
    );
    const express = await upsertCourse(expressCourse, expressLessons);

    await TeacherStudentAssignment.findOneAndUpdate(
        { teacher: teacher._id, student: student._id },
        { $set: { active: true }, $setOnInsert: { assignedBy: admin._id, createdAt: new Date() } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await Progress.findOneAndUpdate(
        { user: student._id, course: preCourse._id },
        { $setOnInsert: { completedLessons: [], lessonProgress: [], enrolledAt: new Date() } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await backfillLegacyProgress();
    return { admin, teacher, student, parent, courses: [preCourse, express] };
};

const run = async () => {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PRODUCTION_SEED !== 'true') {
        throw new Error('Refusing to seed in production without ALLOW_PRODUCTION_SEED=true.');
    }
    await connectDB();
    const result = await seedData();
    console.log(`Seed complete: ${result.courses.length} courses, sample teacher and assignment ready.`);
    process.exit(0);
};

if (require.main === module) {
    run().catch((error) => {
        console.error('Seed error:', error.message);
        process.exit(1);
    });
}

module.exports = { seedData, upsertCourse, backfillLegacyProgress };
