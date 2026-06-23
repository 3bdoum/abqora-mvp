const idOf = (value) => String(value?._id || value || '');

const findLessonProgress = (progress, lessonId) => (
    progress?.lessonProgress?.find((entry) => idOf(entry.lesson) === idOf(lessonId))
);

const isLessonCompleted = (progress, lessonId) => (
    Boolean(progress?.completedLessons?.some((item) => idOf(item) === idOf(lessonId)))
    || findLessonProgress(progress, lessonId)?.status === 'completed'
);

const getLessonState = ({ lessons, lesson, progress }) => {
    if (!progress) return 'locked';

    const lessonId = idOf(lesson);
    const index = lessons.findIndex((item) => idOf(item) === lessonId);
    if (index < 0) return 'locked';

    const entry = findLessonProgress(progress, lessonId);
    if (isLessonCompleted(progress, lessonId)) return 'completed';
    if (entry?.accessOverride === 'locked') return 'locked';
    if (entry?.status === 'awaiting_approval') return 'awaiting_approval';

    const prerequisiteMet = index === 0 || isLessonCompleted(progress, lessons[index - 1]);
    const isAvailable = entry?.accessOverride === 'unlocked' || prerequisiteMet;
    if (!isAvailable) return 'locked';

    return entry?.status === 'in_progress' ? 'in_progress' : 'available';
};

const getOrCreateLessonProgress = (progress, lessonId) => {
    let entry = findLessonProgress(progress, lessonId);
    if (!entry) {
        progress.lessonProgress.push({
            lesson: lessonId,
            status: 'not_started',
            accessOverride: 'default',
            updatedAt: new Date(),
        });
        entry = progress.lessonProgress[progress.lessonProgress.length - 1];
    }
    return entry;
};

const serializeCourseProgress = (course, progress) => {
    const lessons = course.lessons || [];
    const completedCount = lessons.filter((lesson) => isLessonCompleted(progress, lesson)).length;
    const percentage = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0;
    const nextLesson = lessons.find((lesson) => {
        const state = getLessonState({ lessons, lesson, progress });
        return ['available', 'in_progress', 'awaiting_approval'].includes(state);
    });

    return {
        enrolled: Boolean(progress),
        completedCount,
        totalLessons: lessons.length,
        percentage,
        status: percentage === 100 ? 'completed' : progress ? 'in_progress' : 'not_started',
        nextLessonId: nextLesson ? idOf(nextLesson) : null,
        certificateUrl: progress?.certificateUrl || '',
    };
};

module.exports = {
    idOf,
    findLessonProgress,
    getLessonState,
    getOrCreateLessonProgress,
    isLessonCompleted,
    serializeCourseProgress,
};
