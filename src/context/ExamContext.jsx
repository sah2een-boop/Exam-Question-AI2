import React, { createContext, useContext, useReducer } from 'react';

const ExamContext = createContext();

const initialState = {
    user: null, // { id, name, showScore }
    questions: [],
    answers: {}, // { questionId: 'Selected Option' }
    flags: {}, // { questionId: 'triangle' | 'circle' | 'square' | null }
    status: 'idle', // idle, loading, active, finished
    startTime: null,
    score: null,
};

const examReducer = (state, action) => {
    switch (action.type) {
        case 'START_EXAM':
            return {
                ...state,
                user: action.payload.user,
                questions: action.payload.questions,
                status: 'active',
                startTime: Date.now(),
                answers: {},
                flags: {}
            };
        case 'ANSWER_QUESTION':
            return {
                ...state,
                answers: { ...state.answers, [action.payload.questionId]: action.payload.answer }
            };
        case 'TOGGLE_FLAG':
            return {
                ...state,
                flags: { ...state.flags, [action.payload.questionId]: action.payload.flag }
            };
        case 'FINISH_EXAM':
            return { ...state, status: 'finished', score: action.payload.score };
        default:
            return state;
    }
};

export function ExamProvider({ children }) {
    const [state, dispatch] = useReducer(examReducer, initialState);

    return (
        <ExamContext.Provider value={{ state, dispatch }}>
            {children}
        </ExamContext.Provider>
    );
}

export function useExam() {
    return useContext(ExamContext);
}
