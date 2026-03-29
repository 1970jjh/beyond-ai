/**
 * Beyond AI - Google Apps Script Web API
 *
 * Deployed as web app to handle all Google Sheets CRUD operations.
 * Runs under script owner's permissions - no OAuth needed from users.
 *
 * Supports optimistic locking via _version column.
 */

const SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
const API_KEY = PropertiesService.getScriptProperties().getProperty('API_KEY');

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);

    if (API_KEY && payload.apiKey !== API_KEY) {
      return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
    }

    const { action, sheet } = payload;

    switch (action) {
      case 'read_all':
        return jsonResponse(readAll(sheet));
      case 'read_by_id':
        return jsonResponse(readById(sheet, payload.id));
      case 'read_by_field':
        return jsonResponse(readByField(sheet, payload.field, payload.value));
      case 'create':
        return jsonResponse(createRow(sheet, payload.row));
      case 'update':
        return jsonResponse(updateRow(sheet, payload.id, payload.updates, payload.version));
      case 'delete':
        return jsonResponse(deleteRow(sheet, payload.id));
      case 'batch_create':
        return jsonResponse(batchCreate(sheet, payload.rows));
      case 'batch_update':
        return jsonResponse(batchUpdate(sheet, payload.updates));
      case 'init_sheet':
        return jsonResponse(initSheet(sheet, payload.headers, payload.initialData));
      default:
        return jsonResponse({ success: false, error: `Unknown action: ${action}` });
    }
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

function doGet(e) {
  return jsonResponse({ success: true, message: 'Beyond AI GAS API is running' });
}

// --- Core Operations ---

function readAll(sheetName) {
  const ws = getWorksheet(sheetName);
  const data = ws.getDataRange().getValues();
  if (data.length <= 1) return { success: true, data: [] };

  const headers = data[0];
  const rows = data.slice(1).map(row => rowToObject(headers, row));
  return { success: true, data: rows };
}

function readById(sheetName, id) {
  const ws = getWorksheet(sheetName);
  const data = ws.getDataRange().getValues();
  if (data.length <= 1) return { success: true, data: null };

  const headers = data[0];
  const idCol = headers.indexOf(getIdField(sheetName));
  if (idCol === -1) return { success: true, data: null };

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(id)) {
      return { success: true, data: rowToObject(headers, data[i]) };
    }
  }
  return { success: true, data: null };
}

function readByField(sheetName, field, value) {
  const ws = getWorksheet(sheetName);
  const data = ws.getDataRange().getValues();
  if (data.length <= 1) return { success: true, data: [] };

  const headers = data[0];
  const fieldCol = headers.indexOf(field);
  if (fieldCol === -1) return { success: true, data: [] };

  const results = [];
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][fieldCol]) === String(value)) {
      results.push(rowToObject(headers, data[i]));
    }
  }
  return { success: true, data: results };
}

function createRow(sheetName, row) {
  const ws = getWorksheet(sheetName);
  const headers = ws.getRange(1, 1, 1, ws.getLastColumn()).getValues()[0];

  const rowArray = headers.map(h => {
    if (h === '_version' && (row[h] === undefined || row[h] === null)) return 1;
    return row[h] !== undefined ? row[h] : '';
  });

  ws.appendRow(rowArray);
  return { success: true, data: row };
}

function updateRow(sheetName, id, updates, expectedVersion) {
  const ws = getWorksheet(sheetName);
  const data = ws.getDataRange().getValues();
  const headers = data[0];
  const idCol = headers.indexOf(getIdField(sheetName));
  const versionCol = headers.indexOf('_version');

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(id)) {
      // Optimistic lock check
      if (expectedVersion !== undefined && expectedVersion !== null && versionCol !== -1) {
        const currentVersion = Number(data[i][versionCol]) || 1;
        if (currentVersion !== Number(expectedVersion)) {
          return {
            success: false,
            error: `VERSION_CONFLICT: expected ${expectedVersion}, got ${currentVersion}`
          };
        }
      }

      // Apply updates
      for (const [key, value] of Object.entries(updates)) {
        const col = headers.indexOf(key);
        if (col !== -1) {
          ws.getRange(i + 1, col + 1).setValue(value);
        }
      }

      // Increment version
      if (versionCol !== -1) {
        const newVersion = (Number(data[i][versionCol]) || 1) + 1;
        ws.getRange(i + 1, versionCol + 1).setValue(newVersion);
        updates._version = newVersion;
      }

      return { success: true, data: { ...rowToObject(headers, data[i]), ...updates } };
    }
  }

  return { success: false, error: `Row not found: ${id}` };
}

function deleteRow(sheetName, id) {
  const ws = getWorksheet(sheetName);
  const data = ws.getDataRange().getValues();
  const headers = data[0];
  const idCol = headers.indexOf(getIdField(sheetName));

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(id)) {
      ws.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, error: `Row not found: ${id}` };
}

