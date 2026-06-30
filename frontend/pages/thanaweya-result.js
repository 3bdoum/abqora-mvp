import { useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

const officialResultUrl = 'https://g12.emis.gov.eg/';
const ministryUrl = 'https://moe.gov.eg/';
const tansikUrl = 'https://tansik.digital.gov.eg/application/';
const scientificCutoffs2025Url = 'https://tansik.digital.gov.eg/application/Certificates/Thanwy/Limits/LimitE2025.htm';
const literaryCutoffs2025Url = 'https://tansik.digital.gov.eg/application/Certificates/Thanwy/Limits/LimitA2025.htm';
const scientificCutoffs2024Url = 'https://tansik.digital.gov.eg/application/Certificates/Thanwy/Limits/LimitE2024.htm';
const literaryCutoffs2024Url = 'https://tansik.digital.gov.eg/application/Certificates/Thanwy/Limits/LimitA2024.htm';
const supportEmail = 'support@abqora.com';

const degreeSystems = [
    {
        id: 'new',
        label: 'النظام الجديد',
        total: 320,
        badge: '2025 / 2026',
        note: 'الاختيار الافتراضي لأن امتحانات 2025 / 2026 تشمل نظامًا جديدًا.',
    },
    {
        id: 'old',
        label: 'النظام القديم',
        total: 410,
        badge: 'للطلاب القدامى',
        note: 'متاح فقط للطلاب الذين يطبق عليهم النظام القديم.',
    },
];

const featuredVideo = {
    title: 'تطوير المهارات بالعربي',
    description: 'فيديو عربي مناسب لطلاب الثانوية: يساعد الطالب يفكر في بناء نفسه بعد النتيجة بدل التوقف عند رقم واحد.',
    duration: 'فيديو مهارات',
    youtubeId: '5MTAMo0k67k',
    sourceLabel: 'ياسر الحزيمي · YouTube',
    mood: 'مهارات',
    icon: '🧠',
};

const mainServices = [
    {
        icon: '🔗',
        title: 'الرابط الرسمي',
        description: 'اذهب مباشرة إلى موقع النتيجة بدون إدخال بيانات داخل عبقورا.',
        href: officialResultUrl,
        external: true,
        action: 'فتح النتيجة',
    },
    {
        icon: '🧮',
        title: 'حاسبة النسبة',
        description: 'اختر النظام الجديد أو القديم واحسب النسبة داخل جهازك فقط.',
        href: '#result-calculator',
        action: 'احسب الآن',
    },
    {
        icon: '📊',
        title: 'تحليل الكليات',
        description: 'قارن نتيجتك بآخر عامين من بيانات التنسيق الرسمية.',
        href: '#result-analysis',
        action: 'شاهد التحليل',
    },
    {
        icon: '💬',
        title: 'الدعم والمساعد',
        description: 'اسأل عن الرابط، الحاسبة، أو قراءة التحليل بخطوات قصيرة.',
        href: '#result-support',
        action: 'احصل على مساعدة',
    },
];

const admissionTracks = [
    {
        id: 'science',
        label: 'علمي علوم',
        helper: 'مناسب للطب، الأسنان، الصيدلة، العلاج الطبيعي، والعلوم الصحية.',
        source2024: scientificCutoffs2024Url,
        source2025: scientificCutoffs2025Url,
        colleges: [
            { name: 'طب', y2024: 93.17, y2025: 93.12, action: 'احتفظ ببدائل طبية قريبة مثل علاج طبيعي وصيدلة.' },
            { name: 'أسنان', y2024: 92.8, y2025: 92.66, action: 'قارن المحافظات ولا تعتمد على كلية واحدة فقط.' },
            { name: 'علاج طبيعي', y2024: 92.2, y2025: 92.03, action: 'بديل قوي لمن يريد مسارًا صحيًا تطبيقيًا.' },
            { name: 'صيدلة', y2024: 91.71, y2025: 91.88, action: 'اسأل عن فرص التدريب وسوق العمل قبل ترتيب الرغبات.' },
            { name: 'تمريض', y2024: 84.27, y2025: 85.31, action: 'اختيار عملي مع طلب واضح في سوق الرعاية الصحية.' },
        ],
    },
    {
        id: 'math',
        label: 'علمي رياضة',
        helper: 'مناسب للهندسة، الحاسبات، الذكاء الاصطناعي، والفنون التطبيقية.',
        source2024: scientificCutoffs2024Url,
        source2025: scientificCutoffs2025Url,
        colleges: [
            { name: 'هندسة', y2024: 88.66, y2025: 89.84, action: 'قارن بين هندسة وحاسبات حسب ميولك وليس الاسم فقط.' },
            { name: 'حاسبات ومعلومات', y2024: 83.41, y2025: 84.22, action: 'ابدأ فورًا ببرمجة ومشروعات صغيرة حتى قبل التنسيق.' },
            { name: 'ذكاء اصطناعي', y2024: 84.15, y2025: 85.0, action: 'جهّز أساسيات Python والرياضيات العملية.' },
            { name: 'فنون تطبيقية', y2024: 76.1, y2025: 70.47, action: 'اختيار جيد لمن يجمع بين التصميم والتقنية.' },
            { name: 'تمريض/بدائل علمية', y2024: 84.27, y2025: 85.31, action: 'لو المجموع قريب من العلوم الصحية، قارنها بالمسارات التقنية.' },
        ],
    },
    {
        id: 'literature',
        label: 'أدبي',
        helper: 'مناسب للاقتصاد والعلوم السياسية، الألسن، الإعلام، الآثار، والتجارة.',
        source2024: literaryCutoffs2024Url,
        source2025: literaryCutoffs2025Url,
        colleges: [
            { name: 'اقتصاد وعلوم سياسية', y2024: 85.24, y2025: 89.84, action: 'قوّي اللغة الإنجليزية والتحليل السياسي والاقتصادي.' },
            { name: 'ألسن', y2024: 84.27, y2025: 87.66, action: 'ابدأ لغة ثانية مبكرًا، فاللغة مهارة سوق حقيقية.' },
            { name: 'إعلام', y2024: 83.17, y2025: 86.72, action: 'ابنِ ملف أعمال صغير: كتابة، مونتاج، أو تقديم.' },
            { name: 'آثار', y2024: 78.05, y2025: 82.34, action: 'اختيار مناسب لمن يحب التاريخ والبحث والعمل الميداني.' },
            { name: 'تجارة', y2024: 68.66, y2025: 72.19, action: 'اجعل المهارات الرقمية واللغة جزءًا من الخطة.' },
        ],
    },
];

const formatPercent = (value) => `${value.toFixed(1)}%`;

const getPredictedCutoff = (college) => {
    const trend = college.y2025 - college.y2024;
    return Math.max(50, Math.min(99, college.y2025 + trend * 0.35));
};

const getMatchStatus = (percentage, predictedCutoff) => {
    if (!percentage) {
        return {
            key: 'waiting',
            label: 'أدخل المجموع',
            message: 'سنقارن نتيجتك بالسنوات السابقة.',
        };
    }

    const gap = Number(percentage) - predictedCutoff;
    if (gap >= 1.5) {
        return {
            key: 'safe',
            label: 'فرصة قوية',
            message: 'ضعها ضمن أولوياتك مع بدائل قريبة.',
        };
    }
    if (gap >= 0) {
        return {
            key: 'near',
            label: 'قريبة',
            message: 'راقب التنسيق الرسمي وجهّز بدائل واقعية.',
        };
    }
    if (gap >= -2) {
        return {
            key: 'stretch',
            label: 'اختيار طموح',
            message: 'ممكنة فقط إذا انخفض الحد الأدنى أو اختلف التوزيع.',
        };
    }
    return {
        key: 'plan',
        label: 'خطة بديلة',
        message: 'ابحث عن بدائل قريبة وابدأ مهارة داعمة.',
    };
};

export default function ThanaweyaResultPage() {
    const [degreeSystemId, setDegreeSystemId] = useState('new');
    const [score, setScore] = useState('');
    const [total, setTotal] = useState('320');
    const [activeTrackId, setActiveTrackId] = useState('science');
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    const [assistantTopic, setAssistantTopic] = useState('start');

    const selectedSystem = degreeSystems.find((system) => system.id === degreeSystemId) || degreeSystems[0];
    const selectedTrack = admissionTracks.find((track) => track.id === activeTrackId) || admissionTracks[0];

    const percentage = useMemo(() => {
        const numericScore = Number(score);
        const numericTotal = Number(total);
        if (!numericScore || !numericTotal || numericScore < 0 || numericTotal <= 0 || numericScore > numericTotal) {
            return null;
        }
        return Number(((numericScore / numericTotal) * 100).toFixed(2));
    }, [score, total]);

    const estimate = useMemo(() => {
        if (!percentage) {
            return {
                tone: 'muted',
                label: 'أدخل المجموع',
                tip: 'اختر النظام الصحيح أولًا، ثم اكتب مجموع الطالب فقط.',
            };
        }

        if (percentage >= 90) {
            return {
                tone: 'excellent',
                label: 'نطاق مرتفع',
                tip: 'ابدأ بالمقارنة بين كليات القمة والبدائل القريبة حسب الشعبة.',
            };
        }
        if (percentage >= 80) {
            return {
                tone: 'strong',
                label: 'نطاق قوي',
                tip: 'لديك فرص جيدة. اجعل الاختيار مبنيًا على الميول وسوق العمل.',
            };
        }
        if (percentage >= 70) {
            return {
                tone: 'good',
                label: 'نطاق متوسط',
                tip: 'رتّب بدائل واقعية، وابدأ مهارة عملية بجانب الدراسة.',
            };
        }
        return {
            tone: 'support',
            label: 'تحتاج خطة',
            tip: 'النتيجة ليست نهاية الطريق. ركّز على بدائل مناسبة ومهارة قوية.',
        };
    }, [percentage]);

    const analysisRows = useMemo(() => selectedTrack.colleges.map((college) => {
        const predicted = getPredictedCutoff(college);
        const status = getMatchStatus(percentage, predicted);
        const gap = percentage ? Number((percentage - predicted).toFixed(1)) : null;
        return {
            ...college,
            predicted,
            status,
            gap,
        };
    }), [percentage, selectedTrack]);

    const opportunityStats = useMemo(() => {
        const nearCount = analysisRows.filter((row) => ['safe', 'near'].includes(row.status.key)).length;
        const stretchCount = analysisRows.filter((row) => row.status.key === 'stretch').length;
        const visibleRows = analysisRows.length || 1;
        const scoreFromMatches = Math.round(((nearCount * 1) + (stretchCount * 0.55)) / visibleRows * 100);
        const readinessScore = percentage
            ? Math.max(18, Math.min(96, scoreFromMatches))
            : 64;
        const averagePredicted = Math.round(
            analysisRows.reduce((totalValue, row) => totalValue + row.predicted, 0) / visibleRows
        );

        return {
            readinessScore,
            nearCount,
            stretchCount,
            averagePredicted,
            previewRows: analysisRows.slice(0, 3),
        };
    }, [analysisRows, percentage]);

    const primarySuggestion = useMemo(() => {
        if (!percentage) {
            return 'أدخل المجموع واختر الشعبة لنقترح أقرب المسارات.';
        }

        const strongMatch = analysisRows.find((row) => row.status.key === 'safe' || row.status.key === 'near');
        if (strongMatch) {
            return `${strongMatch.name}: ${strongMatch.status.message}`;
        }

        const stretchMatch = analysisRows.find((row) => row.status.key === 'stretch');
        if (stretchMatch) {
            return `${stretchMatch.name}: اختيار طموح، لكن جهّز بدائل قوية.`;
        }

        return 'الأفضل الآن: وسّع دائرة البدائل، وابدأ مهارة عملية ترفع فرصك.';
    }, [analysisRows, percentage]);

    const assistantReplies = useMemo(() => ({
        start: {
            icon: '🤖',
            title: 'مساعد عبقورا',
            message: 'أستطيع إرشادك بسرعة: افتح الرابط الرسمي، احسب النسبة، أو افهم تحليل الكليات بدون تخزين بياناتك.',
            chips: [
                { key: 'calculator', label: 'كيف أحسب النسبة؟' },
                { key: 'analysis', label: 'كيف أقرأ التحليل؟' },
                { key: 'support', label: 'أحتاج تواصل' },
            ],
        },
        calculator: {
            icon: '🧮',
            title: 'الحاسبة',
            message: percentage
                ? `نسبتك الحالية ${percentage}%. اختر الشعبة من بطاقة التوقع لقراءة أقرب المسارات.`
                : `اختر ${selectedSystem.label} ثم اكتب مجموع الطالب من ${selectedSystem.total} درجة. الحساب يتم داخل الصفحة فقط.`,
            chips: [
                { key: 'analysis', label: 'انتقل للتحليل' },
                { key: 'support', label: 'أريد مساعدة' },
            ],
        },
        analysis: {
            icon: '📊',
            title: 'تحليل الكليات',
            message: `أنت تشاهد شعبة ${selectedTrack.label}. المؤشر يقارن نتيجتك ببيانات 2024 و2025 الرسمية ويعطي قراءة إرشادية، وليس قبولًا نهائيًا.`,
            chips: [
                { key: 'calculator', label: 'أعدل المجموع' },
                { key: 'support', label: 'تواصل مع الدعم' },
            ],
        },
        support: {
            icon: '💬',
            title: 'التواصل والدعم',
            message: 'لو تحتاج مساعدة بشرية، أرسل لنا وصفًا قصيرًا للمشكلة: الرابط، الحاسبة، أو تحليل الكلية المطلوبة.',
            chips: [
                { key: 'start', label: 'رجوع للبداية' },
                { key: 'calculator', label: 'الحاسبة' },
            ],
        },
    }), [percentage, selectedSystem, selectedTrack]);

    const activeAssistantReply = assistantReplies[assistantTopic] || assistantReplies.start;
    const supportMailHref = `mailto:${supportEmail}?subject=${encodeURIComponent('طلب دعم من صفحة الثانوية العامة')}&body=${encodeURIComponent('مرحبًا عبقورا، أحتاج مساعدة في:')}`;

    const openAssistant = (topic = 'start') => {
        setAssistantTopic(topic);
        setIsAssistantOpen(true);
    };

    const handleSystemChange = (systemId) => {
        const nextSystem = degreeSystems.find((system) => system.id === systemId) || degreeSystems[0];
        setDegreeSystemId(nextSystem.id);
        setTotal(String(nextSystem.total));
    };

    return (
        <>
            <Head>
                <title>نتيجة الثانوية العامة 2026 | حاسبة وتوقعات تنسيق إرشادية | عبقورا</title>
                <meta
                    name="description"
                    content="صفحة مبسطة للوصول إلى نتيجة الثانوية العامة 2026 من الرابط الرسمي، مع حاسبة للنظام الجديد والقديم وتحليل إرشادي ومساعد دعم سريع."
                />
                <meta name="robots" content="index,follow" />
                <meta property="og:title" content="نتيجة الثانوية العامة 2026 وتحليل التنسيق" />
                <meta
                    property="og:description"
                    content="حاسبة آمنة وتحليل إرشادي جذاب يساعد الطالب يختار خطواته بعد النتيجة."
                />
                <meta property="og:type" content="website" />
            </Head>

            <main className="page shell rtl public-result-page result-dynamic-page">
                <nav className="result-floating-header result-floating-header-simple" aria-label="تنقل سريع داخل صفحة النتيجة">
                    <Link href="/" className="result-floating-brand">عبقورا</Link>
                    <div className="result-floating-links">
                        <a href={officialResultUrl} target="_blank" rel="noopener noreferrer">الرابط الرسمي</a>
                        <a href="#result-calculator">الحاسبة</a>
                        <a href="#result-analysis">تحليل الكليات</a>
                        <a href="#result-support">الدعم</a>
                    </div>
                    <a href={officialResultUrl} target="_blank" rel="noopener noreferrer" className="small-button">
                        ابدأ الآن
                    </a>
                </nav>

                <section className="result-dynamic-hero result-simple-hero" id="result-top">
                    <div className="result-hero-orb one" aria-hidden="true" />
                    <div className="result-hero-orb two" aria-hidden="true" />
                    <div className="result-floating-shape shape-one" aria-hidden="true">320</div>
                    <div className="result-floating-shape shape-two" aria-hidden="true">%</div>
                    <div className="result-floating-shape shape-three" aria-hidden="true">توقع</div>

                    <div className="result-hero-copy">
                        <span className="eyebrow">خدمة نتيجة الثانوية العامة</span>
                        <h1>الرابط، النسبة، وتوقع الكلية في مكان واحد</h1>
                        <p>
                            صفحة مركّزة للطالب: افتح النتيجة من المصدر الرسمي، احسب النسبة بالنظام الصحيح، ثم افهم أقرب مسارات الكليات من بيانات التنسيق.
                        </p>

                        <div className="hero-actions result-simple-actions">
                            <a href={officialResultUrl} target="_blank" rel="noopener noreferrer" className="button">
                                افتح الرابط الرسمي
                            </a>
                            <a href="#result-calculator" className="small-button">
                                احسب وتوقع الآن
                            </a>
                        </div>

                        <p className="result-source-note">
                            لا نطلب رقم الجلوس ولا نخزن بياناتك. الحساب يتم داخل الصفحة.
                        </p>
                    </div>

                    <aside className="result-live-card result-analysis-card result-stat-card" aria-live="polite">
                        <div className="result-motion-stage result-stat-stage" aria-label="رسم متحرك لمؤشر الفرص">
                            <div
                                className="result-success-meter"
                                style={{ '--meter-angle': `${opportunityStats.readinessScore * 3.6}deg` }}
                            >
                                <span>مؤشر الفرص</span>
                                <strong>{opportunityStats.readinessScore}%</strong>
                                <small>{percentage ? 'حسب مدخلاتك' : 'مثال تفاعلي'}</small>
                            </div>

                            <div className="result-stat-rings" aria-hidden="true">
                                <span />
                                <span />
                                <span />
                            </div>

                            <div className="result-stat-bars-mini">
                                {opportunityStats.previewRows.map((college) => (
                                    <div key={college.name}>
                                        <span>{college.name}</span>
                                        <b style={{ width: `${Math.min(100, college.predicted)}%` }} />
                                        <em>{formatPercent(college.predicted)}</em>
                                    </div>
                                ))}
                            </div>

                            <div className="motion-floating-badge badge-official">بيانات رسمية</div>
                            <div className="motion-floating-badge badge-private">مؤشر إرشادي</div>
                        </div>

                        <span className={`result-score-badge tone-${estimate.tone}`}>{estimate.label}</span>
                        <div>
                            <strong>إحصائية سريعة</strong>
                            <p>
                                {percentage
                                    ? `${opportunityStats.nearCount} مسارات قريبة و${opportunityStats.stretchCount} اختيارات طموحة.`
                                    : `متوسط الحدود المعروضة الآن حوالي ${opportunityStats.averagePredicted}%. اكتب مجموعك ليتغير المؤشر.`}
                            </p>
                        </div>
                        <div>
                            <strong>اقتراح مبدئي</strong>
                            <p>{primarySuggestion}</p>
                        </div>
                        <a href="#result-analysis" className="button">
                            شاهد التحليل
                        </a>
                    </aside>

                    <a href="#result-calculator" className="result-scroll-cue" aria-label="انتقل إلى الحاسبة">
                        <span>ابدأ هنا</span>
                        <b aria-hidden="true">↓</b>
                    </a>
                </section>

                <section className="result-main-services" aria-label="الخدمات الأساسية">
                    {mainServices.map((service) => (
                        <a
                            key={service.title}
                            href={service.href}
                            target={service.external ? '_blank' : undefined}
                            rel={service.external ? 'noopener noreferrer' : undefined}
                            className="result-service-card"
                        >
                            <span className="result-service-icon" aria-hidden="true">{service.icon}</span>
                            <strong>{service.title}</strong>
                            <p>{service.description}</p>
                            <small>{service.action}</small>
                        </a>
                    ))}
                </section>

                <section className="result-workspace result-core-workspace">
                    <article className="card result-calculator-card dynamic result-calculator-spotlight" id="result-calculator">
                        <div className="result-card-heading">
                            <div>
                                <span className="eyebrow">حاسبة مباشرة</span>
                                <h2>احسب النسبة بالنظام الصحيح</h2>
                            </div>
                            <span className={`result-score-badge tone-${estimate.tone}`}>
                                {percentage ? `${percentage}%` : estimate.label}
                            </span>
                        </div>

                        <div className="result-calculator-motion" aria-hidden="true">
                            <div className="result-calc-screen">
                                <span>المجموع</span>
                                <strong>{score || '—'}</strong>
                            </div>
                            <div className="result-calc-keys">
                                <span>320</span>
                                <span>%</span>
                                <span>{percentage ? `${percentage}%` : 'ابدأ'}</span>
                            </div>
                            <small>الحساب محلي · بدون تخزين</small>
                        </div>

                        <div className="result-system-toggle" role="tablist" aria-label="اختر نظام الثانوية العامة">
                            {degreeSystems.map((system) => (
                                <button
                                    key={system.id}
                                    type="button"
                                    className={degreeSystemId === system.id ? 'active' : ''}
                                    onClick={() => handleSystemChange(system.id)}
                                >
                                    <strong>{system.label}</strong>
                                    <span>{system.total} درجة · {system.badge}</span>
                                </button>
                            ))}
                        </div>

                        <p className="result-source-note">{selectedSystem.note}</p>

                        <div className="result-input-grid">
                            <label htmlFor="score">
                                <span>مجموع الطالب</span>
                                <input
                                    id="score"
                                    inputMode="decimal"
                                    value={score}
                                    onChange={(event) => setScore(event.target.value)}
                                    placeholder={degreeSystemId === 'new' ? '285' : '365'}
                                />
                            </label>

                            <label htmlFor="total">
                                <span>المجموع الكلي</span>
                                <input
                                    id="total"
                                    inputMode="decimal"
                                    value={total}
                                    onChange={(event) => setTotal(event.target.value)}
                                    placeholder={String(selectedSystem.total)}
                                />
                            </label>
                        </div>

                        <div className={`result-percentage-box dynamic tone-${estimate.tone}`}>
                            <span>النسبة التقريبية</span>
                            <strong>{percentage ? `${percentage}%` : '—'}</strong>
                            <p>{estimate.tip}</p>
                        </div>
                    </article>

                    <article className="card result-prediction-summary">
                        <div className="result-card-heading">
                            <div>
                                <span className="eyebrow">توقع إرشادي</span>
                                <h2>ما أقرب مسار لك؟</h2>
                            </div>
                            <span className="result-progress-pill">آخر عامين</span>
                        </div>

                        <div className="result-track-tabs" role="tablist" aria-label="اختر الشعبة">
                            {admissionTracks.map((track) => (
                                <button
                                    key={track.id}
                                    type="button"
                                    className={track.id === activeTrackId ? 'active' : ''}
                                    onClick={() => setActiveTrackId(track.id)}
                                >
                                    {track.label}
                                </button>
                            ))}
                        </div>

                        <p>{selectedTrack.helper}</p>

                        <div className="result-prediction-highlight">
                            <span>أفضل قراءة الآن</span>
                            <strong>{primarySuggestion}</strong>
                        </div>

                        <a href="#result-analysis" className="small-button">افتح الرسوم والتحليل</a>
                    </article>
                </section>

                <section className="result-analysis-section" id="result-analysis" aria-labelledby="result-analysis-title">
                    <div className="result-video-heading">
                        <div>
                            <span className="eyebrow">Data analysis</span>
                            <h2 id="result-analysis-title">تحليل آخر عامين وتوقع مبدئي</h2>
                        </div>
                        <p>
                            الرسم يقارن 2024 و2025 من صفحات الحدود الدنيا الرسمية، بعد تحويل الدرجات إلى نسب مئوية لأن 2025 يستخدم نظام 320 درجة.
                        </p>
                    </div>

                    <div className="result-source-links" aria-label="مصادر بيانات التنسيق">
                        <a href={selectedTrack.source2025} target="_blank" rel="noopener noreferrer">مصدر 2025 الرسمي</a>
                        <a href={selectedTrack.source2024} target="_blank" rel="noopener noreferrer">مصدر 2024 الرسمي</a>
                        <a href={tansikUrl} target="_blank" rel="noopener noreferrer">بوابة التنسيق</a>
                    </div>

                    <div className="result-analysis-grid">
                        {analysisRows.map((college) => {
                            const maxBar = Math.max(college.y2024, college.y2025, college.predicted, percentage || 0, 100);
                            return (
                                <article className={`result-college-card status-${college.status.key}`} key={college.name}>
                                    <div className="result-college-header">
                                        <div>
                                            <strong>{college.name}</strong>
                                            <span>{college.status.message}</span>
                                        </div>
                                        <small>{college.status.label}</small>
                                    </div>

                                    <div className="result-bars" aria-label={`تحليل ${college.name}`}>
                                        <div>
                                            <span>2024</span>
                                            <b style={{ width: `${(college.y2024 / maxBar) * 100}%` }} />
                                            <em>{formatPercent(college.y2024)}</em>
                                        </div>
                                        <div>
                                            <span>2025</span>
                                            <b style={{ width: `${(college.y2025 / maxBar) * 100}%` }} />
                                            <em>{formatPercent(college.y2025)}</em>
                                        </div>
                                        <div className="predicted">
                                            <span>توقع</span>
                                            <b style={{ width: `${(college.predicted / maxBar) * 100}%` }} />
                                            <em>{formatPercent(college.predicted)}</em>
                                        </div>
                                        {percentage ? (
                                            <div className="student">
                                                <span>أنت</span>
                                                <b style={{ width: `${(percentage / maxBar) * 100}%` }} />
                                                <em>{formatPercent(percentage)}</em>
                                            </div>
                                        ) : null}
                                    </div>

                                    <div className="result-gap-row">
                                        <span>{college.gap === null ? '—' : `${college.gap > 0 ? '+' : ''}${college.gap}%`}</span>
                                        <p>{college.action}</p>
                                    </div>
                                </article>
                            );
                        })}
                    </div>

                    <p className="result-analysis-disclaimer">
                        تنبيه دقة: هذه قراءة إرشادية مبنية على الحدود الدنيا المنشورة في موقع التنسيق. التوقع ليس قبولًا رسميًا، ويجب مراجعة مكتب التنسيق عند إعلان الحدود الدنيا النهائية.
                    </p>
                </section>

                <section className="result-support-section" id="result-support" aria-labelledby="result-support-title">
                    <div className="result-support-copy">
                        <span className="eyebrow">تواصل ودعم</span>
                        <h2 id="result-support-title">مساعدة سريعة بدون تعقيد</h2>
                        <p>
                            لو الطالب أو ولي الأمر محتاج يعرف يبدأ منين، استخدم المساعد العائم أو أرسل رسالة قصيرة للدعم.
                        </p>
                    </div>

                    <div className="result-support-grid">
                        <button type="button" onClick={() => openAssistant('calculator')}>
                            <span>🧮</span>
                            <strong>مساعدة في الحاسبة</strong>
                            <small>اختيار النظام وحساب النسبة</small>
                        </button>
                        <button type="button" onClick={() => openAssistant('analysis')}>
                            <span>📊</span>
                            <strong>فهم تحليل الكليات</strong>
                            <small>قراءة الرسم والمقارنة</small>
                        </button>
                        <a href={supportMailHref}>
                            <span>📩</span>
                            <strong>راسل الدعم</strong>
                            <small>{supportEmail}</small>
                        </a>
                    </div>
                </section>

                <section className="result-video-section result-featured-video" id="result-video" aria-labelledby="result-video-title">
                    <div className="result-video-heading">
                        <div>
                            <span className="eyebrow">فيديو واحد فقط</span>
                            <h2 id="result-video-title">فكرة تساعدك بعد النتيجة</h2>
                        </div>
                        <p>اخترنا فيديو عربي واحد لأنه الأقرب لهذه الشريحة: ماذا أفعل بنفسي بعد ظهور النتيجة؟</p>
                    </div>

                    <article className="result-video-card result-video-card-featured">
                        <div className="result-video-frame">
                            <iframe
                                src={`https://www.youtube-nocookie.com/embed/${featuredVideo.youtubeId}`}
                                title={featuredVideo.title}
                                loading="lazy"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                            />
                            <span className="result-video-mood">{featuredVideo.icon} {featuredVideo.mood}</span>
                            <span className="result-video-duration">{featuredVideo.duration}</span>
                        </div>
                        <div className="result-video-copy">
                            <span>{featuredVideo.sourceLabel}</span>
                            <h3>{featuredVideo.title}</h3>
                            <p>{featuredVideo.description}</p>
                        </div>
                    </article>
                </section>

                <section className="result-action-strip">
                    <div>
                        <span className="eyebrow">مصادر مهمة</span>
                        <h2>النتيجة والتنسيق من المواقع الرسمية فقط</h2>
                        <p>
                            عبقورا يساعدك بالحساب والتحليل، لكنه لا يعرض النتيجة ولا يقرر القبول. استخدم مواقع الوزارة والتنسيق للتحقق النهائي.
                        </p>
                    </div>
                    <div className="result-action-buttons">
                        <a href={officialResultUrl} target="_blank" rel="noopener noreferrer" className="button">
                            رابط النتيجة الرسمي
                        </a>
                        <a href={tansikUrl} target="_blank" rel="noopener noreferrer" className="small-button">
                            موقع التنسيق
                        </a>
                    </div>
                </section>

                <section className="result-growth-card" id="result-plan">
                    <div>
                        <span className="eyebrow">الخطوة التالية</span>
                        <h2>لا تجعل الاختيار قائمًا على المجموع فقط</h2>
                        <p>
                            رتّب الرغبات حسب الميول، فرص العمل، المحافظة، والمهارة التي تستطيع تطويرها خلال أول سنة جامعة.
                        </p>
                    </div>
                    <div className="result-action-buttons">
                        <Link href="/" className="button">تعرف على عبقورا</Link>
                        <a href={ministryUrl} target="_blank" rel="noopener noreferrer" className="small-button">وزارة التربية والتعليم</a>
                    </div>
                </section>

                <button
                    type="button"
                    className="result-assistant-launcher"
                    onClick={() => openAssistant('start')}
                    aria-expanded={isAssistantOpen}
                    aria-controls="result-ai-assistant"
                >
                    <span aria-hidden="true">🤖</span>
                    مساعد عبقورا
                </button>

                {isAssistantOpen ? (
                    <aside className="result-ai-assistant open" id="result-ai-assistant">
                        <div className="result-ai-header">
                            <span aria-hidden="true">{activeAssistantReply.icon}</span>
                            <div>
                                <strong>{activeAssistantReply.title}</strong>
                                <small>مساعد إرشادي لخدمات الصفحة</small>
                            </div>
                            <button type="button" onClick={() => setIsAssistantOpen(false)} aria-label="إغلاق المساعد">×</button>
                        </div>

                        <div className="result-ai-body">
                            <p>{activeAssistantReply.message}</p>
                            <div className="result-ai-chips">
                                {activeAssistantReply.chips.map((chip) => (
                                    <button key={chip.key} type="button" onClick={() => setAssistantTopic(chip.key)}>
                                        {chip.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="result-ai-actions">
                            <a href="#result-calculator" onClick={() => setAssistantTopic('calculator')}>الحاسبة</a>
                            <a href="#result-analysis" onClick={() => setAssistantTopic('analysis')}>التحليل</a>
                            <a href={supportMailHref}>رسالة للدعم</a>
                        </div>
                    </aside>
                ) : null}
            </main>
        </>
    );
}
