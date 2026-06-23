const codeOrgLessonLink = (lessonNumber) =>
    `https://studio.code.org/courses/pre-express-2025/units/1/lessons/${lessonNumber}/levels/1`;

const preExpressCourse = {
    slug: 'cs-fundamentals-pre-reader-express',
    title: 'CS Fundamentals: Pre-reader Express',
    description: 'تعلم مبادئ البرمجة الأولى من خلال مسار Code.org Pre-reader Express 2025، مع شروحات عربية مبسطة وأنشطة عملية مناسبة للمبتدئين.',
    language: 'العربية',
    level: 'تمهيدي',
    ageRange: '5–8 سنوات',
    artwork: '/images/avatar.png',
    referenceUrl: 'https://code.org/en-US/students/elementary',
    published: true,
};

const makeQuiz = (topic, correctIdea) => ({
    title: `اختبار ${topic}`,
    questions: [
        {
            questionText: `ما الفكرة الأساسية في درس ${topic}؟`,
            options: [
                correctIdea,
                'تخطي النشاط بدون قراءة التعليمات',
                'استخدام أوامر عشوائية حتى يعمل البرنامج',
                'حفظ شكل الصفحة فقط بدون فهم الخطوات'
            ],
            correctIndex: 0
        },
        {
            questionText: 'ما أفضل طريقة لحل ألغاز Code.org؟',
            options: [
                'تجربة جميع الإجابات بسرعة',
                'قراءة الهدف وترتيب الخطوات ثم تشغيل الحل واختباره',
                'إغلاق النشاط عند أول خطأ',
                'نسخ الحل من صديق بدون تجربة'
            ],
            correctIndex: 1
        },
        {
            questionText: 'إذا لم يعمل الحل من أول مرة، ماذا تفعل؟',
            options: [
                'أبحث عن الخطأ وأعدل خطوة واحدة ثم أجرب مرة أخرى',
                'أحذف كل الدروس السابقة',
                'أعتبر أن البرمجة لا تصلح لي',
                'أغير اسم الدرس فقط'
            ],
            correctIndex: 0
        }
    ]
});

