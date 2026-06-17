require('dotenv').config();
const connectDB = require('../config/db');
const Course = require('../models/courseModel');
const Lesson = require('../models/lessonModel');
const Quiz = require('../models/quizModel');
const { preExpressCourse, preExpressLessons } = require('../data/preExpressCourse');

const run = async () => {
    try {
        if (process.env.NODE_ENV === 'production' && process.env.ALLOW_CURRICULUM_SYNC !== 'true') {
            console.error('Refusing to sync production curriculum without ALLOW_CURRICULUM_SYNC=true.');
            process.exit(1);
        }

        await connectDB();

        const course = await Course.findOneAndUpdate(
            { title: preExpressCourse.title },
            { $set: preExpressCourse },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        const lessonIds = [];

        for (const lessonData of preExpressLessons) {
            let lesson = await Lesson.findOne({ course: course._id, order: lessonData.order }).sort({ createdAt: 1 });

            const lessonFields = {
                title: lessonData.title,
                content: lessonData.content,
                videoUrl: lessonData.videoUrl || lesson?.videoUrl || '',
                codeOrgLink: lessonData.codeOrgLink,
                course: course._id,
                order: lessonData.order
            };

            if (lesson) {
                lesson.set(lessonFields);
                await lesson.save();
            } else {
                lesson = await Lesson.create(lessonFields);
            }

            lessonIds.push(lesson._id);

            await Quiz.findOneAndUpdate(
                { lesson: lesson._id },
                {
                    $set: {
                        lesson: lesson._id,
                        title: lessonData.quiz.title,
                        questions: lessonData.quiz.questions,
                        passingScore: 70
                    }
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            console.log(`Synced lesson ${lessonData.order}: ${lessonData.title}`);
        }

        course.lessons = lessonIds;
        await course.save();

        const shownLessons = await Lesson.countDocuments({ _id: { $in: lessonIds } });
        const hiddenLessons = await Lesson.countDocuments({ course: course._id, _id: { $nin: lessonIds } });

        console.log(`Pre-reader Express curriculum synced: ${shownLessons} lessons attached to "${course.title}".`);
        if (hiddenLessons > 0) {
            console.log(`${hiddenLessons} older lesson(s) still exist in MongoDB but are no longer attached to the course.`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Curriculum sync error:', error);
        process.exit(1);
    }
};

run();
