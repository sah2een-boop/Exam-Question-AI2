import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useExam } from '../context/ExamContext';
import { fetchQuestions, submitExam } from '../services/api';
import QuestionCard from '../components/QuestionCard';
import QuestionMap from '../components/QuestionMap';
import { Clock, LayoutGrid, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';

const SHUFFLE = import.meta.env.VITE_SHUFFLE_OPTIONS === 'true';
const EXAM_DURATION_SEC = 60 * 60; // 1 Hour

export default function Exam() {
    const { state, dispatch } = useExam();
    const navigate = useNavigate();
    const location = useLocation();
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(EXAM_DURATION_SEC);
    const [showMap, setShowMap] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize Exam
    useEffect(() => {
        // If no user data, redirect to home
        if (!location.state?.id || !location.state?.name) {
            navigate('/');
            return;
        }

        const initExam = async () => {
            try {
                let questions = await fetchQuestions(location.state.subject);

                // Shuffle Options if enabled
                if (SHUFFLE) {
                    questions = questions.map(q => ({
                        ...q,
                        options: [...q.options].sort(() => Math.random() - 0.5)
                    }));
                }

                // Shuffle Questions themselves? "隨機撈取 N 題" - GAS does this usually. 
                // But if we want extra shuffle:
                // questions.sort(() => Math.random() - 0.5);

                dispatch({
                    type: 'START_EXAM',
                    payload: {
                        user: location.state,
                        questions
                    }
                });
                setIsLoading(false);
            } catch (err) {
                console.error("Failed to load exam", err);
                alert(`錯誤：${err.message}`);
                navigate('/');
            }
        };

        // Always initialize exam to clear previous answers
        initExam();
    }, [navigate, location.state, state.status, dispatch]);

    // Timer
    useEffect(() => {
        if (isLoading || state.status !== 'active') return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit(); // Auto submit
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isLoading, state.status]);

    const handleAnswer = (option) => {
        const question = state.questions[currentQuestionIndex];
        if (!question) return;
        dispatch({
            type: 'ANSWER_QUESTION',
            payload: { questionId: question.id, answer: option }
        });
    };

    const handleFlag = (flag) => {
        const question = state.questions[currentQuestionIndex];
        if (!question) return;
        dispatch({
            type: 'TOGGLE_FLAG',
            payload: { questionId: question.id, flag }
        });
    };

    const handleSubmit = async () => {
        // Calculate Score Locally or Prepare for GAS
        // For GAS, we send answers.

        // Check if confirming?
        // In this flow, we go to Result page directly?
        // Or we submit here?
        // Let's submit here.

        // navigate to Result
        // Result page will handle the submission effect or we do it here.
        // Better to do it in context or here.

        // For simplicity, let's just calculate score locally if we have answers (from options check?),
        // but the sheet has '解答' (Answer). 
        // The requirement says "類似 Google Sheets 的「題目」工作表隨機撈取 N 題（不包含解答欄位）".
        // Wait!! The Frontend does NOT have the answers!
        // "不包含解答欄位" -> Browser doesn't verify.
        // "成績計算：將作答結果傳送到 Google Apps Script 計算成績"
        // So we MUST submit to GAS to get the score.

        const resultData = {
            id: state.user.id,
            name: state.user.name,
            subject: state.user.subject,
            answers: state.answers, // Keyed by ID
            timeLeft,
            totalTimeTaken: EXAM_DURATION_SEC - timeLeft
        };

        navigate('/result', { state: { resultData } });
    };

    const formatTime = (sec) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const currentQuestion = state.questions[currentQuestionIndex];
    const answeredCount = Object.keys(state.answers).length;
    const totalCount = state.questions.length;

    if (isLoading || !currentQuestion) {
        return <div className="min-h-screen flex items-center justify-center">載入試題中...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {/* Header */}
            <header className="bg-white shadow-sm px-4 py-3 flex justify-between items-center sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    {showMap ? (
                        <button onClick={() => setShowMap(false)} className="flex items-center text-gray-600 hover:text-gray-900">
                            <ArrowLeft className="w-5 h-5 mr-1" /> 回到題目
                        </button>
                    ) : (
                        <button
                            onClick={() => setShowMap(true)}
                            className="flex items-center text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-md transition-colors"
                        >
                            <LayoutGrid className="w-5 h-5 mr-2" />
                            總覽
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-6 text-sm font-medium">
                    <div className="hidden sm:block text-gray-500">
                        已作答: <span className="text-green-600 font-bold">{answeredCount}</span> / {totalCount}
                    </div>
                    <div className={clsx("flex items-center px-3 py-1 rounded-full", timeLeft < 300 ? "bg-red-100 text-red-600 animate-pulse" : "bg-gray-100 text-gray-700")}>
                        <Clock className="w-4 h-4 mr-2" />
                        {formatTime(timeLeft)}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-4 max-w-4xl mx-auto w-full relative">
                {showMap ? (
                    <QuestionMap
                        totalQuestions={state.questions.length}
                        answers={state.answers}
                        flags={state.flags}
                        currentQuestionIndex={currentQuestionIndex}
                        onJump={(idx) => {
                            setCurrentQuestionIndex(idx);
                            setShowMap(false);
                        }}
                    />
                ) : (
                    <QuestionCard
                        question={currentQuestion}
                        questionIndex={currentQuestionIndex}
                        totalQuestions={state.questions.length}
                        selectedAnswer={state.answers[currentQuestion.id]}
                        flag={state.flags[currentQuestion.id]}
                        onAnswer={handleAnswer}
                        onFlag={handleFlag}
                        onNext={() => {
                            if (currentQuestionIndex < state.questions.length - 1) {
                                setCurrentQuestionIndex(prev => prev + 1);
                            } else {
                                setShowMap(true); // Review before submit
                            }
                        }}
                        onPrev={() => {
                            if (currentQuestionIndex > 0) {
                                setCurrentQuestionIndex(prev => prev - 1);
                            }
                        }}
                    />
                )}
            </main>

            {/* Submit Button (only visible in Map or Last Question?) */}
            {showMap && (
                <div className="p-4 flex justify-center sticky bottom-0 bg-gray-100/90 backdrop-blur-sm">
                    <button
                        onClick={() => {
                            if (window.confirm('確定要提交試卷嗎？')) {
                                handleSubmit();
                            }
                        }}
                        className="bg-green-600 text-white px-8 py-3 rounded-xl shadow-lg hover:bg-green-700 font-bold text-lg"
                    >
                        提交試卷
                    </button>
                </div>
            )}
        </div>
    );
}
