import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useExam } from '../context/ExamContext';
import { fetchQuestions, submitExam } from '../services/api';
import QuestionCard from '../components/QuestionCard';
import QuestionMap from '../components/QuestionMap';
import { Clock, LayoutGrid, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';

const SHUFFLE = import.meta.env.VITE_SHUFFLE_OPTIONS === 'true';

export default function Exam() {
    const { state, dispatch } = useExam();
    const navigate = useNavigate();
    const location = useLocation();
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [showMap, setShowMap] = useState(false);
    const [isLoading, setIsLoading] = useState(true);


    // 從 Home.jsx 傳入的考試時間（分鐘），預設 60
    const duration = location.state?.duration || 60;
    const EXAM_DURATION_SEC = duration * 60;

    // ============================================================
    // 提交試卷（用 useCallback 避免 stale closure）
    // ============================================================
    const handleSubmit = useCallback(() => {
        if (state.status !== 'active') return;

        const resultData = {
            id: state.user.id,
            name: state.user.name,
            subject: state.user.subject,
            answers: state.answers,
            totalQuestions: state.questions.length,
            questions: state.questions,
            timeLeft,
            totalTimeTaken: EXAM_DURATION_SEC - timeLeft
        };

        navigate('/result', { state: { resultData } });
    }, [state, timeLeft, EXAM_DURATION_SEC, navigate]);

    // ============================================================
    // 初始化考試
    // ============================================================
    useEffect(() => {
        if (!location.state?.id || !location.state?.name) {
            navigate('/');
            return;
        }

        const initExam = async () => {
            try {
                const questionCount = location.state.questionCount || 0;
                let questions = await fetchQuestions(location.state.subject, questionCount);

                // 打亂選項順序（建立映射表）
                if (SHUFFLE) {
                    questions = questions.map(q => {
                        const indices = [0, 1, 2, 3];
                        // Fisher-Yates 洗牌
                        for (let i = indices.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1));
                            [indices[i], indices[j]] = [indices[j], indices[i]];
                        }
                        return {
                            ...q,
                            options: indices.map(i => q.options[i]),
                            // 映射：畫面上的位置 → 原始代號
                            optionMap: indices.map(i => ['A', 'B', 'C', 'D'][i]),
                        };
                    });
                }

                dispatch({
                    type: 'START_EXAM',
                    payload: {
                        user: location.state,
                        questions
                    }
                });
                setTimeLeft(EXAM_DURATION_SEC);
                setIsLoading(false);
            } catch (err) {
                console.error("Failed to load exam", err);
                alert(`錯誤：${err.message}`);
                navigate('/');
            }
        };

        initExam();
    }, [navigate, location.state, dispatch, EXAM_DURATION_SEC]);

    // ============================================================
    // 倒數計時器
    // ============================================================
    useEffect(() => {
        if (isLoading || state.status !== 'active') return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isLoading, state.status]);

    // 時間到自動交卷
    useEffect(() => {
        if (timeLeft === 0 && !isLoading && state.status === 'active') {
            handleSubmit();
        }
    }, [timeLeft, isLoading, state.status, handleSubmit]);

    // ============================================================
    // 防止關閉分頁 / 輸入其他網址離開（beforeunload）
    // ============================================================
    useEffect(() => {
        if (isLoading || state.status !== 'active') return;

        const handleBeforeUnload = (e) => {
            e.preventDefault();
            // 瀏覽器會顯示系統預設的「確定要離開嗎？」對話框
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isLoading, state.status]);

    // ============================================================
    // 切換分頁 / Alt+Tab 偵測（visibilitychange）
    // ============================================================
    useEffect(() => {
        if (isLoading || state.status !== 'active') return;

        const handleVisibilityChange = () => {
            if (!document.hidden) {
                // 使用者切回來了，每次都彈出警告
                const shouldSubmit = window.confirm(
                    '⚠️ 偵測到您離開了考試頁面！\n\n' +
                    '點擊「確定」將立即交卷。\n' +
                    '點擊「取消」繼續考試。'
                );
                if (shouldSubmit) {
                    handleSubmit();
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isLoading, state.status, handleSubmit]);

    // ============================================================
    // 作答 & 標記
    // ============================================================
    const handleAnswer = (optionIndex) => {
        const question = state.questions[currentQuestionIndex];
        if (!question) return;

        // 如果有 SHUFFLE 映射，轉回原始代號
        const originalLabel = question.optionMap
            ? question.optionMap[optionIndex]
            : ['A', 'B', 'C', 'D'][optionIndex];

        dispatch({
            type: 'ANSWER_QUESTION',
            payload: { questionId: question.id, answer: originalLabel }
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

    // ============================================================
    // 渲染
    // ============================================================
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
                        questions={state.questions}
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
                                setShowMap(true);
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

            {/* Submit Button */}
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
