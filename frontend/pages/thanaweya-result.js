import { useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { withBasePath } from '../utils/paths';

const officialResultUrl = 'https://g12.emis.gov.eg/';
const ministryUrl = 'https://moe.gov.eg/';

const journeyModes = [
    {
        id: 'official',
        icon: '🔗',
        label: 'أريد الرابط',
        title: 'افتح النتيجة من المصدر الرسمي فقط',
        description: 'اضغط على الرابط الرسمي، ثم أدخل رقم الجلوس داخل موقع الوزارة فقط. عبقورا لا يطلب رقم الجلوس ولا يخزنه.',
        actionLabel: 'فتح موقع النتيجة الرسمي',
        actionHref: officialResultUrl,
        checklist: ['تأكد أن الرابط ينتهي بـ emis.gov.eg', 'لا تدخل رقم الجلوس في صفحات مجهولة', 'راجع الاسم قبل مشاركة أي صورة'],
    },
    {
        id: 'safe',
        icon: '🛡️',
        label: 'أريد الأمان',
        title: 'احمِ بيانات الطالب وقت الزحمة',
        description: 'وقت ظهور النتيجة تنتشر روابط كثيرة. القاعدة الذهبية: رقم الجلوس لا يُكتب إلا في الموقع الرسمي.',
        actionLabel: 'فتح موقع الوزارة',
        actionHref: ministryUrl,
        checklist: ['لا ترسل رقم الجلوس في التعليقات', 'لا تنشر صورة النتيجة كاملة', 'لا تثق بصفحات تطلب بيانات إضافية'],
    },
    {
        id: 'calculator',
        icon: '🧮',
        label: 'أحسب النسبة',
        title: 'احسب النسبة بسرعة وبدون حفظ بيانات',
        description: 'اكتب المجموع والمجموع الكلي فقط. الحاسبة تعمل داخل الصفحة ولا ترسل أي بيانات للخادم.',
        actionLabel: 'اذهب للحاسبة',
        actionHref: '#result-calculator',
        checklist: ['اكتب المجموع بعد التأكد منه', 'استخدم 410 كمجموع كلي إذا كان مناسبًا لنظامك', 'اعتبر النسبة تقديرية للمساعدة فقط'],
    },
    {
        id: 'next',
        icon: '🎯',
        label: 'ماذا بعد؟',
        title: 'حوّل القلق إلى خطة صغيرة',
        description: 'بعد ظهور النتيجة، لا تبدأ بعشرات الاختيارات. ابدأ بثلاث قوائم: رغبات، بدائل، ومهارات تحتاج تقويتها.',
        actionLabel: 'تعرف على عبقورا',
        actionHref: '/',
        checklist: ['اكتب 5 رغبات أساسية', 'اكتب 5 بدائل واقعية', 'اختر مهارة واحدة تبدأ بها هذا الأسبوع'],
    },
];

const quickStats = [
    ['رسمي', 'روابط وزارة التربية والتعليم'],
    ['آمن', 'لا نطلب رقم الجلوس'],
    ['سريع', 'حاسبة نسبة داخل الصفحة'],
];

const motionCards = [
    ['1', 'افتح الرابط الرسمي', '🔗'],
    ['2', 'تأكد من الأمان', '🛡️'],
    ['3', 'احسب النسبة', '🧮'],
];

const motivationVideos = [
    {
        title: 'قوة الاستمرار بعد أي نتيجة',
        description: 'فكرة TED عن الشغف والمثابرة: النتيجة ليست نهاية القصة، الاستمرار الذكي يصنع الفرق.',
        duration: '6:12',
        youtubeId: 'H14bBuluwB8',
        sourceLabel: 'TED · YouTube',
        mood: 'استمرار',
        icon: '🔥',
    },
    {
        title: 'عقلية النمو: أقدر أتحسن',
        description: 'فيديو مناسب لفكرة أن المهارة تتطور بالتدريب، وأن الخطأ أو النتيجة ليسا حكمًا نهائيًا.',
        duration: '10:21',
        youtubeId: '_X0mgOOSpLU',
        sourceLabel: 'TEDx · YouTube',
        mood: 'نمو',
        icon: '🌱',
    },
    {
        title: 'تطوير المهارات بالعربي',
        description: 'فيديو عربي عن معنى تطوير المهارات ولماذا يحتاج الطالب يبني نفسه بعد النتيجة خطوة بخطوة.',
        duration: 'متغير',
        youtubeId: '5MTAMo0k67k',
        sourceLabel: 'ياسر الحزيمي · YouTube',
        mood: 'مهارات',
        icon: '🧠',
    },
    {
        title: 'تعلّم أي مهارة في 20 ساعة',
        description: 'فيديو إنجليزي عملي عن طريقة البدء في أي مهارة جديدة وتقليل حاجز الخوف من البداية.',
        duration: '19:27',
        youtubeId: '5MgBikgcWnY',
        sourceLabel: 'TEDx · YouTube',
        mood: 'Skill',
        icon: '⚡',
    },
];

const resultGameCards = [
    {
        id: 'official-link',
        icon: '🔗',
        title: 'اختار الرابط الرسمي',
        prompt: 'ابدأ من موقع الوزارة فقط.',
        reward: 'نجمة المصدر الآمن',
        done: 'ممتاز! المصدر الرسمي هو البداية الصح.',
    },
    {
        id: 'privacy',
        icon: '🛡️',
        title: 'احمِ رقم الجلوس',
        prompt: 'لا تكتبه في تعليقات أو صفحات مجهولة.',
        reward: 'نجمة الأمان',
        done: 'رائع! بياناتك الشخصية لازم تفضل خاصة.',
    },
    {
        id: 'calm',
        icon: '🌬️',
        title: 'اهدأ 30 ثانية',
        prompt: 'خذ نفسًا عميقًا قبل فتح النتيجة.',
        reward: 'نجمة الهدوء',
        done: 'جميل! الهدوء يساعدك تقرأ النتيجة بوضوح.',
    },
    {
        id: 'skill',
        icon: '🚀',
        title: 'اختار مهارة تبدأ بها',
        prompt: 'لغة، برمجة، تصميم، أو عادة مذاكرة.',
        reward: 'نجمة المستقبل',
        done: 'قوي! مهارة واحدة صغيرة ممكن تغيّر الطريق.',
    },
];

export default function ThanaweyaResultPage() {
    const [activeMode, setActiveMode] = useState(journeyModes[0].id);
    const [score, setScore] = useState('');
    const [total, setTotal] = useState('410');
    const [checkedItems, setCheckedItems] = useState({});
    const [completedGameCards, setCompletedGameCards] = useState({});

    const selectedMode = journeyModes.find((mode) => mode.id === activeMode) || journeyModes[0];

    const percentage = useMemo(() => {
        const numericScore = Number(score);
        const numericTotal = Number(total);
        if (!numericScore || !numericTotal || numericScore < 0 || numericTotal <= 0 || numericScore > numericTotal) {
            return null;
        }
        return ((numericScore / numericTotal) * 100).toFixed(2);
    }, [score, total]);

    const estimate = useMemo(() => {
        if (!percentage) {
            return {
                tone: 'muted',
                label: 'أدخل المجموع لحساب النسبة',
                tip: 'سنحسبها فورًا داخل جهازك بدون حفظ أي بيانات.',
            };
        }

        const value = Number(percentage);
        if (value >= 90) {
            return {
                tone: 'excellent',
                label: 'ممتاز',
                tip: 'ابدأ مقارنة الكليات المناسبة لهدفك، ولا تنسَ ترتيب البدائل.',
            };
        }
        if (value >= 80) {
            return {
                tone: 'strong',
                label: 'جيد جدًا',
                tip: 'لديك اختيارات قوية. رتّب رغباتك بهدوء حسب الهدف والمكان.',
            };
        }
        if (value >= 70) {
            return {
                tone: 'good',
                label: 'جيد',
                tip: 'ركّز على البدائل الواقعية والمسارات العملية بجانب الكلية.',
            };
        }
        if (value >= 60) {
            return {
                tone: 'fair',
                label: 'مقبول',
                tip: 'ابحث عن مسارات مهارية داعمة لسوق العمل، وابدأ بخطة قصيرة.',
            };
        }
        return {
            tone: 'support',
            label: 'تحتاج خطة بدائل',
            tip: 'النتيجة ليست نهاية الطريق. ابدأ بخطة مهارات واضحة وخطوات صغيرة.',
        };
    }, [percentage]);

    const checklistProgress = selectedMode.checklist.filter((item) => checkedItems[`${selectedMode.id}-${item}`]).length;
    const completedGameCount = resultGameCards.filter((card) => completedGameCards[card.id]).length;
    const gameProgress = Math.round((completedGameCount / resultGameCards.length) * 100);
    const gameMessage = completedGameCount === resultGameCards.length
        ? 'جاهز! عندك خطة آمنة وهادئة لما تفتح النتيجة.'
        : completedGameCount > 0
            ? 'جميل جدًا، كمّل باقي النجوم وخلي التجربة أهدأ.'
            : 'اضغط على البطاقات واجمع النجوم قبل ما تفتح النتيجة.';

    const toggleChecklist = (item) => {
        const key = `${selectedMode.id}-${item}`;
        setCheckedItems((current) => ({ ...current, [key]: !current[key] }));
    };

    const toggleGameCard = (cardId) => {
        setCompletedGameCards((current) => ({ ...current, [cardId]: !current[cardId] }));
    };

    const resetGame = () => {
        setCompletedGameCards({});
    };

    const handleModeAction = (event) => {
        if (selectedMode.actionHref.startsWith('#')) {
            event.preventDefault();
            document.querySelector(selectedMode.actionHref)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const selectedActionHref = selectedMode.actionHref.startsWith('http') || selectedMode.actionHref.startsWith('#')
        ? selectedMode.actionHref
        : withBasePath(selectedMode.actionHref);

    return (
        <>
            <Head>
                <title>نتيجة الثانوية العامة 2026 | رابط رسمي وخطوات آمنة | عبقورا</title>
                <meta
                    name="description"
                    content="صفحة تفاعلية للوصول إلى نتيجة الثانوية العامة 2026 من الرابط الرسمي، مع تنبيهات أمان وحاسبة نسبة بدون تخزين بيانات الطالب."
                />
                <meta name="robots" content="index,follow" />
                <meta property="og:title" content="نتيجة الثانوية العامة 2026 من المصدر الرسمي" />
                <meta
                    property="og:description"
                    content="واجهة بسيطة وجذابة للوصول الآمن إلى نتيجة الثانوية العامة وحساب النسبة التقريبية."
                />
                <meta property="og:type" content="website" />
            </Head>

            <main className="page shell rtl public-result-page result-dynamic-page">
                <nav className="result-floating-header" aria-label="تنقل سريع داخل صفحة النتيجة">
                    <Link href="/" className="result-floating-brand">عبقورا</Link>
                    <div className="result-floating-links">
                        <a href="#result-top">الرئيسية</a>
                        <a href="#result-videos">الفيديوهات</a>
                        <a href="#result-calculator">الحاسبة</a>
                        <a href="#result-plan">ماذا بعد؟</a>
                    </div>
                    <a href={officialResultUrl} target="_blank" rel="noopener noreferrer" className="small-button">
                        الرابط الرسمي
                    </a>
                </nav>

                <section className="result-dynamic-hero" id="result-top">
                    <div className="result-hero-orb one" aria-hidden="true" />
                    <div className="result-hero-orb two" aria-hidden="true" />
                    <div className="result-floating-shape shape-one" aria-hidden="true">410</div>
                    <div className="result-floating-shape shape-two" aria-hidden="true">%</div>
                    <div className="result-floating-shape shape-three" aria-hidden="true">آمن</div>

                    <div className="result-hero-copy">
                        <span className="eyebrow">خدمة عامة من عبقورا</span>
                        <h1>نتيجة الثانوية العامة 2026 بدون توتر</h1>
                        <p>
                            اختر ما تحتاجه الآن: الرابط الرسمي، تنبيه الأمان، حساب النسبة، أو خطة ما بعد النتيجة.
                        </p>

                        <div className="result-mode-switcher" role="tablist" aria-label="اختر ما تحتاجه الآن">
                            {journeyModes.map((mode) => (
                                <button
                                    key={mode.id}
                                    type="button"
                                    className={`result-mode-button ${activeMode === mode.id ? 'active' : ''}`}
                                    onClick={() => setActiveMode(mode.id)}
                                    role="tab"
                                    aria-selected={activeMode === mode.id}
                                >
                                    <span aria-hidden="true">{mode.icon}</span>
                                    {mode.label}
                                </button>
                            ))}
                        </div>

                        <a href="#result-game" className="result-hero-game-cta">
                            <span aria-hidden="true">🎮</span>
                            جرّب لعبة الأربع نجوم
                        </a>
                    </div>

                    <aside className="result-live-card" aria-live="polite">
                        <div className="result-motion-stage" aria-label="عرض متحرك لخطوات الصفحة">
                            <div className="motion-browser">
                                <div className="motion-browser-top">
                                    <span />
                                    <span />
                                    <span />
                                </div>
                                <div className="motion-browser-body">
                                    <div className="motion-scan-line" aria-hidden="true" />
                                    {motionCards.map(([number, label, icon]) => (
                                        <div className="motion-step-row" key={label}>
                                            <b>{number}</b>
                                            <span>{icon}</span>
                                            <small>{label}</small>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="motion-floating-badge badge-official">رسمي</div>
                            <div className="motion-floating-badge badge-private">لا نخزن بياناتك</div>
                        </div>

                        <span className="result-live-icon" aria-hidden="true">{selectedMode.icon}</span>
                        <div>
                            <strong>{selectedMode.title}</strong>
                            <p>{selectedMode.description}</p>
                        </div>
                        <a
                            href={selectedActionHref}
                            target={selectedMode.actionHref.startsWith('http') ? '_blank' : undefined}
                            rel={selectedMode.actionHref.startsWith('http') ? 'noopener noreferrer' : undefined}
                            className="button"
                            onClick={handleModeAction}
                        >
                            {selectedMode.actionLabel}
                        </a>
                    </aside>

                    <a href="#result-videos" className="result-scroll-cue" aria-label="انتقل إلى الفيديوهات">
                        <span>مرّر للأسفل</span>
                        <b aria-hidden="true">↓</b>
                    </a>
                </section>

                <section className="result-video-section" id="result-videos" aria-labelledby="result-videos-title">
                    <div className="result-video-heading">
                        <div>
                            <span className="eyebrow">فيديوهات تحفيز ومهارات</span>
                            <h2 id="result-videos-title">شاهد فكرة تساعدك تبدأ صح</h2>
                        </div>
                        <p>اختر فيديو حسب حالتك: هدوء، عقلية نمو، تطوير مهارات بالعربي، أو طريقة عملية لتعلم أي مهارة.</p>
                    </div>

                    <div className="result-video-grid">
                        {motivationVideos.map((video, index) => (
                            <article className="result-video-card" key={video.title}>
                                <div className="result-video-frame">
                                    {video.youtubeId ? (
                                        <iframe
                                            src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}`}
                                            title={video.title}
                                            loading="lazy"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                            allowFullScreen
                                        />
                                    ) : (
                                        <video
                                            src={withBasePath(video.src)}
                                            controls
                                            preload="metadata"
                                            playsInline
                                            aria-label={video.title}
                                        />
                                    )}
                                    <span className="result-video-mood">{video.icon} {video.mood}</span>
                                    <span className="result-video-duration">{video.duration}</span>
                                </div>
                                <div className="result-video-copy">
                                    <span>فيديو {index + 1} · {video.sourceLabel}</span>
                                    <h3>{video.title}</h3>
                                    <p>{video.description}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="result-quick-stats" aria-label="لماذا هذه الصفحة آمنة؟">
                    {quickStats.map(([title, description]) => (
                        <div key={title}>
                            <strong>{title}</strong>
                            <span>{description}</span>
                        </div>
                    ))}
                </section>

                <section className="result-game-section" id="result-game" aria-labelledby="result-game-title">
                    <div className="result-game-copy">
                        <span className="eyebrow">لعبة 30 ثانية</span>
                        <h2 id="result-game-title">اجمع 4 نجوم قبل النتيجة</h2>
                        <p>
                            لعبة بسيطة تساعد الطالب يبدأ بهدوء: مصدر رسمي، أمان، نفس عميق، وخطوة مهارة بعد النتيجة.
                        </p>

                        <div className="result-game-score" aria-live="polite">
                            <strong>{completedGameCount}/{resultGameCards.length}</strong>
                            <span>نجوم جاهزة</span>
                        </div>

                        <div className="result-game-progress" aria-hidden="true">
                            <span style={{ width: `${gameProgress}%` }} />
                        </div>

                        <p className="result-game-message">{gameMessage}</p>

                        <button
                            type="button"
                            className="small-button"
                            onClick={resetGame}
                            disabled={completedGameCount === 0}
                        >
                            إعادة اللعبة
                        </button>
                    </div>

                    <div className="result-game-board" aria-label="بطاقات لعبة الاستعداد للنتيجة">
                        {resultGameCards.map((card) => {
                            const isDone = Boolean(completedGameCards[card.id]);
                            return (
                                <button
                                    key={card.id}
                                    type="button"
                                    className={`result-game-card ${isDone ? 'done' : ''}`}
                                    onClick={() => toggleGameCard(card.id)}
                                    aria-pressed={isDone}
                                >
                                    <span className="result-game-card-icon" aria-hidden="true">
                                        {isDone ? '⭐' : card.icon}
                                    </span>
                                    <small>{card.reward}</small>
                                    <strong>{card.title}</strong>
                                    <p>{isDone ? card.done : card.prompt}</p>
                                </button>
                            );
                        })}
                    </div>
                </section>

                <section className="result-workspace">
                    <article className="card result-checklist-card">
                        <div className="result-card-heading">
                            <div>
                                <span className="eyebrow">قائمة صغيرة</span>
                                <h2>{selectedMode.label}</h2>
                            </div>
                            <span className="result-progress-pill">{checklistProgress}/{selectedMode.checklist.length}</span>
                        </div>

                        <div className="result-mini-progress" aria-hidden="true">
                            <span style={{ width: `${(checklistProgress / selectedMode.checklist.length) * 100}%` }} />
                        </div>

                        <div className="result-checklist">
                            {selectedMode.checklist.map((item) => {
                                const key = `${selectedMode.id}-${item}`;
                                return (
                                    <button
                                        key={item}
                                        type="button"
                                        className={`result-check-item ${checkedItems[key] ? 'checked' : ''}`}
                                        onClick={() => toggleChecklist(item)}
                                    >
                                        <span aria-hidden="true">{checkedItems[key] ? '✓' : '○'}</span>
                                        {item}
                                    </button>
                                );
                            })}
                        </div>
                    </article>

                    <article className="card result-calculator-card dynamic" id="result-calculator">
                        <div className="result-card-heading">
                            <div>
                                <span className="eyebrow">حاسبة مباشرة</span>
                                <h2>احسب النسبة التقريبية</h2>
                            </div>
                            <span className={`result-score-badge tone-${estimate.tone}`}>
                                {estimate.label}
                            </span>
                        </div>

                        <p>اكتب المجموع فقط. لا نحفظ ولا نرسل هذه الأرقام لأي مكان.</p>

                        <div className="result-input-grid">
                            <label htmlFor="score">
                                <span>المجموع</span>
                                <input
                                    id="score"
                                    inputMode="decimal"
                                    value={score}
                                    onChange={(event) => setScore(event.target.value)}
                                    placeholder="365"
                                />
                            </label>

                            <label htmlFor="total">
                                <span>المجموع الكلي</span>
                                <input
                                    id="total"
                                    inputMode="decimal"
                                    value={total}
                                    onChange={(event) => setTotal(event.target.value)}
                                    placeholder="410"
                                />
                            </label>
                        </div>

                        <div className={`result-percentage-box dynamic tone-${estimate.tone}`}>
                            <span>النسبة التقريبية</span>
                            <strong>{percentage ? `${percentage}%` : '—'}</strong>
                            <p>{estimate.tip}</p>
                        </div>
                    </article>
                </section>

                <section className="result-action-strip">
                    <div>
                        <span className="eyebrow">تنبيه مهم</span>
                        <h2>عبقورا لا يعرض النتيجة بنفسه</h2>
                        <p>
                            نحن نوفر تجربة إرشادية وروابط رسمية فقط. لا نستخدم scraping، ولا نطلب رقم الجلوس، ولا نخزن بيانات الطالب.
                        </p>
                    </div>
                    <a href={officialResultUrl} target="_blank" rel="noopener noreferrer" className="button">
                        الرابط الرسمي
                    </a>
                </section>

                <section className="result-help-grid interactive" aria-label="اختيارات سريعة">
                    {journeyModes.slice(1).map((mode) => (
                        <button
                            key={mode.id}
                            type="button"
                            className={`result-help-tile ${activeMode === mode.id ? 'active' : ''}`}
                            onClick={() => setActiveMode(mode.id)}
                        >
                            <span aria-hidden="true">{mode.icon}</span>
                            <strong>{mode.title}</strong>
                            <small>{mode.description}</small>
                        </button>
                    ))}
                </section>

                <section className="result-growth-card" id="result-plan">
                    <div>
                        <span className="eyebrow">من النتيجة إلى المهارة</span>
                        <h2>ابدأ بناء مهارة حقيقية بعد الثانوية</h2>
                        <p>
                            عبقورا يساعد الأطفال يتعلمون بخطوات صغيرة. ونفس الفكرة تنفع أي طالب: هدف واضح، تدريب عملي، ومتابعة بسيطة.
                        </p>
                    </div>
                    <Link href="/" className="button">تعرف على عبقورا</Link>
                </section>
            </main>
        </>
    );
}
