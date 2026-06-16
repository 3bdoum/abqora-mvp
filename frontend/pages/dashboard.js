import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import CourseCard from '../components/CourseCard';
import API from '../utils/api';
import SideVideo from "../components/SideVideo";
import { withBasePath } from '../utils/paths';

export default function Dashboard() {
    const router = useRouter();
    const [courses, setCourses] = useState([]);
    const [message, setMessage] = useState('');
    const [studentProgress, setStudentProgress] = useState(null);
    const [submittingCert, setSubmittingCert] = useState(false);
    const [certError, setCertError] = useState('');
    const [certSuccess, setCertSuccess] = useState('');
    const [submissions, setSubmissions] = useState([]);
    const [profile, setProfile] = useState({ name: '', role: '', ageGroup: '' });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        const name = localStorage.getItem('userName');
        const role = localStorage.getItem('userRole');
        const ageGroup = localStorage.getItem('userAgeGroup');
        setProfile({ name, role, ageGroup });

        // Role redirector
        if (role === 'parent') {
            router.push('/parent/dashboard');
            return;
        } else if (role === 'admin') {
            router.push('/admin');
            return;
        }

        // Fetch courses and student submissions/progress
        const fetchData = async () => {
            try {
                // Fetch course list
                const courseRes = await API.get('/courses');
                setCourses(courseRes.data);

                // Fetch student progress for the primary course
                if (courseRes.data.length > 0) {
                    const primaryCourseId = courseRes.data[0]._id;
                    const progressRes = await API.get(`/progress/${primaryCourseId}`);
                    setStudentProgress(progressRes.data);
                }

                // Fetch submissions
                const subRes = await API.get('/submissions');
                setSubmissions(subRes.data);
            } catch (err) {
                setMessage('تعذر تحميل بيانات لوحة التحكم');
            }
        };

        fetchData();
    }, []);

    // Get certificate request
    const claimCertificate = async (courseId) => {
        setSubmittingCert(true);
        setCertError('');
        setCertSuccess('');
        try {
            const response = await API.post('/progress/verify-certificate', { courseId });
            setCertSuccess('تم إنشاء الشهادة بنجاح! يمكنك الآن مشاهدتها وتحميلها.');
            // Reload progress to update the certificate link
            const progressRes = await API.get(`/progress/${courseId}`);
            setStudentProgress(progressRes.data);
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'لم تكتمل شروط استحقاق الشهادة بعد.';
            const details = err.response?.data?.details;
            if (details && details.length > 0) {
                setCertError(`${errorMsg}\n\n• ${details.join('\n• ')}`);
            } else {
                setCertError(errorMsg);
            }
        } finally {
            setSubmittingCert(false);
        }
    };

    // Helper to translate age range Arabic label
    const getAgeLabel = (age) => {
        if (age === '5-8') return 'سن 5-8 سنوات 🧸';
        if (age === '9-12') return 'سن 9-12 سنة 🚀';
        if (age === '13-16') return 'سن 13-16 سنة 💻';
        return '';
    };

    // Calculate completion percentage
    const calculatePct = (course) => {
        if (!studentProgress || !course.lessons) return 0;
        const total = course.lessons.length;
        const completed = studentProgress.completedLessons ? studentProgress.completedLessons.length : 0;
        return total > 0 ? Math.round((completed / total) * 100) : 0;
    };

    return (
    <Layout>
        <section className="page shell rtl">

            <div className="dashboard-layout">

                <div className="dashboard-content">

                    <div className="hero-card">
                        <h1>أهلاً بك يا {profile.name} 👋</h1>
                        <p style={{ marginTop: '8px', fontSize: '1.1rem' }}>
                            الفئة العمرية: <span className="tag">{getAgeLabel(profile.ageGroup)}</span>
                        </p>
                        <p style={{ marginTop: '12px' }}>
                            واصل رحلتك التعليمية وابنِ ألعابك الأولى المدهشة!
                        </p>
                    </div>

                    {message && <div className="error-box">{message}</div>}

                    {/* Progress Visualizer */}
                    {courses.length > 0 && studentProgress && (
                        <div className="card" style={{ marginBottom: '32px' }}>
                            <h2>مسار تعلمك 📈</h2>

                            {courses.map((course) => {
                                const pct = calculatePct(course);

                                return (
                                    <div key={course._id} style={{ marginTop: '16px' }}>
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            <span>دورة: {course.title}</span>
                                            <span>{pct}% مكتمل</span>
                                        </div>

                                        <div className="progress-bar-container">
                                            <div
                                                className="progress-bar"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>

                                        <div
                                            style={{
                                                marginTop: '20px',
                                                padding: '16px',
                                                background: '#f8fafc',
                                                borderRadius: '16px',
                                                border: '1px solid #e2e8f0'
                                            }}
                                        >
                                            <h3
                                                style={{
                                                    fontSize: '1.1rem',
                                                    marginBottom: '8px'
                                                }}
                                            >
                                                شهادة الدورة 🏆
                                            </h3>

                                            {studentProgress.certificateUrl ? (
                                                <div>
                                                    <p
                                                        style={{
                                                            color: 'var(--success)',
                                                            fontWeight: 'bold',
                                                            marginBottom: '12px'
                                                        }}
                                                    >
                                                        تهانينا! لقد حصلت على شهادة الدورة.
                                                    </p>

                                                    <a
                                                        href={withBasePath(studentProgress.certificateUrl)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="button btn-success"
                                                    >
                                                        عرض وتحميل الشهادة المعتمدة 🎓
                                                    </a>
                                                </div>
                                            ) : (
                                                <div>
                                                    <p
                                                        style={{
                                                            fontSize: '0.9rem',
                                                            marginBottom: '12px'
                                                        }}
                                                    >
                                                        احصل على شهادتك الموثقة عند إتمام جميع الدروس بنسبة 100% واجتياز كل الاختبارات بنسبة نجاح (70% فأكثر).
                                                    </p>

                                                    {certError && (
                                                        <div
                                                            className="error-box"
                                                            style={{
                                                                whiteSpace: 'pre-line',
                                                                fontSize: '0.9rem',
                                                                padding: '12px'
                                                            }}
                                                        >
                                                            {certError}
                                                        </div>
                                                    )}

                                                    {certSuccess && (
                                                        <div
                                                            className="success-box"
                                                            style={{
                                                                fontSize: '0.9rem',
                                                                padding: '12px'
                                                            }}
                                                        >
                                                            {certSuccess}
                                                        </div>
                                                    )}

                                                    <button
                                                        onClick={() => claimCertificate(course._id)}
                                                        className="button"
                                                        disabled={submittingCert}
                                                    >
                                                        {submittingCert
                                                            ? 'جاري التحقق من الشروط...'
                                                            : 'طلب شهادة الإتمام 🎖️'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div style={{ marginBottom: '32px' }}>
                        <h2>دوراتك التعليمية 📚</h2>

                        <div className="grid-cards">
                            {courses.map((course) => (
                                <CourseCard
                                    key={course._id}
                                    course={course}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <h2>مشاريعك البرمجية 🛠️</h2>

                        {submissions.length === 0 ? (
                            <div
                                className="card"
                                style={{
                                    textAlign: 'center',
                                    color: 'var(--text-muted)'
                                }}
                            >
                                لم تقم بتقديم أي مشاريع حتى الآن. ابدأ بالدروس وقدم مشاريعك!
                            </div>
                        ) : (
                            <div className="grid-cards">
                                {submissions.map((sub) => (
                                    <div key={sub._id} className="card">
                                        <h3 style={{ fontSize: '1.1rem' }}>
                                            الدرس: {sub.lesson?.title}
                                        </h3>

                                        <p
                                            style={{
                                                fontSize: '0.85rem',
                                                color: 'var(--text-muted)'
                                            }}
                                        >
                                            تاريخ التقديم:
                                            {' '}
                                            {new Date(sub.createdAt).toLocaleDateString('ar-EG')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>

                <SideVideo />

            </div>

        </section>
    </Layout>
);
}