const preExpressLessons = [
    {
        order: 1,
        title: 'الدرس 1: التعلم بالسحب والإفلات (Learn to Drag and Drop)',
        content: 'نتعلم طريقة استخدام واجهة Code.org: سحب البلوكات، ترتيبها، تشغيل الحل، ثم إعادة المحاولة عند الحاجة.',
        videoUrl: '',
        codeOrgLink: codeOrgLessonLink(1),
        quiz: makeQuiz('السحب والإفلات', 'استخدام البلوكات وتحريكها في المكان الصحيح لبناء الحل')
    },
    {
        order: 2,
        title: 'الدرس 2: التتابع مع سكرات (Sequencing with Scrat)',
        content: 'نرتب الأوامر خطوة بعد خطوة حتى تصل الشخصية إلى الهدف. ترتيب التعليمات هو أساس بناء أي برنامج.',
        videoUrl: '',
        codeOrgLink: codeOrgLessonLink(2),
        quiz: makeQuiz('التتابع', 'ترتيب الأوامر بالترتيب الصحيح من البداية إلى النهاية')
    },
    {
        order: 3,
        title: 'الدرس 3: البرمجة مع الطيور الغاضبة (Programming with Angry Birds)',
        content: 'نستخدم أوامر الحركة لبناء برنامج بسيط يحرك الشخصية داخل المتاهة حتى تصل إلى الهدف.',
        videoUrl: '',
        codeOrgLink: codeOrgLessonLink(3),
        quiz: makeQuiz('البرمجة بالبلوكات', 'اختيار أوامر الحركة المناسبة ووضعها بترتيب صحيح')
    },
    {
        order: 4,
        title: 'الدرس 4: الخرائط السعيدة (Happy Maps)',
        content: 'نتدرب على التفكير الخوارزمي خارج الشاشة: تحديد نقطة البداية، الهدف، والمسار المطلوب بخطوات واضحة.',
        videoUrl: '',
        codeOrgLink: codeOrgLessonLink(4),
        quiz: makeQuiz('الخوارزميات', 'تقسيم الطريق إلى خطوات صغيرة واضحة يمكن تنفيذها')
    },
    {
        order: 5,
        title: 'الدرس 5: جمع الكنوز مع لوريل (Collecting Treasure with Laurel)',
        content: 'نوجه الشخصية لجمع العناصر المطلوبة باستخدام خطوات دقيقة، مع الانتباه لاتجاه الحركة وعدد الخطوات.',
        videoUrl: '',
        codeOrgLink: codeOrgLessonLink(5),
        quiz: makeQuiz('جمع العناصر', 'تحريك الشخصية بخطوات منظمة لجمع العناصر المطلوبة فقط')
    },
    {
        order: 6,
        title: 'الدرس 6: تصحيح الأخطاء في المتاهة (Debugging in Maze)',
        content: 'نتعلم معنى الخطأ البرمجي وكيف نقرأ الحل خطوة بخطوة لاكتشاف مكان المشكلة وإصلاحها.',
        videoUrl: '',
        codeOrgLink: codeOrgLessonLink(6),
        quiz: makeQuiz('تصحيح الأخطاء', 'فحص التعليمات وتعديل الخطوة التي تمنع البرنامج من الوصول للهدف')
    },
    {
        order: 7,
        title: 'الدرس 7: التكرارات مع سكرات (Loops with Scrat)',
        content: 'نستخدم بلوك التكرار عندما تتكرر نفس الخطوة أكثر من مرة، بدلاً من كتابة الأمر نفسه مرات كثيرة.',
        videoUrl: '',
        codeOrgLink: codeOrgLessonLink(7),
        quiz: makeQuiz('التكرارات', 'استخدام كرر لتنفيذ نفس الأوامر عدة مرات بطريقة مختصرة')
    },
    {
        order: 8,
        title: 'الدرس 8: التكرارات مع لوريل (Loops with Laurel)',
        content: 'نطبق التكرار في أنشطة جمع العناصر، ونحدد عدد مرات تكرار الحركة بدقة للوصول إلى الحل.',
        videoUrl: '',
        codeOrgLink: codeOrgLessonLink(8),
        quiz: makeQuiz('تكرار الحركة', 'اختيار عدد تكرارات مناسب للحركة أو الجمع')
    },
    {
        order: 9,
        title: 'الدرس 9: مشهد المحيط بالتكرارات (Ocean Scene with Loops)',
        content: 'نستخدم التكرارات لبناء رسومات ومشاهد فيها أنماط متكررة، ونرى كيف تجعل البلوكات الكود أسهل.',
        videoUrl: '',
        codeOrgLink: codeOrgLessonLink(9),
        quiz: makeQuiz('أنماط التكرار', 'استخدام التكرار لرسم أو تنفيذ نمط يتكرر أكثر من مرة')
    },
    {
        order: 10,
        title: 'الدرس 10: رسم الحدائق بالتكرارات (Drawing Gardens with Loops)',
        content: 'نرسم أشكالاً متكررة وننظم الكود باستخدام الحلقات، حتى يكون الرسم أبسط وأوضح.',
        videoUrl: '',
        codeOrgLink: codeOrgLessonLink(10),
        quiz: makeQuiz('الرسم بالتكرار', 'استخدام التكرار لرسم أشكال متشابهة بدون إعادة كتابة نفس الأوامر')
    },
    {
        order: 11,
        title: 'الدرس 11: الحدث الكبير الصغير (The Big Event Jr.)',
        content: 'نتعرف على فكرة الأحداث: عندما يحدث شيء مثل الضغط على زر، يستجيب البرنامج وينفذ أمراً معيناً.',
        videoUrl: '',
        codeOrgLink: codeOrgLessonLink(11),
        quiz: makeQuiz('الأحداث', 'ربط فعل يحدث من المستخدم باستجابة ينفذها البرنامج')
    }
];

const normalizedPreExpressLessons = preExpressLessons.map((lesson) => ({
    ...lesson,
    stableId: `pre-express-2025-l${String(lesson.order).padStart(2, '0')}`,
    videoUrls: lesson.videoUrls || [],
    type: [2, 4, 6].includes(lesson.order) ? 'project' : 'activity',
    requiresApproval: true,
    isPlaceholder: false,
}));

module.exports = {
    preExpressCourse,
    preExpressLessons: normalizedPreExpressLessons
};
