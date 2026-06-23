import { useEffect, useState } from 'react';
import Link from 'next/link';
import CourseCard from '../components/CourseCard';
import API from '../utils/api';

export default function Home() {
    const [courses, setCourses] = useState([]);
    const [catalogError, setCatalogError] = useState('');

    useEffect(() => {
        API.get('/courses')
            .then(({ data }) => setCourses(data))
            .catch(() => setCatalogError('تعذر تحميل دليل الدورات حالياً.'));
    }, []);

    return (
        <main className="page shell rtl home-page">
            <section className="hero-card home-hero">
                <span className="eyebrow">تعلم البرمجة خطوة بخطوة</span>
                <h1>عبقورا 🎓</h1>
                <p>مسارات عربية مبسطة للأطفال، مع تقدم واضح ومتابعة آمنة من المعلم.</p>
                <div className="actions hero-actions">
                    <Link href="/login" className="button">تسجيل الدخول</Link>
                    <Link href="/register" className="button secondary">إنشاء حساب جديد</Link>
                </div>
            </section>

            <section className="catalog-section" aria-labelledby="catalog-title">
                <div className="section-heading">
                    <div>
                        <span className="eyebrow">دليل التعلم</span>
                        <h2 id="catalog-title">اختر الدورة المناسبة</h2>
                    </div>
                    <p>مساران ذاتيا الإيقاع، مرتبان حسب العمر والخبرة.</p>
                </div>
                {catalogError && <div className="error-box">{catalogError}</div>}
                <div className="course-catalog-grid">
                    {courses.map((course) => <CourseCard key={course._id} course={course} />)}
                </div>
            </section>

            <section className="feature-strip">
                <div><strong>🧭 مسار واضح</strong><span>درس واحد متاح في كل خطوة</span></div>
                <div><strong>👩‍🏫 مراجعة بشرية</strong><span>المعلم يعتمد الإكمال ويقدم ملاحظاته</span></div>
                <div><strong>🏆 تقدم محفوظ</strong><span>إنجازاتك السابقة تبقى كما هي</span></div>
            </section>
        </main>
    );
}
