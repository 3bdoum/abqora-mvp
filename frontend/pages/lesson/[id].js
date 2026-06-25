import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import API from '../../utils/api';

const getEmbedUrl = (url) => {
    if (!url) return '';

    try {
        if (url.includes('/embed/')) {
            return url;
        }

        const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
        if (shortMatch) {
            return `https://www.youtube.com/embed/${shortMatch[1]}`;
        }

        const watchMatch = url.match(/[?&]v=([^&]+)/);
        if (watchMatch) {
            return `https://www.youtube.com/embed/${watchMatch[1]}`;
        }

        const shortsMatch = url.match(/youtube\.com\/shorts\/([^?&/]+)/);
        if (shortsMatch) {
            return `https://www.youtube.com/embed/${shortsMatch[1]}`;
        }

        return '';
    } catch {
        return '';
    }
};

const getExternalVideoUrl = (url) => {
    if (!url) return '';

    try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol) ? url : '';
    } catch {
        return '';
    }
};

const lessonStatusLabels = {
    locked: ['مقفل', '🔒', 'لا يمكن فتح هذا الدرس قبل إكمال السابق.'],
    available: ['متاح الآن', '▶', 'شاهد الشرح ثم افتح التطبيق العملي.'],
    in_progress: ['قيد التعلم', '◐', 'شاهد الشرح وطبّق على Code.org ثم أرسل الدرس للمراجعة.'],
    awaiting_approval: ['بانتظار المعلم', '⏳', 'تم الإرسال وينتظر اعتماد المعلم.'],
    completed: ['مكتمل', '✓', 'أحسنت! يمكنك مراجعة الدرس متى شئت.'],
};

const AGE_PROFILES = {
    '5-8': {
        className: 'age-junior',
        label: 'رحلة صغيرة 🧸',
        heroPrefix: 'هيا نتعلم خطوة خطوة',
        heroText: 'سنشاهد الشرح أولًا، ثم نلعب التمرين العملي، وبعدها نخبر المعلم أننا انتهينا.',
        videoTitle: 'شاهد القصة أولًا 📺',
        videoHelp: 'شاهد الفيديو بهدوء. إذا كان هناك أكثر من فيديو، شاهدهم بالترتيب مثل حلقات قصيرة.',
        practiceTitle: 'الآن وقت اللعب والتجربة 🎮',
        practiceHelp: 'افتح التمرين، جرّب بنفسك، ولا بأس أن تعيد المحاولة أكثر من مرة.',
        submitTitle: 'أخبر المعلم أنك انتهيت ⭐',
        submitHelp: 'بعد التمرين اضغط الزر، وسيقوم المعلم بمراجعة عملك.',
        finishButton: 'خلصت التمرين — أرسل للمعلم ✓',
        retryTitle: 'المعلم ترك لك ملاحظة صغيرة',
        completedTitle: 'أحسنت! الدرس اكتمل 🎉',
    },
    '9-12': {
        className: 'age-builder',
        label: 'مسار مهارة 🚀',
        heroPrefix: 'درس جديد في رحلتك',
        heroText: 'اتبع الخطوات: شرح، تطبيق عملي، ثم إرسال للمراجعة داخل عبقورا.',
        videoTitle: 'شاهد الشرح أولًا 📺',
        videoHelp: 'الفيديو يشرح فكرة التمرين قبل فتح التطبيق العملي. دوّن أي نقطة تحتاج مراجعة.',
        practiceTitle: 'طبّق على Code.org 🎮',
        practiceHelp: 'افتح النشاط العملي العام، أكمل التحدي، ثم ارجع إلى عبقورا لإرسال الإنجاز.',
        submitTitle: 'إرسال الدرس للمراجعة ✍️',
        submitHelp: 'عند الانتهاء أرسل الدرس للمعلم. الموافقة تفتح الدرس التالي.',
        finishButton: 'انتهيت من التطبيق — إرسال للمراجعة ✓',
        retryTitle: 'ملاحظة المعلم لإعادة المحاولة',
        completedTitle: 'الدرس مكتمل بنجاح ✅',
    },
    '13-16': {
        className: 'age-advanced',
        label: 'خطة تنفيذ 💻',
        heroPrefix: 'خطة الدرس',
        heroText: 'راجع الشرح، نفّذ التطبيق العملي، ثم أرسل الإنجاز ليتم اعتماده وفتح المرحلة التالية.',
        videoTitle: 'مراجعة المفهوم 📺',
        videoHelp: 'ابدأ بالفيديو لتفهم المطلوب ومعايير الحل قبل التطبيق.',
        practiceTitle: 'التطبيق العملي على Code.org 🎮',
        practiceHelp: 'نفّذ النشاط في Code.org ثم ارجع إلى عبقورا لتسجيل الإكمال ضمن مسارك.',
        submitTitle: 'اعتماد التقدم ✍️',
        submitHelp: 'إرسال الإكمال ينقل الدرس إلى مراجعة المعلم، وبعد الموافقة ينفتح الدرس التالي.',
        finishButton: 'إرسال الإكمال للمراجعة ✓',
        retryTitle: 'ملاحظات التحسين من المعلم',
        completedTitle: 'تم اعتماد الدرس ✅',
    },
    default: {
        className: 'age-default',
        label: 'درس عبقورا',
        heroPrefix: 'درس جديد في عبقورا',
        heroText: 'شاهد الشرح، طبّق عمليًا، ثم أرسل إنجازك للمراجعة.',
        videoTitle: 'شاهد الشرح أولاً 📺',
        videoHelp: 'قد يحتوي الدرس على فيديو واحد أو أكثر. الهدف أن تفهم التمرين قبل فتح التطبيق العملي.',
        practiceTitle: 'طبّق على Code.org 🎮',
        practiceHelp: 'بعد مشاهدة الشرح، افتح النشاط العملي العام. عند الانتهاء عد إلى عبقورا وأرسل الدرس للمراجعة.',
        submitTitle: 'خطوة التقييم والاكتمال ✍️',
        submitHelp: 'عند انتهائك من مشاهدة الشرح والتطبيق العملي على Code.org، أرسل الدرس للمراجعة.',
        finishButton: 'انتهيت من التطبيق — إرسال للمراجعة ✓',
        retryTitle: 'ملاحظة المعلم',
        completedTitle: 'الدرس مكتمل بنجاح!',
    },
};

