import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import CourseCard from '../components/CourseCard';
import API from '../utils/api';
import SideVideo from "../components/SideVideo";
import { withBasePath } from '../utils/paths';

const AGE_PROFILES = {
    '5-8': {
        className: 'age-junior',
        label: 'سن 5-8 سنوات 🧸',
        stage: 'مرحلة الاستكشاف',
        heroTitle: 'جاهز لمغامرة صغيرة اليوم',
        heroText: 'شاهد فيديو قصير، جرّب التمرين خطوة بخطوة، ثم اطلب من المعلم مراجعة إنجازك.',
        primaryAction: 'هيا نكمل الدرس',
        taskTitle: 'مهمة صغيرة اليوم',
        taskText: 'فيديو شرح قصير ثم تمرين واحد فقط. خطوة صغيرة تكفي لتكسب نجمة جديدة.',
        progressTitle: 'نجومك في التعلم',
        catalogHint: 'بدأنا بالدورات الأسهل والأقرب لعمر الطالب.',
        statLabels: ['دوراتي', 'نجومي', 'مشاريعي'],
        mentorNote: 'الواجهة هنا أبسط وبطاقاتها أكبر لأن هذا العمر يحتاج خطوات واضحة وقليلة.',
    },
    '9-12': {
        className: 'age-builder',
        label: 'سن 9-12 سنة 🚀',
        stage: 'مرحلة بناء المهارات',
        heroTitle: 'لننجز خطوة جديدة في البرمجة',
        heroText: 'ابدأ بالشرح، طبّق على Code.org، ثم أرسل إنجازك ليعتمده المعلم.',
        primaryAction: 'متابعة التعلم',
        taskTitle: 'مهمتك اليوم',
        taskText: 'أكمل فيديو الشرح والتمرين العملي، وراجع حالة اعتماد المعلم قبل الانتقال.',
        progressTitle: 'تقدمك في المسار',
        catalogHint: 'رتبنا الدورات بحيث يظهر المسار الأنسب لعمر الطالب أولًا.',
        statLabels: ['الدورات المسجلة', 'الدروس المكتملة', 'مشاريع مرسلة'],
        mentorNote: 'هذه المرحلة تستفيد من توازن بين التشجيع وخريطة تقدم واضحة.',
    },
    '13-16': {
        className: 'age-advanced',
        label: 'سن 13-16 سنة 💻',
        stage: 'مرحلة التحدي',
        heroTitle: 'خطتك التالية جاهزة',
        heroText: 'تابع الدرس التالي، راقب التقدم، واستخدم ملاحظات المعلم لتحسين الحلول.',
        primaryAction: 'فتح الدرس التالي',
        taskTitle: 'خطة اليوم',
        taskText: 'أنهِ درسًا واحدًا على الأقل: شرح، تطبيق عملي، ثم إرسال للمراجعة عند الحاجة.',
        progressTitle: 'لوحة تقدمك',
        catalogHint: 'الدورات الأكثر تحديًا تظهر أولًا مع بقاء المسارات التمهيدية متاحة للمراجعة.',
        statLabels: ['الدورات النشطة', 'الدروس المنجزة', 'التسليمات'],
        mentorNote: 'هذه الواجهة تعرض معلومات أكثر لأنها تناسب طالبًا مستعدًا لتخطيط تعلمه.',
    },
    default: {
        className: 'age-default',
        label: '',
        stage: 'مسار عبقورا',
        heroTitle: 'أهلاً بك في مساحة التعلم',
        heroText: 'واصل رحلتك خطوة بخطوة. كل درس يفتح التالي بعد الإنجاز ومراجعة المعلم.',
        primaryAction: 'متابعة التعلم',
        taskTitle: 'مهمتك التالية',
        taskText: 'ابدأ بالشرح، ثم انتقل للتطبيق العملي، وبعدها أرسل إنجازك للمعلم.',
        progressTitle: 'مسار تعلمك',
        catalogHint: 'اختر الدورة الأنسب ثم تابع تقدمك من خريطة الدروس.',
        statLabels: ['الدورات المسجلة', 'الدروس المكتملة', 'مشاريع مرسلة'],
        mentorNote: 'يمكن ضبط تجربة الطالب بدقة أكبر عند اختيار الفئة العمرية من الحساب.',
    },
};

const getAgeProfile = (ageGroup) => AGE_PROFILES[ageGroup] || AGE_PROFILES.default;

