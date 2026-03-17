// ████████████████████████████████████████████████████████████████
// 📊 Get Analytics - Netlify Function
// מחזיר נתוני אנליטיקס מ-Supabase
// ████████████████████████████████████████████████████████████████

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function handler(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse query parameters
    const params = event.queryStringParameters || {};
    const {
      startDate,
      endDate,
      hotelId,
      action,
      limit = '1000'
    } = params;

    // Build query
    let query = supabase
      .from('clicks')
      .select('*')
      .order('clicked_at', { ascending: false })
      .limit(parseInt(limit));

    // Filters
    if (startDate) {
      query = query.gte('clicked_at', startDate + 'T00:00:00');
    }
    if (endDate) {
      // Add end of day to include all clicks from that date
      query = query.lte('clicked_at', endDate + 'T23:59:59');
    }
    if (hotelId) {
      query = query.eq('hotel_id', hotelId);
    }
    if (action) {
      query = query.eq('action', action);
    }

    // Execute query
    const { data: clicks, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Database error', details: error.message })
      };
    }

    // Calculate statistics
    const stats = calculateStats(clicks, startDate, endDate);

    // Return results
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        filters: { startDate, endDate, hotelId, action },
        stats: stats,
        clicks: clicks,
        total: clicks.length
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
}

// ═══════════════════════════════════════════════════════════════
// Statistics Calculator
// ═══════════════════════════════════════════════════════════════

function calculateStats(clicks, startDate, endDate) {
  const stats = {
    total: clicks.length,
    
    // By action
    byAction: {},
    
    // By hotel
    byHotel: {},
    
    // By device
    byDevice: {},
    
    // By browser
    byBrowser: {},
    
    // By date
    byDate: {},
    
    // By source
    bySource: {},
    
    // Unique visitors (by IP)
    uniqueVisitors: new Set(),
    
    // Peak hours
    byHour: {}
  };

  clicks.forEach(click => {
    // By action
    stats.byAction[click.action] = (stats.byAction[click.action] || 0) + 1;
    
    // By hotel
    const hotelKey = `${click.hotel_id}_${click.hotel_name}`;
    if (!stats.byHotel[hotelKey]) {
      stats.byHotel[hotelKey] = {
        id: click.hotel_id,
        name: click.hotel_name,
        count: 0,
        byAction: {}
      };
    }
    stats.byHotel[hotelKey].count++;
    stats.byHotel[hotelKey].byAction[click.action] = 
      (stats.byHotel[hotelKey].byAction[click.action] || 0) + 1;
    
    // By device
    if (click.device_type) {
      stats.byDevice[click.device_type] = (stats.byDevice[click.device_type] || 0) + 1;
    }
    
    // By browser
    if (click.browser) {
      stats.byBrowser[click.browser] = (stats.byBrowser[click.browser] || 0) + 1;
    }
    
    // By date
    const date = click.clicked_at?.split('T')[0];
    if (date) {
      stats.byDate[date] = (stats.byDate[date] || 0) + 1;
    }
    
    // By source
    const source = click.utm_source || getSourceFromReferrer(click.referrer) || 'direct';
    stats.bySource[source] = (stats.bySource[source] || 0) + 1;
    
    // Unique visitors
    if (click.ip_address) {
      stats.uniqueVisitors.add(click.ip_address);
    }
    
    // By hour
    if (click.clicked_at) {
      const hour = new Date(click.clicked_at).getHours();
      stats.byHour[hour] = (stats.byHour[hour] || 0) + 1;
    }
  });

  // Convert Set to count
  stats.uniqueVisitors = stats.uniqueVisitors.size;

  // Sort hotels by count
  stats.topHotels = Object.values(stats.byHotel)
    .sort((a, b) => b.count - a.count);

  return stats;
}

function getSourceFromReferrer(referrer) {
  if (!referrer) return null;
  const lower = referrer.toLowerCase();
  
  if (lower.includes('google')) return 'google';
  if (lower.includes('facebook')) return 'facebook';
  if (lower.includes('instagram')) return 'instagram';
  if (lower.includes('twitter') || lower.includes('x.com')) return 'twitter';
  if (lower.includes('whatsapp')) return 'whatsapp';
  
  return 'other';
}
