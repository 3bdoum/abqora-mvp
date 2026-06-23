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

const expressLessons = Array.from({ length: 31 }, (_, index) => {
    const order = index + 1;
    if (order === 1) {
        return {
            stableId: 'express-2025-l01',
            order,
            title: 'الدرس 1: التتابع في المتاهة',
            content: 'رتّب أوامر الحركة والالتفاف بالترتيب الصحيح حتى يصل روبوت عبقورة إلى النجمة. شغّل الحل، راقب كل خطوة، ثم أرسله للمعلم عندما ينجح.',
            videoUrl: '',
            codeOrgLink: '',
            type: 'activity',
            requiresApproval: true,
            isPlaceholder: false,
            nativeActivity: {
                enabled: true,
                kind: 'sequence_maze',
                version: 1,
                config: {
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
                },
            },
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
