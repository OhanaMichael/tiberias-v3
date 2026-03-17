/**
 * apps-script.gs
 * ─────────────────────────────────────────────────────────────────────────────
 * Google Apps Script Webhook — מקבל נתוני מלונות מממשק הניהול וכותב ל-Sheet
 *
 * הוראות פריסה:
 *  1. ב-Google Sheet: הרחבות ← Apps Script
 *  2. הדבק את הקוד הזה ב-Code.gs
 *  3. שמור (Ctrl+S)
 *  4. פרוס: Deploy ← New deployment ← Web app
 *     - Execute as: Me
 *     - Who has access: Anyone
 *  5. העתק את ה-URL שמתקבל
 *  6. הוסף ב-Netlify → Environment Variables:
 *     APPS_SCRIPT_WEBHOOK_URL = <ה-URL שהעתקת>
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Config ──────────────────────────────────────────────────────────────────
const SHEET_NAME = "מלונות טבריה"; // שם הגיליון — חייב להתאים בדיוק
const FIELD_ID_ROW = 2;             // שורה שמכילה את ה-field IDs (row index 2 = שורה 2 ב-Excel)

// ── Handler ─────────────────────────────────────────────────────────────────
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const hotels  = payload.hotels;

    if (!hotels || !Array.isArray(hotels)) {
      return jsonResponse({ error: "No hotels array in payload" }, 400);
    }

    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      return jsonResponse({ error: `Sheet "${SHEET_NAME}" not found` }, 404);
    }

    // Read field IDs from row 2
    const lastCol  = sheet.getLastColumn();
    const fieldRow = sheet.getRange(FIELD_ID_ROW, 1, 1, lastCol).getValues()[0];
    const fieldIds = fieldRow.map(v => String(v || "").trim());

    // Build column-index map: fieldId → 1-based column index
    const colMap = {};
    fieldIds.forEach((fid, idx) => {
      if (fid) colMap[fid] = idx + 1;
    });

    // Clear data rows (from row 3 onwards)
    const dataStartRow = 3;
    const currentLastRow = sheet.getLastRow();
    if (currentLastRow >= dataStartRow) {
      sheet.getRange(dataStartRow, 1, currentLastRow - dataStartRow + 1, lastCol).clearContent();
    }

    // Write hotel data
    if (hotels.length > 0) {
      const rows = hotels.map(hotel => {
        const row = new Array(lastCol).fill("");
        Object.entries(hotel).forEach(([fid, val]) => {
          if (colMap[fid]) {
            row[colMap[fid] - 1] = val;
          }
        });
        return row;
      });

      sheet.getRange(dataStartRow, 1, rows.length, lastCol).setValues(rows);
    }

    // Log the update
    Logger.log(`Updated ${hotels.length} hotels at ${new Date().toISOString()}`);

    return jsonResponse({
      success: true,
      message: `${hotels.length} hotels written to Sheet`,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    Logger.log("Error: " + err.message);
    return jsonResponse({ error: err.message }, 500);
  }
}

// ── GET handler (health check) ───────────────────────────────────────────────
function doGet(e) {
  return jsonResponse({ status: "ok", sheet: SHEET_NAME });
}

// ── Helper ───────────────────────────────────────────────────────────────────
function jsonResponse(obj, statusCode) {
  const output = ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}
