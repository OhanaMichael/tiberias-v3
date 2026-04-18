#!/usr/bin/env node
'use strict';

const axios = require('axios');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// ════════════════════════════════════════════════════════════════
// 🔧 Configuration
// ════════════════════════════════════════════════════════════════
const CONFIG = {
  SHEET_ID: '1AsMDdWRmj2D7SEhNt5csxu8eFdEjia-aW0sJP6isCBk',
  API_KEY: process.env.GOOGLE_SHEETS_API_KEY || '',
  SHEET_NAME: 'מלונות טבריה',
  OUTPUT_DIR: path.join(__dirname, '..', 'public', 'images', 'hotels'),
  JSON_PATH: path.join(__dirname, '..', 'public', 'api', 'hotels.json'),
  WEBP_QUALITY: 80,
  JPG_QUALITY: 85,
  TIMEOUT: 30000,
};
// ════════════════════════════════════════════════════════════════
// 🎨 Console Colors
// ════════════════════════════════════════════════════════════════

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function logSuccess(msg) { log(`✅ ${msg}`, 'green'); }
function logInfo(msg) { log(`ℹ️  ${msg}`, 'blue'); }
function logWarning(msg) { log(`⚠️  ${msg}`, 'yellow'); }
function logError(msg) { log(`❌ ${msg}`, 'red'); }
function logProgress(current, total, name) {
  const percent = Math.round((current / total) * 100);
  const bar = '█'.repeat(Math.floor(percent / 2)) + '░'.repeat(50 - Math.floor(percent / 2));
  log(`[${bar}] ${percent}% - ${name}`, 'cyan');
}

// ════════════════════════════════════════════════════════════════
// 📊 Fetch Google Sheets Data
// ════════════════════════════════════════════════════════════════

