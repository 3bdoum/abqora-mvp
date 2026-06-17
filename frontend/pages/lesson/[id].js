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

export default function LessonPage() {
    const router = useRouter();
    const { id } = router.query;
    const [lesson, setLesson] = useState(null);
    const [progress, setProgress] = useState(null);
    const [completed, setCompleted] = useState(false);

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

                // Fetch progress for the course
                const progressRes = await API.get(`/progress/${lessonRes.data.course}`);
                setProgress(progressRes.data);

                const isDone = progressRes.data.completedLessons?.some(
                    (l) => (l._id || l) === lessonRes.data._id
                );
                setCompleted(isDone);

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
                console.error(err);
            }
        };

        fetchLessonData();
    }, [id]);

    const markLessonComplete = async () => {
        try {
            await API.post('/progress/lesson', {
                courseId: lesson.course,
                lessonId: lesson._id
            });
            setCompleted(true);
        } catch (err) {
            console.error('تعذر تسجيل اكتمال الدرس');
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

    const videoUrl = lesson?.videoUrl?.trim() || '';
    const embedUrl = getEmbedUrl(videoUrl);
    const externalVideoUrl = getExternalVideoUrl(videoUrl);

    return (
        <Layout>
            <section className="page shell rtl">
                {lesson ? (
                    <>
                        <Link href={{ pathname: '/course', query: { id: lesson.course } }} className="button secondary" style={{ marginBottom: '20px', textDecoration: 'none', display: 'inline-flex' }}>
                            ↩ العودة لقائمة الدروس
                        </Link>

                        <div className="lesson-card">
                            <h1>{lesson.title}</h1>
                            <p style={{ fontSize: '1.1rem', marginTop: '12px' }}>{lesson.content}</p>
                        </div>

                        {/* YouTube Tutorial Video */}
                        {videoUrl && (
                            <div
                                className="card"
                                style={{
                                    marginTop: '32px'
                                }}
                            >
                                <h2 style={{ marginBottom: '20px' }}>
                                    الشرح المرئي باللغة العربية 📺
                                </h2>

                                {embedUrl ? (
                                    <>
                                        <div
                                            style={{
                                                position: 'relative',
                                                width: '100%',
                                                paddingBottom: '56.25%',
                                                height: 0,
                                                overflow: 'hidden',
                                                borderRadius: '12px',
                                                background: '#000'
                                            }}
                                        >
                                            <iframe
                                                src={embedUrl}
                                                title={lesson.title}
                                                loading="lazy"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                                referrerPolicy="strict-origin-when-cross-origin"
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: '100%',
                                                    border: 'none',
                                                    borderRadius: '12px'
                                                }}
                                            />
                                        </div>
                                        {externalVideoUrl && (
                                            <p style={{ marginTop: '12px', textAlign: 'center' }}>
                                                إذا لم يعمل الفيديو داخل الصفحة،{' '}
                                                <a href={externalVideoUrl} target="_blank" rel="noopener noreferrer">
                                                    افتحه في نافذة جديدة
                                                </a>
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <div className="error-box">
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
                            </div>
                        )}

                        {/* Code.org Activity Redirect */}
                        {lesson.codeOrgLink && (
                            <div className="card" style={{ marginTop: '32px', textAlign: 'center', background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)', borderColor: '#7dd3fc' }}>
                                <h2>التطبيق العملي على منصة Code.org 🎮</h2>
                                <p style={{ margin: '12px 0 24px' }}>
                                    افتح منصة العملي لحل اللغز المطلوب ثم عد إلى هنا لإكمال الدرس!
                                </p>
                                <a href={lesson.codeOrgLink} target="_blank" rel="noopener noreferrer" className="button" style={{ fontSize: '1.1rem' }}>
                                    افتح منصة الألعاب التطبيقية 🔗
                                </a>
                            </div>
                        )}

                        {/* Project Submission Box (If lesson is a milestone, e.g. Lesson 2, 4, 6) */}
                        {[2, 4, 6].includes(lesson.order) && (
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
                        <div className="card" style={{ marginTop: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                            <h2>خطوة التقييم والاكتمال ✍️</h2>
                            <p>
                                عند انتهائك من مشاهدة الشرح والتطبيق العملي، قم بتسجيل اكتمال الدرس لتفعيل اختبار التقدم.
                            </p>

                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                {!completed ? (
                                    <button onClick={markLessonComplete} className="button">
                                        تحديد كـ "مكتمل" ✓
                                    </button>
                                ) : (
                                    <span className="tag status-completed" style={{ fontSize: '1rem', padding: '10px 20px' }}>
                                        الدرس مكتمل بنجاح!
                                    </span>
                                )}

                                <button
                                    onClick={() => router.push({ pathname: '/quiz', query: { id: lesson._id } })}
                                    className={`button ${completed ? 'btn-primary' : 'btn-secondary'}`}
                                >
                                    دخول اختبار الدرس ✍️
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <p style={{ textAlign: 'center', marginTop: '40px' }}>جاري التحميل...</p>
                )}
            </section>
        </Layout>
    );
}
