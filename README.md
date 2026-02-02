# 驗光師模擬考系統

這是一個基於 React + Google Sheets 的線上考試系統，專為驗光師考試設計，支援多科目測驗、自動計分與成績記錄。

---

## ✨ 功能特色

- **多科目支援**：支援五個驗光師專業科目
- **隨機選項**：每次考試選項順序隨機打亂，防止記憶答案位置
- **即時計時**：內建 60 分鐘倒數計時器
- **自動評分**：考試結束後自動計算分數
- **錯題分析**：顯示所有答錯的題目及正確答案
- **雲端記錄**：所有成績自動儲存至 Google Sheets
- **成績追蹤**：記錄每位考生的考試次數、最高分、最低分等資訊

---

## 📋 系統需求

- Node.js 16.0 或以上版本
- Google 帳號（用於 Google Sheets 和 Apps Script）
- 現代瀏覽器（Chrome、Firefox、Edge 等）

---

## 🚀 快速開始

### 步驟 1：設定 Google Sheets

1. **建立新的 Google 試算表**
   - 前往 [Google Sheets](https://sheets.google.com)
   - 建立一個新的試算表

2. **建立科目工作表（共 5 個）**
   
   為每個科目建立獨立的工作表，**工作表名稱必須完全一致**：
   - `眼球解剖生理學與倫理法規`
   - `視覺光學`
   - `視光學`
   - `隱形眼鏡學與配鏡學`
   - `低視力學`

3. **設定題目格式**
   
   每個科目工作表的第一列（標題列）請設定為：
   
   | 題號 | 題目 | A | B | C | D | 解答 | 圖片 |
   |------|------|---|---|---|---|------|------|
   
   - **題號**：題目編號（如 1, 2, 3...）
   - **題目**：題目內容
   - **A/B/C/D**：四個選項
   - **解答**：正確答案（必須與選項文字完全一致）
   - **圖片**：（選填）圖片網址

4. **建立成績記錄工作表**
   
   建立名為 `回答` 的工作表，第一列設定為：
   
   | 學號 | 姓名 | 次數 | 最後分數 | 最高分 | 初次分數 | 時間 | 科目 |
   |------|------|------|----------|--------|----------|------|------|

5. **複製試算表 ID**
   
   從網址列複製試算表 ID（`/d/` 和 `/edit` 之間的字串）
   ```
   https://docs.google.com/spreadsheets/d/[這裡是ID]/edit
   ```

---

### 步驟 2：部署 Google Apps Script

1. **開啟 Apps Script 編輯器**
   - 在試算表中，點選 **擴充功能** > **Apps Script**

2. **貼上程式碼**
   - 刪除預設的 `Code.gs` 內容
   - 將專案中的 `Code.gs` 檔案內容完整複製貼上
   - 修改第 1 行的 `SPREADSHEET_ID`，填入您的試算表 ID

3. **儲存專案**
   - 按 `Ctrl+S` 或點選儲存圖示
   - 為專案命名（例如：驗光師考試 API）

4. **部署為網頁應用程式**
   - 點選右上角 **部署** > **新增部署**
   - 類型選擇：**網頁應用程式**
   - 設定如下：
     - **執行身分**：我
     - **誰可以存取**：**所有人（Anyone）** ⚠️ 這點非常重要
   - 點選 **部署**

5. **授權應用程式**
   - 首次部署會要求授權
   - 點選 **審查權限**
   - 選擇您的 Google 帳號
   - 可能會顯示「Google 尚未驗證此應用程式」警告
   - 點選 **進階** > **前往 [專案名稱]（不安全）** > **允許**

6. **複製網頁應用程式網址**
   - 部署成功後會顯示一個網址
   - 複製這個網址（格式為 `https://script.google.com/macros/s/.../exec`）

---

### 步驟 3：設定前端專案

1. **安裝相依套件**
   ```bash
   npm install
   ```

2. **設定環境變數**
   
   在專案根目錄建立 `.env` 檔案，內容如下：
   ```env
   VITE_API_URL=您的_GOOGLE_SCRIPT_網址
   VITE_PASS_THRESHOLD=60
   VITE_SHUFFLE_OPTIONS=true
   ```
   
   - `VITE_API_URL`：貼上步驟 2-6 複製的網址
   - `VITE_PASS_THRESHOLD`：及格分數（預設 60 分）
   - `VITE_SHUFFLE_OPTIONS`：是否打亂選項順序（`true` 或 `false`）

3. **啟動開發伺服器**
   ```bash
   npm run dev
   ```
   
   瀏覽器會自動開啟 `http://localhost:5174`

---

## 🌐 部署到 GitHub Pages

### 方法一：自動部署（推薦）

1. **Fork 或上傳專案到 GitHub**
   - 將專案推送到您的 GitHub 倉庫

2. **設定 GitHub Secrets**
   - 前往 GitHub 倉庫頁面
   - 點選 **Settings** > **Secrets and variables** > **Actions**
   - 點選 **New repository secret**
   - 新增以下三個 secrets：
     
     | Name | Value | 說明 |
     |------|-------|------|
     | `VITE_API_URL` | 您的 Google Apps Script URL | 完整的 `/exec` 結尾網址 |
     | `VITE_PASS_THRESHOLD` | `60` | 及格分數 |
     | `VITE_SHUFFLE_OPTIONS` | `true` | 是否隨機排序選項 |

3. **啟用 GitHub Pages**
   - 前往 **Settings** > **Pages**
   - **Source** 選擇 **GitHub Actions**

4. **觸發部署**
   - 推送程式碼到 `main` 分支會自動觸發部署
   - 或在 **Actions** 頁面手動執行 workflow

5. **訪問網站**
   - 部署完成後，網站會在 `https://您的用戶名.github.io/Exam-Question-AI2/` 上線

### 方法二：手動部署

```bash
# 建立生產版本
npm run build

# 部署 dist 資料夾到 GitHub Pages
# 可使用 gh-pages 套件或手動上傳
```

**注意事項：**
- 請確認 `vite.config.js` 中的 `base` 路徑與您的倉庫名稱一致
- 環境變數必須在 GitHub Secrets 中設定，不要直接提交 `.env` 檔案

---

## 📖 使用說明


### 考生操作流程

1. **登入**
   - 輸入學號
   - 輸入姓名
   - 選擇考試科目
   - 勾選「考試後顯示分數」（可選）
   - 點擊「開始考試」

2. **作答**
   - 點選選項進行作答
   - 可使用旗標標記需要複習的題目
   - 右上角顯示剩餘時間和已作答題數
   - 點選「總覽」查看所有題目的作答狀態

3. **提交試卷**
   - 在總覽頁面點選「提交試卷」
   - 確認後系統會自動計算分數
   - 顯示成績和答錯的題目列表

### 管理員操作

1. **新增題目**
   - 開啟 Google Sheets
   - 選擇對應的科目工作表
   - 在最後一列新增題目資料

2. **查看成績**
   - 開啟 Google Sheets 的「回答」工作表
   - 可看到所有考生的成績記錄

3. **更新程式碼**
   - 修改 `Code.gs` 後
   - 前往 Apps Script > **部署** > **管理部署**
   - 點選 **編輯**（鉛筆圖示）
   - **版本**選擇「新版本」
   - 點選 **部署**

---

## 🔧 常見問題

### Q1: 出現「無法載入試題」錯誤
**A:** 請檢查以下項目：
1. Google Apps Script 部署時「誰可以存取」是否設為「所有人」
2. `.env` 檔案中的 `VITE_API_URL` 是否正確
3. Google Sheet 中是否有對應的科目工作表
4. 瀏覽器 Console (F12) 是否有 CORS 錯誤

### Q2: 考試提交後出現兩筆記錄
**A:** 這個問題已在最新版本修正，請確保使用最新的 `Code.gs` 和 `Result.jsx`。

### Q3: 總覽頁面顯示的作答狀態不正確
**A:** 已在最新版本修正，請更新 `QuestionMap.jsx`。

### Q4: 如何修改考試時間？
**A:** 編輯 `src/pages/Exam.jsx` 第 11 行：
```javascript
const EXAM_DURATION_SEC = 60 * 60; // 改為您要的秒數
```

### Q5: 如何新增或修改科目？
**A:** 需要同時修改以下三處：
1. `src/pages/Home.jsx` - 科目下拉選單
2. `Code.gs` - doGet 函數的預設科目
3. Google Sheets - 新增對應名稱的工作表

---

## 📁 專案結構

```
Exam Question AI2/
├── src/
│   ├── components/          # React 元件
│   │   ├── QuestionCard.jsx # 題目卡片
│   │   └── QuestionMap.jsx  # 題目總覽
│   ├── context/
│   │   └── ExamContext.jsx  # 全域狀態管理
│   ├── pages/
│   │   ├── Home.jsx         # 登入頁面
│   │   ├── Exam.jsx         # 考試頁面
│   │   └── Result.jsx       # 成績頁面
│   ├── services/
│   │   └── api.js           # API 服務
│   └── App.jsx              # 主要路由
├── Code.gs                  # Google Apps Script 程式碼
├── .env                     # 環境變數設定
└── README.md               # 本文件
```

---

## 🛠️ 技術棧

- **前端框架**：React 18 + Vite
- **路由**：React Router v6
- **樣式**：Tailwind CSS
- **圖示**：Lucide React
- **後端**：Google Apps Script
- **資料庫**：Google Sheets

---

## 📝 測試資料

專案中的 `QUESTIONS.md` 提供了 10 題眼球解剖學的測試題目，可直接複製到 Google Sheets 進行測試。

---

## 🔒 安全性說明

- Google Apps Script 部署為「所有人」可存取是為了避免 CORS 問題
- 所有資料儲存在您自己的 Google Sheet 中
- 建議定期備份 Google Sheet 資料
- 不建議在公開環境使用，僅供內部測試使用

---

## 📞 技術支援

如遇到問題，請檢查：
1. 瀏覽器開發者工具 Console (F12) 的錯誤訊息
2. Google Apps Script 的執行記錄
3. 確認所有設定步驟都已正確完成

---

## 📄 授權

本專案僅供教育用途使用。
