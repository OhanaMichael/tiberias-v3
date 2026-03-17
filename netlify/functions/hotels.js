// netlify/functions/hotels.js
// Public endpoint — /api/hotels
// Returns sorted, sanitized hotel list (no admin fields)

import { fetchSheetHotels, toPublicHotels, CORS } from "./_sheet.js";

export default async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: CORS });
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  try {
    const { hotels } = await fetchSheetHotels();
    const publicHotels = toPublicHotels(hotels);

    return new Response(
      JSON.stringify({
        hotels: publicHotels,
        total: publicHotels.length,
        lastUpdated: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          ...CORS,
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=60, stale-while-revalidate=30",
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
