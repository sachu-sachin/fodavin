/**
 * Fodavin Technologies - form submission backend.
 *
 * Google Apps Script bound to a Google Sheet. Receives contact and newsletter
 * submissions from the static site, stores them as rows, emails a notification,
 * and serves them back to the admin dashboard behind a password.
 *
 * Deploy: see backend/README.md
 */

// ---------------------------------------------------------------- settings

/** Paste the admin password you want to use for the dashboard. */
var ADMIN_PASSWORD = 'CHANGE-ME-to-a-long-random-password';

/** Where new-submission notifications are sent. */
var NOTIFY_EMAIL = 'fodavintechnologies@gmail.com';

/** Sheet tab name. Created automatically on first submission. */
var SHEET_NAME = 'Submissions';

var HEADERS = ['ID', 'Received', 'Type', 'Name', 'Email', 'Phone', 'Message',
               'Source Page', 'Status', 'Notes'];

// ---------------------------------------------------------------- plumbing

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function authorised_(payload) {
  var given = String(payload.password || '');
  // constant-ish time compare, avoids leaking length via early exit
  if (given.length !== ADMIN_PASSWORD.length) return false;
  var diff = 0;
  for (var i = 0; i < given.length; i++) {
    diff |= given.charCodeAt(i) ^ ADMIN_PASSWORD.charCodeAt(i);
  }
  return diff === 0;
}

function clean_(value, max) {
  return String(value == null ? '' : value).trim().slice(0, max || 2000);
}

// ---------------------------------------------------------------- entrypoint

function doPost(e) {
  try {
    var payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }

    switch (payload.action) {
      case 'submit':     return handleSubmit_(payload);
      case 'list':       return handleList_(payload);
      case 'setStatus':  return handleSetStatus_(payload);
      case 'delete':     return handleDelete_(payload);
      case 'ping':       return json_({ ok: true, service: 'fodavin-forms' });
      default:           return json_({ ok: false, error: 'Unknown action' });
    }
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doGet() {
  // Nothing readable over GET on purpose - the dashboard POSTs with a password.
  return json_({ ok: true, service: 'fodavin-forms' });
}

// ---------------------------------------------------------------- actions

function handleSubmit_(payload) {
  // Honeypot: real people never fill this in. Look successful, store nothing.
  if (clean_(payload.company_website)) {
    return json_({ ok: true, stored: false });
  }

  var type = clean_(payload.type, 40) || 'contact';
  var email = clean_(payload.email, 200);

  if (!email || email.indexOf('@') < 1) {
    return json_({ ok: false, error: 'A valid email address is required.' });
  }
  if (type === 'contact' && !clean_(payload.message)) {
    return json_({ ok: false, error: 'Please include a message.' });
  }

  // Light throttle: same email + type inside 60s is treated as a double click.
  var cache = CacheService.getScriptCache();
  var key = 'sub_' + type + '_' + email;
  if (cache.get(key)) {
    return json_({ ok: true, stored: false, duplicate: true });
  }
  cache.put(key, '1', 60);

  var sheet = getSheet_();
  var id = 'FDV-' + Date.now().toString(36).toUpperCase();
  var row = [
    id,
    new Date(),
    type,
    clean_(payload.name, 200),
    email,
    clean_(payload.phone, 60),
    clean_(payload.message, 5000),
    clean_(payload.page, 300),
    'new',
    ''
  ];
  sheet.appendRow(row);

  notify_(type, row);
  return json_({ ok: true, stored: true, id: id });
}

function notify_(type, row) {
  try {
    var isContact = type === 'contact';
    var subject = isContact
      ? 'New enquiry from ' + (row[3] || row[4])
      : 'New newsletter signup: ' + row[4];

    var body =
      'Type:    ' + row[2] + '\n' +
      'Name:    ' + (row[3] || '-') + '\n' +
      'Email:   ' + row[4] + '\n' +
      'Phone:   ' + (row[5] || '-') + '\n' +
      'Page:    ' + (row[7] || '-') + '\n' +
      'Ref:     ' + row[0] + '\n\n' +
      (row[6] ? 'Message:\n' + row[6] + '\n\n' : '') +
      'Reply directly to this email to answer them.';

    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: subject,
      body: body,
      replyTo: row[4],
      name: 'Fodavin website'
    });
  } catch (err) {
    // Never let a mail failure lose the submission - it is already in the sheet.
    console.error('notify failed: ' + err);
  }
}

function handleList_(payload) {
  if (!authorised_(payload)) {
    Utilities.sleep(700); // blunt the value of guessing repeatedly
    return json_({ ok: false, error: 'Incorrect password.' });
  }

  var sheet = getSheet_();
  var last = sheet.getLastRow();
  if (last < 2) return json_({ ok: true, submissions: [] });

  var values = sheet.getRange(2, 1, last - 1, HEADERS.length).getValues();
  var out = values.map(function (r) {
    return {
      id: String(r[0]),
      received: r[1] instanceof Date ? r[1].toISOString() : String(r[1]),
      type: String(r[2]),
      name: String(r[3]),
      email: String(r[4]),
      phone: String(r[5]),
      message: String(r[6]),
      page: String(r[7]),
      status: String(r[8] || 'new'),
      notes: String(r[9] || '')
    };
  }).reverse(); // newest first

  return json_({ ok: true, submissions: out });
}

function findRowById_(sheet, id) {
  var last = sheet.getLastRow();
  if (last < 2) return -1;
  var ids = sheet.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2;
  }
  return -1;
}

function handleSetStatus_(payload) {
  if (!authorised_(payload)) return json_({ ok: false, error: 'Incorrect password.' });

  var allowed = ['new', 'read', 'replied', 'archived'];
  var status = clean_(payload.status, 20);
  if (allowed.indexOf(status) === -1) {
    return json_({ ok: false, error: 'Unknown status.' });
  }

  var sheet = getSheet_();
  var row = findRowById_(sheet, payload.id);
  if (row === -1) return json_({ ok: false, error: 'Submission not found.' });

  sheet.getRange(row, 9).setValue(status);
  if (payload.notes != null) sheet.getRange(row, 10).setValue(clean_(payload.notes, 2000));
  return json_({ ok: true });
}

function handleDelete_(payload) {
  if (!authorised_(payload)) return json_({ ok: false, error: 'Incorrect password.' });

  var sheet = getSheet_();
  var row = findRowById_(sheet, payload.id);
  if (row === -1) return json_({ ok: false, error: 'Submission not found.' });

  sheet.deleteRow(row);
  return json_({ ok: true });
}