function batchCreate(sheetName, rows) {
  const ws = getWorksheet(sheetName);
  const headers = ws.getRange(1, 1, 1, ws.getLastColumn()).getValues()[0];

  const rowArrays = rows.map(row =>
    headers.map(h => {
      if (h === '_version' && (row[h] === undefined || row[h] === null)) return 1;
      return row[h] !== undefined ? row[h] : '';
    })
  );

  if (rowArrays.length > 0) {
    const startRow = ws.getLastRow() + 1;
    ws.getRange(startRow, 1, rowArrays.length, headers.length).setValues(rowArrays);
  }

  return { success: true, data: rows };
}

function batchUpdate(sheetName, updates) {
  const ws = getWorksheet(sheetName);
  const data = ws.getDataRange().getValues();
  const headers = data[0];
  const idCol = headers.indexOf(getIdField(sheetName));

  for (const update of updates) {
    const id = update.id;
    const changes = update.updates || update;

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idCol]) === String(id)) {
        for (const [key, value] of Object.entries(changes)) {
          if (key === 'id') continue;
          const col = headers.indexOf(key);
          if (col !== -1) {
            ws.getRange(i + 1, col + 1).setValue(value);
          }
        }
        break;
      }
    }
  }

  return { success: true };
}

function initSheet(sheetName, headers, initialData) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let ws;

  try {
    ws = ss.getSheetByName(sheetName);
    if (ws) {
      return { success: true, data: { status: 'already_exists', sheet: sheetName } };
    }
  } catch (e) {
    // Sheet doesn't exist
  }

  ws = ss.insertSheet(sheetName);

  // Set headers
  if (headers && headers.length > 0) {
    ws.getRange(1, 1, 1, headers.length).setValues([headers]);
    ws.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    ws.setFrozenRows(1);
  }

  // Insert initial data
  if (initialData && initialData.length > 0) {
    const rowArrays = initialData.map(row =>
      headers.map(h => row[h] !== undefined ? row[h] : '')
    );
    ws.getRange(2, 1, rowArrays.length, headers.length).setValues(rowArrays);
  }

  return { success: true, data: { status: 'created', sheet: sheetName, rows: (initialData || []).length } };
}

// --- Helpers ---

function getWorksheet(sheetName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const ws = ss.getSheetByName(sheetName);
  if (!ws) throw new Error(`Sheet not found: ${sheetName}`);
  return ws;
}

function getIdField(sheetName) {
  const idFields = {
    'auth_admins': 'email',
    'users': 'id',
    'rooms': 'id',
    'room_participants': 'user_id',
    'quest_results': 'id',
    'activity_logs': 'id',
    'dashboard_stats': 'metric_key',
  };
  return idFields[sheetName] || 'id';
}

function rowToObject(headers, row) {
  const obj = {};
  headers.forEach((h, i) => {
    obj[h] = row[i] !== undefined ? row[i] : '';
  });
  return obj;
}

function jsonResponse(data, statusCode) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- Setup Function (run once manually) ---

function setupProperties() {
  const props = PropertiesService.getScriptProperties();
  // Set these values before deploying:
  // props.setProperty('SPREADSHEET_ID', 'your-spreadsheet-id-here');
  // props.setProperty('API_KEY', 'your-api-key-here');
  Logger.log('Current properties: ' + JSON.stringify(props.getProperties()));
}

function initAllSheets() {
  const sheets = [
    { name: 'auth_admins', headers: ['email', 'role', 'name', 'added_at', 'added_by', 'is_active', '_version'] },
    { name: 'users', headers: ['id', 'email', 'display_name', 'team', 'role', 'avatar_url', 'total_points', 'current_streak', 'joined_at', 'last_active_at', 'is_active', '_version'] },
    { name: 'rooms', headers: ['id', 'name', 'quest_id', 'status', 'difficulty', 'created_by', 'invite_code', 'max_participants', 'current_count', 'start_time', 'end_time', 'created_at', 'settings_json', '_version'] },
    { name: 'room_participants', headers: ['room_id', 'user_id', 'user_email', 'team_name', 'joined_at', 'status', '_version'] },
    { name: 'quest_results', headers: ['id', 'room_id', 'user_id', 'quest_id', 'submission_text', 'ai_submission_text', 'human_score', 'ai_score', 'quality_score', 'creativity_score', 'executability_score', 'time_score', 'peer_score', 'final_score', 'result', 'mode_used', 'duration_sec', 'feedback_json', 'submitted_at', '_version'] },
    { name: 'activity_logs', headers: ['id', 'user_id', 'action', 'target_type', 'target_id', 'detail_json', 'ip_address', 'created_at', '_version'] },
    { name: 'dashboard_stats', headers: ['metric_key', 'metric_value', 'period', 'updated_at', '_version'] },
  ];

  const initialAdmins = [
    { email: 'jjh@jjcreative.co.kr', role: 'super_admin', name: '정재현', added_at: new Date().toISOString(), added_by: 'system', is_active: 'TRUE', _version: 1 },
    { email: 'jjhgather@gmail.com', role: 'super_admin', name: '정재현', added_at: new Date().toISOString(), added_by: 'system', is_active: 'TRUE', _version: 1 },
  ];

  for (const sheet of sheets) {
    const initial = sheet.name === 'auth_admins' ? initialAdmins : [];
    const result = initSheet(sheet.name, sheet.headers, initial);
    Logger.log(`${sheet.name}: ${JSON.stringify(result)}`);
  }

  Logger.log('All sheets initialized.');
}
