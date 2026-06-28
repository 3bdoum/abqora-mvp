import { useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

const officialResultUrl = 'https://g12.emis.gov.eg/';
const ministryUrl = 'https://moe.gov.eg/';

export default function ThanaweyaResultPage() {
    const [score, setScore] = useState('');
    const [total, setTotal] = useState('410');

    const percentage = useMemo(() => {
        const numericScore = Number(score);
        const numericTotal = Number(total);
        if (!numericScore || !numericTotal || numericScore < 0 || numericTotal <= 0 || numericScore > numericTotal) {
            return null;
        }
        return ((numericScore / numericTotal) * 100).toFixed(2);
    }, [score, total]);

    const estimateLabel = useMemo(() => {
        if (!percentage) return 'أدخل المجموع لحساب النسبة';
        const value = Number(percentage);
        if (value >= 90) return 'ممتاز — ابدأ في مقارنة الكليات المناسبة لهدفك';
        if (value >= 80) return 'جيد جدًا — لديك اختيارات قوية تحتاج ترتيبًا هادئًا';
        if (value >= 70) return 'جيد — ركز على البدائل الواقعية والمسارات العملية';
        if (value >= 60) return 'مقبول — ابحث عن مسارات مهارية داعمة لسوق العمل';
        return 'تحتاج خطة بدائل وتطوير مهارات واضحة';
    }, [percentage]);

    return (
        <>
            <Head>
                <title>نتيجة الثانوية العامة 2026 | رابط رسمي وخطوات آمنة | عبقورا</title>
                <meta
                    name="description"
                    content="اعرف طريقة الوصول إلى نتيجة الثانوية العامة 2026 من الرابط الرسمي لوزارة التربية والتعليم، مع خطوات آمنة وحاسبة نسبة بدون تخزين بيانات الطالب."
                />
                <meta name="robots" content="index,follow" />
                <meta property="og:title" content="نتيجة الثانوية العامة 2026 من المصدر الرسمي" />
                <meta
                    property="og:description"
                    content="صفحة إرشادية من عبقورا للوصول الآمن إلى نتيجة الثانوية العامة وحساب النسبة التقريبية."
                />
                <meta property="og:type" content="website" />
            </Head>

            <main className="page shell rtl public-result-page">
                <section className="hero-card result-hero">
                    <div className="result-hero-copy">
                        <span className="eyebrow">خدمة عامة من عبقورا</span>
                        <h1>نتيجة الثانوية العامة 2026 من المصدر الرسمي</h1>
                        <p>
                            هذه الصفحة تساعدك تصل للرابط الرسمي وتفهم الخطوات بهدوء. عبقورا لا يعرض النتيجة بنفسه ولا يخزن رقم الجلوس أو بيانات الطالب.
                        </p>
                        <div className="actions hero-actions">
                            <a href={officialResultUrl} target="_blank" rel="noopener noreferrer" className="button">
                                فتح موقع النتيجة الرسمي
                            </a>
                            <a href={ministryUrl} target="_blank" rel="noopener noreferrer" className="button secondary">
                                موقع وزارة التربية والتعليم
                            </a>
                        </div>
                    </div>

                    <aside className="result-trust-panel" aria-label="تنبيه الخصوصية">
                        <span aria-hidden="true">🛡️</span>
                        <strong>خصوصيتك أولًا</strong>
                        <p>لا تدخل رقم الجلوس إلا داخل الموقع الرسمي فقط.</p>
                    </aside>
                </section>

                <section className="result-notice-card">
                    <span aria-hidden="true">⚠️</span>
                    <div>
                        <strong>تنبيه مهم</strong>
                        <p>
                            عبقورا ليس موقعًا رسميًا لإعلان النتيجة. نحن نوفر دليلًا وروابط رسمية فقط، ولا نستخدم scraping أو أي طريقة غير مصرح بها لجلب النتائج.
                        </p>
                    </div>
                </section>

                <section className="result-grid">
                    <article className="card result-steps-card">
                        <span className="eyebrow">الخطوات</span>
                        <h2>كيف تعرف النتيجة بأمان؟</h2>
                        <ol className="result-steps-list">
                            <li>
                                <strong>افتح الرابط الرسمي</strong>
                                <span>استخدم رابط وزارة التربية والتعليم أو رابط خدمة النتيجة الرسمي.</span>
                            </li>
                            <li>
                                <strong>أدخل رقم الجلوس داخل الموقع الرسمي فقط</strong>
                                <span>لا ترسل رقم الجلوس في تعليقات أو صفحات غير موثوقة.</span>
                            </li>
                            <li>
                                <strong>راجع الاسم والمدرسة والمجموع</strong>
                                <span>تأكد أن البيانات المعروضة تخص الطالب الصحيح.</span>
                            </li>
                            <li>
                                <strong>احفظ النتيجة لنفسك</strong>
                                <span>لا تشارك صورة النتيجة كاملة إذا كانت تحتوي بيانات شخصية.</span>
                            </li>
                        </ol>
                    </article>

                    <article className="card result-calculator-card">
                        <span className="eyebrow">حاسبة سريعة</span>
                        <h2>احسب النسبة التقريبية</h2>
                        <p>الحاسبة تعمل داخل جهازك فقط ولا تحفظ أي بيانات.</p>

                        <label htmlFor="score">المجموع الذي حصلت عليه</label>
                        <input
                            id="score"
                            inputMode="decimal"
                            value={score}
                            onChange={(event) => setScore(event.target.value)}
                            placeholder="مثال: 365"
                        />

                        <label htmlFor="total">المجموع الكلي</label>
                        <input
                            id="total"
                            inputMode="decimal"
                            value={total}
                            onChange={(event) => setTotal(event.target.value)}
                            placeholder="مثال: 410"
                        />

                        <div className="result-percentage-box">
                            <span>النسبة</span>
                            <strong>{percentage ? `${percentage}%` : '—'}</strong>
                            <p>{estimateLabel}</p>
                        </div>
                    </article>
                </section>

                <section className="result-help-grid" aria-label="أسئلة مهمة">
                    <article>
                        <span aria-hidden="true">🔗</span>
                        <h3>هل الرابط رسمي؟</h3>
                        <p>اعتمد دائمًا على روابط وزارة التربية والتعليم أو الخدمات التابعة لها مثل نطاق emis.gov.eg.</p>
                    </article>
                    <article>
                        <span aria-hidden="true">📱</span>
                        <h3>الموقع لا يفتح؟</h3>
                        <p>وقت إعلان النتيجة قد يكون عليه ضغط كبير. جرّب مرة أخرى بعد دقائق ولا تدخل بياناتك في مواقع بديلة مجهولة.</p>
                    </article>
                    <article>
                        <span aria-hidden="true">🎯</span>
                        <h3>بعد النتيجة؟</h3>
                        <p>ابدأ بترتيب رغباتك وخطة مهاراتك. البرمجة واللغة الإنجليزية مهارتان مفيدتان لأي مسار جامعي.</p>
                    </article>
                </section>

                <section className="result-growth-card">
                    <div>
                        <span className="eyebrow">من النتيجة إلى المهارة</span>
                        <h2>ابدأ بناء مهارة حقيقية بعد الثانوية</h2>
                        <p>
                            عبقورا يركز حاليًا على تعليم الأطفال، لكن نفس الفكرة مهمة لكل طالب: خطوة صغيرة، تدريب عملي، ومتابعة واضحة.
                        </p>
                    </div>
                    <Link href="/" className="button">تعرف على عبقورا</Link>
                </section>
            </main>
        </>
    );
}
