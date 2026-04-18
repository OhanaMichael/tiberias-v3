// netlify/functions/hotels.js
import fs from 'fs';
import path from 'path';
import { CORS } from "./_sheet.js";

export default async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: CORS });
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
  
  try {
    // Read from local JSON file instead of Google Sheets
    const jsonPath = path.join(process.cwd(), 'public', 'api', 'hotels.json');
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: {
          ...CORS,
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=3600",
        },
      }
    );
  } catch (err) {
    console.error("[hotels]", err.message);
    return new Response(
      JSON.stringify({ error: "Failed to load hotels", hotels: [], total: 0 }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
};

export const config = { path: "/api/hotels" };