const isRecommendedCourseForAge = (course, ageGroup) => {
    if (!course || !ageGroup) return false;

    const title = `${course.title || ''} ${course.slug || ''}`.toLowerCase();
    const ageRange = `${course.ageRange || ''}`.replace('–', '-').replace(/\s/g, '');

    if (ageGroup === '5-8') {
        return title.includes('pre-reader') || ageRange.includes('5-8');
    }

    if (ageGroup === '9-12' || ageGroup === '13-16') {
        return title.includes('express-course') || title.includes('express course') || ageRange.includes('14');
    }

    return false;
};

const getNextLesson = (course) => {
    if (!course?.lessons?.length) return null;

    const nextLessonId = course.progress?.nextLessonId;
    if (!nextLessonId) return course.lessons[0];

    return course.lessons.find((lesson) => String(lesson._id) === String(nextLessonId)) || course.lessons[0];
};

const formatArabicDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
};

const buildAchievements = ({ courses, enrolledCourses, completedLessons, submissions, pendingReviews, ageGroup }) => {
    const completedCourses = courses.filter((course) => course.progress?.status === 'completed').length;
    const junior = ageGroup === '5-8';

    return [
        {
            id: 'first-course',
            icon: '🚀',
            title: junior ? 'بدأت المغامرة' : 'بداية المسار',
            description: junior ? 'فتحت أول دورة في عبقورا.' : 'سجلت في أول دورة تعليمية.',
            unlocked: enrolledCourses.length > 0,
            progress: `${enrolledCourses.length}/1`,
        },
        {
            id: 'first-lesson',
            icon: junior ? '⭐' : '✅',
            title: junior ? 'أول نجمة' : 'أول درس مكتمل',
            description: junior ? 'أنهيت أول خطوة في التعلم.' : 'أكملت أول درس واعتمده المعلم.',
            unlocked: completedLessons > 0,
            progress: `${completedLessons}/1`,
        },
        {
            id: 'steady-learner',
            icon: '🔥',
            title: junior ? 'بطل الخمس نجوم' : 'متعلم منتظم',
            description: junior ? 'اجمع 5 دروس مكتملة.' : 'أكمل 5 دروس لتثبت انتظامك.',
            unlocked: completedLessons >= 5,
            progress: `${Math.min(completedLessons, 5)}/5`,
        },
        {
            id: 'project-maker',
            icon: '🛠️',
            title: junior ? 'صانع صغير' : 'صانع مشروع',
            description: junior ? 'أرسلت مشروعًا ليراه المعلم.' : 'قدمت مشروعًا برمجيًا للمراجعة.',
            unlocked: submissions.length > 0,
            progress: `${submissions.length}/1`,
        },
        {
            id: 'review-ready',
            icon: '⏳',
            title: junior ? 'بانتظار التشجيع' : 'جاهز للمراجعة',
            description: junior ? 'أرسلت درسًا وينتظر المعلم.' : 'أرسلت إنجازًا بانتظار اعتماد المعلم.',
            unlocked: pendingReviews.length > 0,
            progress: `${pendingReviews.length}/1`,
        },
        {
            id: 'course-hero',
            icon: '🏆',
            title: junior ? 'بطل الدورة' : 'منهي الدورة',
            description: junior ? 'أكمل دورة كاملة لتحصل على الكأس.' : 'أكمل دورة كاملة وافتح شهادة الإنجاز.',
            unlocked: completedCourses > 0,
            progress: `${completedCourses}/1`,
        },
    ];
};

