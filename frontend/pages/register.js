import { useState, useEffect } from 'react';
import API from '../utils/api';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Register() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');
    const [ageGroup, setAgeGroup] = useState('9-12');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            router.push('/dashboard');
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !email || !password || !role) {
            setMessage('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        setLoading(true);
        setMessage('');

        // If not a student, set ageGroup to none
        const finalAgeGroup = role === 'student' ? ageGroup : 'none';

        try {
            const { data } = await API.post('/auth/register', {
                name,
                email,
                password,
                role,
                ageGroup: finalAgeGroup
            });

            localStorage.setItem('token', data.token);
            localStorage.setItem('userName', data.name);
            localStorage.setItem('userEmail', data.email);
            localStorage.setItem('userRole', data.role);
            localStorage.setItem('userAgeGroup', data.ageGroup);

            router.push('/dashboard');
        } catch (error) {
            setMessage(error.response?.data?.message || 'حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة لاحقاً.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="page shell rtl" style={{ display: 'flex', alignItems: 'center', minHeight: '90vh' }}>
            <div className="auth-card" style={{ width: '100%' }}>
                <h1>إنشاء حساب جديد ✨</h1>
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '24px' }}>
                    سجل حسابك مجاناً وابدأ مغامرتك البرمجية اليوم!
                </p>

                {message && <div className="error-box">{message}</div>}

                <form onSubmit={handleSubmit}>
                    <label>الاسم الكامل</label>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="الاسم الثلاثي أو الثنائي"
                        required
                    />

                    <label>البريد الإلكتروني</label>
                    <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        placeholder="example@mail.com"
                        required
                    />

                    <label>كلمة المرور</label>
                    <input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                        placeholder="••••••••"
                        required
                    />

                    <label>نوع الحساب</label>
                    <select value={role} onChange={(e) => setRole(e.target.value)} style={{ marginBottom: '20px' }}>
                        <option value="student">طالب (أتعلم البرمجة) 🎒</option>
                        <option value="parent">ولي أمر (أتابع أطفالي) 👨‍👩‍👦</option>
                    </select>

                    {role === 'student' && (
                        <>
                            <label>الفئة العمرية</label>
                            <select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} style={{ marginBottom: '20px' }}>
                                <option value="5-8">من 5 إلى 8 سنوات 🧸</option>
                                <option value="9-12">من 9 إلى 12 سنة 🚀</option>
                                <option value="13-16">من 13 إلى 16 سنة 💻</option>
                            </select>
                        </>
                    )}

                    <button type="submit" className="button" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
                        {loading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب جديد'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem' }}>
                    لديك حساب بالفعل؟ <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>سجل دخولك</Link>
                </p>
            </div>
        </main>
    );
}
