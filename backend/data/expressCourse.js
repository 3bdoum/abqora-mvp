const EXPRESS_REFERENCE_URL = 'https://studio.code.org/courses/express-2025/units/1';

const expressLessonLink = (lessonNumber) =>
    `${EXPRESS_REFERENCE_URL}/lessons/${lessonNumber}/levels/1`;

const expressCourse = {
    slug: 'cs-fundamentals-express-course',
    title: 'CS Fundamentals: Express Course',
    description: 'مسار ذاتي للطلاب الأكبر سناً: يشاهد الطالب شرح عبقورة أولاً، ثم يفتح نشاط Code.org العام للتطبيق، وبعد الانتهاء يرسل طلب الإكمال للمعلم.',
    language: 'العربية',
    level: 'مبتدئ',
    ageRange: '8–14 سنة',
    artwork: '/images/avatar.png',
    referenceUrl: EXPRESS_REFERENCE_URL,
    published: true,
};

const knownExpressLessons = {
    1: {
        title: 'الدرس 1: التتابع في المتاهة',
        content: 'يشاهد الطالب شرح فكرة التتابع وترتيب الأوامر، ثم يطبقها في نشاط Code.org العام.',
    },
    2: {
        title: 'الدرس 2: ترتيب الأوامر مع المنعطفات',
        content: 'نتدرب على قراءة المسار قبل البرمجة، ثم نستخدم أوامر الحركة والالتفاف بالترتيب الصحيح في Code.org.',
    },
    3: {
        title: 'الدرس 3: قراءة المسار قبل البرمجة',
        content: 'يتعلم الطالب كيف يحول المسار المرئي إلى خطوات مرتبة، ثم يطبق ذلك في نشاط Code.org.',
    },
};

const expressLessons = Array.from({ length: 31 }, (_, index) => {
    const order = index + 1;
    const lesson = knownExpressLessons[order] || {
        title: `الدرس ${order}: تدريب Code.org Express`,
        content: 'شاهد شرح عبقورة المخصص لهذا التمرين، ثم افتح نشاط Code.org العام للتطبيق العملي. هذا عنوان عبقورة عام إلى أن يتم إدخال العنوان الرسمي الموثوق.',
    };

    return {
        stableId: `express-2025-l${String(order).padStart(2, '0')}`,
        order,
        title: lesson.title,
        content: lesson.content,
        videoUrl: '',
        videoUrls: lesson.videoUrls || [],
        codeOrgLink: expressLessonLink(order),
        type: 'activity',
        requiresApproval: true,
        isPlaceholder: false,
    };
});

module.exports = { expressCourse, expressLessons };
