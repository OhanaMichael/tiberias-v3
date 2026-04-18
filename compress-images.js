// compress-images.js
// סקריפט לדחיסת תמונות אוטומטית

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// תיקיות
const INPUT_DIR = path.join(__dirname, 'public', 'images', 'blog');
const OUTPUT_DIR = path.join(__dirname, 'public', 'images', 'blog', 'compressed');

// הגדרות דחיסה
const COMPRESSION_SETTINGS = {
  jpeg: {
    quality: 85,  // איכות 85% - איזון מושלם בין איכות לגודל
    progressive: true,  // טעינה מדורגת
    mozjpeg: true  // דחיסה מתקדמת
  },
  png: {
    quality: 90,  // PNG צריך איכות גבוהה יותר
    compressionLevel: 9,  // רמת דחיסה מקסימלית
    progressive: true
  },
  webp: {
    quality: 85,  // WebP - פורמט מודרני
    effort: 6  // מאמץ דחיסה (0-6, גבוה יותר = קטן יותר)
  }
};

// פונקציה ליצירת תיקיית פלט אם לא קיימת
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 תיקייה נוצרה: ${dir}`);
  }
}

// פונקציה לקבלת גודל קובץ בפורמט קריא
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// פונקציה לדחיסת תמונה בודדת
async function compressImage(inputPath, outputPath, filename) {
  try {
    const ext = path.extname(filename).toLowerCase();
    const baseName = path.basename(filename, ext);
    
    // קריאת גודל קובץ מקורי
    const originalSize = fs.statSync(inputPath).size;
    
    console.log(`\n🖼️  מעבד: ${filename}`);
    console.log(`   גודל מקורי: ${formatFileSize(originalSize)}`);
    
    let compressedSize = 0;
    let savedPercentage = 0;
    
    // דחיסת JPEG/JPG
    if (ext === '.jpg' || ext === '.jpeg') {
      const compressedPath = path.join(outputPath, filename);
      const webpPath = path.join(outputPath, baseName + '.webp');
      
      // דחיסת JPEG
      await sharp(inputPath)
        .jpeg(COMPRESSION_SETTINGS.jpeg)
        .toFile(compressedPath);
      
      compressedSize = fs.statSync(compressedPath).size;
      savedPercentage = ((1 - compressedSize / originalSize) * 100).toFixed(1);
      
      console.log(`   ✅ JPEG דחוס: ${formatFileSize(compressedSize)} (חסכון: ${savedPercentage}%)`);
      
      // המרה ל-WebP
      await sharp(inputPath)
        .webp(COMPRESSION_SETTINGS.webp)
        .toFile(webpPath);
      
      const webpSize = fs.statSync(webpPath).size;
      const webpSaved = ((1 - webpSize / originalSize) * 100).toFixed(1);
      
      console.log(`   ✅ WebP נוצר: ${formatFileSize(webpSize)} (חסכון: ${webpSaved}%)`);
    }
    
    // דחיסת PNG
    else if (ext === '.png') {
      const compressedPath = path.join(outputPath, filename);
      const webpPath = path.join(outputPath, baseName + '.webp');
      
      // דחיסת PNG
      await sharp(inputPath)
        .png(COMPRESSION_SETTINGS.png)
        .toFile(compressedPath);
      
      compressedSize = fs.statSync(compressedPath).size;
      savedPercentage = ((1 - compressedSize / originalSize) * 100).toFixed(1);
      
      console.log(`   ✅ PNG דחוס: ${formatFileSize(compressedSize)} (חסכון: ${savedPercentage}%)`);
      
      // המרה ל-WebP
      await sharp(inputPath)
        .webp(COMPRESSION_SETTINGS.webp)
        .toFile(webpPath);
      
      const webpSize = fs.statSync(webpPath).size;
      const webpSaved = ((1 - webpSize / originalSize) * 100).toFixed(1);
      
      console.log(`   ✅ WebP נוצר: ${formatFileSize(webpSize)} (חסכון: ${webpSaved}%)`);
    }
    
    return {
      filename,
      originalSize,
      compressedSize,
      savedPercentage: parseFloat(savedPercentage)
    };
    
  } catch (error) {
    console.error(`   ❌ שגיאה בעיבוד ${filename}:`, error.message);
    return null;
  }
}

// פונקציה ראשית
async function main() {
  console.log('🚀 מתחיל דחיסת תמונות...\n');
  
  // וידוא שתיקיית הפלט קיימת
  ensureDirectoryExists(OUTPUT_DIR);
  
  // קריאת כל הקבצים בתיקיית התמונות
  const files = fs.readdirSync(INPUT_DIR);
  const imageFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png'].includes(ext);
  });
  
  if (imageFiles.length === 0) {
    console.log('❌ לא נמצאו תמונות לדחיסה!');
    return;
  }
  
  console.log(`📊 נמצאו ${imageFiles.length} תמונות לדחיסה\n`);
  
  const results = [];
  
  // עיבוד כל תמונה
  for (const file of imageFiles) {
    const inputPath = path.join(INPUT_DIR, file);
    const result = await compressImage(inputPath, OUTPUT_DIR, file);
    if (result) {
      results.push(result);
    }
  }
  
  // סיכום
  console.log('\n' + '='.repeat(60));
  console.log('📈 סיכום דחיסה:');
  console.log('='.repeat(60));
  
  const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalCompressed = results.reduce((sum, r) => sum + r.compressedSize, 0);
  const totalSaved = totalOriginal - totalCompressed;
  const avgSaved = (totalSaved / totalOriginal * 100).toFixed(1);
  
  console.log(`\n✅ ${results.length} תמונות עובדו בהצלחה`);
  console.log(`📦 גודל מקורי כולל: ${formatFileSize(totalOriginal)}`);
  console.log(`📦 גודל דחוס כולל: ${formatFileSize(totalCompressed)}`);
  console.log(`💾 חסכון כולל: ${formatFileSize(totalSaved)} (${avgSaved}%)`);
  
  console.log('\n✨ התמונות הדחוסות נמצאות ב:');
  console.log(`   ${OUTPUT_DIR}`);
  console.log('\n💡 כעת תוכל להחליף את התמונות המקוריות בדחוסות!\n');
}

// הרצת הסקריפט
main().catch(error => {
  console.error('❌ שגיאה כללית:', error);
  process.exit(1);
});
