const GAS_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_GOOGLE_APP_SCRIPT_URL;

// Mock data for development if URL is not set
const MOCK_QUESTIONS = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    question: `測試題目 ${i + 1}: 這是模擬的題目內容，請選擇一個答案。`,
    options: ['選項 A', '選項 B', '選項 C', '選項 D'],
    answer: '選項 A', // Simple mock
    image: `https://api.dicebear.com/9.x/shapes/svg?seed=${i}`,
}));

export const fetchQuestions = async (subject) => {
    if (!GAS_URL) {
        console.warn('GAS_URL not set, using mock data');
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        return MOCK_QUESTIONS;
    }

    try {
        const response = await fetch(`${GAS_URL}?action=getQuestions&subject=${encodeURIComponent(subject)}`, {
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
            console.error('JSON Parse Error:', text.substring(0, 100)); // Log first 100 chars
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
        // Calculate mock score
        const correctCount = 15;
        const totalQuestions = 20;
        const score = Math.round((correctCount / totalQuestions) * 100);
        return {
            score,
            correctCount,
            totalQuestions
        }; // Mock response
    }

    try {
        const response = await fetch(GAS_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'submitArgs', ...resultData }),
            // mode: 'no-cors' // Google Apps Script often needs this or text/plain
        });
        // GAS POST typically returns 302 or opaque response if no-cors. 
        // Usually we use text/plain content type to avoid preflight options.
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Submit error:', error);
        throw error;
    }
};
