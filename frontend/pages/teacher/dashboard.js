import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import API from '../../utils/api';

const labels = {
    locked: 'مقفل',
    available: 'متاح',
    in_progress: 'قيد التعلم',
    awaiting_approval: 'بانتظار المراجعة',
    completed: 'مكتمل',
};

const actionLabels = {
    submitted: 'أرسل طلب إكمال',
    approved: 'اعتمد الإكمال',
    rejected: 'طلب إعادة المحاولة',
    unlocked: 'فتح الدرس يدوياً',
    relocked: 'أعاد قفل الدرس',
};

const lessonFilterLabels = {
    all: 'كل الدروس',
    awaiting_approval: 'بانتظار المراجعة',
    completed: 'مكتمل',
    locked: 'مقفل',
    manual: 'مفتوح/مقفل يدوياً',
    needs_content: 'تنبيه محتوى',
};

const feedbackTemplates = [
    'أحسنت، يمكنك الانتقال إلى الدرس التالي.',
    'راجع فيديو الشرح مرة أخرى ثم أعد المحاولة.',
    'أرسل لقطة أو رابط يوضح أنك أنهيت التطبيق.',
    'حاول ترتيب الخطوات بهدوء ثم أعد الإرسال.',
];

const hasContentIssue = (lesson) => Boolean(
    lesson.contentReady && (
        !lesson.contentReady.hasVideos
        || !lesson.contentReady.hasCodeOrgLink
        || !lesson.contentReady.hasQuiz
    )
);

const pendingCountForCourse = (course) => (
    course?.lessons?.filter((lesson) => lesson.studentState === 'awaiting_approval').length || 0
);

