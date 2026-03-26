// ████████████████████████████████████████████████████████████████
// 🎯 Track Click - Netlify Function (CommonJS)
// שומר כל קליק ב-Supabase Database
// ████████████████████████████████████████████████████████████████

const { createClient } = require('@supabase/supabase-js');

// Supabase credentials - using service_role to bypass RLS
const supabaseUrl = 'https://yeqjwafjyrtfixxezlug.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllcWp3YWZqeXJ0Zml4eGV6bHVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk1MjAxMCwiZXhwIjoyMDg3NTI4MDEwfQ.WrvE-WOwaUOHrhqhw1sKDYvZCWGAjAWoLibsHLEmv5c';
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async function(event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // רק POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // פענוח הנתונים
    const data = JSON.parse(event.body);
    
    const {
      hotelId,
      hotelName,
      action,
      timestamp,
      userAgent,
      referrer,
      pageUrl,
      sessionId
    } = data;

    // בדיקות בסיסיות
    if (!hotelId || !hotelName || !action) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // זיהוי מכשיר מה-User Agent
    const deviceInfo = parseUserAgent(userAgent || '');
    
    // זיהוי מיקום מה-IP
    const ip = event.headers['x-forwarded-for']?.split(',')[0] || 
                event.headers['client-ip'] || 
                'unknown';
    
    const locationInfo = await getLocationFromIP(ip);

    // הכנת הנתונים לשמירה
    const clickData = {
      hotel_id: hotelId,
      hotel_name: hotelName,
      action: action,
      clicked_at: timestamp || new Date().toISOString(),
      
      // User info
      user_agent: userAgent,
      device_type: deviceInfo.deviceType,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      
      // Location
      ip_address: ip,
      country: locationInfo.country,
      city: locationInfo.city,
      
      // Source
      referrer: referrer,
      utm_source: extractUTM(referrer, 'utm_source'),
      utm_medium: extractUTM(referrer, 'utm_medium'),
      utm_campaign: extractUTM(referrer, 'utm_campaign'),
      
      // Meta
      session_id: sessionId,
      page_url: pageUrl
    };

    // שמירה ב-Supabase (עם service_role - עוקף RLS!)
    const { data: savedData, error } = await supabase
      .from('clicks')
      .insert([clickData])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Database error', details: error.message })
      };
    }

    // הצלחה! 🎉
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        id: savedData[0].id,
        message: 'Click tracked successfully'
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// ═══════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════

function parseUserAgent(ua) {
  const lower = ua.toLowerCase();
  
  // Device Type
  let deviceType = 'desktop';
  if (/mobile|android|iphone|ipad|ipod/.test(lower)) {
    deviceType = /ipad|tablet/.test(lower) ? 'tablet' : 'mobile';
  }
  
  // Browser
  let browser = 'unknown';
  if (lower.includes('edg/')) browser = 'edge';
  else if (lower.includes('chrome')) browser = 'chrome';
  else if (lower.includes('safari') && !lower.includes('chrome')) browser = 'safari';
  else if (lower.includes('firefox')) browser = 'firefox';
  
  // OS
  let os = 'unknown';
  if (lower.includes('windows')) os = 'windows';
  else if (lower.includes('mac os')) os = 'macos';
  else if (lower.includes('iphone') || lower.includes('ipad')) os = 'ios';
  else if (lower.includes('android')) os = 'android';
  else if (lower.includes('linux')) os = 'linux';
  
  return { deviceType, browser, os };
}

async function getLocationFromIP(ip) {
  // בשלב ראשון - נחזיר ערכים ברירת מחדל
  // אפשר להוסיף IP geolocation API (ipapi.co, ipinfo.io) בעתיד
  
  if (ip === 'unknown' || ip.startsWith('192.168') || ip.startsWith('10.')) {
    return { country: 'IL', city: 'Unknown' };
  }
  
  try {
    // IP geolocation (חינמי: 1000/יום)
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    if (response.ok) {
      const data = await response.json();
      return {
        country: data.country_code || 'Unknown',
        city: data.city || 'Unknown'
      };
    }
  } catch (error) {
    console.error('IP location error:', error);
  }
  
  return { country: 'Unknown', city: 'Unknown' };
}

function extractUTM(url, param) {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get(param);
  } catch {
    return null;
  }
}
