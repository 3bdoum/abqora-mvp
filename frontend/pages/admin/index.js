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

const emptyAdForm = {
    badge: '',
    title: '',
    description: '',
    icon: '📣',
    ctaLabel: '',
    ctaHref: '/register',
    audience: 'all',
    active: true,
    order: '1',
    startsAt: '',
    endsAt: '',
};

const formatDateInput = (value) => (
    value ? new Date(value).toISOString().slice(0, 10) : ''
);

const lessonHasVideos = (lesson) => Boolean(
    lesson?.videoUrls?.some((video) => video.url?.trim()) || lesson?.videoUrl?.trim()
);

const lessonHasCodeOrgLink = (lesson) => Boolean(lesson?.codeOrgLink?.trim());
const lessonHasQuiz = (lesson) => Boolean(lesson?.hasQuiz);

const getLessonReadinessIssues = (lesson) => {
    const issues = [];
    if (!lessonHasVideos(lesson)) issues.push({ key: 'video', label: 'ينقصه فيديو شرح' });
    if (!lessonHasCodeOrgLink(lesson)) issues.push({ key: 'codeorg', label: 'ينقصه رابط Code.org' });
    if (!lessonHasQuiz(lesson)) issues.push({ key: 'quiz', label: 'ينقصه اختبار' });
    return issues;
};

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
    const [lessonsByCourse, setLessonsByCourse] = useState({});
    const [readinessCourseFilter, setReadinessCourseFilter] = useState('all');
    const [readinessStatusFilter, setReadinessStatusFilter] = useState('all');

    // Review submission state
    const [feedbacks, setFeedbacks] = useState({});
    const [ads, setAds] = useState([]);
    const [adForm, setAdForm] = useState(emptyAdForm);
    const [editingAdId, setEditingAdId] = useState('');
    const [savingAd, setSavingAd] = useState(false);

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
            setLessonsByCourse((current) => ({ ...current, [courseId]: sortedLessons }));
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

    const fetchAllCourseLessons = async (courseList) => {
        const lessonEntries = await Promise.all(courseList.map(async (course) => {
            try {
                const { data } = await API.get(`/lessons/course/${course._id}`);
                return [course._id, [...data].sort((a, b) => a.order - b.order)];
            } catch {
                return [course._id, []];
            }
        }));
        const lessonMap = Object.fromEntries(lessonEntries);
        setLessonsByCourse(lessonMap);
        return lessonMap;
    };

    const fetchData = async () => {
        try {
            const [subRes, adsRes] = await Promise.all([
                API.get('/submissions'),
                API.get('/ads').catch(() => ({ data: [] })),
            ]);
            setSubmissions(subRes.data);
            setAds(adsRes.data || []);

            const coursesRes = await API.get('/courses');
            setCourses(coursesRes.data);
            const firstCourseId = coursesRes.data[0]?._id || '';
            const courseIdForManager = selectedManageCourseId || selectedCourseId || firstCourseId;
            const lessonMap = await fetchAllCourseLessons(coursesRes.data);
            if (firstCourseId) {
                setSelectedCourseId((current) => current || firstCourseId);
                setSelectedManageCourseId((current) => current || courseIdForManager);
                const selectedLessons = lessonMap[courseIdForManager] || [];
                setCourseLessons(selectedLessons);
                const lessonToSelect = selectedLessons.find((lesson) => lesson._id === selectedLessonId)
                    || selectedLessons[0];
                selectLessonForEditing(lessonToSelect);
            }
        } catch (err) {
            setMessage('تعذر تحميل البيانات للمشرف');
        }
    };

    const resetAdForm = () => {
        setAdForm(emptyAdForm);
        setEditingAdId('');
    };

    const editAd = (ad) => {
        setEditingAdId(ad._id);
        setAdForm({
            badge: ad.badge || '',
            title: ad.title || '',
            description: ad.description || '',
            icon: ad.icon || '📣',
            ctaLabel: ad.ctaLabel || '',
            ctaHref: ad.ctaHref || '/register',
            audience: ad.audience || 'all',
            active: Boolean(ad.active),
            order: String(ad.order ?? 1),
            startsAt: formatDateInput(ad.startsAt),
            endsAt: formatDateInput(ad.endsAt),
        });
        setActiveTab('ads');
    };

    const handleAdFormChange = (field, value) => {
        setAdForm((current) => ({ ...current, [field]: value }));
    };

    const saveAd = async (event) => {
        event.preventDefault();
        setSavingAd(true);
        setMessage('');
        try {
            const payload = {
                ...adForm,
                startsAt: adForm.startsAt || null,
                endsAt: adForm.endsAt || null,
            };
            if (editingAdId) {
                await API.put(`/ads/${editingAdId}`, payload);
                setMessage('تم تحديث الإعلان بنجاح.');
            } else {
                await API.post('/ads', payload);
                setMessage('تم إنشاء الإعلان بنجاح.');
            }
            resetAdForm();
            const { data } = await API.get('/ads');
            setAds(data || []);
        } catch (err) {
            setMessage(err.response?.data?.message || 'تعذر حفظ الإعلان');
        } finally {
            setSavingAd(false);
        }
    };

    const deleteAd = async (adId) => {
        if (!window.confirm('هل تريد حذف هذا الإعلان؟')) return;
        try {
            await API.delete(`/ads/${adId}`);
            setMessage('تم حذف الإعلان.');
            setAds((current) => current.filter((ad) => ad._id !== adId));
            if (editingAdId === adId) resetAdForm();
        } catch (err) {
            setMessage(err.response?.data?.message || 'تعذر حذف الإعلان');
        }
    };

    const toggleAdActive = async (ad) => {
        try {
            const { data } = await API.put(`/ads/${ad._id}`, {
                ...ad,
                active: !ad.active,
                startsAt: ad.startsAt || null,
                endsAt: ad.endsAt || null,
            });
            setAds((current) => current.map((item) => (item._id === ad._id ? data : item)));
        } catch (err) {
            setMessage(err.response?.data?.message || 'تعذر تحديث حالة الإعلان');
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

    const jumpToLessonEditor = async (courseId, lessonId) => {
        setSelectedManageCourseId(courseId);
        const lessons = lessonsByCourse[courseId]?.length
            ? lessonsByCourse[courseId]
            : await fetchLessonsForCourse(courseId, lessonId);
        setCourseLessons(lessons);
        selectLessonForEditing(lessons.find((lesson) => lesson._id === lessonId) || lessons[0]);
        window.requestAnimationFrame(() => {
            document.getElementById('admin-lesson-video-manager')?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }, 80);
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

    const readinessRows = courses.flatMap((course) => (
        (lessonsByCourse[course._id] || []).map((lesson) => ({
            course,
            lesson,
            issues: getLessonReadinessIssues(lesson),
        }))
    ));
    const readinessStats = {
        courses: courses.length,
        lessons: readinessRows.length,
        withVideos: readinessRows.filter(({ lesson }) => lessonHasVideos(lesson)).length,
        missingVideos: readinessRows.filter(({ lesson }) => !lessonHasVideos(lesson)).length,
        missingCodeOrg: readinessRows.filter(({ lesson }) => !lessonHasCodeOrgLink(lesson)).length,
        missingQuizzes: readinessRows.filter(({ lesson }) => !lessonHasQuiz(lesson)).length,
        ready: readinessRows.filter(({ issues }) => issues.length === 0).length,
    };
    readinessStats.percentage = readinessStats.lessons
        ? Math.round((readinessStats.ready / readinessStats.lessons) * 100)
        : 0;

    const courseReadiness = courses.map((course) => {
        const lessons = lessonsByCourse[course._id] || [];
        const readyLessons = lessons.filter((lesson) => getLessonReadinessIssues(lesson).length === 0).length;
        return {
            course,
            total: lessons.length,
            ready: readyLessons,
            percentage: lessons.length ? Math.round((readyLessons / lessons.length) * 100) : 0,
        };
    });

    const filteredReadinessRows = readinessRows.filter(({ course, lesson, issues }) => {
        if (readinessCourseFilter !== 'all' && course._id !== readinessCourseFilter) return false;
        if (readinessStatusFilter === 'ready') return issues.length === 0;
        if (readinessStatusFilter === 'missing-video') return !lessonHasVideos(lesson);
        if (readinessStatusFilter === 'missing-codeorg') return !lessonHasCodeOrgLink(lesson);
        if (readinessStatusFilter === 'missing-quiz') return !lessonHasQuiz(lesson);
        return true;
    });

    const priorityReadinessRow = readinessRows.find(({ lesson }) => !lessonHasVideos(lesson))
        || readinessRows.find(({ lesson }) => !lessonHasCodeOrgLink(lesson))
        || readinessRows.find(({ lesson }) => !lessonHasQuiz(lesson));
    const selectedLesson = courseLessons.find((lesson) => lesson._id === selectedLessonId);
    const selectedLessonIssues = selectedLesson ? getLessonReadinessIssues(selectedLesson) : [];
    const selectedLessonChecklist = selectedLesson ? [
        { key: 'video', label: 'فيديو شرح', ready: lessonHasVideos(selectedLesson), icon: '🎬' },
        { key: 'codeorg', label: 'رابط Code.org', ready: lessonHasCodeOrgLink(selectedLesson), icon: '🔗' },
        { key: 'quiz', label: 'اختبار', ready: lessonHasQuiz(selectedLesson), icon: '✍️' },
    ] : [];
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
                    <button
                        onClick={() => setActiveTab('ads')}
                        className={`tab-btn ${activeTab === 'ads' ? 'active' : ''}`}
                    >
                        إعلانات الصفحة الرئيسية 📣 ({ads.filter((ad) => ad.active).length} نشط)
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

                {/* Ads Tab */}
                {activeTab === 'ads' && (
                    <div className="ads-manager-layout">
                        <form className="card ads-editor-card" onSubmit={saveAd}>
                            <div className="section-heading compact-heading">
                                <div>
                                    <span className="eyebrow">إعلانات الصفحة الرئيسية</span>
                                    <h2>{editingAdId ? 'تعديل الإعلان' : 'إعلان جديد'}</h2>
                                </div>
                                {editingAdId && (
                                    <button type="button" className="small-button secondary" onClick={resetAdForm}>
                                        إنشاء إعلان جديد
                                    </button>
                                )}
                            </div>

                            <div className="ads-form-grid">
                                <label>
                                    الشارة الصغيرة
                                    <input
                                        value={adForm.badge}
                                        onChange={(event) => handleAdFormChange('badge', event.target.value)}
                                        placeholder="عرض تعليمي"
                                    />
                                </label>
                                <label>
                                    الأيقونة
                                    <input
                                        value={adForm.icon}
                                        onChange={(event) => handleAdFormChange('icon', event.target.value)}
                                        placeholder="📣"
                                        maxLength="8"
                                    />
                                </label>
                                <label className="span-2">
                                    عنوان الإعلان
                                    <input
                                        value={adForm.title}
                                        onChange={(event) => handleAdFormChange('title', event.target.value)}
                                        placeholder="جلسة تعريفية مجانية للأهل"
                                        required
                                    />
                                </label>
                                <label className="span-2">
                                    الوصف
                                    <textarea
                                        value={adForm.description}
                                        onChange={(event) => handleAdFormChange('description', event.target.value)}
                                        placeholder="اكتب وصفًا قصيرًا واضحًا للعرض..."
                                        rows="3"
                                        required
                                    />
                                </label>
                                <label>
                                    نص الزر
                                    <input
                                        value={adForm.ctaLabel}
                                        onChange={(event) => handleAdFormChange('ctaLabel', event.target.value)}
                                        placeholder="ابدأ الآن"
                                    />
                                </label>
                                <label>
                                    الرابط
                                    <input
                                        value={adForm.ctaHref}
                                        onChange={(event) => handleAdFormChange('ctaHref', event.target.value)}
                                        placeholder="/register أو https://..."
                                    />
                                </label>
                                <label>
                                    الجمهور
                                    <select
                                        value={adForm.audience}
                                        onChange={(event) => handleAdFormChange('audience', event.target.value)}
                                    >
                                        <option value="all">الجميع</option>
                                        <option value="students">طلاب</option>
                                        <option value="parents">أولياء الأمور</option>
                                        <option value="teachers">معلمون</option>
                                    </select>
                                </label>
                                <label>
                                    الترتيب
                                    <input
                                        type="number"
                                        value={adForm.order}
                                        onChange={(event) => handleAdFormChange('order', event.target.value)}
                                        min="1"
                                    />
                                </label>
                                <label>
                                    يبدأ في
                                    <input
                                        type="date"
                                        value={adForm.startsAt}
                                        onChange={(event) => handleAdFormChange('startsAt', event.target.value)}
                                    />
                                </label>
                                <label>
                                    ينتهي في
                                    <input
                                        type="date"
                                        value={adForm.endsAt}
                                        onChange={(event) => handleAdFormChange('endsAt', event.target.value)}
                                    />
                                </label>
                                <label className="ad-active-toggle span-2">
                                    <input
                                        type="checkbox"
                                        checked={adForm.active}
                                        onChange={(event) => handleAdFormChange('active', event.target.checked)}
                                    />
                                    الإعلان نشط ويظهر في الصفحة الرئيسية عند تحقق الجدولة
                                </label>
                            </div>

                            <div className="ads-preview-card">
                                <span className="home-ad-icon" aria-hidden="true">{adForm.icon || '📣'}</span>
                                <div>
                                    <span className="tag soft-tag">{adForm.badge || 'شارة الإعلان'}</span>
                                    <h3>{adForm.title || 'عنوان الإعلان سيظهر هنا'}</h3>
                                    <p>{adForm.description || 'وصف مختصر للعرض أو الإعلان.'}</p>
                                </div>
                                {adForm.ctaLabel && <span className="small-button secondary">{adForm.ctaLabel}</span>}
                            </div>

                            <button className="button" type="submit" disabled={savingAd}>
                                {savingAd ? 'جاري الحفظ...' : editingAdId ? 'حفظ التعديل' : 'نشر الإعلان'}
                            </button>
                        </form>

                        <div className="card ads-list-card">
                            <div className="section-heading compact-heading">
                                <div>
                                    <span className="eyebrow">الإعلانات الحالية</span>
                                    <h2>{ads.length} إعلان</h2>
                                </div>
                            </div>

                            {ads.length === 0 ? (
                                <div className="empty-state-card">
                                    <strong>لا توجد إعلانات بعد.</strong>
                                    <p>أنشئ أول إعلان ليظهر في الصفحة الرئيسية.</p>
                                </div>
                            ) : (
                                <div className="admin-ad-list">
                                    {ads.map((ad) => (
                                        <article key={ad._id} className={`admin-ad-row ${ad.active ? 'active' : 'inactive'}`}>
                                            <span className="home-ad-icon" aria-hidden="true">{ad.icon || '📣'}</span>
                                            <div>
                                                <strong>{ad.title}</strong>
                                                <p>{ad.description}</p>
                                                <small>
                                                    ترتيب {ad.order} · {ad.audience === 'all' ? 'الجميع' : ad.audience}
                                                    {ad.startsAt ? ` · يبدأ ${new Date(ad.startsAt).toLocaleDateString('ar-EG')}` : ''}
                                                    {ad.endsAt ? ` · ينتهي ${new Date(ad.endsAt).toLocaleDateString('ar-EG')}` : ''}
                                                </small>
                                            </div>
                                            <div className="admin-ad-actions">
                                                <button type="button" className="small-button secondary" onClick={() => editAd(ad)}>
                                                    تعديل
                                                </button>
                                                <button type="button" className="small-button secondary" onClick={() => toggleAdActive(ad)}>
                                                    {ad.active ? 'إيقاف' : 'تفعيل'}
                                                </button>
                                                <button type="button" className="small-button btn-danger" onClick={() => deleteAd(ad._id)}>
                                                    حذف
                                                </button>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Curriculum Tab */}
                {activeTab === 'curriculum' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start' }}>
                        {/* Content Readiness Dashboard */}
                        <div className="card content-readiness-dashboard">
                            <div className="readiness-hero">
                                <div>
                                    <span className="eyebrow">جاهزية المحتوى</span>
                                    <h2>لوحة متابعة الدروس قبل نشرها للطلاب ✅</h2>
                                    <p>اعرف بسرعة ما ينقص كل درس: فيديو الشرح، رابط Code.org، أو الاختبار. ثم انتقل مباشرة لتعديل الدرس.</p>
                                </div>
                                <div className="readiness-score">
                                    <strong>{readinessStats.percentage}%</strong>
                                    <span>جاهزية عامة</span>
                                    <div className="progress-bar-container">
                                        <div className="progress-bar" style={{ width: `${readinessStats.percentage}%` }} />
                                    </div>
                                </div>
                            </div>

                            <div className="readiness-stat-grid">
                                <div><span>📚</span><strong>{readinessStats.courses}</strong><p>دورات</p></div>
                                <div><span>🧩</span><strong>{readinessStats.lessons}</strong><p>دروس</p></div>
                                <div><span>🎬</span><strong>{readinessStats.withVideos}</strong><p>بها فيديو</p></div>
                                <div className={readinessStats.missingVideos ? 'needs-work' : 'is-ready'}><span>⚠️</span><strong>{readinessStats.missingVideos}</strong><p>بلا فيديو</p></div>
                                <div className={readinessStats.missingCodeOrg ? 'needs-work' : 'is-ready'}><span>🔗</span><strong>{readinessStats.missingCodeOrg}</strong><p>بلا رابط Code.org</p></div>
                                <div className={readinessStats.missingQuizzes ? 'needs-work' : 'is-ready'}><span>✍️</span><strong>{readinessStats.missingQuizzes}</strong><p>بلا اختبار</p></div>
                            </div>

                            {priorityReadinessRow ? (
                                <div className="readiness-priority-card">
                                    <div>
                                        <span className="eyebrow">أولوية اليوم</span>
                                        <h3>درس {priorityReadinessRow.lesson.order}: {priorityReadinessRow.lesson.title}</h3>
                                        <p>{priorityReadinessRow.course.title}</p>
                                        <div className="readiness-issue-list">
                                            {priorityReadinessRow.issues.map((issue) => <span key={issue.key}>{issue.label}</span>)}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="button small-button"
                                        onClick={() => jumpToLessonEditor(priorityReadinessRow.course._id, priorityReadinessRow.lesson._id)}
                                    >
                                        تجهيز هذا الدرس الآن
                                    </button>
                                </div>
                            ) : (
                                <div className="readiness-priority-card is-complete">
                                    <div>
                                        <span className="eyebrow">أولوية اليوم</span>
                                        <h3>كل الدروس جاهزة للطلاب 🎉</h3>
                                        <p>لا توجد نواقص في الفيديوهات أو الروابط أو الاختبارات.</p>
                                    </div>
                                </div>
                            )}

                            <div className="course-readiness-grid">
                                {courseReadiness.map(({ course, total, ready, percentage }) => (
                                    <div key={course._id} className="course-readiness-card">
                                        <div>
                                            <strong>{course.title}</strong>
                                            <span>{ready} من {total} دروس جاهزة</span>
                                        </div>
                                        <b>{percentage}%</b>
                                        <div className="progress-bar-container">
                                            <div className="progress-bar" style={{ width: `${percentage}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="readiness-toolbar">
                                <label>
                                    الدورة
                                    <select value={readinessCourseFilter} onChange={(e) => setReadinessCourseFilter(e.target.value)}>
                                        <option value="all">كل الدورات</option>
                                        {courses.map((course) => (
                                            <option key={course._id} value={course._id}>{course.title}</option>
                                        ))}
                                    </select>
                                </label>

                                <label>
                                    الحالة
                                    <select value={readinessStatusFilter} onChange={(e) => setReadinessStatusFilter(e.target.value)}>
                                        <option value="all">كل الدروس</option>
                                        <option value="ready">جاهزة بالكامل</option>
                                        <option value="missing-video">ينقصها فيديو</option>
                                        <option value="missing-codeorg">ينقصها رابط Code.org</option>
                                        <option value="missing-quiz">ينقصها اختبار</option>
                                    </select>
                                </label>
                            </div>

                            <div className="readiness-list">
                                {filteredReadinessRows.length === 0 ? (
                                    <div className="lesson-video-empty">
                                        <strong>لا توجد دروس بهذا الفلتر.</strong>
                                        <p>جرّب فلتر مختلف أو أضف دروساً للدورة أولاً.</p>
                                    </div>
                                ) : filteredReadinessRows.map(({ course, lesson, issues }) => (
                                    <article className={`readiness-row ${issues.length ? 'needs-work' : 'is-ready'}`} key={`${course._id}-${lesson._id}`}>
                                        <div className="readiness-row-main">
                                            <span className="tag">{course.title}</span>
                                            <h3>درس {lesson.order}: {lesson.title}</h3>
                                            <div className="readiness-badges">
                                                {lessonHasVideos(lesson) ? <span className="ready-video-badge">✓ فيديو</span> : <span className="missing-video-badge">بلا فيديو</span>}
                                                {lessonHasCodeOrgLink(lesson) ? <span className="ready-video-badge">✓ Code.org</span> : <span className="missing-video-badge">بلا رابط</span>}
                                                {lessonHasQuiz(lesson) ? <span className="ready-video-badge">✓ اختبار</span> : <span className="missing-video-badge">بلا اختبار</span>}
                                            </div>
                                        </div>

                                        <div className="readiness-row-actions">
                                            {issues.length === 0 ? (
                                                <span className="ready-video-badge large">جاهز للطلاب</span>
                                            ) : (
                                                <div className="readiness-issue-list">
                                                    {issues.map((issue) => <span key={issue.key}>{issue.label}</span>)}
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                className="button secondary small-button"
                                                onClick={() => jumpToLessonEditor(course._id, lesson._id)}
                                            >
                                                تعديل الدرس
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>
                        
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
                        <div className="card admin-lesson-manager" id="admin-lesson-video-manager">
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
                                                {selectedLessonIssues.length ? (
                                                    <span className="missing-video-badge large">{selectedLessonIssues.length} عناصر ناقصة</span>
                                                ) : (
                                                    <span className="ready-video-badge large">جاهز للطلاب</span>
                                                )}
                                            </div>

                                            <div className="lesson-readiness-checklist">
                                                {selectedLessonChecklist.map((item) => (
                                                    <span key={item.key} className={item.ready ? 'ready' : 'missing'}>
                                                        {item.icon} {item.label} {item.ready ? '✓' : 'ناقص'}
                                                    </span>
                                                ))}
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
