import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import API from '../../utils/api';
import { withBasePath } from '../../utils/paths';

const AGE_GUIDANCE = {
    '5-8': {
        label: '5-8 سنوات 🧸',
        tone: 'مرحلة الاستكشاف',
        note: 'الأفضل جلسات قصيرة: فيديو واحد، تمرين واحد، وتشجيع سريع بعد كل محاولة.',
        homeAction: 'اسأل الطفل: ما الشيء الممتع الذي صنعته اليوم؟',
    },
    '9-12': {
        label: '9-12 سنة 🚀',
        tone: 'مرحلة بناء المهارات',
        note: 'هذا العمر يستفيد من هدف يومي واضح: درس واحد أو جزء صغير من مشروع.',
        homeAction: 'اطلب منه أن يشرح لك خطوة واحدة من الحل بصوته.',
    },
    '13-16': {
        label: '13-16 سنة 💻',
        tone: 'مرحلة التحدي',
        note: 'الطالب الأكبر يحتاج مساحة استقلال مع مراجعة أسبوعية للتقدم والملاحظات.',
        homeAction: 'ناقش معه ما الذي سيحسّنه في الحل القادم.',
    },
    default: {
        label: 'غير محدد',
        tone: 'متابعة عامة',
        note: 'اختيار الفئة العمرية يساعد عبقورا على عرض نصائح أدق للطالب وولي الأمر.',
        homeAction: 'ابدأ بمتابعة درس واحد ثم راقب ملاحظات المعلم.',
    },
};

const STATUS_META = {
    completed: ['مكتمل', '✅'],
    awaiting_approval: ['بانتظار المعلم', '⏳'],
    in_progress: ['قيد التعلم', '◐'],
    not_started: ['لم يبدأ', '○'],
};

const getAgeGuidance = (ageGroup) => AGE_GUIDANCE[ageGroup] || AGE_GUIDANCE.default;

const idOf = (value) => String(value?._id || value || '');

const getCompletedIds = (progress) => new Set((progress?.completedLessons || []).map(idOf));

const findLessonEntry = (progress, lessonId) => (
    (progress?.lessonProgress || []).find((entry) => idOf(entry.lesson) === idOf(lessonId))
);

const getLessonStatus = (progress, lesson) => {
    const completedIds = getCompletedIds(progress);
    if (completedIds.has(idOf(lesson))) return 'completed';

    const entry = findLessonEntry(progress, lesson._id);
    if (entry?.status === 'awaiting_approval') return 'awaiting_approval';
    if (entry?.status === 'in_progress') return 'in_progress';
    return 'not_started';
};

const getScorePct = (result) => (
    result?.total ? Math.round((Number(result.score || 0) / Number(result.total)) * 100) : 0
);

