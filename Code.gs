const SPREADSHEET_ID = '1mGv3N3uXqxv3Je1ZvR_JCCGuluvaM8wkvz2K7ryATzY';
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

// ============================================================
// URL 路由
// ============================================================

function doGet(e) {
  const action = e && e.parameter ? e.parameter.action : null;
  if (action === 'getQuestions') {
    const subject = e.parameter.subject || '眼球解剖生理學與倫理法規';
    const num = e.parameter.num ? parseInt(e.parameter.num, 10) : 0;
    return getQuestions(subject, num);
  }
  return ContentService.createTextOutput(JSON.stringify({status: 'ok'})).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (data.action === 'submitArgs') {
      return submitExam(data);
    }
    return ContentService.createTextOutput(JSON.stringify({error: 'Invalid action'})).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({error: err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================
// 圖片 URL 轉換
// ============================================================

function convertImageUrl(url) {
  if (!url) return null;
  var str = String(url).trim();
  if (!str) return null;

  // Google Drive: https://drive.google.com/file/d/FILE_ID/view?...
  var match = str.match(/drive\.google\.com\/file\/d\/([^\/\?]+)/);
  if (match) return 'https://lh3.googleusercontent.com/d/' + match[1];

  // Google Drive: https://drive.google.com/open?id=FILE_ID
  match = str.match(/drive\.google\.com.*[?&]id=([^&]+)/);
  if (match) return 'https://lh3.googleusercontent.com/d/' + match[1];

  // 已經是直接的圖片 URL
  if (str.startsWith('http')) return str;

  return null;
}

// ============================================================
// 取得題目（按工作表順序，不含解答）
// ============================================================

function getQuestions(subject, num) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(subject);

  if (!sheet) {
    return ContentService.createTextOutput(
      JSON.stringify({error: '找不到科目：' + subject})
    ).setMimeType(ContentService.MimeType.JSON);
  }

  var sheetData = sheet.getDataRange().getValues();
  var sheetFormulas = sheet.getDataRange().getFormulas();
  var headers = sheetData[0].map(function(h) { return String(h).trim(); });

  var idxId  = headers.indexOf('題號');
  var idxQ   = headers.indexOf('題目');
  var idxA   = headers.indexOf('A');
  var idxB   = headers.indexOf('B');
  var idxC   = headers.indexOf('C');
  var idxD   = headers.indexOf('D');
  var idxImg = headers.indexOf('圖片');

  var allQuestions = sheetData.slice(1).map(function(row, i) {
    // 圖片處理
    var imageUrl = null;
    if (idxImg > -1) {
      var cellValue = row[idxImg];
      var cellFormula = sheetFormulas[i + 1][idxImg];

      if (cellValue && String(cellValue).startsWith('http')) {
        imageUrl = convertImageUrl(cellValue);
      } else if (cellFormula && cellFormula.toUpperCase().indexOf('IMAGE') > -1) {
        var m = cellFormula.match(/["'](.*?)["']/);
        if (m && m[1]) imageUrl = convertImageUrl(m[1]);
      }
    }

    return {
      id: row[idxId],
      question: row[idxQ],
      options: [row[idxA], row[idxB], row[idxC], row[idxD]],
      image: imageUrl
    };
  });

  // 如果有指定題數，取前 N 題（按工作表順序）
  var questions = (num > 0 && num < allQuestions.length)
    ? allQuestions.slice(0, num)
    : allQuestions;

  return ContentService.createTextOutput(JSON.stringify(questions)).setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// 提交考試 & 計分
// ============================================================

function submitExam(data) {
  var ss = getSpreadsheet();
  var subject = data.subject || '眼球解剖生理學與倫理法規';
  var qSheet = ss.getSheetByName(subject);
  var aSheet = ss.getSheetByName(SHEET_ANSWERS);

  if (!qSheet) {
    return ContentService.createTextOutput(
      JSON.stringify({error: '找不到科目：' + subject})
    ).setMimeType(ContentService.MimeType.JSON);
  }

  var qData = qSheet.getDataRange().getValues();
  var headers = qData[0].map(function(h) { return String(h).trim(); });
  var idxId  = headers.indexOf('題號');
  var idxAns = headers.indexOf('解答');
  var idxQ   = headers.indexOf('題目');

  // 建立答案對照表
  var answerKey = {};
  var questionTexts = {};
  var allQuestionIds = [];
  qData.slice(1).forEach(function(row) {
    var qId = String(row[idxId]);
    answerKey[qId] = String(row[idxAns]).trim();
    questionTexts[qId] = row[idxQ];
    allQuestionIds.push(qId);
  });

  // 計分：分母 = 前端傳來的 totalQuestions（考生收到的題數）
  var totalQuestions = data.totalQuestions || qData.length - 1;
  var correctCount = 0;
  var wrongAnswers = [];

  // 比對每一題（用 A/B/C/D 代號比對）
  Object.keys(data.answers).forEach(function(qId) {
    var userAns = String(data.answers[qId]).trim();
    var correctAns = answerKey[qId];
    if (userAns === correctAns) {
      correctCount++;
    } else {
      wrongAnswers.push({
        questionId: qId,
        question: questionTexts[qId],
        userAnswer: userAns,
        correctAnswer: correctAns
      });
    }
  });

  var score = Math.round((correctCount / totalQuestions) * 100);
  var timestamp = new Date();

  // ---- 更新「回答」工作表 ----
  var aData = aSheet.getDataRange().getValues();
  var userRowIndex = -1;

  for (var i = 1; i < aData.length; i++) {
    if (String(aData[i][0]) === String(data.id) && String(aData[i][7]) === String(subject)) {
      userRowIndex = i + 1;
      break;
    }
  }

  if (userRowIndex > -1) {
    var vals = aSheet.getRange(userRowIndex, 1, 1, 8).getValues()[0];
    var count = Number(vals[2]) + 1;
    var maxScore = Math.max(Number(vals[4]), score);

    aSheet.getRange(userRowIndex, 3).setValue(count);
    aSheet.getRange(userRowIndex, 4).setValue(score);
    aSheet.getRange(userRowIndex, 5).setValue(maxScore);
    aSheet.getRange(userRowIndex, 7).setValue(timestamp);
    aSheet.getRange(userRowIndex, 8).setValue(subject);
  } else {
    aSheet.appendRow([data.id, data.name, 1, score, score, score, timestamp, subject]);
  }

  // ---- 記錄錯題到「{科目}_錯題」工作表 ----
  recordWrongAnswers(ss, subject, data, wrongAnswers, score, allQuestionIds);

  return ContentService.createTextOutput(JSON.stringify({
    score: score,
    correctCount: correctCount,
    totalQuestions: totalQuestions,
    wrongAnswers: wrongAnswers
  })).setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// 錯題記錄
// ============================================================

function recordWrongAnswers(ss, subject, data, wrongAnswers, score, allQuestionIds) {
  var sheetName = subject + '_錯題';
  var sheet = ss.getSheetByName(sheetName);

  // 首次使用：自動建立工作表並寫入標題列
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    var headers = ['學號', '姓名', '時間', '總分'];
    allQuestionIds.forEach(function(qId) {
      headers.push('題' + qId);
    });
    sheet.appendRow(headers);
    // 凍結標題列
    sheet.setFrozenRows(1);
  }

  // 建立錯題 Set，key = questionId, value = 考生的錯誤答案
  var wrongMap = {};
  wrongAnswers.forEach(function(w) {
    wrongMap[String(w.questionId)] = w.userAnswer || '未作答';
  });

  // 建立考生作答的題目 Set
  var answeredSet = {};
  if (data.answers) {
    Object.keys(data.answers).forEach(function(qId) {
      answeredSet[String(qId)] = true;
    });
  }

  // 寫入一列
  var row = [data.id, data.name, new Date(), score];
  allQuestionIds.forEach(function(qId) {
    if (wrongMap[qId]) {
      // 答錯：填寫考生的錯誤答案
      row.push(wrongMap[qId]);
    } else if (answeredSet[qId]) {
      // 答對：留空
      row.push('');
    } else {
      // 未作答（這題不在考生收到的題目中，或跳過未答）
      row.push('-');
    }
  });

  sheet.appendRow(row);
}