async function fetchGoogleSheet() {
  logInfo('Fetching data from Google Sheets...');
  
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SHEET_ID}/values/${CONFIG.SHEET_NAME}?key=${CONFIG.API_KEY}`;
  
  try {
    const response = await axios.get(url, { timeout: CONFIG.TIMEOUT });
    const rows = response.data.values;
    
    if (!rows || rows.length < 3) {
      throw new Error('Not enough data in sheet (need at least 3 rows: Hebrew headers, English headers, data)');
    }
    
    // Row 1: Hebrew headers (display names)
    // Row 2: English field names (the actual keys we use)
    // Row 3+: Actual hotel data
    const hebrewHeaders = rows[0];
    const englishHeaders = rows[1];
    
    logInfo(`Found ${englishHeaders.length} columns`);
    
    // Start from row 3 (index 2) - skip both header rows
    const data = rows.slice(2).map(row => {
      const obj = {};
      englishHeaders.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });
    
    logSuccess(`Loaded ${data.length} hotels from Google Sheets`);
    return data;
    
  } catch (error) {
    logError(`Failed to fetch Google Sheets: ${error.message}`);
    throw error;
  }
}

// ════════════════════════════════════════════════════════════════
// 🖼️ Download & Process Image
// ════════════════════════════════════════════════════════════════

async function downloadAndProcessImage(url, hotelId) {
  if (!url || !hotelId) {
    return null;
  }
  
  try {
    // Check if files already exist
    const webpPath = path.join(CONFIG.OUTPUT_DIR, `${hotelId}.webp`);
    const jpgPath = path.join(CONFIG.OUTPUT_DIR, `${hotelId}.jpg`);
    
    try {
      await fs.access(webpPath);
      await fs.access(jpgPath);
      logInfo(`Skipping ${hotelId} - already exists`);
      return { webp: `/images/hotels/${hotelId}.webp`, jpg: `/images/hotels/${hotelId}.jpg` };
    } catch {
      // Files don't exist, proceed with download
    }
    
    // Download image
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: CONFIG.TIMEOUT,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    const buffer = Buffer.from(response.data);
    
    // Process with Sharp
    const image = sharp(buffer);
    const metadata = await image.metadata();
    
    // Resize if too large (max 1200px width)
    let processedImage = image;
    if (metadata.width > 1200) {
      processedImage = image.resize(1200, null, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }
    
    // Save WebP
    await processedImage
      .webp({ quality: CONFIG.WEBP_QUALITY })
      .toFile(webpPath);
    
    // Save JPG fallback
    await processedImage
      .jpeg({ quality: CONFIG.JPG_QUALITY, mozjpeg: true })
      .toFile(jpgPath);
    
    // Get file sizes
    const webpStats = await fs.stat(webpPath);
    const jpgStats = await fs.stat(jpgPath);
    
    const originalSize = (buffer.length / 1024).toFixed(0);
    const webpSize = (webpStats.size / 1024).toFixed(0);
    const jpgSize = (jpgStats.size / 1024).toFixed(0);
    const savings = ((1 - webpStats.size / buffer.length) * 100).toFixed(0);
    
    logSuccess(`${hotelId}: ${originalSize}KB → WebP ${webpSize}KB, JPG ${jpgSize}KB (${savings}% saved)`);
    
    return {
      webp: `/images/hotels/${hotelId}.webp`,
      jpg: `/images/hotels/${hotelId}.jpg`,
    };
    
  } catch (error) {
    logWarning(`Failed to process ${hotelId}: ${error.message}`);
    return null;
  }
}

// ════════════════════════════════════════════════════════════════
// 💾 Update JSON File
// ════════════════════════════════════════════════════════════════

async function updateJSON(hotels) {
  logInfo('Updating hotels.json...');
  
  // Ensure directory exists
  await fs.mkdir(path.dirname(CONFIG.JSON_PATH), { recursive: true });
  
  const jsonData = {
    hotels: hotels,
    lastUpdated: new Date().toISOString(),
    totalCount: hotels.length,
  };
  
  await fs.writeFile(
    CONFIG.JSON_PATH,
    JSON.stringify(jsonData, null, 2),
    'utf8'
  );
  
  logSuccess(`Updated ${CONFIG.JSON_PATH}`);
}

// ════════════════════════════════════════════════════════════════
// 🚀 Main Function
// ════════════════════════════════════════════════════════════════

async function main() {
  console.log('\n');
  log('╔═══════════════════════════════════════════════════════╗', 'bright');
  log('║         🏨 Hotels Tiberias Image Downloader          ║', 'bright');
  log('╚═══════════════════════════════════════════════════════╝', 'bright');
  console.log('\n');
  
  try {
    // Ensure output directory exists
    await fs.mkdir(CONFIG.OUTPUT_DIR, { recursive: true });
    logSuccess(`Output directory ready: ${CONFIG.OUTPUT_DIR}`);
    
    // Fetch data from Google Sheets
    const sheetData = await fetchGoogleSheet();
    
    // Filter only active hotels with images
    const hotelsWithImages = sheetData.filter(h => {
      const isActive = h.is_active && (h.is_active.trim().toLowerCase() === 'כן' || h.is_active.trim() === 'TRUE');
      const hasImage = h.main_image_url && h.main_image_url.trim() !== '';
      return isActive && hasImage;
    });
    
    logInfo(`Found ${hotelsWithImages.length} active hotels with images out of ${sheetData.length} total`);
    console.log('\n');
    
    if (hotelsWithImages.length === 0) {
      logWarning('No hotels found matching criteria:');
      logWarning('- is_active must be "כן" or "TRUE"');
      logWarning('- main_image_url must not be empty');
      console.log('\n');
      logInfo('First hotel sample for debugging:');
      console.log(JSON.stringify(sheetData[0], null, 2));
      return;
    }
    
    // Process images
    const results = [];
    let processed = 0;
    
    for (const hotel of hotelsWithImages) {
      processed++;
      logProgress(processed, hotelsWithImages.length, hotel.name_he || hotel.hotel_id);
      
      const imageResult = await downloadAndProcessImage(
        hotel.main_image_url,
        hotel.hotel_id
      );
      
      // Update hotel object with local image paths
      const updatedHotel = {
        ...hotel,
        main_image_url: imageResult ? imageResult.jpg : hotel.main_image_url,
        main_image_webp: imageResult ? imageResult.webp : null,
      };
      
      results.push(updatedHotel);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n');
    
    // Update JSON file
    await updateJSON(results);
    
    console.log('\n');
    log('╔═══════════════════════════════════════════════════════╗', 'green');
    log('║                  ✅ COMPLETED!                         ║', 'green');
    log('╚═══════════════════════════════════════════════════════╝', 'green');
    console.log('\n');
    
    logSuccess(`Processed ${processed} hotels`);
    logSuccess(`Images saved to: ${CONFIG.OUTPUT_DIR}`);
    logSuccess(`JSON updated: ${CONFIG.JSON_PATH}`);
    
    // Show storage savings
    if (processed > 0) {
      console.log('\n');
      logInfo('💾 Next steps:');
      logInfo('1. Update your index.html to use local images instead of Booking.com URLs');
      logInfo('2. Commit and push to Git');
      logInfo('3. Check PageSpeed - expect Performance +20-25 points! 🚀');
    }
    
  } catch (error) {
    console.log('\n');
    logError(`Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run
main();
