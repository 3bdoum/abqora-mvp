import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Head from 'next/head';

export default function PublicCertificatePage() {
    const router = useRouter();
    const { id } = router.query;
    const [cert, setCert] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id) return;

        axios.get(`http://localhost:5001/api/certificates/${id}`)
            .then((res) => {
                setCert(res.data);
            })
            .catch((err) => {
                setError('عذراً، لم نتمكن من العثور على شهادة بهذا الرمز. يرجى التحقق من صحة الرابط.');
            });
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <>
            <Head>
                <title>شهادة إتمام معتمدة - عبقورا</title>
                <meta name="description" content="صفحة التحقق من صحة شهادة إتمام دورة برمجية من منصة عبقورا" />
            </Head>

            <main className="rtl page certificate-view" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', backgroundColor: '#f1f5f9' }}>
                
                {/* Back to Home / Verification Info */}
                <div className="no-print" style={{ textAlign: 'center', marginBottom: '24px', maxWidth: '800px', width: '100%' }}>
                    <h2 style={{ color: 'var(--primary)', marginBottom: '8px' }}>شهادة إتمام موثقة ✓</h2>
                    <p style={{ fontSize: '0.95rem' }}>
                        هذه الصفحة عامة وتتيح لأولياء الأمور والمؤسسات التحقق من صحة الشهادة الصادرة للطفل من منصة عبقورا لتعليم البرمجة.
                    </p>
                </div>

                {error && (
                    <div className="error-box" style={{ maxWidth: '600px', width: '100%', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                {cert ? (
                    <>
                        <div className="certificate-paper">
                            {/* Certificate Border Details */}
                            <div className="certificate-subheader">
                                شهادة إتمام دورة برمجية
                            </div>
                            
                            <h1 className="certificate-header">منصة عبقورا لتعليم البرمجة 🎓</h1>
                            
                            <p style={{ fontStyle: 'italic', color: '#64748b', margin: '12px 0' }}>
                                تشهد إدارة المنصة بأن العبقري(ة) البطل:
                            </p>
                            
                            <div className="certificate-recipient">
                                {cert.studentName}
                            </div>
                            
                            <p style={{ maxWidth: '550px', margin: '8px auto', fontSize: '1.05rem', lineHeight: '1.7', color: '#334155' }}>
                                قد أتم(ت) بنجاح جميع الدروس البرمجية وحل التحديات العملية واجتياز كافة الاختبارات والتقييمات المخصصة لدورة:
                            </p>
                            
                            <div className="certificate-course">
                                {cert.courseTitle}
                            </div>

                            {/* Seal / Stamp */}
                            <div className="certificate-stamp">
                                عبقورا<br />APPROVED
                            </div>

                            {/* Signatures & Info */}
                            <div className="certificate-footer">
                                <div className="certificate-metadata">
                                    <div><strong>رقم التحقق:</strong> {cert.certificateId}</div>
                                    <div><strong>تاريخ الإصدار:</strong> {new Date(cert.issueDate).toLocaleDateString('ar-EG')}</div>
                                    <div style={{ color: 'var(--success)', marginTop: '4px', fontWeight: 'bold' }}>✓ شهادة رقمية معتمدة</div>
                                </div>
                                <div className="certificate-signature-box">
                                    <div>مؤسس المنصة</div>
                                    <div style={{ fontFamily: 'Brush Script MT, cursive', fontSize: '1.5rem', color: '#1e3a8a', transform: 'rotate(-5deg)', margin: '4px 0' }}>
                                        Abqora Team
                                    </div>
                                    <div className="certificate-signature-line">معلم البرمجة المعتمد</div>
                                </div>
                            </div>
                        </div>

                        {/* Print Actions */}
                        <div className="no-print" style={{ marginTop: '32px', display: 'flex', gap: '16px' }}>
                            <button onClick={handlePrint} className="button btn-success" style={{ fontSize: '1rem', padding: '12px 28px' }}>
                                طباعة الشهادة / حفظ كـ PDF 🖨️
                            </button>
                            <button onClick={() => router.push('/')} className="button secondary" style={{ fontSize: '1rem', padding: '12px 28px' }}>
                                الصفحة الرئيسية 🏠
                            </button>
                        </div>
                    </>
                ) : (
                    !error && <p style={{ textAlign: 'center' }}>جاري تحميل الشهادة البرمجية...</p>
                )}
            </main>
        </>
    );
}
