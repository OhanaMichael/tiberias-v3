# 🏨 פורטל מלונות טבריה v3 — Published CSV

## ארכיטקטורה

```
 Google Sheet (ציבורי לקריאה, CSV)
        ↓  fetch כל 60 שניות
 Netlify Function
        ↓
 /api/hotels   ← ציבורי, ממוין, ללא שדות פנימיים
 /api/admin    ← מוגן, מלא, כולל display_order + internal_notes
```

---

## שלב 1: הכנת Google Sheet

### א. ייבא את קובץ ה-Excel
1. פתח **sheets.google.com**
2. **File → Import → Upload** → בחר `מלוני_טבריה_דאטאבייס.xlsx`
3. Import location: **Replace spreadsheet** (או Create new)
4. **Import data**

### ב. פרסם את ה-Sheet ל-CSV
1. **File → Share → Publish to web**
2. בחר: **מלונות טבריה** (הגיליון הראשון)
3. Format: **Comma-separated values (.csv)**
4. לחץ **Publish** → אשר
5. **העתק את ה-URL שמתקבל** — הוא ייראה כך:
   ```
   https://docs.google.com/spreadsheets/d/SHEET_ID/pub?gid=0&single=true&output=csv
   ```
6. **ה-SHEET_ID** הוא הטקסט הארוך באמצע ה-URL

---

## שלב 2: פריסה ל-Netlify

### א. העלה לגיטהאב
```bash
git init && git add . && git commit -m "init"
git remote add origin https://github.com/YOUR/REPO.git
git push -u origin main
```

### ב. חבר ל-Netlify
- **netlify.com** → **Add new site** → **Import an existing project**
- Build command: *(ריק)*
- Publish directory: `public`

---

## שלב 3: משתני סביבה (חובה!)

**Netlify → Site Settings → Environment Variables:**

| משתנה | ערך | הסבר |
|-------|-----|-------|
| `GOOGLE_SHEET_ID` | `1BxiMVs0XRA...` | ה-ID מה-URL של ה-Sheet |
| `GOOGLE_SHEET_GID` | `0` | ה-GID (0 = גיליון ראשון) |
| `ADMIN_USERNAME` | `admin` | שם המשתמש לממשק הניהול |
| `ADMIN_PASSWORD` | `Strong!Pass123` | סיסמה חזקה — 12+ תווים |
| `APPS_SCRIPT_WEBHOOK_URL` | `https://script.google...` | אופציונלי — רק אם רוצים העלאת Excel |

לאחר שמירה: **Deploys → Trigger deploy**

---

## שלב 4: הגדרת Apps Script (אופציונלי — לממשק העלאת Excel)

כדי שהעלאת Excel תכתוב ישירות ל-Sheet:

1. ב-Google Sheet: **Extensions → Apps Script**
2. הדבק את תוכן הקובץ `apps-script.gs`
3. שמור → **Deploy → New deployment**
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
4. לחץ **Deploy** → **Authorize** → העתק את ה-URL
5. הוסף ב-Netlify: `APPS_SCRIPT_WEBHOOK_URL` = ה-URL

**ללא Apps Script** — ממשק הניהול עדיין עובד, רק ה-Excel upload לא ייכתב אוטומטית ל-Sheet.

---

## עבודה שוטפת

### לעדכון נתונים (הכי פשוט):
1. פתח את ה-Sheet ← לחץ "פתח את ה-Sheet" בממשק הניהול
2. ערוך, שמור
3. האתר מתעדכן תוך **~60 שניות**

### לשינוי סדר הופעה:
- עמודה `display_order` — מספר **1 = ראשון**, 2 = שני, וכו'
- ריק / 9999 = יופיע בסוף

### לשדות הסודיים (לא מוצגים לגולשים):
| שדה | שימוש |
|-----|-------|
| `display_order` | סדר הופעה — גולשים לא רואים |
| `internal_notes` | הערות אישיות שלך |
| `admin_priority` | עדיפות פנימית |

---

## כתובות

| URL | מי רואה |
|-----|---------|
| `yoursite.netlify.app/` | כולם |
| `yoursite.netlify.app/admin/` | רק אתה (לא מקושר, noindex) |
| `yoursite.netlify.app/api/hotels` | כולם (נתונים מסוננים) |
| `yoursite.netlify.app/api/admin` | רק עם סיסמה |

---

## פיתוח מקומי

```bash
# צור .env בתיקיית הפרויקט:
GOOGLE_SHEET_ID=your-sheet-id
GOOGLE_SHEET_GID=0
ADMIN_USERNAME=admin
ADMIN_PASSWORD=localdev
APPS_SCRIPT_WEBHOOK_URL=  # אופציונלי

npm install -g netlify-cli
netlify dev
# → http://localhost:8888
# → http://localhost:8888/admin/
```
