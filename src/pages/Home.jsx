import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const [formData, setFormData] = useState({ id: '', name: '', subject: '', showScore: false });
  const navigate = useNavigate();

  const handleStart = (e) => {
    e.preventDefault();
    if (!formData.id || !formData.name || !formData.subject) return;
    // Save to local storage or context (TODO)
    navigate('/exam', { state: formData });
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
              <option value="眼球解剖生理學與倫理法規">眼球解剖生理學與倫理法規</option>
              <option value="視覺光學">視覺光學</option>
              <option value="視光學">視光學</option>
              <option value="隱形眼鏡學與配鏡學">隱形眼鏡學與配鏡學</option>
              <option value="低視力學">低視力學</option>
            </select>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showScore"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={formData.showScore}
              onChange={(e) => setFormData({ ...formData, showScore: e.target.checked })}
            />
            <label htmlFor="showScore" className="ml-2 block text-sm text-gray-900">
              考試後顯示分數？
            </label>
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
