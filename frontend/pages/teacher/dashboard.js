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
        try {
            await loadCourse(selectedStudent._id, courseId);
        } catch (err) {
            setError(err.response?.data?.message || 'تعذر تحميل تقدم الدورة');
        }
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
            await loadCourse(selectedStudent._id, selectedCourseId);
        } catch (err) {
            setError(err.response?.data?.message || 'تعذر تحديث حالة الدرس');
        } finally {
            setBusy('');
        }
    };

    const currentLessonCounts = details?.course?.lessons?.reduce((acc, lesson) => {
        acc[lesson.studentState] = (acc[lesson.studentState] || 0) + 1;
        return acc;
    }, {}) || {};

    const teacherStats = [
        { label: 'طلاب تحت المتابعة', value: students.length, icon: '👧' },
        { label: 'طلبات بانتظارك', value: currentLessonCounts.awaiting_approval || 0, icon: '⏳' },
        { label: 'دروس مكتملة', value: currentLessonCounts.completed || 0, icon: '✅' },
    ];

    return (
        <Layout>
            <section className="page teacher-page rtl">
                <div className="teacher-heading">
                    <div><span className="eyebrow">الإشراف التعليمي</span><h1>لوحة المعلم</h1></div>
                    <p>راجع طلبات الإكمال، تحكم في وصول طالب محدد، وراجع كل تغيير مسجل.</p>
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
                        <h2>الطلاب المعيّنون</h2>
                        {students.length === 0 && <p>لا يوجد طلاب معيّنون لهذا الحساب.</p>}
                        <div className="student-list">
                            {students.map((student) => (
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
                                        {courses.map((course) => <option key={course._id} value={course._id}>{course.title}</option>)}
                                    </select>
                                </label>
                            </div>
                        )}

                        {details && (
                            <>
                                <div className="teacher-progress-card card">
                                    <div><h2>{details.course.title}</h2><p>{details.course.progress.completedCount} من {details.course.progress.totalLessons} دروس مكتملة</p></div>
                                    <strong>{details.course.progress.percentage}%</strong>
                                </div>

                                <div className="teacher-lessons">
                                    {details.course.lessons.map((lesson) => (
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
                                            {lesson.submittedAt && <p className="submission-time">طلب الإكمال: {new Date(lesson.submittedAt).toLocaleString('ar-EG')}</p>}
                                            <textarea
                                                value={feedback[lesson._id] ?? lesson.feedback ?? ''}
                                                onChange={(event) => setFeedback({ ...feedback, [lesson._id]: event.target.value })}
                                                placeholder="ملاحظة قصيرة للطالب (اختيارية)"
                                                maxLength="500"
                                                rows="2"
                                            />
                                            <div className="teacher-actions">
                                                {lesson.studentState === 'awaiting_approval' && (
                                                    <>
                                                        <button className="button btn-success" disabled={busy} onClick={() => updateLesson(lesson, 'approve')}>اعتماد الإكمال</button>
                                                        <button className="button btn-danger" disabled={busy} onClick={() => updateLesson(lesson, 'reject')}>طلب إعادة المحاولة</button>
                                                    </>
                                                )}
                                                {lesson.studentState === 'locked' ? (
                                                    <button className="button secondary" disabled={busy} onClick={() => updateLesson(lesson, 'unlock')}>فتح لهذا الطالب</button>
                                                ) : !['completed', 'awaiting_approval'].includes(lesson.studentState) && (
                                                    <button className="button secondary" disabled={busy} onClick={() => updateLesson(lesson, 'relock')}>إعادة القفل</button>
                                                )}
                                            </div>
                                        </article>
                                    ))}
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
