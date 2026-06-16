import Link from 'next/link';

export default function CourseCard({ course }) {
    return (
        <div className="card course-card">
            <div>
                <h2>{course.title}</h2>
                <p>{course.description}</p>
                <span className="tag">{course.language}</span>
            </div>
            <Link href={{ pathname: '/course', query: { id: course._id } }} className="button small">عرض الدورة</Link>
        </div>
    );
}
