import React, { useEffect, useState, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useExam } from '../context/ExamContext';
import { submitExam } from '../services/api';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function Result() {
    const { state, dispatch } = useExam();
    const location = useLocation();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const hasSubmitted = useRef(false); // Prevent duplicate submissions

    useEffect(() => {
        const data = location.state?.resultData;
        if (!data) {
            setLoading(false);
            return; // Should redirect
        }

        // Prevent duplicate submission
        if (hasSubmitted.current) {
            return;
        }
        hasSubmitted.current = true;

        const postResults = async () => {
            try {
                const response = await submitExam(data);
                setResult(response);
                dispatch({ type: 'FINISH_EXAM', payload: { score: response.score } });
            } catch (err) {
                console.error(err);
                setError('提交結果失敗，請聯絡管理員。');
            } finally {
                setLoading(false);
            }
        };

        postResults();
    }, [location.state, dispatch]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-600">正在提交試卷...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <XCircle className="w-16 h-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold text-gray-800 mb-2">提交失敗</h1>
                <p className="text-gray-600 mb-6">{error}</p>
                <Link to="/" className="text-blue-600 hover:underline">返回首頁</Link>
            </div>
        );
    }

    const showScore = state.user?.showScore;

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white max-w-lg w-full rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-green-600 p-8 text-center">
                    <CheckCircle className="w-20 h-20 text-white mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-white">測驗完成！</h1>
                </div>

                <div className="p-8 text-center">
                    <p className="text-gray-600 text-lg mb-6">
                        感謝您的參與， <span className="font-semibold text-gray-900">{state.user?.name}</span>.
                        <br />您的成績已紀錄。
                    </p>

                    {showScore && result ? (
                        <>
                            <div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-100">
                                <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">您的分數</span>
                                <div className="text-5xl font-black text-blue-600 mt-2">
                                    {result.score} <span className="text-2xl text-gray-400 font-normal">/ 100</span>
                                </div>
                                <div className="mt-2 text-gray-500 text-sm">
                                    答對題數： {result.correctCount} / {result.totalQuestions}
                                </div>
                            </div>

                            {result.wrongAnswers && result.wrongAnswers.length > 0 && (
                                <div className="bg-red-50 rounded-xl p-6 mb-6 border border-red-100 text-left">
                                    <h3 className="text-sm font-semibold text-red-700 mb-4">答錯的題目</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-red-200">
                                                    <th className="text-left py-2 px-2 font-semibold text-red-700">題號</th>
                                                    <th className="text-left py-2 px-2 font-semibold text-red-700">題目</th>
                                                    <th className="text-left py-2 px-2 font-semibold text-red-700">您的答案</th>
                                                    <th className="text-left py-2 px-2 font-semibold text-red-700">正確答案</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {result.wrongAnswers.map((item, idx) => (
                                                    <tr key={idx} className="border-b border-red-100 last:border-0">
                                                        <td className="py-3 px-2 font-medium text-red-600">{item.questionId}</td>
                                                        <td className="py-3 px-2 text-gray-700">{item.question}</td>
                                                        <td className="py-3 px-2 text-red-600">{item.userAnswer || '未作答'}</td>
                                                        <td className="py-3 px-2 text-green-600 font-medium">{item.correctAnswer}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="bg-yellow-50 rounded-xl p-4 mb-8 text-yellow-800 text-sm">
                            本次測驗不顯示分數。
                        </div>
                    )}

                    <Link
                        to="/"
                        className="inline-block w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        返回首頁
                    </Link>
                </div>
            </div>
        </div>
    );
}
