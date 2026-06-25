const Lesson = require('../models/lessonModel');
const Course = require('../models/courseModel');
const Progress = require('../models/progressModel');
const AiTutorExchange = require('../models/aiTutorExchangeModel');
const { getLessonState } = require('../utils/progressAccess');
const { cleanText, isObjectId } = require('../utils/validation');

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const DEFAULT_MODEL = 'gpt-4.1-mini';

const ageProfiles = {
    '5-8': {
        label: '5 إلى 8 سنوات',
        tone: 'استخدم جملاً قصيرة جداً، كلمات سهلة، وتشبيه بسيط. لا تكثر من النقاط.',
        maxWords: 90,
    },
    '9-12': {
        label: '9 إلى 12 سنة',
        tone: 'استخدم شرحاً واضحاً مع خطوات قليلة وتلميح عملي واحد.',
        maxWords: 130,
    },
    '13-16': {
        label: '13 إلى 16 سنة',
        tone: 'استخدم لغة منظمة أكثر، واشرح السبب وراء الخطوة بدون إعطاء الحل الكامل.',
        maxWords: 160,
    },
    none: {
        label: 'غير محدد',
        tone: 'استخدم لغة عربية مبسطة ومناسبة للأطفال.',
        maxWords: 120,
    },
};

const getAgeProfile = (ageGroup) => ageProfiles[ageGroup] || ageProfiles.none;

const normalizeLessonVideos = (lesson) => (
    lesson.videoUrls?.length
        ? lesson.videoUrls
        : (lesson.videoUrl ? [{ title: 'الشرح المرئي', url: lesson.videoUrl }] : [])
).filter((video) => video?.url);

const getResponseText = (payload) => {
    if (typeof payload?.output_text === 'string') return payload.output_text.trim();

    const textParts = [];
    for (const item of payload?.output || []) {
        for (const content of item?.content || []) {
            if (typeof content?.text === 'string') textParts.push(content.text);
        }
    }
    return textParts.join('\n').trim();
};

const isDisallowedStudentPrompt = (message) => {
    const normalized = message.toLowerCase();
    return [
        /api\s*key/i,
        /password/i,
        /كلمة\s*المرور/i,
        /اعطني\s+الحل\s+كامل/i,
        /اكتب\s+الحل\s+كامل/i,
        /افتح\s+الدرس/i,
        /اعتمد\s+الدرس/i,
    ].some((pattern) => pattern.test(normalized));
};

const buildSystemPrompt = ({ student, course, lesson, lessonState }) => {
    const age = getAgeProfile(student.ageGroup);
    const videos = normalizeLessonVideos(lesson)
        .slice(0, 6)
        .map((video, index) => `${index + 1}. ${video.title || `فيديو ${index + 1}`}${video.description ? ` — ${video.description}` : ''}`)
        .join('\n') || 'لا توجد فيديوهات مسجلة لهذا الدرس بعد.';

    return `
أنت "مساعد عبقورا الذكي"، مساعد تعلم آمن للأطفال داخل منصة عربية لتعليم البرمجة.

قواعد صارمة:
- أجب بالعربية فقط.
- ساعد الطالب على الفهم والتفكير، ولا تعطِ الحل الكامل أو كوداً نهائياً ينسخه الطالب.
- قدّم تلميحات صغيرة، خطوة أو خطوتين، ثم اسأل سؤالاً توجيهياً.
- ابقَ داخل سياق الدرس الحالي. إذا خرج السؤال عن الدرس، أعد الطالب بلطف إلى الدرس.
- لا تطلب معلومات شخصية، ولا تناقش كلمات مرور أو مفاتيح API أو بيانات حساب.
- لا تفتح دروساً، لا تعتمد الإكمال، ولا تدّعي أنك معلم بشري. قل إن المعلم يراجع الإكمال داخل عبقورا.
- إذا طلب الطالب شيئاً غير مناسب لطفل أو خارج التعلم، ارفض بلطف واقترح سؤالاً متعلقاً بالدرس.
- شجّع الطالب على مشاهدة فيديو الشرح قبل التطبيق العملي.
- الحد الأقصى التقريبي للإجابة: ${age.maxWords} كلمة.

أسلوب العمر:
الفئة العمرية: ${age.label}
${age.tone}

سياق عبقورا:
الدورة: ${course.title}
الدرس ${lesson.order}: ${lesson.title}
حالة الدرس: ${lessonState}
ملخص الدرس: ${lesson.content || 'لا يوجد ملخص نصي.'}
فيديوهات الشرح:
${videos}
رابط التطبيق العملي متوفر: ${lesson.codeOrgLink ? 'نعم' : 'لا'}
`.trim();
};

const buildUserPrompt = ({ message, recentExchanges }) => {
    const recent = recentExchanges.length
        ? recentExchanges.map((exchange, index) => (
            `محادثة سابقة ${index + 1}:\nالطالب: ${exchange.userMessage}\nالمساعد: ${exchange.assistantMessage}`
        )).join('\n\n')
        : 'لا توجد محادثة سابقة.';

    return `
المحادثة السابقة المختصرة:
${recent}

سؤال الطالب الآن:
${message}

أجب كمساعد تعلم يعطي تلميحات وليس الحل الكامل.
`.trim();
};

