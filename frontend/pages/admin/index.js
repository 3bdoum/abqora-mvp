import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import API from '../../utils/api';

export default function AdminDashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('submissions');
    const [submissions, setSubmissions] = useState([]);
    const [courses, setCourses] = useState([]);
    const [message, setMessage] = useState('');
    
    // Create course form state
    const [newCourseTitle, setNewCourseTitle] = useState('');
    const [newCourseDesc, setNewCourseDesc] = useState('');
    
    // Add lesson form state
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [newLessonTitle, setNewLessonTitle] = useState('');
    const [newLessonContent, setNewLessonContent] = useState('');
    const [newLessonVideo, setNewLessonVideo] = useState('');
    const [newLessonCodeLink, setNewLessonCodeLink] = useState('');
    const [newLessonOrder, setNewLessonOrder] = useState('1');

    // Review submission state
    const [feedbacks, setFeedbacks] = useState({});

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole');

        if (!token) {
            router.push('/login');
            return;
        }

        if (role !== 'admin') {
            router.push('/dashboard');
            return;
        }

        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const subRes = await API.get('/submissions');
            setSubmissions(subRes.data);

            const coursesRes = await API.get('/courses');
            setCourses(coursesRes.data);
            if (coursesRes.data.length > 0) {
                setSelectedCourseId(coursesRes.data[0]._id);
            }
        } catch (err) {
            setMessage('تعذر تحميل البيانات للمشرف');
        }
    };

    const handleCreateCourse = async (e) => {
        e.preventDefault();
        if (!newCourseTitle || !newCourseDesc) return;
        try {
            await API.post('/courses', { title: newCourseTitle, description: newCourseDesc });
            setMessage('تم إنشاء الدورة الجديدة بنجاح! 🎉');
            setNewCourseTitle('');
            setNewCourseDesc('');
            fetchData();
        } catch (err) {
            setMessage('تعذر إنشاء الدورة الجديدة');
        }
    };

    const handleCreateLesson = async (e) => {
        e.preventDefault();
        if (!selectedCourseId || !newLessonTitle || !newLessonContent) return;
        try {
            // Wait, we need a post route for creating lessons in backend!
            // Let's check: in courseController.js there is only getCourses, getCourseById, createCourse.
            // Let's look: is there a lesson creation endpoint?
            // In backend routes/lessonRoutes.js we only see getLessonsByCourse, getLessonById.
            // Oh! No lesson creation backend endpoint!
            // We should add it or handle it cleanly.
            // Let's first look: since this is an MVP, we can add a route to create lessons in lessonRoutes.js and lessonController.js!
            // Let's implement that to make the Course Builder work.
            // But let's build this frontend form first.
            await API.post('/lessons', {
                title: newLessonTitle,
                content: newLessonContent,
                videoUrl: newLessonVideo,
                codeOrgLink: newLessonCodeLink,
                course: selectedCourseId,
                order: parseInt(newLessonOrder)
            });
            setMessage('تمت إضافة الدرس الجديد بنجاح! 🚀');
            setNewLessonTitle('');
            setNewLessonContent('');
            setNewLessonVideo('');
            setNewLessonCodeLink('');
            setNewLessonOrder((prev) => (parseInt(prev) + 1).toString());
            fetchData();
        } catch (err) {
            setMessage('تعذر إضافة الدرس الجديد. تأكد من إعداد المسارات.');
        }
    };

    const handleReview = async (subId, status) => {
        const feedbackText = feedbacks[subId] || '';
        try {
            await API.put(`/submissions/${subId}/review`, {
                status,
                feedback: feedbackText
            });
            setMessage('تم تحديث حالة المشروع وإرسال التغذية الراجعة بنجاح! ✍️');
            fetchData(); // Refresh submissions list
        } catch (err) {
            setMessage('تعذر تحديث حالة المشروع');
        }
    };

    const handleFeedbackChange = (subId, val) => {
        setFeedbacks({
            ...feedbacks,
            [subId]: val
        });
    };

    return (
        <Layout>
            <section className="page shell rtl">
                <div className="dashboard-header">
                    <div>
                        <h1>لوحة المعلم والإدارة 🎓</h1>
                        <p>راجع تقديمات مشاريع الطلاب، وأضف المناهج والدروس البرمجية.</p>
                    </div>
                </div>

                {message && (
                    <div className="success-box" style={{ background: message.includes('تعذر') ? 'var(--danger-light)' : 'var(--success-light)', color: message.includes('تعذر') ? 'var(--danger)' : 'var(--success)' }}>
                        {message}
                    </div>
                )}

                {/* Tabs */}
                <div className="tabs-header">
                    <button 
                        onClick={() => setActiveTab('submissions')} 
                        className={`tab-btn ${activeTab === 'submissions' ? 'active' : ''}`}
                    >
                        مراجعة مشاريع الطلاب ({submissions.filter(s => s.status === 'pending').length} معلق)
                    </button>
                    <button 
                        onClick={() => setActiveTab('curriculum')} 
                        className={`tab-btn ${activeTab === 'curriculum' ? 'active' : ''}`}
                    >
                        إدارة المناهج والدروس 📚
                    </button>
                </div>

                {/* Submissions Tab */}
                {activeTab === 'submissions' && (
                    <div>
                        <h2>مراجعة التقديمات البرمجية 🛠️</h2>
                        {submissions.length === 0 ? (
                            <p style={{ textAlign: 'center', margin: '40px 0', color: 'var(--text-muted)' }}>
                                لا توجد تقديمات مسجلة على المنصة حتى الآن.
                            </p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                                {submissions.map((sub) => (
                                    <div key={sub._id} className="card" style={{ borderRight: sub.status === 'approved' ? '6px solid var(--success)' : sub.status === 'rejected' ? '6px solid var(--danger)' : '6px solid var(--warning)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
                                            <div>
                                                <strong>الطالب:</strong> {sub.user?.name} ({sub.user?.email})
                                            </div>
                                            <div style={{ color: 'var(--text-muted)' }}>
                                                <strong>الدرس:</strong> {sub.lesson?.title}
                                            </div>
                                            <div>
                                                <span className={`tag ${sub.status === 'approved' ? 'status-completed' : sub.status === 'rejected' ? 'status-locked' : 'status-pending'}`}>
                                                    {sub.status === 'approved' ? 'تم القبول ✅' : sub.status === 'rejected' ? 'يحتاج تعديل ❌' : 'قيد الانتظار ⏳'}
                                                </span>
                                            </div>
                                        </div>

                                        <p style={{ marginBottom: '12px', color: 'var(--text)' }}>
                                            <strong>الوصف من الطالب:</strong> {sub.description}
                                        </p>

                                        <div style={{ marginBottom: '20px' }}>
                                            <strong>رابط العمل البرمجي:</strong>{' '}
                                            <a href={sub.projectUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                                                فتح المشروع في نافذة جديدة 🔗
                                            </a>
                                        </div>

                                        {/* Review Input */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#f8fafc', padding: '16px', borderRadius: '16px' }}>
                                            <label style={{ fontSize: '0.85rem', marginBottom: '4px' }}>ملاحظات المعلم والتغذية الراجعة</label>
                                            <textarea 
                                                value={feedbacks[sub._id] !== undefined ? feedbacks[sub._id] : sub.feedback} 
                                                onChange={(e) => handleFeedbackChange(sub._id, e.target.value)} 
                                                placeholder="اكتب تعليقاً لمساعدة الطالب على التحسين أو الثناء على عمله..."
                                                rows="2"
                                                style={{ marginBottom: '12px', padding: '10px' }}
                                            />
                                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                                <button 
                                                    onClick={() => handleReview(sub._id, 'rejected')} 
                                                    className="button btn-danger small-button"
                                                >
                                                    طلب تعديل (رفض ❌)
                                                </button>
                                                <button 
                                                    onClick={() => handleReview(sub._id, 'approved')} 
                                                    className="button btn-success small-button"
                                                >
                                                    قبول المشروع (نجاح ✅)
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Curriculum Tab */}
                {activeTab === 'curriculum' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start' }}>
                        
                        {/* Course Creator Form */}
                        <div className="card">
                            <h2>إنشاء دورة جديدة 📚</h2>
                            <form onSubmit={handleCreateCourse}>
                                <label>عنوان الدورة</label>
                                <input 
                                    value={newCourseTitle} 
                                    onChange={(e) => setNewCourseTitle(e.target.value)} 
                                    placeholder="مثال: أساسيات بايثون للأطفال" 
                                    required 
                                />

                                <label>وصف الدورة</label>
                                <textarea 
                                    value={newCourseDesc} 
                                    onChange={(e) => setNewCourseDesc(e.target.value)} 
                                    placeholder="اكتب وصفاً جذاباً لمحتوى الدورة وأهدافها..." 
                                    rows="4" 
                                    required 
                                />

                                <button type="submit" className="button" style={{ width: '100%' }}>إنشاء الدورة</button>
                            </form>
                        </div>

                        {/* Lesson Creator Form */}
                        <div className="card">
                            <h2>إضافة درس جديد 🚀</h2>
                            <form onSubmit={handleCreateLesson}>
                                <label>اختر الدورة</label>
                                <select 
                                    value={selectedCourseId} 
                                    onChange={(e) => setSelectedCourseId(e.target.value)}
                                    style={{ marginBottom: '20px' }}
                                >
                                    {courses.map(c => (
                                        <option key={c._id} value={c._id}>{c.title}</option>
                                    ))}
                                </select>

                                <label>عنوان الدرس</label>
                                <input 
                                    value={newLessonTitle} 
                                    onChange={(e) => setNewLessonTitle(e.target.value)} 
                                    placeholder="مثال: الدرس 7: المتغيرات البرمجية" 
                                    required 
                                />

                                <label>محتوى الشرح والنص</label>
                                <textarea 
                                    value={newLessonContent} 
                                    onChange={(e) => setNewLessonContent(e.target.value)} 
                                    placeholder="اكتب ملخص الشرح والأهداف للدرس..." 
                                    rows="4" 
                                    required 
                                />

                                <label>رابط فيديو الشرح العربي (YouTube embed URL)</label>
                                <input 
                                    value={newLessonVideo} 
                                    onChange={(e) => setNewLessonVideo(e.target.value)} 
                                    placeholder="https://www.youtube.com/embed/..." 
                                />

                                <label>رابط النشاط العملي (Code.org Link)</label>
                                <input 
                                    value={newLessonCodeLink} 
                                    onChange={(e) => setNewLessonCodeLink(e.target.value)} 
                                    placeholder="https://studio.code.org/s/..." 
                                />

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                                    <div>
                                        <label>ترتيب الدرس</label>
                                        <input 
                                            type="number"
                                            value={newLessonOrder} 
                                            onChange={(e) => setNewLessonOrder(e.target.value)} 
                                            placeholder="1"
                                            min="1"
                                            required 
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="button" style={{ width: '100%', marginTop: '10px' }}>إضافة الدرس للدورة</button>
                            </form>
                        </div>
                    </div>
                )}
            </section>
        </Layout>
    );
}
