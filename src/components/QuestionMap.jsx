import React from 'react';
import { Triangle, Circle, Square } from 'lucide-react';
import clsx from 'clsx';

export default function QuestionMap({
    totalQuestions,
    answers,
    flags,
    currentQuestionIndex,
    onJump
}) {
    return (
        <div className="bg-white rounded-xl shadow-md p-4">
            <h3 className="font-semibold text-gray-700 mb-4 border-b pb-2">題目總覽</h3>
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                {Array.from({ length: totalQuestions }).map((_, idx) => {
                    // answers and flags are keyed by question ID, not index
                    const questionId = idx + 1; // This assumes sequential IDs 1,2,3...
                    // Better: pass questions array and use questions[idx].id
                    const isAnswered = answers.hasOwnProperty(questionId);
                    const flag = flags[questionId];
                    const isCurrent = currentQuestionIndex === idx;

                    return (
                        <button
                            key={idx}
                            onClick={() => onJump(idx)}
                            className={clsx(
                                "relative h-10 rounded-md border text-sm font-medium transition-all flex items-center justify-center",
                                isCurrent ? "ring-2 ring-blue-500 z-10" : "",
                                isAnswered
                                    ? "bg-green-100 border-green-300 text-green-800"
                                    : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                            )}
                        >
                            {idx + 1}
                            {flag && (
                                <div className="absolute -top-1 -right-1 bg-white rounded-full shadow-sm p-0.5">
                                    {flag === 'triangle' && <Triangle className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                                    {flag === 'circle' && <Circle className="w-3 h-3 text-red-500 fill-red-500" />}
                                    {flag === 'square' && <Square className="w-3 h-3 text-blue-500 fill-blue-500" />}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="mt-6 space-y-2 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                    <span>已作答</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-50 border border-gray-200 rounded"></div>
                    <span>未作答</span>
                </div>
                <div className="flex items-center gap-2">
                    <Triangle className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span>已標記</span>
                </div>
            </div>
        </div>
    );
}
