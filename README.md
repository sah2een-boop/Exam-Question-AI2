# 驗光師模擬考系統

這是一個基於 React + Google Sheets 的線上模擬考系統，專為驗光師考試設計，支援多科目測驗、自動計分、錯題分析與成績記錄。

---

## ✨ 功能特色

- **多科目支援**：支援五個驗光師專業科目，可個別設定題數與考試時間
- **隨機選項**：每次考試選項順序隨機打亂，防止記憶答案位置
- **即時計時**：每科可設定獨立的倒數計時器（預設 60 分鐘）
- **自動評分**：考試結束後自動計算分數
- **錯題分析**：顯示所有答錯的題目、您的答案與正確答案
- **結果下載**：考試完成後可一鍵下載完整的成績報告（支援 PNG 圖片與 HTML 網頁格式），包含分數、錯題詳情，方便分享、離線檢視或列印
- **雲端記錄**：所有成績與錯題記錄自動儲存至 Google Sheets
- **成績追蹤**：記錄每位考生的考試次數、分數、最高分
- **防作弊偵測**：切換分頁或離開視窗時會彈出警告
- **題目標記**：可使用三角形、圓形、方形旗標標記需要複習的題目

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
   - **A/B/C/D**：四個選項的文字
   - **解答**：正確答案的代號（A、B、C 或 D）
   - **圖片**：（選填）圖片網址或 Google Drive 連結

4. **錯題記錄工作表（自動建立）**
   
   系統會在首次考試時**自動建立** `{科目}_錯題` 工作表（例如 `視光學_錯題`），無需手動建立。
   
   每次考試會新增一列，記錄：學號、姓名、次數、分數、最高分、時間，以及每題的答錯記錄。

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
   - ⚠️ 如果是從試算表的「擴充功能」開啟的，`SPREADSHEET_ID` 留空即可
   - 如果是獨立部署，請在第 3 行填入您的試算表 ID

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
   VITE_SHUFFLE_OPTIONS=true
   ```
   
   - `VITE_API_URL`：貼上步驟 2-6 複製的網址
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
   - 新增以下 secrets：
     
     | Name | Value | 說明 |
     |------|-------|------|
     | `VITE_API_URL` | 您的 Google Apps Script URL | 完整的 `/exec` 結尾網址 |
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
   - 點擊「開始考試」

2. **作答**
   - 點選選項進行作答
   - 可使用旗標標記需要複習的題目（三角形 / 圓形 / 方形）
   - 右上角顯示剩餘時間和已作答題數
   - 點選「總覽」查看所有題目的作答狀態

3. **提交試卷**
   - 在總覽頁面點選「提交試卷」
   - 確認後系統會自動計算分數
   - 顯示成績和答錯的題目列表

4. **儲存考試結果**
   - 在成績頁面點選綠色的「儲存結果」按鈕展開選單
   - 選擇你要的格式：
     - **PNG 圖片**：方便分享到社群或通訊軟體
     - **HTML 網頁**：可離線開啟、列印保存，文字清晰且可選取
   - 系統會自動下載對應格式的成績報告
   - 檔案命名格式：`考試結果_姓名_科目_日期.[png|html]`

### 管理員操作

1. **新增題目**
   - 開啟 Google Sheets
   - 選擇對應的科目工作表
   - 在最後一列新增題目資料

2. **查看成績**
   - 開啟 Google Sheets 的 `{科目}_錯題` 工作表
   - 可看到所有考生的成績記錄與錯題詳情

3. **調整題數與時間**
   - 編輯 `src/pages/Home.jsx` 中的 `SUBJECT_CONFIG`：
   ```javascript
   const SUBJECT_CONFIG = {
       '眼球解剖生理學與倫理法規': { questionCount: 50, duration: 60 },
       '視覺光學':                 { questionCount: 50, duration: 60 },
       // ...
   };
   ```
   - `questionCount`：每次考試的題數（0 = 全部出題）
   - `duration`：考試時間（分鐘）

4. **更新 Apps Script 程式碼**
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

### Q2: 如何修改考試時間或題數？
**A:** 編輯 `src/pages/Home.jsx` 中的 `SUBJECT_CONFIG`，可為每科設定獨立的 `questionCount`（題數）和 `duration`（考試時間，分鐘）。

### Q3: 如何新增或修改科目？
**A:** 需要同時修改以下兩處：
1. `src/pages/Home.jsx` - `SUBJECT_CONFIG` 物件中新增科目
2. Google Sheets - 新增對應名稱的工作表

### Q4: 考試期間切換分頁會怎樣？
**A:** 系統會在考生切回來時彈出警告對話框，考生可以選擇「確定」立即交卷，或「取消」繼續考試。

---

## 📁 專案結構

```
Exam Question AI2/
├── src/
│   ├── components/          # React 元件
│   │   ├── QuestionCard.jsx # 題目卡片（含選項、標記）
│   │   └── QuestionMap.jsx  # 題目總覽（作答狀態）
│   ├── context/
│   │   └── ExamContext.jsx  # 全域狀態管理（考試資料）
│   ├── pages/
│   │   ├── Home.jsx         # 登入頁面（含科目/題數/時間設定）
│   │   ├── Exam.jsx         # 考試頁面（計時、防作弊）
│   │   └── Result.jsx       # 成績頁面（分數、錯題表格）
│   ├── services/
│   │   └── api.js           # API 服務（含開發用 Mock 資料）
│   ├── App.jsx              # 主要路由
│   └── main.jsx             # 應用程式進入點
├── .github/
│   └── workflows/
│       └── deploy.yml       # GitHub Pages 自動部署
├── Code.gs                  # Google Apps Script 程式碼
├── .env.example             # 環境變數範本
└── README.md                # 本文件
```

---

## 🛠️ 技術棧

- **前端框架**：React 19 + Vite 7
- **路由**：React Router v7
- **樣式**：Tailwind CSS 4
- **圖示**：Lucide React
- **後端**：Google Apps Script
- **資料庫**：Google Sheets
- **部署**：GitHub Pages + GitHub Actions

---

## 📝 測試資料

專案中的 `QUESTIONS.md` 及各科 `QUESTIONS_*.md` 提供了測試題目，可直接複製到 Google Sheets 進行測試。

---

## 🔒 安全性說明

- Google Apps Script 部署為「所有人」可存取是為了避免 CORS 問題
- API 不會回傳題目原文，錯題詳情由前端本地資料顯示
- 所有資料儲存在您自己的 Google Sheet 中
- **建議將 Google Sheet 設為「限制存取」**，不要設為「知道連結的人可檢視」
- `.env` 檔案已加入 `.gitignore`，不會被提交到版本控制
- 本系統適合作為學校內部模擬考使用，不建議用於正式考試

---

## 📞 技術支援

如遇到問題，請檢查：
1. 瀏覽器開發者工具 Console (F12) 的錯誤訊息
2. Google Apps Script 的執行記錄
3. 確認所有設定步驟都已正確完成

---

## 📄 授權

本專案僅供教育用途使用。
