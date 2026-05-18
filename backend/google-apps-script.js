/**
 * Daily Standup Management - Google Apps Script Backend
 * 
 * Setup Instructions:
 * 1. Create a new Google Sheet
 * 2. Create two sheets named "Members" and "Standups"
 * 3. Add headers to Members: id, name, email, active, createdAt
 * 4. Add headers to Standups: id, date, memberId, section, bulletText, order, updatedAt
 * 5. Open Extensions > Apps Script
 * 6. Paste this code
 * 7. Deploy as Web App (Execute as: Me, Access: Anyone)
 * 8. Copy the deployment URL to your .env file as VITE_API_URL
 */

const SPREADSHEET_ID = '1lSc3LRwDGZ2gZ5k6DhLrUooKTDyOCx2eTGAzbM4QYK4'; // Replace with your sheet ID

// Handle CORS preflight
function doOptions() {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

function corsOutput(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName(name);
}

function doGet(e) {
  const action = e.parameter.action;
  let result;

  try {
    switch (action) {
      case 'getMembers':
        result = getMembers();
        break;
      case 'getStandups':
        result = getStandups(e.parameter.date);
        break;
      default:
        result = { error: 'Unknown action' };
    }
  } catch (error) {
    result = { error: error.message };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch {
    return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid JSON' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  let result;
  try {
    switch (body.action) {
      case 'addMember':
        result = addMember(body.member);
        break;
      case 'updateMember':
        result = updateMember(body.member);
        break;
      case 'deleteMember':
        result = deleteMember(body.id);
        break;
      case 'saveStandups':
        result = saveStandups(body.date, body.entries);
        break;
      case 'duplicateDay':
        result = duplicateDay(body.date, body.previousDate);
        break;
      default:
        result = { error: 'Unknown action' };
    }
  } catch (error) {
    result = { error: error.message };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============ MEMBERS ============

function getMembers() {
  const sheet = getSheet('Members');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const members = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0]) { // Has ID
      members.push({
        id: row[0],
        name: row[1],
        email: row[2],
        active: row[3] === true || row[3] === 'TRUE',
        createdAt: row[4],
      });
    }
  }

  return { members };
}

function addMember(memberData) {
  const sheet = getSheet('Members');
  const id = Utilities.getUuid();
  const now = new Date().toISOString();

  sheet.appendRow([id, memberData.name, memberData.email, memberData.active, now]);

  return {
    member: {
      id,
      name: memberData.name,
      email: memberData.email,
      active: memberData.active,
      createdAt: now,
    },
  };
}

function updateMember(member) {
  const sheet = getSheet('Members');
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === member.id) {
      sheet.getRange(i + 1, 2).setValue(member.name);
      sheet.getRange(i + 1, 3).setValue(member.email);
      sheet.getRange(i + 1, 4).setValue(member.active);
      return { member };
    }
  }

  return { error: 'Member not found' };
}

function deleteMember(id) {
  const sheet = getSheet('Members');
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }

  return { error: 'Member not found' };
}

// ============ STANDUPS ============

function getStandups(date) {
  const sheet = getSheet('Standups');
  const data = sheet.getDataRange().getValues();
  const standups = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[1] === date) {
      standups.push({
        id: row[0],
        date: row[1],
        memberId: row[2],
        section: row[3],
        bulletText: row[4],
        order: row[5],
        updatedAt: row[6],
      });
    }
  }

  return { standups };
}

function saveStandups(date, entries) {
  const sheet = getSheet('Standups');
  const data = sheet.getDataRange().getValues();

  if (!date) {
    return { error: 'Date is required' };
  }

  // Remove existing entries for this date
  const rowsToDelete = [];
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][1] === date) {
      rowsToDelete.push(i + 1);
    }
  }

  // Delete from bottom to top to preserve row indices
  rowsToDelete.forEach(row => sheet.deleteRow(row));

  // Add new entries
  if (entries && entries.length > 0) {
    entries.forEach(entry => {
      sheet.appendRow([
        entry.id,
        entry.date,
        entry.memberId,
        entry.section,
        entry.bulletText,
        entry.order,
        entry.updatedAt,
      ]);
    });
  }

  return { success: true };
}

function duplicateDay(targetDate, previousDate) {
  const sheet = getSheet('Standups');
  const data = sheet.getDataRange().getValues();

  // Get previous day entries
  const previousEntries = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === previousDate) {
      previousEntries.push({
        id: Utilities.getUuid(),
        date: targetDate,
        memberId: data[i][2],
        section: data[i][3],
        bulletText: data[i][4],
        order: data[i][5],
        updatedAt: new Date().toISOString(),
      });
    }
  }

  if (previousEntries.length === 0) {
    return { error: 'No entries found for previous day' };
  }

  // Add duplicated entries
  previousEntries.forEach(entry => {
    sheet.appendRow([
      entry.id,
      entry.date,
      entry.memberId,
      entry.section,
      entry.bulletText,
      entry.order,
      entry.updatedAt,
    ]);
  });

  return { success: true };
}