export default function Dashboard() {
    const router = useRouter();
    const [courses, setCourses] = useState([]);
    const [message, setMessage] = useState('');
    const [submittingCert, setSubmittingCert] = useState(false);
    const [certError, setCertError] = useState('');
    const [certSuccess, setCertSuccess] = useState('');
    const [submissions, setSubmissions] = useState([]);
    const [progressDetails, setProgressDetails] = useState({});
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
        setProfile({ name: name || '', role: role || '', ageGroup: ageGroup || '' });

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
                const [courseRes, subRes] = await Promise.all([
                    API.get('/courses'),
                    API.get('/submissions'),
                ]);
                const loadedCourses = courseRes.data || [];
                setCourses(loadedCourses);
                setSubmissions(subRes.data || []);

                const enrolled = loadedCourses.filter((course) => course.progress?.enrolled);
                const detailPairs = await Promise.all(enrolled.map(async (course) => {
                    try {
                        const detailRes = await API.get(`/progress/${course._id}`);
                        return [course._id, detailRes.data];
                    } catch (err) {
                        return [course._id, null];
                    }
                }));
                setProgressDetails(Object.fromEntries(detailPairs.filter(([, detail]) => detail)));
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

    // Calculate completion percentage
    const calculatePct = (course) => {
        return course.progress?.percentage || 0;
    };

    const ageProfile = getAgeProfile(profile.ageGroup);
    const sortedCourses = [...courses].sort((a, b) => (
        Number(isRecommendedCourseForAge(b, profile.ageGroup)) - Number(isRecommendedCourseForAge(a, profile.ageGroup))
    ));
    const enrolledCourses = courses.filter((course) => course.progress?.enrolled);
    const completedLessons = courses.reduce((total, course) => total + (course.progress?.completedCount || 0), 0);
    const totalLessons = courses.reduce((total, course) => total + (course.lessonCount || course.lessons?.length || 0), 0);
    const activeCourse = enrolledCourses.find((course) => course.progress?.status !== 'completed') || enrolledCourses[0] || sortedCourses[0];
    const activeNextLesson = getNextLesson(activeCourse);
    const recommendedCourse = sortedCourses.find((course) => isRecommendedCourseForAge(course, profile.ageGroup)) || sortedCourses[0];
    const pendingReviews = enrolledCourses.flatMap((course) => {
        const detail = progressDetails[course._id];
        return (detail?.lessonProgress || [])
            .filter((entry) => entry.status === 'awaiting_approval')
            .map((entry) => {
                const entryLessonId = entry.lesson?._id || entry.lesson;
                const lesson = entry.lesson?.title
                    ? entry.lesson
                    : course.lessons?.find((item) => String(item._id) === String(entryLessonId));
                return {
                    course,
                    lesson,
                    submittedAt: entry.submittedAt,
                };
            });
    });
    const progressSummary = [
        { label: ageProfile.statLabels[0], value: enrolledCourses.length, icon: '📚' },
        { label: ageProfile.statLabels[1], value: `${completedLessons}/${totalLessons || 0}`, icon: profile.ageGroup === '5-8' ? '⭐' : '✅' },
        { label: ageProfile.statLabels[2], value: submissions.length, icon: '🛠️' },
    ];
    const achievements = buildAchievements({
        courses,
        enrolledCourses,
        completedLessons,
        submissions,
        pendingReviews,
        ageGroup: profile.ageGroup,
    });
    const unlockedAchievements = achievements.filter((item) => item.unlocked).length;

    return (
    <Layout>
        <section className="page shell rtl dashboard-page">

            <div className="dashboard-layout">

                <div className="dashboard-content">

                    <div className={`dashboard-hero-card student-learning-hero ${ageProfile.className}`}>
                        <div className="dashboard-hero-copy">
                            <span className="eyebrow">مساحتك التعليمية</span>
                            <span className="age-stage-pill">{ageProfile.stage}</span>
                            <h1>{ageProfile.heroTitle} يا {profile.name || 'بطل عبقورا'} 👋</h1>
                            <p>{ageProfile.heroText}</p>
                            <div className="hero-chip-row">
                                {ageProfile.label && <span className="tag">{ageProfile.label}</span>}
                                <span className="tag soft-tag">تعلم ذاتي بإشراف آمن</span>
                                {recommendedCourse && (
                                    <span className="tag recommended-tag">
                                        مقترح: {recommendedCourse.title}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="dashboard-next-card student-focus-card">
                            <span>ابدأ من هنا</span>
                            <strong>
                                {activeNextLesson
                                    ? `الدرس ${activeNextLesson.order}: ${activeNextLesson.title}`
                                    : activeCourse?.title || 'اختر دورة للبدء'}
                            </strong>
                            <p>
                                {activeCourse?.progress?.enrolled
                                    ? `${activeCourse.title} — ${activeCourse.progress.percentage || 0}% مكتمل.`
                                    : 'ابدأ بالدورة المناسبة لعمر الطالب، وسنفتح الدرس الأول مباشرة.'}
                            </p>
                            {activeCourse && (
                                <div className="next-card-meta">
                                    <span>{activeCourse.lessonCount || activeCourse.lessons?.length || 0} درساً</span>
                                    {isRecommendedCourseForAge(activeCourse, profile.ageGroup) && <span>مناسب للعمر ✨</span>}
                                </div>
                            )}
                            {activeCourse && (
                                <button
                                    type="button"
                                    className="button"
                                    onClick={() => router.push({ pathname: '/course', query: { id: activeCourse._id } })}
                                >
                                    {activeCourse.progress?.enrolled ? ageProfile.primaryAction : 'استعراض الدورة'}
                                </button>
                            )}
                        </div>
                    </div>

                    {message && <div className="error-box">{message}</div>}

                    <div className="student-home-grid">
                        <article className="student-insight-card featured">
                            <span className="insight-icon" aria-hidden="true">
                                {profile.ageGroup === '5-8' ? '🎈' : '🎯'}
                            </span>
                            <div>
                                <span className="eyebrow">اليوم</span>
                                <h3>{ageProfile.taskTitle}</h3>
                                <p>
                                    {activeNextLesson
                                        ? ageProfile.taskText
                                        : 'اختر دورة من الكتالوج، وبعد التسجيل ستظهر لك مهمة اليوم هنا.'}
                                </p>
                            </div>
                        </article>

                        <article className="student-insight-card">
                            <span className="insight-icon pending-icon" aria-hidden="true">⏳</span>
                            <div>
                                <span className="eyebrow">مراجعة المعلم</span>
                                <h3>{pendingReviews.length ? `${pendingReviews.length} بانتظار الاعتماد` : 'لا توجد دروس معلّقة'}</h3>
                                {pendingReviews.length ? (
                                    <ul className="pending-review-list">
                                        {pendingReviews.slice(0, 2).map((item) => (
                                            <li key={`${item.course._id}-${item.lesson?._id || item.lesson?.title}`}>
                                                <strong>{item.lesson?.title || 'درس بانتظار المراجعة'}</strong>
                                                <span>
                                                    {item.course.title}
                                                    {item.submittedAt ? ` · ${formatArabicDate(item.submittedAt)}` : ''}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p>عندما ترسل درسًا للمراجعة سيظهر هنا حتى يعتمد المعلم النتيجة.</p>
                                )}
                            </div>
                        </article>

                        <article className="student-insight-card age-note-card">
                            <span className="insight-icon" aria-hidden="true">🧭</span>
                            <div>
                                <span className="eyebrow">مناسب للعمر</span>
                                <h3>{recommendedCourse ? recommendedCourse.title : 'اختر الفئة العمرية'}</h3>
                                <p>{ageProfile.mentorNote}</p>
                            </div>
                        </article>
                    </div>

                    <div className="dashboard-stat-grid">
                        {progressSummary.map((item) => (
                            <div className="dashboard-stat-card" key={item.label}>
                                <span aria-hidden="true">{item.icon}</span>
                                <strong>{item.value}</strong>
                                <p>{item.label}</p>
                            </div>
                        ))}
                    </div>

                    <div className="student-achievements-panel">
                        <div className="section-heading compact-heading">
                            <div>
                                <span className="eyebrow">الإنجازات</span>
                                <h2>{profile.ageGroup === '5-8' ? 'نجومك وشاراتك 🌟' : 'شارات التقدم 🏅'}</h2>
                            </div>
                            <p>{unlockedAchievements} من {achievements.length} شارات مفتوحة.</p>
                        </div>

                        <div className="achievement-grid">
                            {achievements.map((achievement) => (
                                <article
                                    key={achievement.id}
                                    className={`achievement-card ${achievement.unlocked ? 'is-unlocked' : 'is-locked'}`}
                                >
                                    <span className="achievement-icon" aria-hidden="true">{achievement.icon}</span>
                                    <div>
                                        <strong>{achievement.title}</strong>
                                        <p>{achievement.description}</p>
                                        <small>{achievement.unlocked ? 'مفتوحة الآن' : `التقدم: ${achievement.progress}`}</small>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>

                    {/* Progress Visualizer */}
                    {courses.length > 0 && (
                        <div className="learning-progress-panel">
                            <div className="section-heading compact-heading">
                                <div>
                                    <span className="eyebrow">المتابعة اليومية</span>
                                    <h2>{ageProfile.progressTitle} 📈</h2>
                                </div>
                                <p>{ageProfile.catalogHint}</p>
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
                            <p>{ageProfile.catalogHint}</p>
                        </div>

                        <div className="grid-cards">
                            {sortedCourses.map((course) => (
                                <CourseCard
                                    key={course._id}
                                    course={course}
                                    studentAgeGroup={profile.ageGroup}
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
