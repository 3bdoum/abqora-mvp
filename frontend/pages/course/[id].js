import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import API from '../../utils/api';

export default function CoursePage() {
    const router = useRouter();
    const { id } = router.query;
    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [progress, setProgress] = useState(null);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        if (!id) return;

        const fetchCourseData = async () => {
            try {
                const courseRes = await API.get(`/courses/${id}`);
                setCourse(courseRes.data);
                setLessons(courseRes.data.lessons || []);

                const progressRes = await API.get(`/progress/${id}`);
                setProgress(progressRes.data);
            } catch (err) {
                setMessage('تعذر تحميل بيانات الدورة');
            }
        };

        fetchCourseData();
    }, [id]);

    const isLessonCompleted = (lessonId) => {
        if (!progress || !progress.completedLessons) return false;
        return progress.completedLessons.some(l => (l._id || l) === lessonId);
    };

    return (
        <Layout>
            <section className="page shell rtl">
                <Link href="/dashboard" className="button secondary" style={{ marginBottom: '20px', textDecoration: 'none', display: 'inline-flex' }}>
                    ↩ العودة للوحة التحكم
                </Link>

                {message && <div className="error-box">{message}</div>}

                {course ? (
                    <>
                        <div className="hero-card" style={{ textAlign: 'right', padding: '32px' }}>
                            <h1>{course.title}</h1>
                            <p style={{ marginTop: '12px', fontSize: '1.1rem' }}>{course.description}</p>
                            <div style={{ marginTop: '16px' }}>
                                <span className="tag" style={{ marginLeft: '12px' }}>اللغة: {course.language}</span>
                                <span className="tag">المستوى: {course.level}</span>
                            </div>
                        </div>

                        <h2>خريطة الطريق البرمجية 🗺️</h2>
                        <p style={{ marginBottom: '24px' }}>أكمل الدروس خطوة بخطوة لتحصل على شهادتك المعتمدة.</p>

                        <div className="roadmap">
                            {lessons.map((lesson, index) => {
                                const completed = isLessonCompleted(lesson._id);
                                return (
                                    <div key={lesson._id} className="roadmap-item">
                                        <div className="roadmap-number" style={{ background: completed ? 'var(--success-light)' : 'var(--primary-light)', color: completed ? 'var(--success)' : 'var(--primary)' }}>
                                            {index + 1}
                                        </div>
                                        <div className="roadmap-content">
                                            <h3>{lesson.title}</h3>
                                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                                {lesson.content.slice(0, 150)}...
                                            </p>
                                            <div style={{ marginTop: '12px' }}>
                                                <Link href={{ pathname: '/lesson', query: { id: lesson._id } }} className="button small-button">
                                                    {completed ? 'مراجعة الدرس 📖' : 'ابدأ الدرس الآن 🚀'}
                                                </Link>
                                            </div>
                                        </div>
                                        <div style={{ alignSelf: 'center' }}>
                                            <span className={`roadmap-status ${completed ? 'status-completed' : 'status-pending'}`}>
                                                {completed ? 'مكتمل ✓' : 'مستمر ⏳'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <p style={{ textAlign: 'center', marginTop: '40px' }}>جاري التحميل...</p>
                )}
            </section>
        </Layout>
    );
}
