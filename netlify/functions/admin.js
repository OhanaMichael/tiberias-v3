// netlify/functions/admin.js
// Protected endpoint — /api/admin
// Returns FULL hotel data including display_order, internal_notes, admin_priority

import { fetchSheetHotels, checkAuth, CORS } from "./_sheet.js";

export default async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: CORS });

  if (!checkAuth(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        ...CORS,
        "Content-Type": "application/json",
        "WWW-Authenticate": 'Basic realm="Admin"',
      },
    });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  try {
    const { hotels, sheetUrl } = await fetchSheetHotels();

    // Sort by display_order for admin preview
    const sorted = [...hotels].sort((a, b) => {
      const oa = parseInt(a.display_order) || 9999;
      const ob = parseInt(b.display_order) || 9999;
      return oa - ob;
    });

    const active   = hotels.filter((h) => h.is_active === "כן").length;
    const inactive = hotels.filter((h) => h.is_active !== "כן").length;

    return new Response(
      JSON.stringify({
        hotels: sorted,
        total: hotels.length,
        active,
        inactive,
        sheetUrl,
        fetchedAt: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          ...CORS,
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (err) {
    console.error("[admin]", err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
};

export const config = { path: "/api/admin" };
