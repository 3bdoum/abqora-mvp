import { useEffect, useState } from 'react';
import Link from 'next/link';
import CourseCard from '../components/CourseCard';
import API from '../utils/api';

const homeAds = [
    {
        badge: 'عرض تعليمي',
        title: 'جلسة تعريفية مجانية للأهل',
        description: 'اكتشف كيف يتعلم الطفل داخل عبقورا: فيديو شرح، تطبيق عملي، ومراجعة من المعلم.',
        action: 'احجز اهتمامك',
        href: '/register',
        icon: '🎁',
    },
    {
        badge: 'مساحة إعلان',
        title: 'مكان مخصص لشريك تعليمي',
        description: 'يمكن استخدام هذه المساحة لاحقًا لعروض المدارس، المعسكرات، أو شركاء المحتوى المناسبين للأطفال.',
        action: 'تواصل معنا',
        href: '/login',
        icon: '📣',
    },
];

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
            <section className="hero-card home-hero landing-hero">
                <div className="landing-hero-copy">
                    <span className="eyebrow">تعلم البرمجة للأطفال بالعربية</span>
                    <h1>عبقورا يساعد الطفل يتعلم خطوة صغيرة كل يوم 🎓</h1>
                    <p>
                        تجربة عربية RTL تجمع بين فيديو شرح مبسط، تطبيق عملي على Code.org، ومتابعة آمنة من المعلم وولي الأمر.
                    </p>
                    <div className="actions hero-actions">
                        <Link href="/register" className="button">ابدأ الآن</Link>
                        <Link href="/login" className="button secondary">لدي حساب بالفعل</Link>
                    </div>
                </div>

                <div className="landing-hero-panel" aria-label="ملخص عبقورا">
                    <div>
                        <strong>2</strong>
                        <span>مسارات تعلم</span>
                    </div>
                    <div>
                        <strong>42</strong>
                        <span>درسًا إجماليًا</span>
                    </div>
                    <div>
                        <strong>3</strong>
                        <span>أدوار متابعة</span>
                    </div>
                </div>
            </section>

            <section className="home-ads-section" aria-labelledby="home-ads-title">
                <div className="section-heading compact-heading">
                    <div>
                        <span className="eyebrow">إعلانات وعروض</span>
                        <h2 id="home-ads-title">مساحة مخصصة للعروض المهمة</h2>
                    </div>
                    <p>نستخدمها للعروض المناسبة للأهل والطلاب بدون إزعاج تجربة التعلم.</p>
                </div>

                <div className="home-ads-grid">
                    {homeAds.map((ad) => (
                        <article className="home-ad-card" key={ad.title}>
                            <span className="home-ad-icon" aria-hidden="true">{ad.icon}</span>
                            <div>
                                <span className="tag soft-tag">{ad.badge}</span>
                                <h3>{ad.title}</h3>
                                <p>{ad.description}</p>
                            </div>
                            <Link href={ad.href} className="small-button secondary">
                                {ad.action}
                            </Link>
                        </article>
                    ))}
                </div>
            </section>

            <section className="landing-audience-grid" aria-label="ماذا يقدم عبقورا؟">
                <article>
                    <span>👧</span>
                    <h3>للطفل</h3>
                    <p>واجهة واضحة حسب العمر، فيديو قبل التطبيق، وشارات تشجعه على الاستمرار.</p>
                </article>
                <article>
                    <span>👨‍👩‍👦</span>
                    <h3>لولي الأمر</h3>
                    <p>لوحة متابعة تعرض التقدم، الدروس المنتظرة، والشهادات بدون تفاصيل مربكة.</p>
                </article>
                <article>
                    <span>👩‍🏫</span>
                    <h3>للمعلم</h3>
                    <p>اعتماد الإكمال، ملاحظات قصيرة، وفتح أو قفل الدروس لطالب محدد عند الحاجة.</p>
                </article>
            </section>

            <section className="landing-flow-section">
                <div className="section-heading">
                    <div>
                        <span className="eyebrow">طريقة التعلم</span>
                        <h2>رحلة بسيطة من 4 خطوات</h2>
                    </div>
                    <p>صممنا التدفق ليكون مفهومًا للأطفال ومطمئنًا للأهل.</p>
                </div>

                <div className="landing-flow-grid">
                    <div><strong>1</strong><span>يشاهد الطالب فيديو الشرح داخل عبقورا.</span></div>
                    <div><strong>2</strong><span>ينتقل للتطبيق العملي على Code.org.</span></div>
                    <div><strong>3</strong><span>يرجع إلى عبقورا ويرسل “أنهيت الدرس”.</span></div>
                    <div><strong>4</strong><span>يعتمد المعلم الإكمال ويفتح الدرس التالي.</span></div>
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

            <section className="feature-strip landing-feature-strip">
                <div><strong>🧭 مسار واضح</strong><span>درس واحد متاح في كل خطوة</span></div>
                <div><strong>👩‍🏫 مراجعة بشرية</strong><span>المعلم يعتمد الإكمال ويقدم ملاحظاته</span></div>
                <div><strong>🏆 تقدم محفوظ</strong><span>إنجازات وشهادات تظهر للطالب وولي الأمر</span></div>
            </section>

            <section className="landing-safety-card">
                <div>
                    <span className="eyebrow">أمان ووضوح</span>
                    <h2>لا نعتمد على تتبع غير مصرح من Code.org</h2>
                    <p>
                        عبقورا يستخدم تدفقًا آمنًا: الطالب يتدرب خارجيًا، ثم يرسل الإكمال داخل عبقورا، والمعلم يراجع ويعتمد.
                    </p>
                </div>
                <Link href="/register" className="button">إنشاء حساب جديد</Link>
            </section>
        </main>
    );
}
