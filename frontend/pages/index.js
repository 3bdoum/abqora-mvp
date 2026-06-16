import Link from 'next/link';

export default function Home() {
    return (
        <main className="page shell rtl" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <section className="hero-card" style={{ padding: '60px 40px' }}>
                <h1>عبقورة 🎓</h1>
                <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
                    المنصة البرمجية العربية الأولى للأطفال والمبتدئين (من سن 5 إلى 16 سنة).
                </p>
                <p style={{ maxWidth: '750px', margin: '0 auto 32px', lineHeight: '1.8' }}>
                    نقدم تعليماً برمجياً تفاعلياً مبسطاً باللغة العربية كطبقة توجيهية فوق مناهج Code.org العالمية.
                    نساعد الأطفال على فهم التفكير الحاسوبي، بناء الألعاب، وإحراز الشهادات، مع توفير لوحة متابعة شاملة لأولياء الأمور!
                </p>
                <div className="actions" style={{ gap: '20px' }}>
                    <Link href="/login" className="button" style={{ fontSize: '1.1rem', padding: '14px 32px' }}>
                        تسجيل الدخول
                    </Link>
                    <Link href="/register" className="button secondary" style={{ fontSize: '1.1rem', padding: '14px 32px' }}>
                        إنشاء حساب جديد
                    </Link>
                </div>
            </section>

            <section style={{ margin: '40px 0' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '32px' }}>ماذا تقدم منصة عبقورا؟ 🚀</h2>
                <div className="grid-cards">
                    <div className="card">
                        <h3>📚 منهج منظم متكامل</h3>
                        <p>شروحات مرئية باللغة العربية لتغطية كافة المبادئ البرمجية الأساسية مثل التكرار والدوال والأحداث.</p>
                    </div>
                    <div className="card">
                        <h3>🎮 تكامل مع Code.org</h3>
                        <p>تطبيق عملي فوري عبر أنشطة منصة Code.org العالمية لتنمية مهارات التفكير المنطقي خطوة بخطوة.</p>
                    </div>
                    <div className="card">
                        <h3>👨‍👩‍👧 لوحة أولياء الأمور</h3>
                        <p>لوحة تفاعلية تسمح للوالدين بمتابعة نسبة تقدم الطفل في الدورة، نتائج اختباراته، وشهاداته الصادرة.</p>
                    </div>
                    <div className="card">
                        <h3>🏆 شهادات إتمام موثقة</h3>
                        <p>شهادة إلكترونية رسمية عند إتمام الدورة بنسبة 100% واجتياز الاختبارات بصفحة تحقق عامة مخصصة.</p>
                    </div>
                </div>
            </section>
        </main>
    );
}
