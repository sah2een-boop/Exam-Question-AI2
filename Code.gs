const SPREADSHEET_ID = '1mGv3N3uXqxv3Je1ZvR_JCCGuluvaM8wkvz2K7ryATzY';

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
  var action = e && e.parameter ? e.parameter.action : null;
  if (action === 'getQuestions') {
    var subject = e.parameter.subject || '眼球解剖生理學與倫理法規';
    var num = e.parameter.num ? parseInt(e.parameter.num, 10) : 0;
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

  var match = str.match(/drive\.google\.com\/file\/d\/([^\/\?]+)/);
  if (match) return 'https://lh3.googleusercontent.com/d/' + match[1];

  match = str.match(/drive\.google\.com.*[?&]id=([^&]+)/);
  if (match) return 'https://lh3.googleusercontent.com/d/' + match[1];

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

  // 計分
  var totalQuestions = data.totalQuestions || qData.length - 1;
  var correctCount = 0;
  var wrongAnswers = [];

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

  // ---- 記錄到「{科目}_錯題」分頁（含成績 + 錯題） ----
  recordExamResult(ss, subject, data, score, wrongAnswers, allQuestionIds);

  return ContentService.createTextOutput(JSON.stringify({
    score: score,
    correctCount: correctCount,
    totalQuestions: totalQuestions,
    wrongAnswers: wrongAnswers
  })).setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// 記錄考試結果（成績 + 錯題，每次考試新增一列）
// ============================================================

function recordExamResult(ss, subject, data, score, wrongAnswers, allQuestionIds) {
  var sheetName = subject + '_錯題';
  var sheet = ss.getSheetByName(sheetName);

  // 首次使用：自動建立工作表並寫入標題列
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    var headers = ['學號', '姓名', '次數', '分數', '最高分', '時間'];
    allQuestionIds.forEach(function(qId) {
      headers.push('題' + qId);
    });
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }

  // 計算此學生的次數與最高分
  var existingData = sheet.getDataRange().getValues();
  var attemptCount = 0;
  var historicalMaxScore = 0;

  for (var i = 1; i < existingData.length; i++) {
    if (String(existingData[i][0]) === String(data.id)) {
      attemptCount++;
      var prevScore = Number(existingData[i][3]);
      if (prevScore > historicalMaxScore) {
        historicalMaxScore = prevScore;
      }
    }
  }

  var currentAttempt = attemptCount + 1;
  var maxScore = Math.max(historicalMaxScore, score);

  // 建立錯題 Map
  var wrongMap = {};
  wrongAnswers.forEach(function(w) {
    wrongMap[String(w.questionId)] = w.userAnswer || '未作答';
  });

  // 建立已作答 Set
  var answeredSet = {};
  if (data.answers) {
    Object.keys(data.answers).forEach(function(qId) {
      answeredSet[String(qId)] = true;
    });
  }

  // 組裝資料列
  var row = [data.id, data.name, currentAttempt, score, maxScore, new Date()];
  allQuestionIds.forEach(function(qId) {
    if (wrongMap[qId]) {
      row.push(wrongMap[qId]);
    } else if (answeredSet[qId]) {
      row.push('');
    } else {
      row.push('-');
    }
  });

  sheet.appendRow(row);
}