const getAgeProfile = (ageGroup) => AGE_PROFILES[ageGroup] || AGE_PROFILES.default;

const getLessonProgressEntry = (progress, lessonId) => {
    if (!progress?.lessonProgress?.length || !lessonId) return null;
    return progress.lessonProgress.find((entry) => String(entry.lesson?._id || entry.lesson) === String(lessonId)) || null;
};

const getNextCourseLesson = (course, currentLesson) => {
    if (!course?.lessons?.length || !currentLesson) return null;

    const nextByProgress = course.progress?.nextLessonId
        ? course.lessons.find((item) => String(item._id) === String(course.progress.nextLessonId))
        : null;
    if (nextByProgress && String(nextByProgress._id) !== String(currentLesson._id)) {
        return nextByProgress;
    }

    return course.lessons.find((item) => item.order > currentLesson.order && item.studentState !== 'locked') || null;
};

export default function LessonPage() {
    const router = useRouter();
    const { id } = router.query;
    const [lesson, setLesson] = useState(null);
    const [course, setCourse] = useState(null);
    const [progress, setProgress] = useState(null);
    const [lessonState, setLessonState] = useState('in_progress');
    const [pageError, setPageError] = useState('');
    const [studentAgeGroup, setStudentAgeGroup] = useState('');

    // Project submission form state
    const [projectUrl, setProjectUrl] = useState('');
    const [description, setDescription] = useState('');
    const [submission, setSubmission] = useState(null);
    const [subMessage, setSubMessage] = useState('');
    const [subError, setSubError] = useState('');
    const [submittingProject, setSubmittingProject] = useState(false);
    const [submittingCompletion, setSubmittingCompletion] = useState(false);
    const [completionMessage, setCompletionMessage] = useState('');
    const [completionError, setCompletionError] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        setStudentAgeGroup(localStorage.getItem('userAgeGroup') || '');
        if (!id) return;

        const fetchLessonData = async () => {
            try {
                // Fetch lesson details
                const lessonRes = await API.get(`/lessons/${id}`);
                setLesson(lessonRes.data);
                setLessonState(lessonRes.data.studentState || 'in_progress');

                // Fetch course, progress, and student submissions together.
                const [courseRes, progressRes, submissionsRes] = await Promise.all([
                    API.get(`/courses/${lessonRes.data.course}`),
                    API.get(`/progress/${lessonRes.data.course}`),
                    API.get('/submissions'),
                ]);
                setCourse(courseRes.data);
                setProgress(progressRes.data);

                const isDone = progressRes.data.completedLessons?.some(
                    (l) => (l._id || l) === lessonRes.data._id
                );
                if (isDone) setLessonState('completed');

                // Fetch submissions to see if student submitted a project for this lesson
                const matchedSub = submissionsRes.data.find(
                    (sub) => sub.lesson && (sub.lesson._id || sub.lesson) === lessonRes.data._id
                );
                if (matchedSub) {
                    setSubmission(matchedSub);
                    setProjectUrl(matchedSub.projectUrl);
                    setDescription(matchedSub.description);
                }
            } catch (err) {
                setPageError(err.response?.data?.message || 'تعذر تحميل الدرس');
            }
        };

        fetchLessonData();
    }, [id]);

    const markLessonComplete = async () => {
        setSubmittingCompletion(true);
        setCompletionMessage('');
        setCompletionError('');
        try {
            const { data } = await API.post('/progress/lesson', {
                courseId: lesson.course,
                lessonId: lesson._id
            });
            setLessonState(data.studentState || 'awaiting_approval');
            const [progressRes, courseRes] = await Promise.all([
                API.get(`/progress/${lesson.course}`),
                API.get(`/courses/${lesson.course}`),
            ]);
            setProgress(progressRes.data);
            setCourse(courseRes.data);
            setCompletionMessage(
                data.studentState === 'completed'
                    ? 'تم إكمال الدرس بنجاح.'
                    : 'تم تسجيل انتهائك من التطبيق العملي. الدرس الآن بانتظار موافقة المعلم.'
            );
        } catch (err) {
            setCompletionError(err.response?.data?.message || 'تعذر إرسال طلب الإكمال');
        } finally {
            setSubmittingCompletion(false);
        }
    };

    const handleProjectSubmit = async (e) => {
        e.preventDefault();
        if (!projectUrl || !description) {
            setSubError('يرجى كتابة وصف وإدخال رابط المشروع');
            return;
        }

        setSubmittingProject(true);
        setSubMessage('');
        setSubError('');

        try {
            const response = await API.post('/submissions', {
                lessonId: lesson._id,
                projectUrl,
                description
            });
            setSubmission(response.data);
            setSubMessage('تم تقديم المشروع البرمجي بنجاح! سيقوم المعلم بمراجعته قريباً.');
        } catch (err) {
            setSubError(err.response?.data?.message || 'تعذر تقديم المشروع');
        } finally {
            setSubmittingProject(false);
        }
    };

    const explanationVideos = lesson
        ? (lesson.videoUrls?.length
            ? lesson.videoUrls
            : lesson.videoUrl
                ? [{ title: 'الشرح المرئي', url: lesson.videoUrl, description: '' }]
                : [])
        : [];
    const [statusLabel, statusIcon, statusHelp] = lessonStatusLabels[lessonState] || lessonStatusLabels.in_progress;
    const ageProfile = getAgeProfile(studentAgeGroup);
    const lessonProgressEntry = getLessonProgressEntry(progress, lesson?._id);
    const teacherFeedback = lessonProgressEntry?.feedback || '';
    const wasReviewedForRetry = lessonState === 'in_progress' && teacherFeedback && lessonProgressEntry?.reviewedAt;
    const nextLesson = getNextCourseLesson(course, lesson);
    const canPractice = Boolean(lesson?.codeOrgLink && !lesson?.isPlaceholder);
    const journeySteps = [
        {
            number: 1,
            title: 'الشرح',
            icon: '📺',
            state: explanationVideos.length ? 'ready' : 'needs-content',
        },
        {
            number: 2,
            title: 'التطبيق',
            icon: '🎮',
            state: canPractice ? 'ready' : 'needs-content',
        },
        {
            number: 3,
            title: 'المراجعة',
            icon: lessonState === 'completed' ? '✅' : lessonState === 'awaiting_approval' ? '⏳' : '✍️',
            state: lessonState,
        },
    ];

    return (
        <Layout>
            <section className="page shell rtl">
                {pageError && (
                    <div className="error-box">
                        {pageError}
                        <div style={{ marginTop: '12px' }}>
                            <Link href="/dashboard" className="button secondary">العودة لدليل الدورات</Link>
                        </div>
                    </div>
                )}
                {lesson ? (
                    <>
                        <Link href={{ pathname: '/course', query: { id: lesson.course } }} className="button secondary" style={{ marginBottom: '20px', textDecoration: 'none', display: 'inline-flex' }}>
                            ↩ العودة لقائمة الدروس
                        </Link>

                        <div className={`lesson-hero-card lesson-experience-hero ${ageProfile.className}`}>
                            <div>
                                <span className="eyebrow">الدرس {lesson.order}</span>
                                <span className="age-stage-pill">{ageProfile.label}</span>
                                <h1>{ageProfile.heroPrefix}: {lesson.title}</h1>
                                <p>{lesson.content || ageProfile.heroText}</p>
                                <div className="lesson-hero-helper">
                                    <span>الترتيب: شرح ← تطبيق ← مراجعة</span>
                                    {course?.title && <span>{course.title}</span>}
                                </div>
                            </div>
                            <aside className={`lesson-status-panel state-${lessonState}`}>
                                <span aria-hidden="true">{statusIcon}</span>
                                <strong>{statusLabel}</strong>
                                <p>{statusHelp}</p>
                            </aside>
                        </div>

                        <div className={`lesson-journey-strip ${ageProfile.className}`} aria-label="خطوات الدرس">
                            {journeySteps.map((step) => (
                                <article key={step.number} className={`lesson-journey-step state-${step.state}`}>
                                    <span className="journey-step-number">{step.number}</span>
                                    <div>
                                        <strong>{step.icon} {step.title}</strong>
                                        <small>
                                            {step.number === 1
                                                ? (explanationVideos.length ? 'جاهز للمشاهدة' : 'بانتظار إضافة الفيديو')
                                                : step.number === 2
                                                    ? (canPractice ? 'جاهز للتطبيق' : 'بانتظار رابط التطبيق')
                                                    : statusLabel}
                                        </small>
                                    </div>
                                </article>
                            ))}
                        </div>

                        {wasReviewedForRetry && (
                            <div className="teacher-feedback-card retry-feedback-card">
                                <span aria-hidden="true">💬</span>
                                <div>
                                    <strong>{ageProfile.retryTitle}</strong>
                                    <p>{teacherFeedback}</p>
                                    <small>عدّل عملك أو أعد التطبيق، ثم أرسل الدرس مرة أخرى للمراجعة.</small>
                                </div>
                            </div>
                        )}

                        <div className="card lesson-video-section lesson-step-card">
                            <div className="lesson-section-heading lesson-section-heading-v2">
                                <span className="step-pill">1</span>
                                <div>
                                    <h2>{ageProfile.videoTitle}</h2>
                                    <p>{ageProfile.videoHelp}</p>
                                </div>
                            </div>

                            {explanationVideos.length > 0 ? (
                                <div className="lesson-video-list">
                                    {explanationVideos.map((video, index) => {
                                        const videoUrl = video.url?.trim() || '';
                                        const embedUrl = getEmbedUrl(videoUrl);
                                        const externalVideoUrl = getExternalVideoUrl(videoUrl);
                                        return (
                                            <article className="lesson-video-card" key={`${videoUrl}-${index}`}>
                                                <div className="lesson-video-meta">
                                                    <span className="tag">فيديو {index + 1}</span>
                                                    <h3>{video.title || `شرح الدرس ${index + 1}`}</h3>
                                                    {video.description && <p>{video.description}</p>}
                                                    {video.duration && <small>المدة التقريبية: {video.duration}</small>}
                                                </div>

                                                {embedUrl ? (
                                                    <div className="video-frame">
                                                        <iframe
                                                            src={embedUrl}
                                                            title={video.title || lesson.title}
                                                            loading="lazy"
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                            allowFullScreen
                                                            referrerPolicy="strict-origin-when-cross-origin"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="error-box compact-alert">
                                                        رابط الفيديو غير صالح أو لا يمكن عرضه داخل الصفحة.
                                                        {externalVideoUrl && (
                                                            <p style={{ marginTop: '8px' }}>
                                                                <a href={externalVideoUrl} target="_blank" rel="noopener noreferrer">
                                                                    فتح الرابط في نافذة جديدة
                                                                </a>
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </article>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="lesson-video-empty">
                                    <strong>لم تتم إضافة فيديو الشرح لهذا الدرس بعد.</strong>
                                    <p>يمكن إضافة رابط YouTube واحد أو أكثر لهذا الدرس من بيانات الدورة. بعد إضافة الفيديو سيظهر هنا قبل التطبيق العملي.</p>
                                </div>
                            )}
                        </div>

                        {/* Code.org Activity Redirect */}
                        {canPractice ? (
                            <div className="card codeorg-practice-card lesson-step-card">
                                <div className="lesson-section-heading lesson-section-heading-v2">
                                    <span className="step-pill">2</span>
                                    <div>
                                        <h2>{ageProfile.practiceTitle}</h2>
                                        <p>{ageProfile.practiceHelp}</p>
                                    </div>
                                </div>
                                <div className="practice-info-grid">
                                    <div className="practice-note">
                                        <strong>مهم</strong>
                                        <p>التطبيق يتم على Code.org، لكن تسجيل التقدم والاعتماد يحدثان هنا داخل عبقورا.</p>
                                    </div>
                                    <a href={lesson.codeOrgLink} target="_blank" rel="noopener noreferrer" className="button practice-launch-button">
                                        افتح التمرين العملي 🔗
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div className="card codeorg-practice-card lesson-step-card missing-practice-card">
                                <div className="lesson-section-heading lesson-section-heading-v2">
                                    <span className="step-pill">2</span>
                                    <div>
                                        <h2>{ageProfile.practiceTitle}</h2>
                                        <p>لم تتم إضافة رابط التطبيق العملي لهذا الدرس بعد.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Project Submission Box (If lesson is a milestone, e.g. Lesson 2, 4, 6) */}
                        {!lesson.isPlaceholder && [2, 4, 6].includes(lesson.order) && (
                            <div className="card project-submission-card lesson-step-card">
                                <div className="lesson-section-heading lesson-section-heading-v2">
                                    <span className="step-pill optional-step-pill">★</span>
                                    <div>
                                        <h2>تسليم المشروع البرمجي 🛠️</h2>
                                        <p>هذا الدرس يحتوي على مشروع. اكتب وصفًا بسيطًا وأضف رابط العمل ليتمكن المعلم من مراجعته.</p>
                                    </div>
                                </div>

                                {subMessage && <div className="success-box">{subMessage}</div>}
                                {subError && <div className="error-box">{subError}</div>}

                                {submission && submission.status === 'approved' ? (
                                    <div className="submission-state-box approved">
                                        <strong>✓ تم قبول هذا المشروع من قبل المعلم!</strong>
                                        <p><strong>تعليق المعلم:</strong> {submission.feedback || 'أحسنت عملاً!'}</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleProjectSubmit}>
                                        {submission && submission.status === 'rejected' && (
                                            <div className="submission-state-box rejected">
                                                <strong>المشروع يحتاج تعديلًا بسيطًا.</strong>
                                                <p>{submission.feedback || 'راجع المطلوب ثم أرسل المشروع مرة أخرى.'}</p>
                                            </div>
                                        )}

                                        <label>رابط المشروع البرمجي (URL)</label>
                                        <input
                                            value={projectUrl}
                                            onChange={(e) => setProjectUrl(e.target.value)}
                                            placeholder="https://studio.code.org/projects/..."
                                            required
                                            disabled={submission && submission.status === 'pending'}
                                        />

                                        <label>وصف مختصر للمشروع</label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="اشرح ماذا تفعل لعبتك وكيف قمت ببرمجتها..."
                                            rows="4"
                                            required
                                            disabled={submission && submission.status === 'pending'}
                                        />

                                        {submission && submission.status === 'pending' ? (
                                            <div className="submission-state-box pending">
                                                <strong>المشروع قيد المراجعة حالياً من قبل المعلم ⏳</strong>
                                                <p>سنعرض ملاحظة المعلم هنا عند الاعتماد أو طلب التعديل.</p>
                                            </div>
                                        ) : (
                                            <button type="submit" className="button" disabled={submittingProject}>
                                                {submittingProject
                                                    ? 'جاري الإرسال...'
                                                    : submission?.status === 'rejected'
                                                        ? 'إعادة إرسال المشروع بعد التعديل 🛠️'
                                                        : submission
                                                            ? 'إعادة إرسال المشروع المعدل 🛠️'
                                                            : 'تقديم المشروع للمراجعة 🚀'}
                                            </button>
                                        )}
                                    </form>
                                )}
                            </div>
                        )}

                        {/* Navigation Actions */}
                        <div className={`card completion-card lesson-completion-v2 state-${lessonState}`}>
                            <div className="lesson-section-heading lesson-section-heading-v2 centered-heading">
                                <span className="step-pill">3</span>
                                <div>
                                    <h2>{lessonState === 'completed' ? ageProfile.completedTitle : ageProfile.submitTitle}</h2>
                                    <p>{ageProfile.submitHelp}</p>
                                </div>
                            </div>

                            {teacherFeedback && lessonState === 'completed' && (
                                <div className="teacher-feedback-card approved-feedback-card">
                                    <span aria-hidden="true">🌟</span>
                                    <div>
                                        <strong>ملاحظة المعلم</strong>
                                        <p>{teacherFeedback}</p>
                                    </div>
                                </div>
                            )}

                            {completionMessage && <div className="success-box compact-alert">{completionMessage}</div>}
                            {completionError && <div className="error-box compact-alert">{completionError}</div>}

                            <div className="lesson-action-row">
                                {lessonState === 'awaiting_approval' ? (
                                    <span className="tag status-pending lesson-large-status">
                                        بانتظار موافقة المعلم ⏳
                                    </span>
                                ) : lessonState === 'completed' ? (
                                    <span className="tag status-completed lesson-large-status">
                                        الدرس مكتمل بنجاح!
                                    </span>
                                ) : lesson.isPlaceholder ? (
                                    <span className="tag status-locked lesson-large-status">
                                        الدرس غير متاح بعد داخل عبقورة
                                    </span>
                                ) : (
                                    <button onClick={markLessonComplete} className="button" disabled={submittingCompletion}>
                                        {submittingCompletion ? 'جاري الإرسال...' : ageProfile.finishButton}
                                    </button>
                                )}

                                {lessonState === 'completed' && nextLesson && (
                                    <Link href={{ pathname: '/lesson', query: { id: nextLesson._id } }} className="button btn-success">
                                        الدرس التالي: {nextLesson.order} ←
                                    </Link>
                                )}

                                <Link href={{ pathname: '/course', query: { id: lesson.course } }} className="button btn-secondary">
                                    خريطة الدروس
                                </Link>

                                {!lesson.isPlaceholder && (
                                    <button
                                        onClick={() => router.push({ pathname: '/quiz', query: { id: lesson._id } })}
                                        className="button btn-secondary"
                                    >
                                        دخول اختبار الدرس ✍️
                                    </button>
                                )}
                            </div>
                        </div>
                    </>
                ) : !pageError && (
                    <p style={{ textAlign: 'center', marginTop: '40px' }}>جاري التحميل...</p>
                )}
            </section>
        </Layout>
    );
}
