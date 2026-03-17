// netlify/functions/_sheet.js
// Shared utility: fetches Google Sheet as CSV and parses it
// Row 0 = display headers (Hebrew), Row 1 = field IDs, Row 2+ = data

const ADMIN_FIELDS = new Set([
  "display_order",
  "internal_notes",
  "admin_priority",
]);

/**
 * Robust CSV parser — handles quoted fields, commas inside quotes, newlines
 */
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuote = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuote) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuote = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuote = true;
      } else if (ch === ",") {
        row.push(field.trim());
        field = "";
      } else if (ch === "\n" || (ch === "\r" && next === "\n")) {
        if (ch === "\r") i++;
        row.push(field.trim());
        if (row.some((c) => c !== "")) rows.push(row);
        row = [];
        field = "";
      } else {
        field += ch;
      }
    }
  }
  // Last field/row
  if (field || row.length) {
    row.push(field.trim());
    if (row.some((c) => c !== "")) rows.push(row);
  }
  return rows;
}

/**
 * Fetch and parse the Google Sheet CSV
 * Returns { hotels: Hotel[], sheetUrl: string }
 */
export async function fetchSheetHotels() {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const gid = process.env.GOOGLE_SHEET_GID || "0"; // 0 = first tab

  if (!sheetId) throw new Error("GOOGLE_SHEET_ID environment variable not set");

  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;

  const res = await fetch(csvUrl, {
    headers: { "User-Agent": "TiberiasHotelsPortal/3.0" },
  });

  if (!res.ok) {
    throw new Error(
      `Could not fetch Sheet (${res.status}). Make sure the Sheet is published: File → Share → Publish to web → CSV`
    );
  }

  const text = await res.text();
  const rows = parseCSV(text);

  if (rows.length < 3) return { hotels: [], sheetUrl };

  // Row 1 (index 1) = field IDs
  const fieldIds = rows[1].map((v) => v.trim());

  const hotels = [];
  for (let r = 2; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every((c) => !c)) continue;

    const hotel = {};
    fieldIds.forEach((fid, ci) => {
      if (fid) hotel[fid] = (row[ci] || "").trim();
    });

    if (!hotel.hotel_id) continue;
    hotels.push(hotel);
  }

  return { hotels, sheetUrl };
}

/**
 * Strip admin-only fields and sort by display_order
 */
export function toPublicHotels(hotels) {
  return hotels
    .filter((h) => h.is_active === "כן")
    .sort((a, b) => {
      const oa = parseInt(a.display_order) || 9999;
      const ob = parseInt(b.display_order) || 9999;
      return oa - ob;
    })
    .map((h) => {
      const pub = { ...h };
      ADMIN_FIELDS.forEach((f) => delete pub[f]);
      return pub;
    });
}

/**
 * Check Basic Auth against env vars
 */
export function checkAuth(req) {
  const h = req.headers.get("Authorization") || "";
  if (!h.startsWith("Basic ")) return false;
  let decoded;
  try {
    decoded = Buffer.from(h.slice(6), "base64").toString("utf-8");
  } catch {
    return false;
  }
  const colon = decoded.indexOf(":");
  if (colon === -1) return false;
  const user = decoded.slice(0, colon);
  const pass = decoded.slice(colon + 1);
  const validUser = process.env.ADMIN_USERNAME || "";
  const validPass = process.env.ADMIN_PASSWORD || "";
  // Constant-time compare to prevent timing attacks
  if (!validUser || !validPass) return false;
  const ul = Math.max(user.length, validUser.length);
  const pl = Math.max(pass.length, validPass.length);
  let uOk = user.length === validUser.length;
  let pOk = pass.length === validPass.length;
  for (let i = 0; i < ul; i++) uOk = uOk && (user.charCodeAt(i) === validUser.charCodeAt(i));
  for (let i = 0; i < pl; i++) pOk = pOk && (pass.charCodeAt(i) === validPass.charCodeAt(i));
  return uOk && pOk;
}

export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};