const ensureStudentLessonAccess = async (req, res, lessonId) => {
    if (req.user.role !== 'student') {
        res.status(403).json({ message: 'مساعد عبقورا الذكي متاح للطلاب فقط حالياً' });
        return null;
    }

    if (!isObjectId(lessonId)) {
        res.status(400).json({ message: 'معرّف الدرس غير صالح' });
        return null;
    }

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
        res.status(404).json({ message: 'الدرس غير موجود' });
        return null;
    }

    const [course, progress] = await Promise.all([
        Course.findById(lesson.course).populate({ path: 'lessons', options: { sort: { order: 1 } } }),
        Progress.findOne({ user: req.user._id, course: lesson.course }),
    ]);

    if (!course || !progress) {
        res.status(403).json({ message: 'سجّل في الدورة أولاً لاستخدام مساعد عبقورا' });
        return null;
    }

    const lessonState = getLessonState({ lessons: course.lessons, lesson, progress });
    if (lessonState === 'locked') {
        res.status(403).json({ message: 'لا يمكن استخدام المساعد في درس مقفل' });
        return null;
    }

    return { lesson, course, progress, lessonState };
};

const callOpenAIResponses = async ({ systemPrompt, userPrompt }) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        const error = new Error('OPENAI_API_KEY is not configured');
        error.code = 'AI_NOT_CONFIGURED';
        throw error;
    }

    const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;
    const response = await fetch(OPENAI_RESPONSES_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model,
            input: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            max_output_tokens: 450,
        }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        const error = new Error(payload?.error?.message || 'OpenAI request failed');
        error.status = response.status;
        throw error;
    }

    return {
        model,
        text: getResponseText(payload),
    };
};

const chatWithTutor = async (req, res) => {
    try {
        const lessonId = cleanText(req.body.lessonId, 80);
        const message = cleanText(req.body.message, 1200);
        if (!message || message.length < 2) {
            return res.status(400).json({ message: 'اكتب سؤالاً قصيراً للمساعد' });
        }

        const access = await ensureStudentLessonAccess(req, res, lessonId);
        if (!access) return null;

        const { lesson, course, lessonState } = access;
        if (isDisallowedStudentPrompt(message)) {
            const assistantMessage = 'أستطيع مساعدتك بتلميحات وفهم خطوات الدرس، لكن لا أستطيع إعطاء الحل الكامل أو فتح/اعتماد الدروس. ما الجزء الذي تريد فهمه؟';
            await AiTutorExchange.create({
                student: req.user._id,
                course: course._id,
                lesson: lesson._id,
                lessonState,
                userMessage: message,
                assistantMessage,
                status: 'blocked',
                safetyFlags: [{ type: 'student_prompt', message: 'Disallowed shortcut or credential request' }],
            });
            return res.json({ message: assistantMessage, status: 'blocked' });
        }

        const recentExchanges = await AiTutorExchange.find({
            student: req.user._id,
            lesson: lesson._id,
            status: { $in: ['answered', 'blocked'] },
        }).sort('-createdAt').limit(4);

        const systemPrompt = buildSystemPrompt({
            student: req.user,
            course,
            lesson,
            lessonState,
        });
        const userPrompt = buildUserPrompt({
            message,
            recentExchanges: [...recentExchanges].reverse(),
        });

        let aiResult;
        try {
            aiResult = await callOpenAIResponses({ systemPrompt, userPrompt });
        } catch (error) {
            if (error.code === 'AI_NOT_CONFIGURED') {
                return res.status(503).json({
                    code: 'AI_NOT_CONFIGURED',
                    message: 'مساعد عبقورا الذكي غير مفعّل بعد. أضف OPENAI_API_KEY في إعدادات الخادم.',
                });
            }
            await AiTutorExchange.create({
                student: req.user._id,
                course: course._id,
                lesson: lesson._id,
                lessonState,
                userMessage: message,
                assistantMessage: '',
                model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
                status: 'error',
                safetyFlags: [{ type: 'provider_error', message: cleanText(error.message, 300) }],
            });
            return res.status(502).json({ message: 'تعذر تشغيل مساعد عبقورا الآن. حاول لاحقاً.' });
        }

        const assistantMessage = cleanText(aiResult.text, 1800)
            || 'أحتاج أن تعيد صياغة السؤال بكلمات أبسط حتى أساعدك بتلميح مناسب.';

        const exchange = await AiTutorExchange.create({
            student: req.user._id,
            course: course._id,
            lesson: lesson._id,
            lessonState,
            userMessage: message,
            assistantMessage,
            model: aiResult.model,
            status: 'answered',
        });

        return res.json({
            id: exchange._id,
            message: assistantMessage,
            status: 'answered',
            createdAt: exchange.createdAt,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const getTutorHistory = async (req, res) => {
    try {
        const access = await ensureStudentLessonAccess(req, res, req.params.lessonId);
        if (!access) return null;

        const history = await AiTutorExchange.find({
            student: req.user._id,
            lesson: access.lesson._id,
            status: { $in: ['answered', 'blocked'] },
        }).sort('-createdAt').limit(12);

        return res.json(history.reverse().map((exchange) => ({
            _id: exchange._id,
            userMessage: exchange.userMessage,
            assistantMessage: exchange.assistantMessage,
            status: exchange.status,
            createdAt: exchange.createdAt,
        })));
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = { chatWithTutor, getTutorHistory };