export default function ParentDashboard() {
    const router = useRouter();
    const [children, setChildren] = useState([]);
    const [selectedChild, setSelectedChild] = useState(null);
    const [progressByCourse, setProgressByCourse] = useState({});
    const [courses, setCourses] = useState([]);
    const [loadingProgress, setLoadingProgress] = useState(false);

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
            const [kidsRes, coursesRes] = await Promise.all([
                API.get('/auth/linked-students'),
                API.get('/courses'),
            ]);

            const loadedChildren = kidsRes.data || [];
            const loadedCourses = coursesRes.data || [];
            setChildren(loadedChildren);
            setCourses(loadedCourses);

            if (loadedChildren.length > 0) {
                await selectChild(loadedChildren[0], loadedCourses);
            }
        } catch (err) {
            setMessage('تعذر تحميل بيانات لوحة المتابعة');
        }
    };

    const selectChild = async (child, courseList = courses) => {
        setSelectedChild(child);
        setProgressByCourse({});
        if (!child || courseList.length === 0) return;

        setLoadingProgress(true);
        try {
            const pairs = await Promise.all(courseList.map(async (course) => {
                try {
                    const res = await API.get(`/progress/student/${child._id}/${course._id}`);
                    return [course._id, res.data || {}];
                } catch (err) {
                    return [course._id, { completedLessons: [], lessonProgress: [], quizResults: [] }];
                }
            }));
            setProgressByCourse(Object.fromEntries(pairs));
        } finally {
            setLoadingProgress(false);
        }
    };

    const handleLinkStudent = async (e) => {
        e.preventDefault();
        if (!studentEmail) return;

        const emailToLink = studentEmail.trim().toLowerCase();
        setLinking(true);
        setLinkMessage('');
        setLinkError('');

        try {
            const res = await API.post('/auth/link-student', { email: emailToLink });
            setLinkMessage(res.data.message || 'تم ربط حساب الابن بنجاح!');
            setStudentEmail('');

            const kidsRes = await API.get('/auth/linked-students');
            const loadedChildren = kidsRes.data || [];
            setChildren(loadedChildren);

            const newKid = loadedChildren.find((kid) => kid.email.toLowerCase() === emailToLink);
            await selectChild(newKid || loadedChildren[loadedChildren.length - 1], courses);
        } catch (err) {
            setLinkError(err.response?.data?.message || 'عذراً، لم نتمكن من ربط الحساب. تأكد من بريد الطالب وسجلاته.');
        } finally {
            setLinking(false);
        }
    };

    const getCourseSnapshot = (course) => {
        const progress = progressByCourse[course._id] || {};
        const lessons = course.lessons || [];
        const totalLessons = course.lessonCount ?? lessons.length;
        const completedIds = getCompletedIds(progress);
        const completedCount = lessons.filter((lesson) => completedIds.has(idOf(lesson))).length;
        const pendingLessons = lessons.filter((lesson) => getLessonStatus(progress, lesson) === 'awaiting_approval');
        const retryLessons = lessons.filter((lesson) => {
            const entry = findLessonEntry(progress, lesson._id);
            return entry?.status === 'in_progress' && entry?.feedback && entry?.reviewedAt;
        });
        const nextLesson = lessons.find((lesson) => !completedIds.has(idOf(lesson))) || null;
        const percentage = totalLessons ? Math.round((completedCount / totalLessons) * 100) : 0;
        const quizResults = progress.quizResults || [];
        const passedQuizzes = quizResults.filter((result) => getScorePct(result) >= 70).length;

        return {
            course,
            progress,
            lessons,
            totalLessons,
            completedCount,
            pendingLessons,
            retryLessons,
            nextLesson,
            percentage,
            quizResults,
            passedQuizzes,
            hasActivity: Boolean(progress._id || completedCount || pendingLessons.length || quizResults.length || progress.certificateUrl),
        };
    };

    const childGuidance = getAgeGuidance(selectedChild?.ageGroup);
    const courseSnapshots = courses.map(getCourseSnapshot);
    const totalLessons = courseSnapshots.reduce((sum, item) => sum + item.totalLessons, 0);
    const totalCompleted = courseSnapshots.reduce((sum, item) => sum + item.completedCount, 0);
    const overallPct = totalLessons ? Math.round((totalCompleted / totalLessons) * 100) : 0;
    const pendingCount = courseSnapshots.reduce((sum, item) => sum + item.pendingLessons.length, 0);
    const retryCount = courseSnapshots.reduce((sum, item) => sum + item.retryLessons.length, 0);
    const certificateCount = courseSnapshots.filter((item) => item.progress?.certificateUrl).length;
    const activeCourseCount = courseSnapshots.filter((item) => item.hasActivity && item.percentage < 100).length;
    const nextSnapshot = courseSnapshots.find((item) => item.pendingLessons.length)
        || courseSnapshots.find((item) => item.retryLessons.length)
        || courseSnapshots.find((item) => item.nextLesson && item.hasActivity)
        || courseSnapshots[0];

    return (
        <Layout>
            <section className="page shell rtl parent-dashboard-page">
                <div className="parent-hero-card">
                    <div>
                        <span className="eyebrow">لوحة الأسرة</span>
                        <h1>متابعة تعلم الأبناء 👨‍👩‍👦</h1>
                        <p>نظرة واضحة على تقدم كل طفل، الدروس المنتظرة، الشهادات، وماذا يمكن أن تفعل الأسرة اليوم.</p>
                    </div>
                    <div className="parent-hero-summary">
                        <strong>{children.length}</strong>
                        <span>طالب مربوط</span>
                    </div>
                </div>

                {message && <div className="error-box">{message}</div>}

                <div className="role-priority-card parent-priority-card">
                    <div>
                        <span className="eyebrow">متابعة بدون زحمة</span>
                        <h2>ما يهم ولي الأمر اليوم</h2>
                        <p>ابدأ باختيار الطفل، ثم اقرأ بطاقة “ماذا أفعل اليوم؟”. باقي التفاصيل موجودة عند الحاجة فقط.</p>
                    </div>
                    <div className="priority-action-list">
                        <a href="#parent-children">1. اختر الطفل</a>
                        <a href="#parent-next-action">2. نصيحة اليوم</a>
                        <a href="#parent-course-progress">3. تقدم الدورات</a>
                    </div>
                </div>

                <div className="parent-dashboard-layout">
                    <aside id="parent-children" className="parent-sidebar">
                        <div className="card parent-link-card">
                            <h3>ربط حساب ابن جديد 🔗</h3>
                            {linkMessage && <div className="success-box compact-alert">{linkMessage}</div>}
                            {linkError && <div className="error-box compact-alert">{linkError}</div>}

                            <form onSubmit={handleLinkStudent}>
                                <label>البريد الإلكتروني للطالب</label>
                                <input
                                    type="email"
                                    value={studentEmail}
                                    onChange={(e) => setStudentEmail(e.target.value)}
                                    placeholder="student@example.com"
                                    required
                                />
                                <button type="submit" className="button" disabled={linking}>
                                    {linking ? 'جاري الربط...' : 'ربط الحساب ➕'}
                                </button>
                            </form>
                        </div>

                        <div className="card parent-children-card">
                            <h3>الأبناء المربوطون 👥</h3>
                            {children.length === 0 ? (
                                <p className="muted-copy">لم تقم بربط أي حساب طالب بعد.</p>
                            ) : (
                                <div className="parent-child-list">
                                    {children.map((child) => {
                                        const selected = selectedChild?._id === child._id;
                                        const guidance = getAgeGuidance(child.ageGroup);
                                        return (
                                            <button
                                                key={child._id}
                                                type="button"
                                                onClick={() => selectChild(child)}
                                                className={`parent-child-button ${selected ? 'selected' : ''}`}
                                            >
                                                <strong>{child.name}</strong>
                                                <span>{child.email}</span>
                                                <small>{guidance.label}</small>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </aside>

                    <main className="parent-main-panel">
                        {selectedChild ? (
                            <>
                                <div className="parent-student-header">
                                    <div>
                                        <span className="eyebrow">تقرير الطالب</span>
                                        <h2>{selectedChild.name} 🎒</h2>
                                        <p>{selectedChild.email} · {childGuidance.label}</p>
                                    </div>
                                    <div className="parent-age-guidance">
                                        <strong>{childGuidance.tone}</strong>
                                        <p>{childGuidance.note}</p>
                                    </div>
                                </div>

                                <div className="parent-stat-grid">
                                    <div className="parent-stat-card">
                                        <span>📈</span>
                                        <strong>{overallPct}%</strong>
                                        <p>التقدم الكلي</p>
                                    </div>
                                    <div className="parent-stat-card">
                                        <span>✅</span>
                                        <strong>{totalCompleted}/{totalLessons || 0}</strong>
                                        <p>دروس مكتملة</p>
                                    </div>
                                    <div className="parent-stat-card">
                                        <span>⏳</span>
                                        <strong>{pendingCount}</strong>
                                        <p>بانتظار المعلم</p>
                                    </div>
                                    <div className="parent-stat-card">
                                        <span>🏆</span>
                                        <strong>{certificateCount}</strong>
                                        <p>شهادات</p>
                                    </div>
                                </div>

                                <div id="parent-next-action" className="parent-next-action-card">
                                    <div>
                                        <span className="eyebrow">ماذا أفعل اليوم؟</span>
                                        <h3>
                                            {pendingCount
                                                ? 'هناك درس بانتظار اعتماد المعلم'
                                                : retryCount
                                                    ? 'يوجد درس يحتاج إعادة محاولة'
                                                    : nextSnapshot?.nextLesson
                                                        ? `الخطوة التالية: الدرس ${nextSnapshot.nextLesson.order}`
                                                        : 'كل شيء هادئ الآن'}
                                        </h3>
                                        <p>
                                            {pendingCount
                                                ? 'لا يحتاج ولي الأمر إجراءً الآن، فقط تابع حالة الاعتماد من المعلم.'
                                                : retryCount
                                                    ? 'ساعد الطالب على قراءة ملاحظة المعلم بهدوء ثم إعادة المحاولة.'
                                                    : childGuidance.homeAction}
                                        </p>
                                    </div>
                                    <span aria-hidden="true">🧭</span>
                                </div>

                                {loadingProgress ? (
                                    <div className="empty-state-card">
                                        <strong>جاري تحميل تقدم الطالب...</strong>
                                    </div>
                                ) : (
                                    <div id="parent-course-progress" className="parent-course-list">
                                        {courseSnapshots.map((snapshot) => (
                                            <article key={snapshot.course._id} className="parent-course-card">
                                                <div className="parent-course-header">
                                                    <div>
                                                        <span className="eyebrow">{snapshot.course.ageRange || snapshot.course.level}</span>
                                                        <h3>{snapshot.course.title}</h3>
                                                    </div>
                                                    <strong>{snapshot.percentage}%</strong>
                                                </div>

                                                <div className="progress-bar-container">
                                                    <div className="progress-bar" style={{ width: `${snapshot.percentage}%` }} />
                                                </div>

                                                <div className="parent-course-meta">
                                                    <span>✅ {snapshot.completedCount} مكتمل</span>
                                                    <span>⏳ {snapshot.pendingLessons.length} مراجعة</span>
                                                    <span>✍️ {snapshot.passedQuizzes}/{snapshot.quizResults.length || 0} اختبارات ناجحة</span>
                                                </div>

                                                {snapshot.progress?.certificateUrl && (
                                                    <div className="parent-certificate-strip">
                                                        <span>🏆 حصل الطالب على شهادة هذه الدورة</span>
                                                        <a href={withBasePath(snapshot.progress.certificateUrl)} target="_blank" rel="noopener noreferrer" className="button btn-success small-button">
                                                            عرض الشهادة
                                                        </a>
                                                    </div>
                                                )}

                                                {snapshot.retryLessons.length > 0 && (
                                                    <div className="parent-alert-strip retry">
                                                        <strong>ملاحظات تحتاج متابعة</strong>
                                                        <p>{snapshot.retryLessons[0].title}: {findLessonEntry(snapshot.progress, snapshot.retryLessons[0]._id)?.feedback}</p>
                                                    </div>
                                                )}

                                                <div className="parent-lesson-mini-list">
                                                    {snapshot.lessons.slice(0, 8).map((lesson) => {
                                                        const status = getLessonStatus(snapshot.progress, lesson);
                                                        const [label, icon] = STATUS_META[status] || STATUS_META.not_started;
                                                        return (
                                                            <div key={lesson._id} className={`parent-lesson-mini state-${status}`}>
                                                                <span>{icon}</span>
                                                                <strong>درس {lesson.order}</strong>
                                                                <p>{lesson.title}</p>
                                                                <small>{label}</small>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {snapshot.lessons.length > 8 && (
                                                    <p className="muted-copy mini-list-note">يعرض أول 8 دروس فقط لتبقى المتابعة سريعة.</p>
                                                )}
                                            </article>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="empty-state-card parent-empty-state">
                                <strong>اختر طالبًا لعرض تقرير التقدم.</strong>
                                <p>يمكنك ربط حساب طالب من البطاقة الجانبية باستخدام بريده الإلكتروني.</p>
                            </div>
                        )}
                    </main>
                </div>
            </section>
        </Layout>
    );
}
