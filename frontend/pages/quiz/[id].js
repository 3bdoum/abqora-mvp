import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import QuizPlayer from '../../components/QuizPlayer';
import API from '../../utils/api';

export default function QuizPage() {
    const router = useRouter();
    const { id } = router.query;
    const [quiz, setQuiz] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        if (!id) return;

        API.get(`/quizzes/lesson/${id}`)
            .then((response) => {
                setQuiz(response.data);
            })
            .catch(() => {
                setError('تعذر تحميل هذا الاختبار. يرجى العودة للدرس والتأكد من إتمامه.');
            });
    }, [id]);

    return (
        <Layout>
            <section className="page shell rtl">
                {error && <div className="error-box">{error}</div>}
                
                {quiz ? (
                    <QuizPlayer quiz={quiz} />
                ) : (
                    !error && <p style={{ textAlign: 'center', marginTop: '40px' }}>جاري التحميل...</p>
                )}
            </section>
        </Layout>
    );
}
