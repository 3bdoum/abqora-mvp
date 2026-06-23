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

export default function LessonPage() {
    const router = useRouter();
    const { id } = router.query;
    const [lesson, setLesson] = useState(null);
    const [progress, setProgress] = useState(null);
    const [lessonState, setLessonState] = useState('in_progress');
    const [pageError, setPageError] = useState('');

    // Project submission form state
    const [projectUrl, setProjectUrl] = useState('');
    const [description, setDescription] = useState('');
    const [submission, setSubmission] = useState(null);
    const [subMessage, setSubMessage] = useState('');
    const [subError, setSubError] = useState('');
    const [submittingProject, setSubmittingProject] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        if (!id) return;

        const fetchLessonData = async () => {
            try {
                // Fetch lesson details
                const lessonRes = await API.get(`/lessons/${id}`);
                setLesson(lessonRes.data);
                setLessonState(lessonRes.data.studentState || 'in_progress');

                // Fetch progress for the course
                const progressRes = await API.get(`/progress/${lessonRes.data.course}`);
                setProgress(progressRes.data);

                const isDone = progressRes.data.completedLessons?.some(
                    (l) => (l._id || l) === lessonRes.data._id
                );
                if (isDone) setLessonState('completed');

                // Fetch submissions to see if student submitted a project for this lesson
                const submissionsRes = await API.get('/submissions');
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
        try {
            const { data } = await API.post('/progress/lesson', {
                courseId: lesson.course,
                lessonId: lesson._id
            });
            setLessonState(data.studentState || 'awaiting_approval');
            setSubMessage('تم تسجيل انتهائك من التطبيق العملي. الدرس الآن بانتظار موافقة المعلم.');
        } catch (err) {
            setSubError(err.response?.data?.message || 'تعذر إرسال طلب الإكمال');
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

                        <div className="lesson-hero-card">
                            <div>
                                <span className="eyebrow">الدرس {lesson.order}</span>
                                <h1>{lesson.title}</h1>
                                <p>{lesson.content}</p>
                            </div>
                            <aside className={`lesson-status-panel state-${lessonState}`}>
                                <span aria-hidden="true">{statusIcon}</span>
                                <strong>{statusLabel}</strong>
                                <p>{statusHelp}</p>
                            </aside>
                        </div>

                        <div className="card lesson-video-section">
                            <div className="lesson-section-heading">
                                <span className="step-pill">1</span>
                                <div>
                                    <h2>شاهد الشرح أولاً 📺</h2>
                                    <p>قد يحتوي الدرس على فيديو واحد أو أكثر. الهدف أن يفهم الطالب التمرين قبل فتح التطبيق العملي.</p>
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
                        {lesson.codeOrgLink && !lesson.isPlaceholder && (
                            <div className="card codeorg-practice-card">
                                <div className="lesson-section-heading">
                                    <span className="step-pill">2</span>
                                    <div>
                                        <h2>طبّق على Code.org 🎮</h2>
                                        <p>بعد مشاهدة الشرح، افتح النشاط العملي العام في Code.org. عند الانتهاء عد إلى عبقورة وأرسل الدرس للمراجعة.</p>
                                    </div>
                                </div>
                                <a href={lesson.codeOrgLink} target="_blank" rel="noopener noreferrer" className="button" style={{ fontSize: '1.1rem' }}>
                                    افتح تطبيق Code.org 🔗
                                </a>
                            </div>
                        )}

                        {/* Project Submission Box (If lesson is a milestone, e.g. Lesson 2, 4, 6) */}
                        {!lesson.isPlaceholder && [2, 4, 6].includes(lesson.order) && (
                            <div className="card" style={{ marginTop: '32px' }}>
                                <h2>تسليم المشروع البرمجي 🛠️ (مطلوب)</h2>
                                <p style={{ marginBottom: '20px' }}>
                                    اكتب وصف مشروعك باللغة العربية وأدخل رابط العمل (مثال: رابط المشروع من Scratch أو Code.org).
                                </p>

                                {subMessage && <div className="success-box">{subMessage}</div>}
                                {subError && <div className="error-box">{subError}</div>}

                                {submission && submission.status === 'approved' ? (
                                    <div className="success-box">
                                        <p style={{ fontWeight: 'bold' }}>✓ تم قبول هذا المشروع من قبل المعلم!</p>
                                        <p style={{ fontSize: '0.9rem', marginTop: '4px' }}>
                                            <strong>تعليق المعلم:</strong> {submission.feedback || 'أحسنت عملاً!'}
                                        </p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleProjectSubmit}>
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
                                            <div className="success-box" style={{ background: 'var(--warning-light)', color: 'var(--warning)', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
                                                المشروع قيد المراجعة حالياً من قبل المعلم ⏳
                                            </div>
                                        ) : (
                                            <button type="submit" className="button" disabled={submittingProject}>
                                                {submittingProject ? 'جاري الإرسال...' : submission ? 'إعادة إرسال المشروع المعدل 🛠️' : 'تقديم المشروع للمراجعة 🚀'}
                                            </button>
                                        )}
                                    </form>
                                )}
                            </div>
                        )}

                        {/* Navigation Actions */}
                        <div className="card completion-card">
                            <h2>خطوة التقييم والاكتمال ✍️</h2>
                            <p>
                                عند انتهائك من مشاهدة الشرح والتطبيق العملي على Code.org، أرسل الدرس للمراجعة.
                            </p>

                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                {lessonState === 'awaiting_approval' ? (
                                    <span className="tag status-pending" style={{ fontSize: '1rem', padding: '10px 20px' }}>
                                        بانتظار موافقة المعلم ⏳
                                    </span>
                                ) : lessonState === 'completed' ? (
                                    <span className="tag status-completed" style={{ fontSize: '1rem', padding: '10px 20px' }}>
                                        الدرس مكتمل بنجاح!
                                    </span>
                                ) : lesson.isPlaceholder ? (
                                    <span className="tag status-locked" style={{ fontSize: '1rem', padding: '10px 20px' }}>
                                        الدرس غير متاح بعد داخل عبقورة
                                    </span>
                                ) : (
                                    <button onClick={markLessonComplete} className="button">
                                        انتهيت من التطبيق — إرسال للمراجعة ✓
                                    </button>
                                )}

                                <button
                                    onClick={() => router.push({ pathname: '/quiz', query: { id: lesson._id } })}
                                    className="button btn-secondary"
                                >
                                    دخول اختبار الدرس ✍️
                                </button>
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
