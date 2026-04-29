const GAS_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_GOOGLE_APP_SCRIPT_URL;

// Mock data for development if URL is not set
const MOCK_QUESTIONS = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    question: `測試題目 ${i + 1}: 這是模擬的題目內容，請選擇一個答案。`,
    options: ['選項 A 的內容', '選項 B 的內容', '選項 C 的內容', '選項 D 的內容'],
    image: null,
}));

export const fetchQuestions = async (subject, num) => {
    if (!GAS_URL) {
        console.warn('GAS_URL not set, using mock data');
        await new Promise(resolve => setTimeout(resolve, 1000));
        return num > 0 ? MOCK_QUESTIONS.slice(0, num) : MOCK_QUESTIONS;
    }

    try {
        let url = `${GAS_URL}?action=getQuestions&subject=${encodeURIComponent(subject)}`;
        if (num > 0) {
            url += `&num=${num}`;
        }

        const response = await fetch(url, {
            method: 'GET',
            redirect: 'follow'
        });

        if (!response.ok) {
            throw new Error(`伺服器回應錯誤: ${response.status}`);
        }

        const text = await response.text();
        try {
            return JSON.parse(text);
        } catch (e) {
            console.error('JSON Parse Error:', text.substring(0, 100));
            if (text.includes('<!DOCTYPE html>') || text.includes('Google Accounts')) {
                throw new Error('權限錯誤：請確認 Apps Script 部署為「任何人 (Anyone)」可存取');
            }
            throw new Error('資料格式錯誤：伺服器未回傳有效的 JSON');
        }
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
};

export const submitExam = async (resultData) => {
    if (!GAS_URL) {
        console.log('Mock Submit:', resultData);
        // Mock: 隨機計分
        const totalQuestions = resultData.totalQuestions || 20;
        const correctCount = Math.floor(Math.random() * totalQuestions);
        const score = Math.round((correctCount / totalQuestions) * 100);

        // Mock 錯題
        const wrongAnswers = [];
        for (let i = correctCount + 1; i <= totalQuestions; i++) {
            wrongAnswers.push({
                questionId: i,
                question: `測試題目 ${i}`,
                userAnswer: 'B',
                correctAnswer: 'A'
            });
        }

        return {
            score,
            correctCount,
            totalQuestions,
            wrongAnswers
        };
    }

    try {
        const response = await fetch(GAS_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'submitArgs', ...resultData }),
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Submit error:', error);
        throw error;
    }
};
