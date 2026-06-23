require('dotenv').config();
const connectDB = require('../config/db');
const { preExpressCourse, preExpressLessons } = require('../data/preExpressCourse');
const { expressCourse, expressLessons } = require('../data/expressCourse');
const { upsertCourse, backfillLegacyProgress } = require('./seed');
const Lesson = require('../models/lessonModel');

const run = async () => {
    await connectDB();
    await upsertCourse(
        preExpressCourse,
        preExpressLessons,
        ['منشئ الألعاب مع Code.org']
    );
    await upsertCourse(expressCourse, expressLessons);
    await Lesson.collection.updateMany({}, { $unset: { nativeActivity: '' } });
    await backfillLegacyProgress();
    console.log('Course/access migration completed without deleting existing progress.');
    process.exit(0);
};

run().catch((error) => {
    console.error('Migration error:', error.message);
    process.exit(1);
});
