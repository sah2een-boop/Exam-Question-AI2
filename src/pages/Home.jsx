import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ============================================================
// 出題者設定：每科的題數與考試時間（分鐘）
// 修改這裡即可調整各科設定
// ============================================================
const SUBJECT_CONFIG = {
    '眼球解剖生理學與倫理法規': { questionCount: 50, duration: 60 },
    '視覺光學':                 { questionCount: 50, duration: 60 },
    '視光學':                   { questionCount: 50, duration: 60 },
    '隱形眼鏡學與配鏡學':       { questionCount: 50, duration: 60 },
    '低視力學':                 { questionCount: 50, duration: 60 },
};

export default function Home() {
  const [formData, setFormData] = useState({ id: '', name: '', subject: '' });
  const navigate = useNavigate();

  const handleStart = (e) => {
    e.preventDefault();
    if (!formData.id || !formData.name || !formData.subject) return;

    const config = SUBJECT_CONFIG[formData.subject] || { questionCount: 50, duration: 60 };

    navigate('/exam', {
      state: {
        ...formData,
        questionCount: config.questionCount,
        duration: config.duration,
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">驗光師模擬考</h1>
        <form onSubmit={handleStart} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">學號</label>
            <input
              type="text"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">姓名</label>
            <input
              type="text"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">科目</label>
            <select
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={formData.subject || ''}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            >
              <option value="">請選擇科目</option>
              {Object.keys(SUBJECT_CONFIG).map((subj) => (
                <option key={subj} value={subj}>{subj}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            開始考試
          </button>
        </form>
      </div>
    </div>
  );
}
