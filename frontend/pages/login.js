import { useState, useEffect } from 'react';
import API from '../utils/api';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // If already logged in, redirect to dashboard
        const token = localStorage.getItem('token');
        if (token) {
            const role = localStorage.getItem('userRole');
            if (role === 'teacher') router.push('/teacher/dashboard');
            else if (role === 'admin') router.push('/admin');
            else if (role === 'parent') router.push('/parent/dashboard');
            else router.push('/dashboard');
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            setMessage('يرجى ملء جميع الحقول');
            return;
        }
        
        setLoading(true);
        setMessage('');

        try {
            const { data } = await API.post('/auth/login', { email, password });
            localStorage.setItem('token', data.token);
            localStorage.setItem('userName', data.name);
            localStorage.setItem('userEmail', data.email);
            localStorage.setItem('userRole', data.role);
            localStorage.setItem('userAgeGroup', data.ageGroup);
            
            if (data.role === 'teacher') router.push('/teacher/dashboard');
            else if (data.role === 'admin') router.push('/admin');
            else if (data.role === 'parent') router.push('/parent/dashboard');
            else router.push('/dashboard');
        } catch (error) {
            setMessage(error.response?.data?.message || 'حدث خطأ أثناء تسجيل الدخول. يرجى التحقق من البيانات.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="page shell rtl" style={{ display: 'flex', alignItems: 'center', minHeight: '80vh' }}>
            <div className="auth-card" style={{ width: '100%' }}>
                <h1>تسجيل الدخول 🔑</h1>
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '24px' }}>
                    أهلاً بك مجدداً في عبقورا!
                </p>
                
                {message && <div className="error-box">{message}</div>}
                
                <form onSubmit={handleSubmit}>
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
                    
                    <button type="submit" className="button" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
                        {loading ? 'جاري الدخول...' : 'دخول'}
                    </button>
                </form>
                
                <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem' }}>
                    لا تملك حساب؟ <Link href="/register" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>أنشئ حساباً جديداً</Link>
                </p>
            </div>
        </main>
    );
}
