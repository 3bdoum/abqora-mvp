import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import API from '../../utils/api';
import { withBasePath } from '../../utils/paths';

export default function ParentDashboard() {
    const router = useRouter();
    const [children, setChildren] = useState([]);
    const [selectedChild, setSelectedChild] = useState(null);
    const [childProgress, setChildProgress] = useState(null);
    const [courses, setCourses] = useState([]);
    
    // Add child form state
    const [studentEmail, setStudentEmail] = useState('');
    const [linkMessage, setLinkMessage] = useState('');
    const [linkError, setLinkError] = useState('');
    const [linking, setLinking] = useState(false);
    
    const [message, setMessage] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole');

        if (!token) {
            router.push('/login');
            return;
        }

        if (role !== 'parent' && role !== 'admin') {
            router.push('/dashboard');
            return;
        }

        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            // Fetch linked children list
            const kidsRes = await API.get('/auth/linked-students');
            setChildren(kidsRes.data);

            // Fetch course list
            const coursesRes = await API.get('/courses');
            setCourses(coursesRes.data);

            if (kidsRes.data.length > 0) {
                selectChild(kidsRes.data[0], coursesRes.data[0]?._id);
            }
        } catch (err) {
            setMessage('تعذر تحميل بيانات لوحة المتابعة');
        }
    };

    const selectChild = async (child, courseId) => {
        setSelectedChild(child);
        setChildProgress(null);
        if (!courseId && courses.length > 0) {
            courseId = courses[0]._id;
        }
        if (!courseId) return;

        try {
            const res = await API.get(`/progress/student/${child._id}/${courseId}`);
            setChildProgress(res.data);
        } catch (err) {
            console.error('تعذر تحميل تقدم الطالب');
        }
    };

    const handleLinkStudent = async (e) => {
        e.preventDefault();
        if (!studentEmail) return;

        setLinking(true);
        setLinkMessage('');
        setLinkError('');

        try {
            const res = await API.post('/auth/link-student', { email: studentEmail });
            setLinkMessage(res.data.message || 'تم ربط حساب الابن بنجاح!');
            setStudentEmail('');
            
            // Re-fetch children list
            const kidsRes = await API.get('/auth/linked-students');
            setChildren(kidsRes.data);
            
            // If nothing was selected, select the newly added kid
            const newKid = kidsRes.data.find(k => k.email.toLowerCase() === studentEmail.toLowerCase());
            if (newKid) {
                selectChild(newKid);
            } else if (kidsRes.data.length > 0) {
                selectChild(kidsRes.data[kidsRes.data.length - 1]);
            }
        } catch (err) {
            setLinkError(err.response?.data?.message || 'عذراً، لم نتمكن من ربط الحساب. تأكد من بريد الطالب وسجلاته.');
        } finally {
            setLinking(false);
        }
    };

    const getAgeLabel = (age) => {
        if (age === '5-8') return '5-8 سنوات';
        if (age === '9-12') return '9-12 سنة';
        if (age === '13-16') return '13-16 سنة';
        return 'غير محدد';
    };

    const calculatePct = (course) => {
        if (!childProgress || !course.lessons) return 0;
        const total = course.lessons.length;
        const completed = childProgress.completedLessons ? childProgress.completedLessons.length : 0;
        return total > 0 ? Math.round((completed / total) * 100) : 0;
    };

    return (
        <Layout>
            <section className="page shell rtl">
                <div className="dashboard-header">
                    <div>
                        <h1>لوحة أولياء الأمور 👨‍👩‍👦</h1>
                        <p>تابع تقدم أبنائك، نتائج اختباراتهم، وشهاداتهم المعتمدة.</p>
                    </div>
                </div>

                {message && <div className="error-box">{message}</div>}

                <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '32px', alignItems: 'start' }}>
                    
                    {/* Right Column: Manage Children & Link Forms */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        
                        {/* Link child account */}
                        <div className="card">
                            <h3>ربط حساب ابن جديد 🔗</h3>
                            {linkMessage && <div className="success-box" style={{ fontSize: '0.85rem', padding: '10px' }}>{linkMessage}</div>}
                            {linkError && <div className="error-box" style={{ fontSize: '0.85rem', padding: '10px' }}>{linkError}</div>}
                            
                            <form onSubmit={handleLinkStudent}>
                                <label style={{ fontSize: '0.85rem' }}>البريد الإلكتروني للطالب</label>
                                <input 
                                    type="email" 
                                    value={studentEmail}
                                    onChange={(e) => setStudentEmail(e.target.value)}
                                    placeholder="student@example.com"
                                    style={{ padding: '10px', fontSize: '0.9rem', marginBottom: '12px' }}
                                    required
                                />
                                <button type="submit" className="button" style={{ width: '100%', padding: '10px' }} disabled={linking}>
                                    {linking ? 'جاري الربط...' : 'ربط الحساب ➕'}
                                </button>
                            </form>
                        </div>

                        {/* Linked Children List */}
                        <div className="card">
                            <h3>قائمة الأبناء المربوطين 👥</h3>
                            {children.length === 0 ? (
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                                    لم تقم بربط أي حساب طالب بعد.
                                </p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                                    {children.map((child) => (
                                        <button
                                            key={child._id}
                                            onClick={() => selectChild(child)}
                                            className={`option ${selectedChild && selectedChild._id === child._id ? 'selected' : ''}`}
                                            style={{ textAlign: 'right', padding: '12px 16px', fontSize: '0.95rem' }}
                                        >
                                            <div style={{ fontWeight: 'bold' }}>{child.name}</div>
                                            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                                                {child.email} • {getAgeLabel(child.ageGroup)}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Left Column: Selected Child Details */}
                    <div>
                        {selectedChild ? (
                            <div className="card" style={{ minHeight: '400px' }}>
                                <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '24px' }}>
                                    <h2>تقرير المتابعة: {selectedChild.name} 🎒</h2>
                                    <p>البريد الإلكتروني: {selectedChild.email} • الفئة العمرية: {getAgeLabel(selectedChild.ageGroup)}</p>
                                </div>

                                {courses.length > 0 && (
                                    <div>
                                        {courses.map((course) => {
                                            const pct = calculatePct(course);
                                            return (
                                                <div key={course._id} style={{ marginBottom: '32px' }}>
                                                    <h3>الدورة الحالية: {course.title}</h3>
                                                    
                                                    {/* Progress bar */}
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginTop: '12px' }}>
                                                        <span>نسبة الإتمام</span>
                                                        <span>{pct}% مكتمل</span>
                                                    </div>
                                                    <div className="progress-bar-container" style={{ margin: '8px 0 20px' }}>
                                                        <div className="progress-bar" style={{ width: `${pct}%` }}></div>
                                                    </div>

                                                    {/* Child Certificate link */}
                                                    {childProgress && childProgress.certificateUrl && (
                                                        <div className="success-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', padding: '14px' }}>
                                                            <span>🏆 حصل {selectedChild.name} على شهادة إتمام الدورة!</span>
                                                            <a href={withBasePath(childProgress.certificateUrl)} target="_blank" rel="noopener noreferrer" className="button btn-success small-button" style={{ textDecoration: 'none' }}>
                                                                عرض الشهادة المعتمدة 🎓
                                                            </a>
                                                        </div>
                                                    )}

                                                    {/* Course Lessons Checklist */}
                                                    <div style={{ marginTop: '24px' }}>
                                                        <h4>الدروس المكتملة 📋</h4>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                                                            {course.lessons?.map((lesson, idx) => {
                                                                const isDone = childProgress?.completedLessons?.some(l => (l._id || l) === lesson._id);
                                                                return (
                                                                    <div key={lesson._id} style={{ display: 'flex', justifyItems: 'center', gap: '12px', padding: '10px 14px', background: '#f8fafc', borderRadius: '10px', fontSize: '0.9rem' }}>
                                                                        <span>{isDone ? '✅' : '⏳'}</span>
                                                                        <span style={{ textDecoration: isDone ? 'line-through' : 'none', color: isDone ? 'var(--text-muted)' : 'var(--text)' }}>
                                                                            الدرس {idx + 1}: {lesson.title}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    {/* Quiz scores history */}
                                                    <div style={{ marginTop: '32px' }}>
                                                        <h4>درجات الاختبارات ✍️</h4>
                                                        {!childProgress || !childProgress.quizResults || childProgress.quizResults.length === 0 ? (
                                                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                                                                لم يقم الطالب بحل أي اختبارات بعد.
                                                            </p>
                                                        ) : (
                                                            <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginTop: '12px' }}>
                                                                {childProgress.quizResults.map((res, i) => {
                                                                    const scorePct = Math.round((res.score / res.total) * 100);
                                                                    const passed = scorePct >= 70;
                                                                    return (
                                                                        <div key={i} className="card" style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px' }}>
                                                                            <h5 style={{ fontSize: '0.9rem', marginBottom: '6px' }}>الاختبار {i + 1}</h5>
                                                                            <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: passed ? 'var(--success)' : 'var(--danger)', margin: '4px 0' }}>
                                                                                {res.score} / {res.total} ({scorePct}%)
                                                                            </p>
                                                                            <span className={`tag ${passed ? 'status-completed' : 'status-locked'}`} style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                                                                                {passed ? 'ناجح ✓' : 'لم يجتز بعد ❌'}
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', color: 'var(--text-muted)' }}>
                                يرجى اختيار طالب من القائمة الجانبية أو ربط حساب طالب جديد لعرض تقرير التقدم.
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </Layout>
    );
}
