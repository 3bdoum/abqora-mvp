const Lesson = require('../models/lessonModel');
const Course = require('../models/courseModel');
const Progress = require('../models/progressModel');
const AiTutorExchange = require('../models/aiTutorExchangeModel');
const { getLessonState } = require('../utils/progressAccess');
const { cleanText, isObjectId } = require('../utils/validation');

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_OPENAI_MODEL = 'gpt-4.1-mini';
const DEFAULT_GEMINI_MODEL = 'gemini-3.1-flash-lite';

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

const getGeminiResponseText = (payload) => {
    const textParts = [];
    for (const candidate of payload?.candidates || []) {
        for (const part of candidate?.content?.parts || []) {
            if (typeof part?.text === 'string') textParts.push(part.text);
        }
    }
    return textParts.join('\n').trim();
};

const getPrimaryAiProvider = () => (
    process.env.AI_PROVIDER
    || (process.env.GEMINI_API_KEY ? 'gemini' : 'openai')
).trim().toLowerCase();

const getProviderChain = () => {
    const primary = getPrimaryAiProvider();
    const fallback = (process.env.AI_FALLBACK_PROVIDER || '').trim().toLowerCase();
    return [...new Set([primary, fallback].filter(Boolean))];
};

const getConfiguredModelLabel = () => {
    const provider = getPrimaryAiProvider();
    if (provider === 'gemini') return `gemini:${process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL}`;
    if (provider === 'openai') return `openai:${process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL}`;
    return provider || 'unknown';
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

const callOpenAIResponses = async ({ systemPrompt, userPrompt, maxOutputTokens = 450 }) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        const error = new Error('OPENAI_API_KEY is not configured');
        error.code = 'AI_NOT_CONFIGURED';
        throw error;
    }

    const configuredModel = process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL;
    const fallbackModel = process.env.OPENAI_FALLBACK_MODEL || 'gpt-4o-mini';
    const modelsToTry = [...new Set([configuredModel, fallbackModel].filter(Boolean))];
    let lastError;

    for (const model of modelsToTry) {
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
                max_output_tokens: maxOutputTokens,
            }),
        });

        const payload = await response.json().catch(() => ({}));
        if (response.ok) {
            return {
                provider: 'openai',
                model,
                text: getResponseText(payload),
            };
        }

        const error = new Error(payload?.error?.message || 'OpenAI request failed');
        error.status = response.status;
        error.providerType = payload?.error?.type;
        lastError = error;

        if ([401, 403, 429].includes(response.status)) break;
    }

    lastError.code = 'AI_PROVIDER_ERROR';
    throw lastError;
};

