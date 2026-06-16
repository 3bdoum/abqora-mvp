const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/userModel');
const Course = require('../models/courseModel');
const Lesson = require('../models/lessonModel');
const Quiz = require('../models/quizModel');
const Progress = require('../models/progressModel');
const Certificate = require('../models/certificateModel');
const Submission = require('../models/submissionModel');

const run = async () => {
    try {
        await connectDB();

        // Clear collections
        await User.deleteMany({});
        await Course.deleteMany({});
        await Lesson.deleteMany({});
        await Quiz.deleteMany({});
        await Progress.deleteMany({});
        await Certificate.deleteMany({});
        await Submission.deleteMany({});

        console.log('Cleared all collections.');

        // 1. Create Default Users
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

        // Update student with parent link
        student.parent = parent._id;
        await student.save();

        // 2. Create the Course
        const course = await Course.create({
            title: 'منشئ الألعاب مع Code.org',
            description: 'تعلم أساسيات البرمجة وقم ببناء ألعابك وتطبيقاتك الأولى باستخدام لغة السي شارب التفاعلية على منصة Code.org بمساعدة شروحات عربية مبسطة!',
            language: 'العربية',
            level: 'مبتدئ'
        });
        console.log('Created course:', course.title);

        // 3. Lessons Data
        const lessonsData = [
            {
                title: 'الدرس 1: مقدمة في البرمجة',
                content: 'مرحباً بك في عالم البرمجة! في هذا الدرس سنتعرف على مفهوم البرمجة وكيف يفكر الحاسوب، وسنقوم بحل اللغز الأول على Code.org.',
                videoUrl: 'https://www.youtube.com/embed/m2Ux2PnJe6E',
                codeOrgLink: 'https://studio.code.org/s/coursea-2023/lessons/1/levels/1',
                order: 1,
                quiz: {
                    title: 'اختبار مقدمة البرمجة',
                    questions: [
                        {
                            questionText: 'ما هي البرمجة؟',
                            options: [
                                'كتابة تعليمات يفهمها الحاسوب لينفذ مهام محددة',
                                'تصليح الأجزاء المادية للحاسوب',
                                'تصفح مواقع الإنترنت ومشاهدة الفيديوهات',
                                'لعب ألعاب الفيديو'
                            ],
                            correctIndex: 0
                        },
                        {
                            questionText: 'ما هي اللغة التي يفهمها الحاسوب؟',
                            options: [
                                'العربية فقط',
                                'البرمجية (الأوامر والتعليمات)',
                                'الإنجليزية فقط',
                                'الصوتية فقط'
                            ],
                            correctIndex: 1
                        },
                        {
                            questionText: 'الخطوة الأولى لحل أي مشكلة برمجية هي:',
                            options: [
                                'كتابة الكود فوراً دون تفكير',
                                'فهم المشكلة وتصميم الحل خطوة بخطوة',
                                'إغلاق الحاسوب',
                                'طلب المساعدة من صديق'
                            ],
                            correctIndex: 1
                        }
                    ]
                }
            },
            {
                title: 'الدرس 2: التتابع (Sequencing)',
                content: 'التتابع هو ترتيب الخطوات بشكل صحيح من البداية إلى النهاية. إذا اختلف الترتيب، فلن نصل إلى الحل الصحيح! (مشروع مطلوب: تصميم لعبة متاهة على ورقة أو رابط خارجى)',
                videoUrl: 'https://www.youtube.com/embed/EuYt8QGfE2g',
                codeOrgLink: 'https://studio.code.org/s/coursea-2023/lessons/3/levels/1',
                order: 2,
                quiz: {
                    title: 'اختبار التتابع',
                    questions: [
                        {
                            questionText: 'ماذا يعني التتابع في البرمجة؟',
                            options: [
                                'تكرار نفس الكود بدون نهاية',
                                'كتابة الكود في سطر واحد فقط',
                                'ترتيب الأوامر والتعليمات خطوة بخطوة بشكل صحيح',
                                'إخفاء الكود عن الآخرين'
                            ],
                            correctIndex: 2
                        },
                        {
                            questionText: 'إذا قمنا بتغيير ترتيب الخطوات في برنامج التتابع:',
                            options: [
                                'سيعمل البرنامج بشكل أسرع',
                                'قد لا يعمل البرنامج أو يعطي نتائج خاطئة',
                                'سيتغير لون واجهة البرنامج تلقائياً',
                                'لن يحدث أي شيء'
                            ],
                            correctIndex: 1
                        },
                        {
                            questionText: 'لمساعدة الطائر الغاضب في الوصول للخنزير، نتحرك خطوة للأمام ثم خطوة للأمام. هذا يسمى:',
                            options: [
                                'حدث (Event)',
                                'تكرار (Loop)',
                                'تتابع (Sequencing)',
                                'متغير (Variable)'
                            ],
                            correctIndex: 2
                        }
                    ]
                }
            },
            {
                title: 'الدرس 3: الأحداث (Events)',
                content: 'الأحداث هي الأشياء التي تجعل الكود يبدأ في العمل عند تفاعل المستخدم، مثل: الضغط على زر، أو تحريك الفأرة، أو لمس الشاشة.',
                videoUrl: 'https://www.youtube.com/embed/52lZgD7uXlI',
                codeOrgLink: 'https://studio.code.org/s/playlab/lessons/1/levels/1',
                order: 3,
                quiz: {
                    title: 'اختبار الأحداث',
                    questions: [
                        {
                            questionText: 'ما هو "الحدث" (Event) في البرمجة؟',
                            options: [
                                'خطأ يحدث أثناء تشغيل البرنامج',
                                'فعل يقوم به المستخدم (مثل الضغط على زر) يجعل كود معين يعمل',
                                'تكرار الكود البرمجي بشكل متواصل',
                                'حفظ الملفات في الذاكرة'
                            ],
                            correctIndex: 1
                        },
                        {
                            questionText: 'أي مما يلي يعتبر حدثاً (Event)؟',
                            options: [
                                'عند الضغط على زر "البدء"',
                                'عند لمس عصفور للوح الزجاجي في اللعبة',
                                'عند نقر زر الفأرة الأيمن',
                                'كل ما سبق صحيح'
                            ],
                            correctIndex: 3
                        },
                        {
                            questionText: 'في لعبة قيادة السيارات، عندما نضغط على السهم العلوي فتتحرك السيارة للأمام. ما هو الحدث هنا؟',
                            options: [
                                'تحرك السيارة للأمام',
                                'الضغط على السهم العلوي',
                                'صوت محرك السيارة',
                                'لون السيارة'
                            ],
                            correctIndex: 1
                        }
                    ]
                }
            },
            {
                title: 'الدرس 4: التكرار (Loops)',
                content: 'لماذا نكتب نفس السطر 5 مرات بينما يمكننا كتابته مرة واحدة ونطلب من الحاسوب تكراره؟ التكرار يسهل كتابة الكود ويجعله أنظف. (مشروع مطلوب: قصة متحركة)',
                videoUrl: 'https://www.youtube.com/embed/y59kI_FfW1M',
                codeOrgLink: 'https://studio.code.org/s/coursea-2023/lessons/6/levels/1',
                order: 4,
                quiz: {
                    title: 'اختبار التكرار',
                    questions: [
                        {
                            questionText: 'لماذا نستخدم "التكرار" (Loops) في البرمجة؟',
                            options: [
                                'لتشغيل البرنامج لمرة واحدة فقط ثم حذفه',
                                'لتوفير الوقت والجهد وتجنب إعادة كتابة نفس التعليمات عدة مرات',
                                'لزيادة سرعة الإنترنت في المنزل',
                                'لتغيير اسم المتغيرات تلقائياً'
                            ],
                            correctIndex: 1
                        },
                        {
                            questionText: 'إذا أردنا رسم مربع، ونعلم أن المربع له 4 أضلاع متطابقة. أي حلقة تكرار هي الأنسب؟',
                            options: [
                                'كرر لـ 2 مرات',
                                'كرر لـ 3 مرات',
                                'كرر لـ 4 مرات',
                                'لا نستخدم التكرار في رسم المربع'
                            ],
                            correctIndex: 2
                        },
                        {
                            questionText: 'الرمز المستخدم لحلقة التكرار عادة في برمجة البلوكات هو:',
                            options: [
                                'Repeat أو كرر',
                                'Start أو ابدأ',
                                'If أو إذا',
                                'Move أو تحرك'
                            ],
                            correctIndex: 0
                        }
                    ]
                }
            },
            {
                title: 'الدرس 5: الدوال (Functions)',
                content: 'الدالة هي مجموعة من الخطوات مرتبطة معاً تحت اسم معين. متى أردنا تنفيذ هذه الخطوات، نقوم فقط بمناداة اسم الدالة بدلاً من كتابة كل الخطوات مجدداً.',
                videoUrl: 'https://www.youtube.com/embed/0eo0t45558k',
                codeOrgLink: 'https://studio.code.org/s/coursef-2023/lessons/14/levels/1',
                order: 5,
                quiz: {
                    title: 'اختبار الدوال',
                    questions: [
                        {
                            questionText: 'ما هي "الدالة" (Function)؟',
                            options: [
                                'جهاز يتم توصيله بالحاسوب',
                                'مجموعة من التعليمات البرمجية التي تُعطى اسماً ويمكن استدعاؤها لتنفيذ مهمة محددة',
                                'نوع من أنواع الألعاب على الهاتف',
                                'ملف لحفظ الصور'
                            ],
                            correctIndex: 1
                        },
                        {
                            questionText: 'فائدة كتابة الدوال هي:',
                            options: [
                                'تنظيم الكود وإعادة استخدامه بسهولة دون تكرار',
                                'إخفاء الأخطاء في الكود البرمجي',
                                'جعل الكود طويلاً جداً بدون داعٍ',
                                'تلوين شاشة اللعبة بألوان عشوائية'
                            ],
                            correctIndex: 0
                        },
                        {
                            questionText: 'عند بناء لعبة لتنظيف الشاطئ، قمنا بتجميع حركات (التقاط القمامة، المشي سلتين، إلقاؤها) داخل بلوك اسمه "Clean". ما هو "Clean" هنا؟',
                            options: [
                                'حدث (Event)',
                                'دالة (Function)',
                                'تكرار (Loop)',
                                'متغير (Variable)'
                            ],
                            correctIndex: 1
                        }
                    ]
                }
            },
            {
                title: 'الدرس 6: أساسيات بناء الألعاب',
                content: 'حان الوقت لنجمع كل ما تعلمناه! التتابع، التكرار، الأحداث، والدوال. سنصمم لعبتنا الخاصة كاملة على Code.org. (مشروع مطلوب: لعبة سباق بسيطة)',
                videoUrl: 'https://www.youtube.com/embed/34vK7VwV1bY',
                codeOrgLink: 'https://studio.code.org/s/artist/lessons/1/levels/1',
                order: 6,
                quiz: {
                    title: 'اختبار بناء الألعاب',
                    questions: [
                        {
                            questionText: 'لتحديد الفائز في لعبة، ما الشرط البرمجي المناسب؟',
                            options: [
                                'إذا وصلت النتيجة (Score) إلى 10 نقاط',
                                'إذا اصطدم اللاعب بالحائط',
                                'إذا مرت 5 ثوانٍ فقط',
                                'إذا تم تغيير خلفية اللعبة'
                            ],
                            correctIndex: 0
                        },
                        {
                            questionText: 'لتحريك شخصية اللعبة باستخدام أسهم لوحة المفاتيح، نحتاج إلى استخدام:',
                            options: [
                                'الأحداث (Events) لتحديد أي زر تم الضغط عليه',
                                'التكرار (Loops) فقط بدون أحداث',
                                'تخزين اللعبة في السحابة الإلكترونية',
                                'تغيير لغة الحاسوب'
                            ],
                            correctIndex: 0
                        },
                        {
                            questionText: 'أي من العناصر التالية ضروري عند التخطيط لبناء لعبة جديدة؟',
                            options: [
                                'تحديد هدف اللعبة (كيف يفوز اللاعب وكيف يخسر)',
                                'تصميم الشخصيات والخلفيات والقوانين',
                                'تحديد الأزرار التي سيستخدمها اللاعب للتحكم',
                                'كل ما سبق صحيح وضروري'
                            ],
                            correctIndex: 3
                        }
                    ]
                }
            }
        ];

        // 4. Insert lessons and quizzes
        const lessonIds = [];
        for (const data of lessonsData) {
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

            // Create Quiz for the lesson
            const quiz = await Quiz.create({
                lesson: lesson._id,
                title: data.quiz.title,
                questions: data.quiz.questions,
                passingScore: 70
            });
            console.log('Created Quiz for:', lesson.title);
        }

        // Attach lessons to course
        course.lessons = lessonIds;
        await course.save();

        console.log('Successfully seeded database with Course, 6 Lessons, 6 Quizzes, Admin, Student, and Parent accounts.');
        process.exit(0);
    } catch (err) {
        console.error('Seed error:', err);
        process.exit(1);
    }
};

run();
