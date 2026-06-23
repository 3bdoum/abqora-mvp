const EXPRESS_REFERENCE_URL = 'https://studio.code.org/courses/express-2025/units/1';

const expressCourse = {
    slug: 'cs-fundamentals-express-course',
    title: 'CS Fundamentals: Express Course',
    description: 'مسار ذاتي للطلاب الأكبر سناً لتطوير مهارات التفكير الحاسوبي والبرمجة بالبلوكات. عناوين الدروس التفصيلية بانتظار تزويد عبقورا ببيانات موثوقة.',
    language: 'العربية',
    level: 'مبتدئ',
    ageRange: '8–14 سنة',
    artwork: '/images/avatar.png',
    referenceUrl: EXPRESS_REFERENCE_URL,
    published: true,
};

const sequenceMaze = (config) => ({
    enabled: true,
    kind: 'sequence_maze',
    version: 1,
    config,
});

const nativeLessonData = {
    1: {
        stableId: 'express-2025-l01',
        title: 'الدرس 1: التتابع في المتاهة',
        content: 'رتّب أوامر الحركة والالتفاف بالترتيب الصحيح حتى يصل روبوت عبقورة إلى النجمة. شغّل الحل، راقب كل خطوة، ثم أرسله للمعلم عندما ينجح.',
        nativeActivity: sequenceMaze({
            title: 'برمج الروبوت ليصل إلى النجمة',
            instructions: 'استخدم أوامر الحركة والالتفاف لبناء سلسلة واحدة. الهدف هو الوصول للنجمة بدون الخروج عن الطريق.',
            rows: 5,
            columns: 5,
            start: { row: 4, column: 0, direction: 'east' },
            goal: { row: 2, column: 4 },
            validCells: [
                { row: 4, column: 0 },
                { row: 4, column: 1 },
                { row: 4, column: 2 },
                { row: 3, column: 2 },
                { row: 2, column: 2 },
                { row: 2, column: 3 },
                { row: 2, column: 4 },
            ],
            maxBlocks: 12,
        }),
    },
    2: {
        stableId: 'express-2025-l02',
        title: 'الدرس 2: ترتيب الأوامر مع المنعطفات',
        content: 'في هذا التحدي يتدرب الطالب على بناء سلسلة أطول من الأوامر. اتبع المسار خطوة بخطوة، واستخدم الالتفافات في اللحظة المناسبة حتى يصل روبوت عبقورة إلى النجمة.',
        nativeActivity: sequenceMaze({
            title: 'مسار أطول وتتابع أدق',
            instructions: 'هذه المتاهة تحتاج أكثر من منعطف. فكّر في الاتجاه الحالي للروبوت قبل إضافة كل أمر.',
            rows: 6,
            columns: 6,
            start: { row: 5, column: 0, direction: 'east' },
            goal: { row: 1, column: 5 },
            validCells: [
                { row: 5, column: 0 },
                { row: 5, column: 1 },
                { row: 4, column: 1 },
                { row: 3, column: 1 },
                { row: 3, column: 2 },
                { row: 3, column: 3 },
                { row: 2, column: 3 },
                { row: 1, column: 3 },
                { row: 1, column: 4 },
                { row: 1, column: 5 },
            ],
            maxBlocks: 16,
        }),
    },
};

const expressLessons = Array.from({ length: 31 }, (_, index) => {
    const order = index + 1;
    const nativeLesson = nativeLessonData[order];
    if (nativeLesson) {
        return {
            stableId: nativeLesson.stableId,
            order,
            title: nativeLesson.title,
            content: nativeLesson.content,
            videoUrl: '',
            codeOrgLink: '',
            type: 'activity',
            requiresApproval: true,
            isPlaceholder: false,
            nativeActivity: nativeLesson.nativeActivity,
        };
    }

    return {
        stableId: `express-2025-l${String(order).padStart(2, '0')}`,
        order,
        title: `الدرس ${order} — العنوان الرسمي مطلوب`,
        content: 'عنصر نائب واضح: لم تُزوّد عبقورا بعد بعنوان ووصف موثوقين أو نشاط أصلي لهذا الدرس. لن تفتح عبقورا رابط Code.org مباشر للطالب؛ يجب تأليف نشاط عبقورة آمن داخل المنصة أولاً.',
        videoUrl: '',
        codeOrgLink: '',
        type: 'activity',
        requiresApproval: true,
        isPlaceholder: true,
    };
});

module.exports = { expressCourse, expressLessons };