const callGeminiGenerateContent = async ({ systemPrompt, userPrompt, maxOutputTokens = 450 }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        const error = new Error('GEMINI_API_KEY is not configured');
        error.code = 'AI_NOT_CONFIGURED';
        error.provider = 'gemini';
        throw error;
    }

    const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
    const modelPath = model.startsWith('models/') ? model : `models/${model}`;
    const encodedModelPath = modelPath.split('/').map(encodeURIComponent).join('/');
    const response = await fetch(`${GEMINI_API_BASE_URL}/${encodedModelPath}:generateContent?key=${encodeURIComponent(apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            systemInstruction: {
                parts: [{ text: systemPrompt }],
            },
            contents: [{
                role: 'user',
                parts: [{ text: userPrompt }],
            }],
            generationConfig: {
                maxOutputTokens,
            },
        }),
    });

    const payload = await response.json().catch(() => ({}));
    if (response.ok) {
        return {
            provider: 'gemini',
            model,
            text: getGeminiResponseText(payload),
        };
    }

    const error = new Error(payload?.error?.message || 'Gemini request failed');
    error.code = 'AI_PROVIDER_ERROR';
    error.status = response.status;
    error.provider = 'gemini';
    error.providerType = payload?.error?.status || payload?.error?.code;
    error.model = model;
    throw error;
};

const callAiProvider = async (provider, args) => {
    if (provider === 'gemini') return callGeminiGenerateContent(args);
    if (provider === 'openai') return callOpenAIResponses(args);

    const error = new Error(`Unsupported AI_PROVIDER: ${provider}`);
    error.code = 'AI_PROVIDER_NOT_SUPPORTED';
    error.provider = provider;
    throw error;
};

const callConfiguredAiProvider = async (args) => {
    const providersToTry = getProviderChain();
    let lastError;
    let firstConfiguredProviderError;

    for (const provider of providersToTry) {
        try {
            return await callAiProvider(provider, args);
        } catch (error) {
            lastError = error;
            lastError.providersTried = providersToTry;
            if (error.code === 'AI_PROVIDER_NOT_SUPPORTED') break;
            if (error.code !== 'AI_NOT_CONFIGURED' && !firstConfiguredProviderError) {
                firstConfiguredProviderError = error;
            }
            if (provider === providersToTry[providersToTry.length - 1]) break;
        }
    }

    if (lastError?.code === 'AI_NOT_CONFIGURED' && firstConfiguredProviderError) {
        throw firstConfiguredProviderError;
    }

    throw lastError;
};

const buildPublicAssistantSystemPrompt = ({ pageContext }) => `
أنت "مساعد عبقورا الذكي"، مساعد عام متقدم لزوار منصة عبقورا.

مهمتك:
- أجب عن أسئلة المستخدم العامة، وليس فقط الأسئلة الموجودة في بيانات الصفحة.
- إذا كان السؤال عن عبقورا أو نتيجة الثانوية أو التنسيق، استخدم سياق الصفحة أدناه.
- إذا كان السؤال خارج عبقورا، أجب بشكل عام ومفيد وآمن.
- إذا لم تعرف شيئاً حديثاً أو رسمياً، قل إن المستخدم يجب أن يراجع المصدر الرسمي.
- لا تدّعي أنك تعرض نتيجة الطالب، ولا تطلب رقم الجلوس، ولا تطلب بيانات شخصية.
- لا تعطي نصائح طبية/قانونية/مالية عالية الخطورة كحقيقة نهائية؛ قدّم إرشاداً عاماً واطلب مراجعة مختص.
- لا تساعد في الاحتيال أو الاختراق أو تجاوز الأنظمة.
- اكتب غالباً بالعربية إذا كان السؤال بالعربية، وبالإنجليزية إذا كان السؤال بالإنجليزية.
- كن تفاعلياً وطبيعياً مثل محادثة ChatGPT: افهم النية، أجب مباشرة، ثم اسأل سؤال متابعة واحداً عند الحاجة.
- إذا طلب المستخدم شرحاً، استخدم أمثلة بسيطة. إذا طلب خطة، أعطه خطوات عملية. إذا سأل سؤالاً عاماً، أجب من معرفتك العامة بأمان.
- اجعل الإجابة مفيدة ومختصرة غالباً، ويمكنك التفصيل إذا طلب المستخدم ذلك.

سياق عبقورا:
- عبقورا منصة عربية RTL لتعليم البرمجة للأطفال.
- تجربة التعلم تعتمد على فيديو شرح، تطبيق عملي، متابعة معلم، ولوحة ولي أمر.
- صفحة الثانوية العامة الحالية تساعد الطالب على فتح الرابط الرسمي، حساب النسبة، وقراءة توقعات إرشادية من بيانات التنسيق.
- عبقورا لا تخزن رقم الجلوس ولا تعرض النتيجة الرسمية.
- النظام الجديد في الصفحة: 320 درجة. النظام القديم: 410 درجات.
- التوقعات إرشادية فقط وليست قبولاً رسمياً.

سياق الصفحة الحالي من المتصفح:
${pageContext || 'لا يوجد سياق إضافي.'}
`.trim();

const chatWithPublicAssistant = async (req, res) => {
    try {
        const message = cleanText(req.body.message, 1800);
        const pageContext = cleanText(req.body.pageContext, 1800);
        const history = Array.isArray(req.body.history) ? req.body.history.slice(-6) : [];

        if (!message || message.length < 2) {
            return res.status(400).json({ message: 'اكتب سؤالاً واضحاً للمساعد' });
        }

        const sanitizedHistory = history
            .map((item) => ({
                role: item?.role === 'assistant' ? 'assistant' : 'user',
                text: cleanText(item?.text, 500),
            }))
            .filter((item) => item.text)
            .map((item, index) => `${index + 1}. ${item.role === 'assistant' ? 'المساعد' : 'المستخدم'}: ${item.text}`)
            .join('\n');

        const systemPrompt = buildPublicAssistantSystemPrompt({ pageContext });
        const userPrompt = `
المحادثة السابقة:
${sanitizedHistory || 'لا توجد.'}

سؤال المستخدم الآن:
${message}
`.trim();

        let aiResult;
        try {
            aiResult = await callConfiguredAiProvider({
                systemPrompt,
                userPrompt,
                maxOutputTokens: Number(process.env.PUBLIC_AI_MAX_TOKENS) || 900,
            });
        } catch (error) {
            if (error.code === 'AI_NOT_CONFIGURED') {
                return res.status(503).json({
                    code: 'AI_NOT_CONFIGURED',
                    message: 'المساعد المتقدم غير مفعّل بعد. اضبط AI_PROVIDER=gemini وأضف GEMINI_API_KEY في إعدادات الخادم.',
                });
            }
            if (error.code === 'AI_PROVIDER_NOT_SUPPORTED') {
                return res.status(503).json({
                    code: 'AI_PROVIDER_NOT_SUPPORTED',
                    message: 'مزود الذكاء الاصطناعي غير مدعوم. استخدم AI_PROVIDER=gemini أو AI_PROVIDER=openai.',
                });
            }
            console.error('Public AI provider error:', {
                status: error.status,
                provider: error.provider,
                type: error.providerType,
                model: error.model,
                providersTried: error.providersTried,
                message: error.message,
            });
            return res.status(502).json({
                code: 'AI_PROVIDER_ERROR',
                message: 'المساعد المتقدم متصل بالخادم، لكن مزود الذكاء الاصطناعي رفض الطلب. تحقق من GEMINI_API_KEY أو OPENAI_API_KEY أو الحصة أو اسم النموذج.',
            });
        }

        const assistantMessage = cleanText(aiResult.text, 2400)
            || 'أحتاج أن تعيد صياغة السؤال حتى أساعدك بشكل أفضل.';

        return res.json({
            message: assistantMessage,
            status: 'answered',
            model: aiResult.model,
            provider: aiResult.provider,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
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
            aiResult = await callConfiguredAiProvider({ systemPrompt, userPrompt });
        } catch (error) {
            if (error.code === 'AI_NOT_CONFIGURED') {
                return res.status(503).json({
                    code: 'AI_NOT_CONFIGURED',
                    message: 'مساعد عبقورا الذكي غير مفعّل بعد. اضبط AI_PROVIDER=gemini وأضف GEMINI_API_KEY في إعدادات الخادم.',
                });
            }
            if (error.code === 'AI_PROVIDER_NOT_SUPPORTED') {
                return res.status(503).json({
                    code: 'AI_PROVIDER_NOT_SUPPORTED',
                    message: 'مزود الذكاء الاصطناعي غير مدعوم. استخدم AI_PROVIDER=gemini أو AI_PROVIDER=openai.',
                });
            }
            await AiTutorExchange.create({
                student: req.user._id,
                course: course._id,
                lesson: lesson._id,
                lessonState,
                userMessage: message,
                assistantMessage: '',
                model: getConfiguredModelLabel(),
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
            model: aiResult.provider ? `${aiResult.provider}:${aiResult.model}` : aiResult.model,
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

module.exports = { chatWithTutor, getTutorHistory, chatWithPublicAssistant };
