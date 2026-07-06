import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useExam } from '../context/ExamContext';
import { submitExam } from '../services/api';
import { CheckCircle, XCircle, Loader2, Download, Image, FileText, ChevronDown } from 'lucide-react';
import html2canvas from 'html2canvas';

export default function Result() {
    const { state, dispatch } = useExam();
    const location = useLocation();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [downloading, setDownloading] = useState(false);
    const [showFormatMenu, setShowFormatMenu] = useState(false);
    const hasSubmitted = useRef(false);
    const menuRef = useRef(null);

    // 點擊外部關閉下拉選單
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowFormatMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 從 resultData 取得題目資料，建立查詢表（用於前端顯示錯題詳情）
    const questionMap = useMemo(() => {
        const questions = location.state?.resultData?.questions || [];
        const map = {};
        questions.forEach(q => { map[q.id] = q; });
        return map;
    }, [location.state]);

    // 將選項代號（A/B/C/D）轉換為選項文字（處理選項打亂的情況）
    const getOptionText = (questionId, label) => {
        if (!label) return null;
        const q = questionMap[questionId];
        if (!q) return label;
        const labels = q.optionMap || ['A', 'B', 'C', 'D'];
        const idx = labels.indexOf(label);
        if (idx >= 0 && q.options && q.options[idx]) {
            return `(${label}) ${q.options[idx]}`;
        }
        return label;
    };

    // ============================================================
    // 共用：取得基本資訊與產生 HTML 內容
    // ============================================================
    const getResultInfo = () => {
        const subject = location.state?.resultData?.subject || '未知科目';
        const studentName = state.user?.name || '未知';
        const studentId = state.user?.id || '';
        const now = new Date();
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        return { subject, studentName, studentId, dateStr, timeStr };
    };

    const buildHTMLContent = (info) => {
        const { subject, studentName, studentId, dateStr, timeStr } = info;

        // 建立錯題表格 HTML
        let wrongAnswersHTML = '';
        if (result.wrongAnswers && result.wrongAnswers.length > 0) {
            const rows = result.wrongAnswers.map((item) => {
                const questionText = questionMap[item.questionId]?.question || `題目 ${item.questionId}`;
                const userAns = getOptionText(item.questionId, item.userAnswer) || '未作答';
                const correctAns = getOptionText(item.questionId, item.correctAnswer);
                return `
                    <tr>
                        <td style="padding:10px 12px;border-bottom:1px solid #fecaca;font-weight:600;color:#dc2626;text-align:center;width:60px;">${item.questionId}</td>
                        <td style="padding:10px 12px;border-bottom:1px solid #fecaca;color:#374151;">${questionText}</td>
                        <td style="padding:10px 12px;border-bottom:1px solid #fecaca;color:#dc2626;font-weight:600;">${userAns}</td>
                        <td style="padding:10px 12px;border-bottom:1px solid #fecaca;color:#16a34a;font-weight:600;">${correctAns}</td>
                    </tr>`;
            }).join('');

            wrongAnswersHTML = `
                <div style="background:#fef2f2;border-radius:12px;padding:24px;margin-bottom:24px;border:1px solid #fecaca;">
                    <h3 style="font-size:14px;font-weight:700;color:#b91c1c;margin:0 0 16px 0;">
                        答錯的題目（共 ${result.wrongAnswers.length} 題）
                    </h3>
                    <table style="width:100%;border-collapse:collapse;font-size:13px;">
                        <thead>
                            <tr style="border-bottom:2px solid #fca5a5;">
                                <th style="text-align:left;padding:8px 12px;font-weight:700;color:#b91c1c;">題號</th>
                                <th style="text-align:left;padding:8px 12px;font-weight:700;color:#b91c1c;">題目</th>
                                <th style="text-align:left;padding:8px 12px;font-weight:700;color:#b91c1c;">您的答案</th>
                                <th style="text-align:left;padding:8px 12px;font-weight:700;color:#b91c1c;">正確答案</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>`;
        } else if (result.wrongAnswers && result.wrongAnswers.length === 0) {
            wrongAnswersHTML = `
                <div style="background:#f0fdf4;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;color:#166534;font-weight:600;font-size:16px;">
                    🎉 恭喜！全部答對！
                </div>`;
        }

        const scoreColor = result.score >= 60 ? '#2563eb' : '#dc2626';

        return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>考試結果 - ${studentName} - ${subject} - ${dateStr}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Microsoft JhengHei', 'PingFang TC', 'Noto Sans TC', sans-serif;
            background: #f3f4f6;
            padding: 32px 16px;
            color: #374151;
        }
        .container {
            max-width: 720px;
            margin: 0 auto;
            background: #fff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 24px rgba(0,0,0,0.08);
        }
        .header {
            background: linear-gradient(135deg, #16a34a, #15803d);
            padding: 40px 32px;
            text-align: center;
            color: #fff;
        }
        .header h1 { font-size: 28px; font-weight: 900; margin-bottom: 8px; }
        .header .subtitle { font-size: 14px; opacity: 0.85; }
        .content { padding: 32px; }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 24px;
            background: #f9fafb;
            border-radius: 12px;
            padding: 20px;
            border: 1px solid #e5e7eb;
        }
        .info-item { font-size: 14px; }
        .info-label { color: #6b7280; font-size: 12px; margin-bottom: 2px; }
        .info-value { font-weight: 600; color: #111827; }
        .score-box {
            background: #f9fafb;
            border-radius: 12px;
            padding: 28px;
            margin-bottom: 24px;
            border: 1px solid #e5e7eb;
            text-align: center;
        }
        .score-label { font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 2px; }
        .score-value { font-size: 56px; font-weight: 900; color: ${scoreColor}; margin-top: 4px; }
        .score-value span { font-size: 24px; color: #9ca3af; font-weight: 400; }
        .score-detail { margin-top: 8px; font-size: 14px; color: #6b7280; }
        .footer {
            text-align: center;
            padding: 20px 32px;
            font-size: 11px;
            color: #9ca3af;
            border-top: 1px solid #f3f4f6;
        }
        @media print {
            body { background: #fff; padding: 0; }
            .container { box-shadow: none; }
        }
        @media (max-width: 600px) {
            .info-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ 測驗完成</h1>
            <div class="subtitle">驗光師模擬考系統 — 考試結果報告</div>
        </div>
        <div class="content">
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">考生姓名</div>
                    <div class="info-value">${studentName}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">學號</div>
                    <div class="info-value">${studentId}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">考試科目</div>
                    <div class="info-value">${subject}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">考試日期</div>
                    <div class="info-value">${dateStr} ${timeStr}</div>
                </div>
            </div>

            <div class="score-box">
                <div class="score-label">您的分數</div>
                <div class="score-value">${result.score} <span>/ 100</span></div>
                <div class="score-detail">答對題數： ${result.correctCount} / ${result.totalQuestions}</div>
            </div>

            ${wrongAnswersHTML}
        </div>
        <div class="footer">
            此報告由驗光師模擬考系統自動產生 · ${dateStr} ${timeStr}
        </div>
    </div>
</body>
</html>`;
    };

    // ============================================================
    // 下載結果為 HTML 檔案
    // ============================================================
    const downloadResultAsHTML = () => {
        if (!result) return;
        setDownloading(true);
        setShowFormatMenu(false);

        const info = getResultInfo();
        const htmlContent = buildHTMLContent(info);

        // 建立 Blob 並觸發下載
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `考試結果_${info.studentName}_${info.subject}_${info.dateStr}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setTimeout(() => setDownloading(false), 1000);
    };

    // ============================================================
    // 下載結果為 PNG 圖片
    // ============================================================
    const downloadResultAsImage = async () => {
        if (!result) return;
        setDownloading(true);
        setShowFormatMenu(false);

        try {
            const info = getResultInfo();
            const htmlContent = buildHTMLContent(info);

            // 建立一個隱藏的容器來渲染 HTML
            const container = document.createElement('div');
            container.style.cssText = 'position:fixed;left:-9999px;top:0;width:800px;z-index:-1;';
            container.innerHTML = htmlContent
                .replace(/<!DOCTYPE html>[\s\S]*?<body[^>]*>/, '')
                .replace(/<\/body>[\s\S]*$/, '');

            // 將內嵌樣式提取並套用
            const styleMatch = htmlContent.match(/<style>([\s\S]*?)<\/style>/);
            if (styleMatch) {
                const styleEl = document.createElement('style');
                styleEl.textContent = styleMatch[1];
                container.prepend(styleEl);
            }

            document.body.appendChild(container);

            // 等待渲染完成
            await new Promise(resolve => setTimeout(resolve, 300));

            // 使用 html2canvas 擷取
            const canvas = await html2canvas(container, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#f3f4f6',
                width: 800,
                windowWidth: 800,
            });

            // 清理隱藏容器
            document.body.removeChild(container);

            // 觸發下載
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = `考試結果_${info.studentName}_${info.subject}_${info.dateStr}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('圖片下載失敗:', err);
            alert('圖片下載失敗，請改用 HTML 格式下載。');
        } finally {
            setTimeout(() => setDownloading(false), 1000);
        }
    };

    useEffect(() => {
        const data = location.state?.resultData;
        if (!data) {
            setLoading(false);
            return;
        }

        if (hasSubmitted.current) {
            return;
        }
        hasSubmitted.current = true;

        const postResults = async () => {
            try {
                // 不要把 questions 陣列傳到後端
                const { questions, ...submitData } = data;
                const response = await submitExam(submitData);
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

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white max-w-2xl w-full rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-green-600 p-8 text-center">
                    <CheckCircle className="w-20 h-20 text-white mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-white">測驗完成！</h1>
                </div>

                <div className="p-8">
                    <p className="text-gray-600 text-lg mb-6 text-center">
                        感謝您的參與， <span className="font-semibold text-gray-900">{state.user?.name}</span>.
                        <br />您的成績已紀錄。
                    </p>

                    {result && (
                        <>
                            {/* 分數顯示 */}
                            <div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-100 text-center">
                                <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">您的分數</span>
                                <div className="text-5xl font-black text-blue-600 mt-2">
                                    {result.score} <span className="text-2xl text-gray-400 font-normal">/ 100</span>
                                </div>
                                <div className="mt-2 text-gray-500 text-sm">
                                    答對題數： {result.correctCount} / {result.totalQuestions}
                                </div>
                            </div>

                            {/* 錯題表格 */}
                            {result.wrongAnswers && result.wrongAnswers.length > 0 && (
                                <div className="bg-red-50 rounded-xl p-6 mb-6 border border-red-100 text-left">
                                    <h3 className="text-sm font-semibold text-red-700 mb-4">
                                        答錯的題目（共 {result.wrongAnswers.length} 題）
                                    </h3>
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
                                                        <td className="py-3 px-2 text-gray-700">
                                                            {questionMap[item.questionId]?.question || `題目 ${item.questionId}`}
                                                        </td>
                                                        <td className="py-3 px-2 text-red-600 font-medium">
                                                            {getOptionText(item.questionId, item.userAnswer) || '未作答'}
                                                        </td>
                                                        <td className="py-3 px-2 text-green-600 font-medium">
                                                            {getOptionText(item.questionId, item.correctAnswer)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {result.wrongAnswers && result.wrongAnswers.length === 0 && (
                                <div className="bg-green-50 rounded-xl p-4 mb-6 text-green-800 text-center font-medium">
                                    🎉 恭喜！全部答對！
                                </div>
                            )}
                        </>
                    )}

                    {/* 按鈕區域 */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        {result && (
                            <div className="flex-1 relative" ref={menuRef}>
                                <button
                                    id="download-result-btn"
                                    onClick={() => setShowFormatMenu(!showFormatMenu)}
                                    disabled={downloading}
                                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    <Download className={`w-5 h-5 ${downloading ? 'animate-bounce' : ''}`} />
                                    {downloading ? '下載中...' : '儲存結果'}
                                    {!downloading && <ChevronDown className={`w-4 h-4 transition-transform ${showFormatMenu ? 'rotate-180' : ''}`} />}
                                </button>

                                {/* 格式選擇下拉選單 */}
                                {showFormatMenu && (
                                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-10 animate-in fade-in slide-in-from-bottom-2">
                                        <button
                                            onClick={downloadResultAsImage}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                                        >
                                            <Image className="w-5 h-5 text-emerald-500" />
                                            <div>
                                                <div className="font-semibold text-sm">PNG 圖片</div>
                                                <div className="text-xs text-gray-400">方便分享到社群或通訊軟體</div>
                                            </div>
                                        </button>
                                        <div className="border-t border-gray-100" />
                                        <button
                                            onClick={downloadResultAsHTML}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                        >
                                            <FileText className="w-5 h-5 text-blue-500" />
                                            <div>
                                                <div className="font-semibold text-sm">HTML 網頁</div>
                                                <div className="text-xs text-gray-400">可離線開啟、列印保存</div>
                                            </div>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                        <Link
                            to="/"
                            className="flex-1 inline-block bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors text-center"
                        >
                            返回首頁
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
