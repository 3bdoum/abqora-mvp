require('dotenv').config();
const connectDB = require('../config/db');
const { preExpressCourse, preExpressLessons } = require('../data/preExpressCourse');
const { upsertCourse, backfillLegacyProgress } = require('./seed');

const run = async () => {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_CURRICULUM_SYNC !== 'true') {
        throw new Error('Refusing to sync production curriculum without ALLOW_CURRICULUM_SYNC=true.');
    }
    await connectDB();
    const course = await upsertCourse(
        preExpressCourse,
        preExpressLessons,
        ['منشئ الألعاب مع Code.org']
    );
    await backfillLegacyProgress();
    console.log(`Pre-reader Express synced in place: ${course.lessons.length} lessons; existing progress preserved.`);
    process.exit(0);
};

run().catch((error) => {
    console.error('Curriculum sync error:', error.message);
    process.exit(1);
});
