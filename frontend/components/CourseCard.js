import { useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import API from '../utils/api';
import { withBasePath } from '../utils/paths';

export default function CourseCard({ course }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const progress = course.progress || {};
    const lessonCount = course.lessonCount ?? course.lessons?.length ?? 0;
    const isComplete = progress.status === 'completed';
    const started = progress.enrolled && !isComplete;
    const progressPercent = progress.percentage || 0;

    const openCourse = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        const role = localStorage.getItem('userRole');
        if (role === 'student' && !progress.enrolled) {
            setLoading(true);
            setError('');
            try {
                await API.post(`/courses/${course._id}/enroll`);
            } catch (err) {
                setError(err.response?.data?.message || 'تعذر التسجيل في الدورة');
                setLoading(false);
                return;
            }
        }
        router.push({ pathname: '/course', query: { id: course._id } });
    };

    return (
        <article className={`course-catalog-card ${isComplete ? 'is-complete' : ''} ${started ? 'is-active' : ''}`}>
            <div className="course-artwork">
                <Image
                    src={withBasePath(course.artwork || '/images/avatar.png')}
                    alt="رسمة عبقورا للدورة"
                    width={120}
                    height={120}
                    unoptimized
                />
                <span className="course-card-orb" aria-hidden="true" />
                {isComplete && <span className="course-complete-ribbon">مكتملة ✓</span>}
            </div>
            <div className="course-card-body">
                <div className="course-meta-row">
                    <span className="tag">{course.ageRange || course.level}</span>
                    <span className="course-lesson-count">{lessonCount} درساً 📚</span>
                </div>
                <h3>{course.title}</h3>
                <p>{course.description}</p>

                <div className="course-card-flags">
                    <span>{progress.enrolled ? 'مسجل' : 'متاح للبدء'}</span>
                    <span>{course.level || 'مبتدئ'}</span>
                </div>

                <div className="course-progress-summary">
                    <div className="course-progress-label">
                        <span>تقدم الطالب</span>
                        <strong>{progressPercent}%</strong>
                    </div>
                    <div className="progress-bar-container">
                        <div className="progress-bar" style={{ width: `${progressPercent}%` }} />
                    </div>
                    <small>{progress.completedCount || 0} من {lessonCount} دروس مكتملة</small>
                </div>

                {error && <div className="error-box compact-alert">{error}</div>}
                <button type="button" className={`button course-action ${isComplete ? 'btn-success' : ''}`} onClick={openCourse} disabled={loading}>
                    {loading
                        ? 'جاري التسجيل...'
                        : isComplete
                            ? 'مراجعة الدورة'
                            : progress.enrolled
                                ? 'متابعة الدورة'
                                : 'ابدأ الدورة'}
                </button>
            </div>
        </article>
    );
}
