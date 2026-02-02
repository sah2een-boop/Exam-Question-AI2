# Google Apps Script Code

Copy and paste the following code into your Google Apps Script project associated with your Google Sheet.
Deploy it as a Web App (Execute as: Me, Who has access: Anyone).

```javascript
// ***********************************************************************************************************************
// 設定區 / Config
// 如果你的 Script 是綁定在試算表 (從 Sheet > 擴充功能開啟)，這行可以保持原樣，因為 getActiveSpreadsheet() 會抓當前的。
// 如果你是獨立建立的 Script，請在下方引號內填入 Sheet 的 ID。
// ***********************************************************************************************************************
const SPREADSHEET_ID = '18WVUq3zyqRvT65UAKRhb3tF6ziiPD87cDsxM7c25HPM'; 

const SHEET_QUESTIONS = '題目';
const SHEET_ANSWERS = '回答';

// Helper function to get the spreadsheet object
function getSpreadsheet() {
  if (SPREADSHEET_ID) {
    try {
      return SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (e) {
      Logger.log('Error opening by ID: ' + e.toString());
      // Fallback or re-throw
    }
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function doGet(e) {
  const action = e && e.parameter ? e.parameter.action : null;
  
  if (action === 'getQuestions') {
    return getQuestions();
  }
  
  return ContentService.createTextOutput(JSON.stringify({status: 'running'})).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    if (action === 'submitArgs') {
      return submitExam(data);
    }
    
    return ContentService.createTextOutput(JSON.stringify({error: 'Invalid action'})).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({error: err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

function getQuestions() {
  const ss = getSpreadsheet();
  if (!ss) throw new Error("Start Spreadsheet failed. Please fill SPREADSHEET_ID if script is standalone.");

  const sheet = ss.getSheetByName(SHEET_QUESTIONS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0]; // Assuming Row 1 is headers: 題號, 題目, A, B, C, D, 解答, [圖片]
  
  // Parse headers to find indices
  const idxId = headers.indexOf('題號');
  const idxQ = headers.indexOf('題目');
  const idxA = headers.indexOf('A');
  const idxB = headers.indexOf('B');
  const idxC = headers.indexOf('C');
  const idxD = headers.indexOf('D');
  const idxAns = headers.indexOf('解答'); // Not sent to frontend
  const idxImg = headers.indexOf('圖片'); // Optional

  // Randomly select N questions (e.g., 20)
  const rows = data.slice(1);
  const shuffled = rows.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 20); // Configurable N

  const questions = selected.map(row => ({
    id: row[idxId],
    question: row[idxQ],
    options: [row[idxA], row[idxB], row[idxC], row[idxD]],
    image: idxImg > -1 && row[idxImg] ? row[idxImg] : null
  }));

  return ContentService.createTextOutput(JSON.stringify(questions)).setMimeType(ContentService.MimeType.JSON);
}

function submitExam(data) {
  // data: { id, name, answers: {qId: 'Option'}, ... }
  const ss = getSpreadsheet();
  const qSheet = ss.getSheetByName(SHEET_QUESTIONS);
  const aSheet = ss.getSheetByName(SHEET_ANSWERS);
  
  // Calculate Score
  const qData = qSheet.getDataRange().getValues();
  const headers = qData[0];
  const idxId = headers.indexOf('題號');
  const idxAns = headers.indexOf('解答');
  
  const answerKey = {};
  qData.slice(1).forEach(row => {
    answerKey[row[idxId]] = row[idxAns];
  });

  let correctCount = 0;
  // Count only answered questions or total? 
  // Score is usually based on Total Exam Questions (N=20).
  const totalQuestions = 20; 

  Object.keys(data.answers).forEach(qId => {
    if (data.answers[qId] === answerKey[qId]) {
      correctCount++;
    }
  });
  
  const score = Math.round((correctCount / totalQuestions) * 100);

  // Record to Answer Sheet
  // Headers: 學號, 姓名, 次數, 最後分數, 最高分, 初次分數, 時間
  const aData = aSheet.getDataRange().getValues();
  let userRowIndex = -1;
  const userStrId = String(data.id);
  
  for (let i = 1; i < aData.length; i++) {
    if (String(aData[i][0]) === userStrId) {
      userRowIndex = i + 1;
      break;
    }
  }

  const timestamp = new Date();

  // Columns definition (1-based indices):
  // 1: 學號 (ID)
  // 2: 姓名 (Name)
  // 3: 次數 (Count)
  // 4: 最後分數 (LastScore)
  // 5: 最高分 (MaxScore)
  // 6: 初次分數 (FirstScore)
  // 7: 時間 (Time)

  if (userRowIndex > -1) {
    const range = aSheet.getRange(userRowIndex, 1, 1, 7);
    const values = range.getValues()[0];
    
    let count = values[2] || 0; 
    let maxScore = values[4] || 0;
    // ensure numbers
    count = Number(count) + 1;
    maxScore = Math.max(Number(maxScore), score);
    
    // Write updates
    aSheet.getRange(userRowIndex, 3).setValue(count);
    aSheet.getRange(userRowIndex, 4).setValue(score);
    aSheet.getRange(userRowIndex, 5).setValue(maxScore);
    // First Score (Col 6) remains untouched
    aSheet.getRange(userRowIndex, 7).setValue(timestamp);
  } else {
    // New User
    aSheet.appendRow([
      data.id, 
      data.name, 
      1, // Count
      score, // Last
      score, // Max
      score, // First
      timestamp
    ]);
  }

  return ContentService.createTextOutput(JSON.stringify({
    score: score,
    correctCount: correctCount,
    totalQuestions: totalQuestions
  })).setMimeType(ContentService.MimeType.JSON);
}
```
