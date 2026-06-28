import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import API from '../../utils/api';

const stateLabels = {
    locked: ['مقفل', '🔒'],
    available: ['متاح', '▶'],
    in_progress: ['قيد التعلم', '◐'],
    awaiting_approval: ['بانتظار موافقة المعلم', '⏳'],
    completed: ['مكتمل', '✓'],
};

const typeLabels = {
    activity: 'نشاط تطبيقي',
    video: 'فيديو',
    project: 'مشروع',
    quiz: 'اختبار',
    mixed: 'درس متنوع',
};

export default function CoursePage() {
    const router = useRouter();
    const { id } = router.query;
    const [course, setCourse] = useState(null);
    const [message, setMessage] = useState('');
    const [enrolling, setEnrolling] = useState(false);
    const [role, setRole] = useState('');

    const fetchCourse = async () => {
        try {
            const { data } = await API.get(`/courses/${id}`);
            setCourse(data);
        } catch (err) {
            setMessage(err.response?.data?.message || 'تعذر تحميل بيانات الدورة');
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return void router.push('/login');
        setRole(localStorage.getItem('userRole') || '');
        if (id) fetchCourse();
    }, [id]);

    const enroll = async () => {
        setEnrolling(true);
        try {
            await API.post(`/courses/${id}/enroll`);
            await fetchCourse();
        } catch (err) {
            setMessage(err.response?.data?.message || 'تعذر التسجيل في الدورة');
        } finally {
            setEnrolling(false);
        }
    };

    const progress = course?.progress || {};
    const nextLesson = course?.lessons?.find((lesson) => String(lesson._id) === String(progress.nextLessonId));
    const lessonCounts = course?.lessons?.reduce((acc, lesson) => {
        const state = lesson.studentState || 'available';
        acc[state] = (acc[state] || 0) + 1;
        return acc;
    }, {}) || {};

    return (
        <Layout>
            <section className="page shell rtl course-details-page">
                <Link href="/dashboard" className="button secondary back-button">↩ العودة لدليل الدورات</Link>
                {message && <div className="error-box">{message}</div>}

                {course ? (
                    <>
                        <div className="course-detail-hero">
                            <div>
                                <span className="eyebrow">{course.ageRange} · {course.level}</span>
                                <h1>{course.title}</h1>
                                <p>{course.description}</p>
                                <div className="course-detail-tags">
                                    <span className="tag">{course.language}</span>
                                    <span className="tag">{course.lessonCount} درساً</span>
                                    {course.lessons.some((lesson) => lesson.isPlaceholder) && (
                                        <span className="tag placeholder-tag">بعض العناوين بانتظار البيانات</span>
                                    )}
                                </div>
                            </div>
                            <div className="course-overall-progress">
                                <strong>{progress.percentage || 0}%</strong>
                                <span>التقدم الكلي</span>
                                <div className="progress-bar-container">
                                    <div className="progress-bar" style={{ width: `${progress.percentage || 0}%` }} />
                                </div>
                                {progress.enrolled && nextLesson && (
                                    <Link href={{ pathname: '/lesson', query: { id: nextLesson._id } }} className="button">
                                        متابعة: الدرس {nextLesson.order}
                                    </Link>
                                )}
                                {!progress.enrolled && role === 'student' && (
                                    <button className="button" onClick={enroll} disabled={enrolling}>
                                        {enrolling ? 'جاري التسجيل...' : 'سجّل وابدأ الدرس الأول'}
                                    </button>
                                )}
                            </div>
                        </div>

                        <details className="simple-disclosure course-map-disclosure" open={!progress.enrolled}>
                            <summary>
                                <span>كل دروس الدورة</span>
                                <small>{course.lessonCount} درس · الدرس التالي يظهر بالأعلى</small>
                            </summary>

                            <div className="lesson-map-heading">
                                <div><span className="eyebrow">خريطة الدورة</span><h2>الدروس بالترتيب</h2></div>
                                <p>لا تحتاج حفظ الخريطة. عبقورا يفتح لك الدرس المناسب تلقائيًا.</p>
                            </div>

                            <div className="lesson-state-legend" aria-label="ملخص حالات الدروس">
                                <span><b className="legend-dot available" /> متاح: {lessonCounts.available || 0}</span>
                                <span><b className="legend-dot in-progress" /> قيد التعلم: {lessonCounts.in_progress || 0}</span>
                                <span><b className="legend-dot pending" /> بانتظار المعلم: {lessonCounts.awaiting_approval || 0}</span>
                                <span><b className="legend-dot complete" /> مكتمل: {lessonCounts.completed || 0}</span>
                                <span><b className="legend-dot locked" /> مقفل: {lessonCounts.locked || 0}</span>
                            </div>

                            <div className="lesson-sequence">
                                {course.lessons.map((lesson) => {
                                    const state = lesson.studentState || 'available';
                                    const [label, icon] = stateLabels[state] || stateLabels.available;
                                    const locked = state === 'locked';
                                    const unavailablePlaceholder = lesson.isPlaceholder && !locked;
                                    return (
                                        <article key={lesson.stableId || lesson._id} className={`lesson-row state-${state} ${lesson.isPlaceholder ? 'is-placeholder' : ''}`}>
                                            <div className="lesson-order">{lesson.order}</div>
                                            <div className="lesson-row-content">
                                                <div className="lesson-row-title">
                                                    <h3>{lesson.title}</h3>
                                                    {lesson.isPlaceholder && <span className="placeholder-badge">قيد التأليف داخل عبقورة</span>}
                                                </div>
                                                <div className="lesson-row-meta">
                                                    <span>{typeLabels[lesson.type] || 'درس'}</span>
                                                    <span className={`lesson-state-badge state-${state}`}>{icon} {label}</span>
                                                    {unavailablePlaceholder && <span className="lesson-note">لا يوجد نشاط داخلي بعد</span>}
                                                </div>
                                            </div>
                                            {locked ? (
                                                <button className="lesson-open-button locked" disabled aria-label="الدرس مقفل">🔒</button>
                                            ) : (
                                                <Link href={{ pathname: '/lesson', query: { id: lesson._id } }} className="lesson-open-button" aria-label={`فتح ${lesson.title}`}>←</Link>
                                            )}
                                        </article>
                                    );
                                })}
                            </div>
                        </details>
                    </>
                ) : !message && <p className="loading-copy">جاري التحميل...</p>}
            </section>
        </Layout>
    );
}
