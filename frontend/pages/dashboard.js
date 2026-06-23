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
        } else if (role === 'teacher') {
            router.push('/teacher/dashboard');
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
            const courseRes = await API.get('/courses');
            setCourses(courseRes.data);
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
        return course.progress?.percentage || 0;
    };

    const enrolledCourses = courses.filter((course) => course.progress?.enrolled);
    const completedLessons = courses.reduce((total, course) => total + (course.progress?.completedCount || 0), 0);
    const totalLessons = courses.reduce((total, course) => total + (course.lessonCount || course.lessons?.length || 0), 0);
    const activeCourse = enrolledCourses.find((course) => course.progress?.status !== 'completed') || courses[0];
    const progressSummary = [
        { label: 'الدورات المسجلة', value: enrolledCourses.length, icon: '📚' },
        { label: 'الدروس المكتملة', value: `${completedLessons}/${totalLessons || 0}`, icon: '✅' },
        { label: 'مشاريع مرسلة', value: submissions.length, icon: '🛠️' },
    ];

    return (
    <Layout>
        <section className="page shell rtl dashboard-page">

            <div className="dashboard-layout">

                <div className="dashboard-content">

                    <div className="dashboard-hero-card">
                        <div className="dashboard-hero-copy">
                            <span className="eyebrow">مساحتك التعليمية</span>
                            <h1>أهلاً بك يا {profile.name || 'بطل عبقورا'} 👋</h1>
                            <p>
                                واصل رحلتك خطوة بخطوة. كل درس يفتح التالي بعد الإنجاز ومراجعة المعلم.
                            </p>
                            <div className="hero-chip-row">
                                {profile.ageGroup && <span className="tag">{getAgeLabel(profile.ageGroup)}</span>}
                                <span className="tag soft-tag">تعلم ذاتي بإشراف آمن</span>
                            </div>
                        </div>

                        <div className="dashboard-next-card">
                            <span>الخطوة التالية</span>
                            <strong>{activeCourse ? activeCourse.title : 'اختر دورة للبدء'}</strong>
                            <p>
                                {activeCourse?.progress?.enrolled
                                    ? `${activeCourse.progress.percentage || 0}% مكتمل — تابع من خريطة الدروس.`
                                    : 'ابدأ بأول دورة مناسبة لعمر الطالب.'}
                            </p>
                            {activeCourse && (
                                <button
                                    type="button"
                                    className="button"
                                    onClick={() => router.push({ pathname: '/course', query: { id: activeCourse._id } })}
                                >
                                    {activeCourse.progress?.enrolled ? 'متابعة التعلم' : 'استعراض الدورة'}
                                </button>
                            )}
                        </div>
                    </div>

                    {message && <div className="error-box">{message}</div>}

                    <div className="dashboard-stat-grid">
                        {progressSummary.map((item) => (
                            <div className="dashboard-stat-card" key={item.label}>
                                <span aria-hidden="true">{item.icon}</span>
                                <strong>{item.value}</strong>
                                <p>{item.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Progress Visualizer */}
                    {courses.length > 0 && (
                        <div className="learning-progress-panel">
                            <div className="section-heading compact-heading">
                                <div>
                                    <span className="eyebrow">المتابعة اليومية</span>
                                    <h2>مسار تعلمك 📈</h2>
                                </div>
                                <p>نظرة سريعة على الدورات التي بدأت بها.</p>
                            </div>

                            {enrolledCourses.length === 0 && (
                                <div className="empty-state-card">
                                    <strong>لم تبدأ أي دورة بعد.</strong>
                                    <p>اختر دورة من الدليل بالأسفل وسنفتح لك الدرس الأول فور التسجيل.</p>
                                </div>
                            )}

                            {enrolledCourses.map((course) => {
                                const pct = calculatePct(course);

                                return (
                                    <div key={course._id} className="learning-course-card">
                                        <div className="learning-course-header">
                                            <div>
                                                <span className="eyebrow">دورة قيد التعلم</span>
                                                <h3>{course.title}</h3>
                                            </div>
                                            <strong>{pct}%</strong>
                                        </div>

                                        <div className="progress-bar-container">
                                            <div
                                                className="progress-bar"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>

                                        <div className="certificate-mini-card">
                                            <h3>شهادة الدورة 🏆</h3>

                                            {course.progress?.certificateUrl ? (
                                                <div>
                                                    <p className="certificate-ready-copy">
                                                        تهانينا! لقد حصلت على شهادة الدورة.
                                                    </p>

                                                    <a
                                                        href={withBasePath(course.progress.certificateUrl)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="button btn-success"
                                                    >
                                                        عرض وتحميل الشهادة المعتمدة 🎓
                                                    </a>
                                                </div>
                                            ) : (
                                                <div>
                                                    <p>
                                                        احصل على شهادتك الموثقة عند إتمام جميع الدروس بنسبة 100% واجتياز كل الاختبارات بنسبة نجاح (70% فأكثر).
                                                    </p>

                                                    {certError && (
                                                        <div className="error-box compact-alert multiline-alert">
                                                            {certError}
                                                        </div>
                                                    )}

                                                    {certSuccess && (
                                                        <div className="success-box compact-alert">
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

                    <div className="catalog-dashboard-section">
                        <div className="section-heading compact-heading">
                            <div>
                                <span className="eyebrow">دليل الدورات</span>
                                <h2>دوراتك التعليمية 📚</h2>
                            </div>
                            <p>اختر مساراً ثم تابع تقدمه من خريطة الدروس.</p>
                        </div>

                        <div className="grid-cards">
                            {courses.map((course) => (
                                <CourseCard
                                    key={course._id}
                                    course={course}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="projects-section">
                        <div className="section-heading compact-heading">
                            <div>
                                <span className="eyebrow">إبداعاتك</span>
                                <h2>مشاريعك البرمجية 🛠️</h2>
                            </div>
                        </div>

                        {submissions.length === 0 ? (
                            <div className="empty-state-card">
                                <strong>لا توجد مشاريع بعد.</strong>
                                <p>ابدأ بالدروس، وعندما تصل إلى مشروع سنحفظه هنا للمراجعة.</p>
                            </div>
                        ) : (
                            <div className="grid-cards">
                                {submissions.map((sub) => (
                                    <div key={sub._id} className="card project-card">
                                        <h3>
                                            الدرس: {sub.lesson?.title}
                                        </h3>

                                        <p>
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
