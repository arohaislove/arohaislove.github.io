/**
 * Work Diary - Google Apps Script
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to script.google.com
 * 2. Create a new project, name it "Work Diary"
 * 3. Paste this entire file into the editor (replace everything)
 * 4. Run → setup() once to create your spreadsheet
 * 5. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Copy the Web App URL — paste it into the Cloudflare Worker secret APPS_SCRIPT_URL
 *
 * Your Google Sheet will appear in Drive as "Work Diary"
 * with two tabs: "Diary" and "Times"
 */

// ─── SETUP: Run this once to create the spreadsheet ───────────────────────────

function setup() {
  const ss = SpreadsheetApp.create('Work Diary');
  const sheetId = ss.getId();

  // Set up Diary sheet
  const diary = ss.getSheets()[0];
  diary.setName('Diary');
  diary.getRange('A1:E1').setValues([['Timestamp', 'Date', 'Entry', 'Tags', 'Source']]);
  diary.getRange('A1:E1').setFontWeight('bold').setBackground('#667eea').setFontColor('#ffffff');
  diary.setColumnWidth(1, 160);
  diary.setColumnWidth(2, 100);
  diary.setColumnWidth(3, 500);
  diary.setColumnWidth(4, 150);
  diary.setColumnWidth(5, 80);
  diary.setFrozenRows(1);

  // Set up Times sheet
  const times = ss.insertSheet('Times');
  times.getRange('A1:F1').setValues([['Timestamp', 'Date', 'Start Time', 'End Time', 'Duration (hrs)', 'Activity / Notes']]);
  times.getRange('A1:F1').setFontWeight('bold').setBackground('#667eea').setFontColor('#ffffff');
  times.setColumnWidth(1, 160);
  times.setColumnWidth(2, 100);
  times.setColumnWidth(3, 100);
  times.setColumnWidth(4, 100);
  times.setColumnWidth(5, 110);
  times.setColumnWidth(6, 400);
  times.setFrozenRows(1);

  // Store the spreadsheet ID in script properties so doPost can find it
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', sheetId);

  Logger.log('Spreadsheet created: https://docs.google.com/spreadsheets/d/' + sheetId);
  Logger.log('Copy the ID above and share the sheet with anyone who needs read access.');
}


// ─── WEB APP: Receives POST requests from the Cloudflare Worker ───────────────

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const type = data.type; // 'diary' or 'times'

    const ssId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
    if (!ssId) {
      return jsonResponse({ success: false, error: 'Spreadsheet not set up. Run setup() first.' });
    }

    const ss = SpreadsheetApp.openById(ssId);
    const now = new Date();
    const timestamp = Utilities.formatDate(now, 'Pacific/Auckland', "yyyy-MM-dd'T'HH:mm:ss");
    const date = Utilities.formatDate(now, 'Pacific/Auckland', 'yyyy-MM-dd');

    if (type === 'diary') {
      const sheet = ss.getSheetByName('Diary');
      sheet.appendRow([
        timestamp,
        date,
        data.entry || '',
        (data.tags || []).join(', '),
        data.source || 'web'
      ]);
      return jsonResponse({ success: true, type: 'diary', timestamp });
    }

    if (type === 'times') {
      const sheet = ss.getSheetByName('Times');
      const startTime = data.startTime || '';
      const endTime = data.endTime || '';
      let duration = '';
      if (startTime && endTime) {
        // Calculate duration in hours
        const [sh, sm] = startTime.split(':').map(Number);
        const [eh, em] = endTime.split(':').map(Number);
        const mins = (eh * 60 + em) - (sh * 60 + sm);
        duration = mins > 0 ? (mins / 60).toFixed(2) : '';
      }
      sheet.appendRow([
        timestamp,
        data.date || date,
        startTime,
        endTime,
        duration,
        data.activity || ''
      ]);
      return jsonResponse({ success: true, type: 'times', timestamp });
    }

    return jsonResponse({ success: false, error: 'Unknown type. Use diary or times.' });

  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}


function doGet(e) {
  return jsonResponse({ status: 'ok', message: 'Work Diary Apps Script is running.' });
}


function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
