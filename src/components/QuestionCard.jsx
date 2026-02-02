import React, { useMemo } from 'react';
import { Triangle, Circle, Square, Check, X, ChevronRight, ChevronLeft } from 'lucide-react';
import clsx from 'clsx';

export default function QuestionCard({
    question,
    questionIndex,
    totalQuestions,
    selectedAnswer,
    onAnswer,
    flag,
    onFlag,
    onNext,
    onPrev
}) {
    // Memoize shuffled options if we were doing it locally, 
    // but better to have options prepared in the question object itself from context to persist order.
    // Assuming question.options is already shuffled or fixed as per config.

    const options = question.options || [];

    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col h-full">
            {/* Header / Toolbar */}
            <div className="bg-gray-50 border-b p-4 flex justify-between items-center">
                <span className="font-semibold text-lg text-gray-700">
                    題目 {questionIndex + 1} <span className="text-gray-400 text-sm">/ {totalQuestions}</span>
                </span>

                {/* Helper Flags */}
                <div className="flex gap-2">
                    <button
                        onClick={() => onFlag(flag === 'triangle' ? null : 'triangle')}
                        className={clsx("p-2 rounded-full hover:bg-yellow-100 transition-colors", flag === 'triangle' ? 'bg-yellow-100 ring-2 ring-yellow-400' : '')}
                        title="Mark with Triangle"
                    >
                        <Triangle className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    </button>
                    <button
                        onClick={() => onFlag(flag === 'circle' ? null : 'circle')}
                        className={clsx("p-2 rounded-full hover:bg-red-100 transition-colors", flag === 'circle' ? 'bg-red-100 ring-2 ring-red-400' : '')}
                        title="Mark with Circle"
                    >
                        <Circle className="w-5 h-5 text-red-500 fill-red-500" />
                    </button>
                    <button
                        onClick={() => onFlag(flag === 'square' ? null : 'square')}
                        className={clsx("p-2 rounded-full hover:bg-blue-100 transition-colors", flag === 'square' ? 'bg-blue-100 ring-2 ring-blue-400' : '')}
                        title="Mark with Square"
                    >
                        <Square className="w-5 h-5 text-blue-500 fill-blue-500" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto">
                <h3 className="text-xl font-medium text-gray-800 mb-6 leading-relaxed">
                    {question.question}
                </h3>

                {question.image && (
                    <div className="mb-6 flex justify-center">
                        <img
                            src={question.image}
                            alt="Question Reference"
                            className="max-h-64 object-contain rounded-lg border"
                        />
                    </div>
                )}

                {/* Options */}
                <div className="grid grid-cols-1 gap-4">
                    {options.map((opt, idx) => {
                        const isSelected = selectedAnswer === opt;
                        return (
                            <button
                                key={idx}
                                onClick={() => onAnswer(opt)}
                                className={clsx(
                                    "text-left p-4 rounded-lg border-2 transition-all flex items-center group relative",
                                    isSelected
                                        ? "border-blue-500 bg-blue-50 text-blue-900"
                                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700"
                                )}
                            >
                                <div className={clsx(
                                    "w-8 h-8 rounded-full border-2 flex items-center justify-center mr-4 shrink-0 transition-colors",
                                    isSelected ? "border-blue-500 bg-blue-500 text-white" : "border-gray-300 text-gray-500 group-hover:border-gray-400"
                                )}>
                                    {['A', 'B', 'C', 'D'][idx]}
                                </div>
                                <span className="text-lg">{opt}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Footer Navigation */}
            <div className="bg-gray-50 border-t p-4 flex justify-between">
                <button
                    onClick={onPrev}
                    disabled={questionIndex === 0}
                    className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronLeft className="w-5 h-5 mr-1" />
                    上一題
                </button>
                <button
                    onClick={onNext}
                    className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                    {questionIndex === totalQuestions - 1 ? '結束並檢查' : '下一題'}
                    {questionIndex !== totalQuestions - 1 && <ChevronRight className="w-5 h-5 ml-1" />}
                </button>
            </div>
        </div>
    );
}
