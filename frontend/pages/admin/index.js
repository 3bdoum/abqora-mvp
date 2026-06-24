import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import API from '../../utils/api';

const emptyVideoRow = () => ({
    title: '',
    url: '',
    description: '',
    duration: '',
});

const emptyLessonForm = {
    title: '',
    content: '',
    codeOrgLink: '',
};

const lessonHasVideos = (lesson) => Boolean(
    lesson?.videoUrls?.some((video) => video.url?.trim()) || lesson?.videoUrl?.trim()
);

const getYoutubeEmbedUrl = (url) => {
    if (!url) return '';

    try {
        if (url.includes('/embed/')) return url;
        const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
        if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
        const watchMatch = url.match(/[?&]v=([^&]+)/);
        if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
        const shortsMatch = url.match(/youtube\.com\/shorts\/([^?&/]+)/);
        if (shortsMatch) return `https://www.youtube.com/embed/${shortsMatch[1]}`;
        return '';
    } catch {
        return '';
    }
};

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

    // Lesson video manager state
    const [selectedManageCourseId, setSelectedManageCourseId] = useState('');
    const [courseLessons, setCourseLessons] = useState([]);
    const [selectedLessonId, setSelectedLessonId] = useState('');
    const [lessonForm, setLessonForm] = useState(emptyLessonForm);
    const [videoRows, setVideoRows] = useState([emptyVideoRow()]);
    const [lessonManagerLoading, setLessonManagerLoading] = useState(false);
    const [savingLesson, setSavingLesson] = useState(false);

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

    const selectLessonForEditing = (lesson) => {
        if (!lesson) {
            setSelectedLessonId('');
            setLessonForm(emptyLessonForm);
            setVideoRows([emptyVideoRow()]);
            return;
        }

        setSelectedLessonId(lesson._id);
        setLessonForm({
            title: lesson.title || '',
            content: lesson.content || '',
            codeOrgLink: lesson.codeOrgLink || '',
        });

        const rows = lesson.videoUrls?.length
            ? lesson.videoUrls
            : (lesson.videoUrl ? [{ title: 'الشرح المرئي', url: lesson.videoUrl }] : []);

        setVideoRows(rows.length ? rows.map((video) => ({
            title: video.title || '',
            url: video.url || '',
            description: video.description || '',
            duration: video.duration || '',
        })) : [emptyVideoRow()]);
    };

    const fetchLessonsForCourse = async (courseId, preferredLessonId = '') => {
        if (!courseId) {
            setCourseLessons([]);
            selectLessonForEditing(null);
            return [];
        }

        setLessonManagerLoading(true);
        try {
            const { data } = await API.get(`/lessons/course/${courseId}`);
            const sortedLessons = [...data].sort((a, b) => a.order - b.order);
            setCourseLessons(sortedLessons);
            const lessonToSelect = sortedLessons.find((lesson) => lesson._id === preferredLessonId)
                || sortedLessons.find((lesson) => lesson._id === selectedLessonId)
                || sortedLessons[0];
            selectLessonForEditing(lessonToSelect);
            return sortedLessons;
        } catch (err) {
            setMessage('تعذر تحميل دروس الدورة لإدارة الفيديوهات');
            setCourseLessons([]);
            selectLessonForEditing(null);
            return [];
        } finally {
            setLessonManagerLoading(false);
        }
    };

    const fetchData = async () => {
        try {
            const subRes = await API.get('/submissions');
            setSubmissions(subRes.data);

            const coursesRes = await API.get('/courses');
            setCourses(coursesRes.data);
            const firstCourseId = coursesRes.data[0]?._id || '';
            const courseIdForManager = selectedManageCourseId || selectedCourseId || firstCourseId;
            if (firstCourseId) {
                setSelectedCourseId((current) => current || firstCourseId);
                setSelectedManageCourseId((current) => current || courseIdForManager);
                await fetchLessonsForCourse(courseIdForManager, selectedLessonId);
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
            const videoUrls = newLessonVideo
                .split('\n')
                .map((url) => url.trim())
                .filter(Boolean)
                .map((url, index) => ({
                    title: `شرح الدرس ${index + 1}`,
                    url,
                }));

            await API.post('/lessons', {
                title: newLessonTitle,
                content: newLessonContent,
                videoUrl: videoUrls[0]?.url || '',
                videoUrls,
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

    const handleManageCourseChange = async (courseId) => {
        setSelectedManageCourseId(courseId);
        await fetchLessonsForCourse(courseId, '');
    };

    const updateVideoRow = (index, field, value) => {
        setVideoRows((rows) => rows.map((row, rowIndex) => (
            rowIndex === index ? { ...row, [field]: value } : row
        )));
    };

    const addVideoRow = () => {
        setVideoRows((rows) => [...rows, emptyVideoRow()]);
    };

    const removeVideoRow = (index) => {
        setVideoRows((rows) => {
            const nextRows = rows.filter((_, rowIndex) => rowIndex !== index);
            return nextRows.length ? nextRows : [emptyVideoRow()];
        });
    };

    const handleUpdateLesson = async (e) => {
        e.preventDefault();
        if (!selectedLessonId) return;

        setSavingLesson(true);
        try {
            const cleanedVideos = videoRows
                .map((video) => ({
                    title: video.title.trim(),
                    url: video.url.trim(),
                    description: video.description.trim(),
                    duration: video.duration.trim(),
                }))
                .filter((video) => video.url);

            await API.put(`/lessons/${selectedLessonId}`, {
                title: lessonForm.title,
                content: lessonForm.content,
                codeOrgLink: lessonForm.codeOrgLink,
                videoUrl: cleanedVideos[0]?.url || '',
                videoUrls: cleanedVideos,
            });
            setMessage('تم حفظ بيانات الدرس وفيديوهات الشرح بنجاح ✅');
            await fetchLessonsForCourse(selectedManageCourseId, selectedLessonId);
        } catch (err) {
            setMessage(`تعذر حفظ بيانات الدرس: ${err.response?.data?.message || 'تحقق من الروابط والبيانات'}`);
        } finally {
            setSavingLesson(false);
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

    const selectedLesson = courseLessons.find((lesson) => lesson._id === selectedLessonId);
    const missingVideoCount = courseLessons.filter((lesson) => !lessonHasVideos(lesson)).length;
    const readyVideoCount = Math.max(courseLessons.length - missingVideoCount, 0);
    const previewVideo = videoRows.find((video) => video.url.trim());
    const previewEmbedUrl = getYoutubeEmbedUrl(previewVideo?.url || '');

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

                                <label>روابط فيديوهات الشرح العربي (YouTube)</label>
                                <textarea
                                    value={newLessonVideo} 
                                    onChange={(e) => setNewLessonVideo(e.target.value)} 
                                    placeholder={'ضع كل رابط في سطر مستقل:\nhttps://www.youtube.com/watch?v=...\nhttps://youtu.be/...'}
                                    rows="3"
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

                        {/* Lesson Video Manager */}
                        <div className="card admin-lesson-manager">
                            <div className="lesson-manager-header">
                                <div>
                                    <span className="eyebrow">مركز جاهزية المحتوى</span>
                                    <h2>إدارة فيديوهات الدروس 🎬</h2>
                                    <p>اختر درساً، أضف فيديو شرح واحد أو أكثر، ثم احفظ. سيظهر الشرح للطالب قبل تطبيق Code.org.</p>
                                </div>
                                <div className="lesson-manager-summary">
                                    <span><strong>{courseLessons.length}</strong> درس</span>
                                    <span className="ready"><strong>{readyVideoCount}</strong> جاهز</span>
                                    <span className={missingVideoCount ? 'missing' : 'ready'}><strong>{missingVideoCount}</strong> بلا فيديو</span>
                                </div>
                            </div>

                            <label>اختر الدورة لإدارة دروسها</label>
                            <select
                                value={selectedManageCourseId}
                                onChange={(e) => handleManageCourseChange(e.target.value)}
                            >
                                {courses.map((course) => (
                                    <option key={course._id} value={course._id}>{course.title}</option>
                                ))}
                            </select>

                            <div className="lesson-manager-layout">
                                <aside className="lesson-picker">
                                    {lessonManagerLoading ? (
                                        <p className="muted-text">جاري تحميل الدروس...</p>
                                    ) : courseLessons.length === 0 ? (
                                        <p className="muted-text">لا توجد دروس في هذه الدورة بعد.</p>
                                    ) : courseLessons.map((lesson) => (
                                        <button
                                            type="button"
                                            key={lesson._id}
                                            className={`lesson-picker-button ${selectedLessonId === lesson._id ? 'active' : ''}`}
                                            onClick={() => selectLessonForEditing(lesson)}
                                        >
                                            <span>درس {lesson.order}</span>
                                            <strong>{lesson.title}</strong>
                                            {lessonHasVideos(lesson) ? (
                                                <small className="ready-video-badge">✓ لديه فيديو</small>
                                            ) : (
                                                <small className="missing-video-badge">ينقصه فيديو</small>
                                            )}
                                        </button>
                                    ))}
                                </aside>

                                <form className="lesson-video-editor" onSubmit={handleUpdateLesson}>
                                    {selectedLesson ? (
                                        <>
                                            <div className="editor-heading-row">
                                                <div>
                                                    <span className="tag">الدرس {selectedLesson.order}</span>
                                                    <h3>{selectedLesson.title}</h3>
                                                </div>
                                                {!lessonHasVideos(selectedLesson) && (
                                                    <span className="missing-video-badge large">يحتاج فيديو شرح</span>
                                                )}
                                            </div>

                                            <label>عنوان الدرس</label>
                                            <input
                                                value={lessonForm.title}
                                                onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                                                required
                                            />

                                            <label>ملخص الدرس</label>
                                            <textarea
                                                value={lessonForm.content}
                                                onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                                                rows="3"
                                                required
                                            />

                                            <label>رابط تطبيق Code.org للطلاب</label>
                                            <input
                                                value={lessonForm.codeOrgLink}
                                                onChange={(e) => setLessonForm({ ...lessonForm, codeOrgLink: e.target.value })}
                                                placeholder="https://studio.code.org/courses/.../lessons/1/levels/1"
                                            />

                                            <div className="video-editor-list">
                                                <div className="editor-heading-row compact">
                                                    <h3>فيديوهات الشرح</h3>
                                                    <button type="button" className="button secondary small-button" onClick={addVideoRow}>
                                                        + إضافة فيديو
                                                    </button>
                                                </div>

                                                {videoRows.map((video, index) => (
                                                    <div key={`video-row-${index}`} className="video-editor-row">
                                                        <div className="video-row-title">
                                                            <span>فيديو {index + 1}</span>
                                                            <button
                                                                type="button"
                                                                className="text-link danger-link"
                                                                onClick={() => removeVideoRow(index)}
                                                            >
                                                                حذف
                                                            </button>
                                                        </div>

                                                        <div className="video-field-grid">
                                                            <input
                                                                value={video.title}
                                                                onChange={(e) => updateVideoRow(index, 'title', e.target.value)}
                                                                placeholder="عنوان الفيديو"
                                                            />
                                                            <input
                                                                value={video.duration}
                                                                onChange={(e) => updateVideoRow(index, 'duration', e.target.value)}
                                                                placeholder="المدة مثل 04:30"
                                                            />
                                                        </div>
                                                        <input
                                                            value={video.url}
                                                            onChange={(e) => updateVideoRow(index, 'url', e.target.value)}
                                                            placeholder="https://www.youtube.com/watch?v=..."
                                                        />
                                                        <textarea
                                                            value={video.description}
                                                            onChange={(e) => updateVideoRow(index, 'description', e.target.value)}
                                                            placeholder="وصف قصير لما يشرحه الفيديو"
                                                            rows="2"
                                                        />
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="video-preview-box">
                                                <strong>معاينة أول فيديو</strong>
                                                {previewEmbedUrl ? (
                                                    <iframe
                                                        src={previewEmbedUrl}
                                                        title="معاينة فيديو الشرح"
                                                        loading="lazy"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                        allowFullScreen
                                                    />
                                                ) : (
                                                    <p>أضف رابط YouTube صالحاً لعرض المعاينة هنا.</p>
                                                )}
                                            </div>

                                            <button type="submit" className="button" disabled={savingLesson}>
                                                {savingLesson ? 'جاري الحفظ...' : 'حفظ تحديثات الدرس'}
                                            </button>
                                        </>
                                    ) : (
                                        <p className="muted-text">اختر درساً من القائمة لبدء التحرير.</p>
                                    )}
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </Layout>
    );
}
