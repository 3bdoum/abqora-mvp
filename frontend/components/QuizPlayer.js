import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import API from '../utils/api';

export default function QuizPlayer({ quiz }) {
    const router = useRouter();
    const [answers, setAnswers] = useState(Array(quiz.questions.length).fill(null));
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const chooseOption = (questionIndex, optionIndex) => {
        if (result) return; // Prevent changing answers after submission
        const next = [...answers];
        next[questionIndex] = optionIndex;
        setAnswers(next);
    };

    const submit = async () => {
        if (result) return;

        if (answers.some((answer) => answer === null)) {
            setError('يرجى الإجابة على جميع الأسئلة قبل الإرسال 📝');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await API.post('/quizzes/submit', {
                quizId: quiz._id,
                answers,
            });
            setResult(response.data);
        } catch (err) {
            setError('تعذر إرسال إجابات الاختبار. يرجى المحاولة لاحقاً.');
        } finally {
            setLoading(false);
        }
    };

    const calculatePct = () => {
        if (!result) return 0;
        return Math.round((result.score / result.total) * 100);
    };

    const isPassed = () => {
        return calculatePct() >= (quiz.passingScore || 70);
    };

    return (
        <div className="quiz-card" style={{ maxWidth: '700px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '1.75rem', marginBottom: '8px' }}>{quiz.title}</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                درجة النجاح المطلوبة: <span className="tag">{quiz.passingScore || 70}%</span>
            </p>

            {/* Questions List */}
            {quiz.questions.map((question, qIdx) => (
                <div key={qIdx} className="quiz-question" style={{ marginBottom: '24px', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px', background: 'var(--surface)' }}>
                    <p style={{ fontWeight: '700', color: 'var(--text)', fontSize: '1.05rem', marginBottom: '16px' }}>
                        {`${qIdx + 1}. ${question.questionText}`}
                    </p>
                    <div className="options-list">
                        {question.options.map((option, oIdx) => {
                            const isSelected = answers[qIdx] === oIdx;
                            const isCorrectAnswer = result && question.correctIndex === oIdx;
                            const isWrongSelection = result && isSelected && question.correctIndex !== oIdx;
                            
                            let optionClass = 'option';
                            let optionStyle = {};

                            if (isSelected) {
                                optionClass = 'option selected';
                            }

                            if (result) {
                                if (isCorrectAnswer) {
                                    optionStyle = { backgroundColor: 'var(--success-light)', color: 'var(--success)', borderColor: 'var(--success)' };
                                } else if (isWrongSelection) {
                                    optionStyle = { backgroundColor: 'var(--danger-light)', color: 'var(--danger)', borderColor: 'var(--danger)' };
                                } else {
                                    optionStyle = { opacity: 0.6, cursor: 'not-allowed' };
                                }
                            }

                            return (
                                <button
                                    key={oIdx}
                                    className={optionClass}
                                    style={optionStyle}
                                    onClick={() => chooseOption(qIdx, oIdx)}
                                    type="button"
                                    disabled={!!result}
                                >
                                    {option}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}

            {/* Action Area */}
            {!result ? (
                <div>
                    <button className="button" onClick={submit} style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'جاري تصحيح الاختبار...' : 'تسليم الإجابات وإنهاء الاختبار 🏁'}
                    </button>
                    {error && <p className="error" style={{ textAlign: 'center', marginTop: '12px', color: 'var(--danger)', fontWeight: 'bold' }}>{error}</p>}
                </div>
            ) : (
                <div className={isPassed() ? 'success-box' : 'error-box'} style={{ padding: '24px', textAlign: 'center', borderRadius: '20px' }}>
                    <h2 style={{ color: 'inherit', marginBottom: '8px' }}>
                        {isPassed() ? 'تهانينا! لقد اجتزت الاختبار بنجاح 🎉' : 'أوه! لم تجتز النسبة المطلوبة هذه المرة 💫'}
                    </h2>
                    <p style={{ color: 'inherit', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '16px' }}>
                        لقد حصلت على: {result.score} من {result.total} ({calculatePct()}%)
                    </p>
                    <p style={{ color: 'inherit', fontSize: '0.95rem', marginBottom: '24px' }}>
                        {isPassed() ? 'أنت جاهز للانتقال للدرس التالي ومواصلة التعلم!' : 'لا تقلق، يمكنك مراجعة الدرس وإعادة المحاولة في أي وقت.'}
                    </p>
                    
                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button 
                            onClick={() => {
                                // Reset state to try again
                                setResult(null);
                                setAnswers(Array(quiz.questions.length).fill(null));
                            }} 
                            className="button secondary"
                            style={{ padding: '10px 20px' }}
                        >
                            إعادة المحاولة 🔄
                        </button>
                        <Link href="/dashboard" className="button" style={{ textDecoration: 'none', padding: '10px 20px' }}>
                            الذهاب للوحة التحكم 🏠
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
