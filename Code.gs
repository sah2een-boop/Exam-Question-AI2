const SPREADSHEET_ID = '1mGv3N3uXqxv3Je1ZvR_JCCGuluvaM8wkvz2K7ryATzY';
const SHEET_QUESTIONS = '題目';
const SHEET_ANSWERS = '回答';

function getSpreadsheet() {
  if (SPREADSHEET_ID) {
    try {
      return SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (e) {
      Logger.log('Error: ' + e.toString());
    }
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function doGet(e) {
  const action = e && e.parameter ? e.parameter.action : null;
  if (action === 'getQuestions') {
    const subject = e.parameter.subject || '眼球解剖生理學與倫理法規'; // Default subject
    return getQuestions(subject);
  }
  return ContentService.createTextOutput(JSON.stringify({status: 'ok'})).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.action === 'submitArgs') {
      return submitExam(data);
    }
    return ContentService.createTextOutput(JSON.stringify({error: 'Invalid action'})).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({error: err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

function getQuestions(subject) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(subject); // Use subject as sheet name
  
  if (!sheet) {
    throw new Error('找不到科目：' + subject);
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const idxId = headers.indexOf('題號');
  const idxQ = headers.indexOf('題目');
  const idxA = headers.indexOf('A');
  const idxB = headers.indexOf('B');
  const idxC = headers.indexOf('C');
  const idxD = headers.indexOf('D');
  const idxImg = headers.indexOf('圖片');
  
  // Return all questions in original order (no shuffling)
  const rows = data.slice(1);
  
  const questions = rows.map(function(row) {
    return {
      id: row[idxId],
      question: row[idxQ],
      options: [row[idxA], row[idxB], row[idxC], row[idxD]],
      image: idxImg > -1 && row[idxImg] ? row[idxImg] : null
    };
  });
  
  return ContentService.createTextOutput(JSON.stringify(questions)).setMimeType(ContentService.MimeType.JSON);
}

function submitExam(data) {
  const ss = getSpreadsheet();
  const subject = data.subject || '眼球解剖生理學與倫理法規';
  const qSheet = ss.getSheetByName(subject); // Read from subject-specific sheet
  const aSheet = ss.getSheetByName(SHEET_ANSWERS);
  
  if (!qSheet) {
    throw new Error('找不到科目：' + subject);
  }
  
  const qData = qSheet.getDataRange().getValues();
  const headers = qData[0];
  const idxId = headers.indexOf('題號');
  const idxAns = headers.indexOf('解答');
  const idxQ = headers.indexOf('題目');
  
  const answerKey = {};
  const questionTexts = {};
  qData.slice(1).forEach(function(row) {
    answerKey[row[idxId]] = row[idxAns];
    questionTexts[row[idxId]] = row[idxQ];
  });
  
  let correctCount = 0;
  const wrongAnswers = [];
  const totalQuestions = qData.length - 1; // Use total questions in the sheet
  
  Object.keys(data.answers).forEach(function(qId) {
    if (data.answers[qId] === answerKey[qId]) {
      correctCount++;
    } else {
      wrongAnswers.push({
        questionId: qId,
        question: questionTexts[qId],
        userAnswer: data.answers[qId],
        correctAnswer: answerKey[qId]
      });
    }
  });
  
  const score = Math.round((correctCount / totalQuestions) * 100);
  const aData = aSheet.getDataRange().getValues();
  let userRowIndex = -1;
  
  for (let i = 1; i < aData.length; i++) {
    // Check both Student ID (col 0) and Subject (col 7)
    if (String(aData[i][0]) === String(data.id) && String(aData[i][7]) === String(subject)) {
      userRowIndex = i + 1;
      break;
    }
  }
  
  const timestamp = new Date();
  
  if (userRowIndex > -1) {
    const vals = aSheet.getRange(userRowIndex, 1, 1, 8).getValues()[0];
    const count = Number(vals[2]) + 1;
    const maxScore = Math.max(Number(vals[4]), score);
    
    aSheet.getRange(userRowIndex, 3).setValue(count);
    aSheet.getRange(userRowIndex, 4).setValue(score);
    aSheet.getRange(userRowIndex, 5).setValue(maxScore);
    aSheet.getRange(userRowIndex, 7).setValue(timestamp);
    aSheet.getRange(userRowIndex, 8).setValue(subject);
  } else {
    aSheet.appendRow([data.id, data.name, 1, score, score, score, timestamp, subject]);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    score: score,
    correctCount: correctCount,
    totalQuestions: totalQuestions,
    wrongAnswers: wrongAnswers
  })).setMimeType(ContentService.MimeType.JSON);
}