export default function TeacherDashboard() {
    const router = useRouter();
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [courses, setCourses] = useState([]);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [details, setDetails] = useState(null);
    const [feedback, setFeedback] = useState({});
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState('');
    const [studentSearch, setStudentSearch] = useState('');
    const [lessonFilter, setLessonFilter] = useState('all');

    useEffect(() => {
        const role = localStorage.getItem('userRole');
        if (!localStorage.getItem('token')) return void router.push('/login');
        if (!['teacher', 'admin'].includes(role)) return void router.push('/dashboard');
        loadStudents();
    }, []);

    const loadStudents = async () => {
        try {
            const { data } = await API.get('/teacher/students');
            setStudents(data);
            if (data[0]) await selectStudent(data[0]);
        } catch (err) {
            setError(err.response?.data?.message || 'تعذر تحميل الطلاب');
        }
    };

    const selectStudent = async (student) => {
        setSelectedStudent(student);
        setDetails(null);
        setLessonFilter('all');
        setError('');
        try {
            const { data } = await API.get(`/teacher/students/${student._id}/courses`);
            setCourses(data.courses);
            const firstCourse = data.courses[0];
            setSelectedCourseId(firstCourse?._id || '');
            if (firstCourse) await loadCourse(student._id, firstCourse._id);
        } catch (err) {
            setError(err.response?.data?.message || 'تعذر تحميل تسجيلات الطالب');
        }
    };

    const loadCourse = async (studentId, courseId) => {
        const { data } = await API.get(`/teacher/students/${studentId}/courses/${courseId}`);
        setDetails(data);
    };

    const changeCourse = async (courseId) => {
        setSelectedCourseId(courseId);
        setDetails(null);
        setLessonFilter('all');
        try {
            await loadCourse(selectedStudent._id, courseId);
        } catch (err) {
            setError(err.response?.data?.message || 'تعذر تحميل تقدم الدورة');
        }
    };

    const applyTemplate = (lessonId, template) => {
        setFeedback((current) => ({
            ...current,
            [lessonId]: template,
        }));
    };

    const updateLesson = async (lesson, action) => {
        setBusy(`${lesson._id}:${action}`);
        setMessage('');
        setError('');
        try {
            await API.patch(`/teacher/students/${selectedStudent._id}/lessons/${lesson._id}`, {
                action,
                feedback: feedback[lesson._id] || '',
            });
            setMessage('تم حفظ التغيير وتسجيله في سجل المراجعة.');
            const { data } = await API.get(`/teacher/students/${selectedStudent._id}/courses`);
            setCourses(data.courses);
            await loadCourse(selectedStudent._id, selectedCourseId);
        } catch (err) {
            setError(err.response?.data?.message || 'تعذر تحديث حالة الدرس');
        } finally {
            setBusy('');
        }
    };

    const filteredStudents = students.filter((student) => {
        const query = studentSearch.trim().toLowerCase();
        if (!query) return true;
        return `${student.name} ${student.email}`.toLowerCase().includes(query);
    });

    const currentLessonCounts = details?.course?.lessons?.reduce((acc, lesson) => {
        acc[lesson.studentState] = (acc[lesson.studentState] || 0) + 1;
        if (lesson.accessOverride !== 'default') acc.manual = (acc.manual || 0) + 1;
        if (hasContentIssue(lesson)) acc.needs_content = (acc.needs_content || 0) + 1;
        return acc;
    }, {}) || {};

    const selectedCourseSummary = courses.find((course) => course._id === selectedCourseId);
    const pendingAcrossCourses = courses.reduce((sum, course) => sum + pendingCountForCourse(course), 0);
    const contentIssueCount = currentLessonCounts.needs_content || 0;

    const teacherStats = [
        { label: 'طلاب تحت المتابعة', value: students.length, icon: '👧' },
        { label: 'طلبات بانتظارك', value: pendingAcrossCourses || currentLessonCounts.awaiting_approval || 0, icon: '⏳' },
        { label: 'دروس مكتملة', value: currentLessonCounts.completed || 0, icon: '✅' },
        { label: 'تنبيهات محتوى', value: contentIssueCount, icon: '🎬' },
    ];

    const filteredLessons = (details?.course?.lessons || []).filter((lesson) => {
        if (lessonFilter === 'all') return true;
        if (lessonFilter === 'manual') return lesson.accessOverride !== 'default';
        if (lessonFilter === 'needs_content') return hasContentIssue(lesson);
        return lesson.studentState === lessonFilter;
    });

    return (
        <Layout>
            <section className="page teacher-page rtl">
                <div className="teacher-heading">
                    <div><span className="eyebrow">الإشراف التعليمي</span><h1>لوحة المعلم</h1></div>
                    <p>راجع طلبات الإكمال، ابحث عن الطلاب بسرعة، واستخدم فلاتر الدروس لاتخاذ الإجراء المناسب.</p>
                </div>

                {message && <div className="success-box">{message}</div>}
                {error && <div className="error-box">{error}</div>}

                <div className="teacher-stat-grid">
                    {teacherStats.map((stat) => (
                        <div className="teacher-stat-card" key={stat.label}>
                            <span aria-hidden="true">{stat.icon}</span>
                            <strong>{stat.value}</strong>
                            <p>{stat.label}</p>
                        </div>
                    ))}
                </div>

                <div className="teacher-layout">
                    <aside className="teacher-sidebar card">
                        <div className="teacher-sidebar-heading">
                            <h2>الطلاب المعيّنون</h2>
                            <span>{filteredStudents.length}/{students.length}</span>
                        </div>
                        <input
                            value={studentSearch}
                            onChange={(event) => setStudentSearch(event.target.value)}
                            placeholder="ابحث بالاسم أو البريد..."
                            className="teacher-search-input"
                        />
                        {students.length === 0 && <p>لا يوجد طلاب معيّنون لهذا الحساب.</p>}
                        {students.length > 0 && filteredStudents.length === 0 && <p>لا توجد نتيجة لهذا البحث.</p>}
                        <div className="student-list">
                            {filteredStudents.map((student) => (
                                <button
                                    key={student._id}
                                    className={selectedStudent?._id === student._id ? 'active' : ''}
                                    onClick={() => selectStudent(student)}
                                >
                                    <strong>{student.name}</strong>
                                    <span>{student.email}</span>
                                </button>
                            ))}
                        </div>
                    </aside>

                    <div className="teacher-main">
                        {selectedStudent && (
                            <div className="student-course-toolbar card">
                                <div><span>الطالب</span><strong>{selectedStudent.name}</strong></div>
                                <label>
                                    الدورة المسجلة
                                    <select value={selectedCourseId} onChange={(event) => changeCourse(event.target.value)}>
                                        {courses.map((course) => (
                                            <option key={course._id} value={course._id}>
                                                {course.title} {pendingCountForCourse(course) ? `— ${pendingCountForCourse(course)} بانتظارك` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                        )}

                        {details && (
                            <>
                                <div className="teacher-progress-card card">
                                    <div>
                                        <h2>{details.course.title}</h2>
                                        <p>
                                            {details.course.progress.completedCount} من {details.course.progress.totalLessons} دروس مكتملة
                                            {selectedCourseSummary && ` · ${pendingCountForCourse(selectedCourseSummary)} طلبات مراجعة`}
                                        </p>
                                    </div>
                                    <strong>{details.course.progress.percentage}%</strong>
                                </div>

                                <div className="teacher-filter-card card">
                                    <div>
                                        <span className="eyebrow">فلاتر الدروس</span>
                                        <h2>ركّز على ما يحتاج تدخلك</h2>
                                    </div>
                                    <div className="teacher-filter-buttons">
                                        {Object.entries(lessonFilterLabels).map(([key, label]) => (
                                            <button
                                                key={key}
                                                type="button"
                                                className={lessonFilter === key ? 'active' : ''}
                                                onClick={() => setLessonFilter(key)}
                                            >
                                                {label}
                                                <span>
                                                    {key === 'all'
                                                        ? details.course.lessons.length
                                                        : currentLessonCounts[key] || 0}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="teacher-lessons">
                                    {filteredLessons.length === 0 ? (
                                        <div className="card">
                                            <p>لا توجد دروس مطابقة لهذا الفلتر.</p>
                                        </div>
                                    ) : filteredLessons.map((lesson) => {
                                        const approving = busy === `${lesson._id}:approve`;
                                        const rejecting = busy === `${lesson._id}:reject`;
                                        const unlocking = busy === `${lesson._id}:unlock`;
                                        const relocking = busy === `${lesson._id}:relock`;
                                        const contentIssues = [
                                            lesson.contentReady && !lesson.contentReady.hasVideos ? 'بلا فيديو شرح' : '',
                                            lesson.contentReady && !lesson.contentReady.hasCodeOrgLink ? 'بلا رابط Code.org' : '',
                                            lesson.contentReady && !lesson.contentReady.hasQuiz ? 'بلا اختبار' : '',
                                        ].filter(Boolean);

                                        return (
                                            <article key={lesson._id} className={`teacher-lesson card state-${lesson.studentState}`}>
                                                <div className="teacher-lesson-summary">
                                                    <span className="lesson-order">{lesson.order}</span>
                                                    <div>
                                                        <h3>{lesson.title}</h3>
                                                        <div className="teacher-lesson-badges">
                                                            <span className={`lesson-state-badge state-${lesson.studentState}`}>{labels[lesson.studentState]}</span>
                                                            {lesson.isPlaceholder && <span className="placeholder-badge">قيد التأليف</span>}
                                                            {lesson.accessOverride !== 'default' && <span className="manual-access-badge">فتح يدوي</span>}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="teacher-content-readiness">
                                                    <span className={lesson.contentReady?.hasVideos ? 'ready' : 'missing'}>🎬 فيديو</span>
                                                    <span className={lesson.contentReady?.hasCodeOrgLink ? 'ready' : 'missing'}>🔗 Code.org</span>
                                                    <span className={lesson.contentReady?.hasQuiz ? 'ready' : 'missing'}>✍️ اختبار</span>
                                                </div>
                                                {contentIssues.length > 0 && (
                                                    <p className="teacher-content-warning">تنبيه محتوى: {contentIssues.join(' · ')}</p>
                                                )}
                                                {lesson.submittedAt && <p className="submission-time">طلب الإكمال: {new Date(lesson.submittedAt).toLocaleString('ar-EG')}</p>}

                                                <textarea
                                                    value={feedback[lesson._id] ?? lesson.feedback ?? ''}
                                                    onChange={(event) => setFeedback({ ...feedback, [lesson._id]: event.target.value })}
                                                    placeholder="ملاحظة قصيرة للطالب (اختيارية)"
                                                    maxLength="500"
                                                    rows="2"
                                                />

                                                <div className="feedback-template-row">
                                                    {feedbackTemplates.map((template) => (
                                                        <button
                                                            type="button"
                                                            key={template}
                                                            onClick={() => applyTemplate(lesson._id, template)}
                                                        >
                                                            {template}
                                                        </button>
                                                    ))}
                                                </div>

                                                <div className="teacher-actions">
                                                    {lesson.studentState === 'awaiting_approval' && (
                                                        <>
                                                            <button className="button btn-success" disabled={Boolean(busy)} onClick={() => updateLesson(lesson, 'approve')}>
                                                                {approving ? 'جاري الاعتماد...' : 'اعتماد الإكمال'}
                                                            </button>
                                                            <button className="button btn-danger" disabled={Boolean(busy)} onClick={() => updateLesson(lesson, 'reject')}>
                                                                {rejecting ? 'جاري الرفض...' : 'طلب إعادة المحاولة'}
                                                            </button>
                                                        </>
                                                    )}
                                                    {lesson.studentState === 'locked' ? (
                                                        <button className="button secondary" disabled={Boolean(busy)} onClick={() => updateLesson(lesson, 'unlock')}>
                                                            {unlocking ? 'جاري الفتح...' : 'فتح لهذا الطالب'}
                                                        </button>
                                                    ) : !['completed', 'awaiting_approval'].includes(lesson.studentState) && (
                                                        <button className="button secondary" disabled={Boolean(busy)} onClick={() => updateLesson(lesson, 'relock')}>
                                                            {relocking ? 'جاري القفل...' : 'إعادة القفل'}
                                                        </button>
                                                    )}
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>

                                <section className="audit-card card">
                                    <h2>سجل التغييرات</h2>
                                    {details.audit.length === 0 ? <p>لا توجد تغييرات مسجلة بعد.</p> : (
                                        <div className="audit-list">
                                            {details.audit.map((item) => (
                                                <div key={item._id}>
                                                    <strong>{item.actor?.name}: {actionLabels[item.action] || item.action}</strong>
                                                    <span>{item.lesson?.title}</span>
                                                    {item.note && <p>“{item.note}”</p>}
                                                    <time>{new Date(item.createdAt).toLocaleString('ar-EG')}</time>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            </>
                        )}
                    </div>
                </div>
            </section>
        </Layout>
    );
}
