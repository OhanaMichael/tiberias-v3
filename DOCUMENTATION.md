# תיעוד מלא - פורטל מלונות טבריה (tiberias-v3)

**גרסה:** 1.0.0 | **עודכן לאחרונה:** מאי 2026 | **מחבר:** ITMO / Michael Ohana

---

## תוכן עניינים

1. [סקירה כללית](#1-סקירה-כללית)
2. [ארכיטקטורה וסביבה טכנולוגית](#2-ארכיטקטורה-וסביבה-טכנולוגית)
3. [מבנה תיקיות ו-Repository](#3-מבנה-תיקיות-ו-repository)
4. [עמודי האתר - תיאור מלא](#4-עמודי-האתר)
5. [מערכת הבלוג](#5-מערכת-הבלוג)
6. [מערכת מלונות - API ונתונים](#6-מערכת-מלונות)
7. [Netlify Functions - Backend](#7-netlify-functions)
8. [תהליך Build ו-Deploy](#8-תהליך-build-ו-deploy)
9. [GitHub Actions - אוטומציה](#9-github-actions)
10. [SEO - הגדרות ואופטימיזציה](#10-seo)
11. [Google Search Console](#11-google-search-console)
12. [ניהול ותחזוקה שוטפת](#12-ניהול-ותחזוקה)
13. [הוספת תוכן חדש](#13-הוספת-תוכן-חדש)
14. [פרטי גישה וכניסה למערכות](#14-פרטי-גישה)
15. [פתרון בעיות נפוצות](#15-פתרון-בעיות)
16. [היסטוריית שינויים עיקריים](#16-היסטוריית-שינויים)

---

## 1. סקירה כללית

### מה האתר?

פורטל מלונות טבריה הוא אתר סטטי (HTML/CSS/JS בלבד) המשמש כמדריך הזמנות חדרי מלון בטבריה. האתר מפנה אורחים לאתרי הזמנות רשמיים של המלונות (בוקינג.com ודומים) וכולל בלוג תוכן שמשפר קידום ב-Google.

### קישורים חשובים

| מערכת | URL |
| --- | --- |
| אתר חי | https://www.hotels-tiberias.co.il |
| GitHub Repository | https://github.com/OhanaMichael/tiberias-v3 |
| Netlify Dashboard | https://app.netlify.com/projects/hotels-tiberias |
| Google Search Console | https://search.google.com/search-console |
| GitHub Actions | https://github.com/OhanaMichael/tiberias-v3/actions |

---

## 2. ארכיטקטורה וסביבה טכנולוגית

### סטק טכנולוגי

| רכיב | טכנולוגיה | תפקיד |
| --- | --- | --- |
| Frontend | HTML5 + CSS3 + Vanilla JS | פרונטאנד - אפס frameworks |
| Hosting | Netlify | אירוח ו-CDN גלובלי |
| Backend Functions | Netlify Functions (Node.js 18) | Serverless API |
| Database / Data | Google Sheets + JSON סטטי | נתוני מלונות |
| Analytics | Supabase | מעקב קליקים על מלונות |
| Build System | Node.js + build-blog.js | בניית קבצי blog ל-HTML |
| Version Control | Git + GitHub | קוד והיסטוריה |
| CI/CD | GitHub Actions + Netlify Auto-Deploy | פרסום אוטומטי |
| Images | WebP + JPG (sharp library) | תמונות מודחסות |
| Domain | .co.il (דומיין ישראלי) | www.hotels-tiberias.co.il |

### תלותייסות (Dependencies)

**תלותייות ייצור (dependencies):**
- `@supabase/supabase-js ^2.100.0` - חיבור ל-Supabase למעקב קליקים
- `axios ^1.15.0` - בקשות HTTP (סקריפט עדכון משיט)

**תלותייות פיתוח (devDependencies):**
- `sharp ^0.34.5` - דחיסות ועיבוד תמונות (compress-images.js)

---

## 3. מבנה תיקיות ו-Repository

```
tiberias-v3/
├── .github/
│   └── workflows/
│       └── update-hotels.yml      # GitHub Action - עדכון יומי אוטומטי
├── content/
│   └── blog/                          # קבצי Markdown - מקור בלוג
│       ├── 2026-03-17-10-things-to-do-in-tiberias.md
│       ├── 2026-03-19-tiberias-beaches-water-parks.md
│       ├── 2026-03-21-tiberias-restaurants-guide.md
│       ├── 2026-03-23-tiberium-light-water-show.md
│       ├── 2026-03-24-roman-theater-tiberias.md
│       ├── 2026-03-25-jewish-heritage-tiberias.md
│       ├── 2026-03-26-vacation-with-dog-tiberias.md
│       └── 2026-03-27-tiberias-promenade-guide.md
├── netlify/
│   └── functions/
│       ├── get-analytics.js               # Netlify Function - קריאת נתוני Supabase
│       └── track-click.js                 # Netlify Function - רישום קליק על מלון
├── public/                            # כל הקבצים של Netlify מפרסם
│   ├── api/
│   │   └── hotels.json                    # נתוני מלונות JSON סטטי
│   ├── images/                        # תמונות מלונות (WebP + JPG)
│   ├── blog/                          # קבצי HTML של מאמרי בלוג
│   │   ├── index.html                     # דף רשימת בלוג
│   │   ├── 10-things-to-do-in-tiberias/index.html
│   │   ├── tiberias-beaches-water-parks/index.html
│   │   ├── tiberias-restaurants-guide/index.html
│   │   ├── tiberium-light-water-show-tiberias/index.html
│   │   ├── roman-theater-tiberias-archeological-site/index.html
│   │   ├── jewish-heritage-tiberias-holy-sites/index.html
│   │   ├── vacation-with-dog-tiberias-pet-boarding/index.html
│   │   └── tiberias-promenade-guide/index.html
│   ├── about/index.html               # דף אודות
│   ├── advertise/index.html           # דף פרסום
│   ├── contact/index.html             # דף צור קשר
│   ├── faq/index.html                 # שאלות נפוצות
│   ├── hotels-boutique-tiberias/index.html
│   ├── hotels-family-tiberias/index.html
│   ├── hotels-spa-tiberias/index.html
│   ├── privacy/index.html             # פרטיות
│   ├── terms/index.html               # תנאי שימוש
│   ├── index.html                     # דף בית
│   ├── sitemap.xml                    # Sitemap ל-Google
│   └── robots.txt                     # הוראות ל-Googlebot
├── scripts/
│   └── download-images.js             # הורדת תמונות מ-Google Sheets
├── .gitignore
├── apps-script.gs                     # Google Apps Script - ניהול גיליון
├── blog-post-template.html            # תבנית HTML למאמרי בלוג
├── build-blog.js                      # סקריפט build ראשי
├── compress-images.js                 # דחיסות תמונות
├── netlify.toml                       # הגדרות Netlify
└── package.json                       # תלותייות Node.js
```

---

## 4. עמודי האתר

### 4.1 דף בית - `/`

**URL:** https://www.hotels-tiberias.co.il/
**קובץ:** `public/index.html`
**תוכן:**
- כותרת: "מלונות בטבריה | הזמנה ישירה על הכנרת 2026"
- רשימת מלונות הנטענת דינמית מקובץ hotels.json
- סנני סינון: כל המלונות, מלונות בוטיק, מלונות ספא, מלונות משפחתיים, בלוג
- כרטיסיית מלון: שם, תיאור, כתובת, מספר חדרים, כשרות, דירוג, מחיר מתחיל, ציון בוקינג, כפתור הזמנה
- סכריפט JS טוען את המלונות מ-`/api/hotels` (מופנה ל-hotels.json)
- קליק על "הזמן עכשו" קורא ל-`/api/track-click` ומפנה לאתר הבוקינג של המלון

### 4.2 קטגוריית מלונות

| קטגוריה | URL | קובץ |
| --- | --- | --- |
| מלונות בוטיק | /hotels-boutique-tiberias/ | public/hotels-boutique-tiberias/index.html |
| מלונות ספא | /hotels-spa-tiberias/ | public/hotels-spa-tiberias/index.html |
| מלונות משפחתיים | /hotels-family-tiberias/ | public/hotels-family-tiberias/index.html |

### 4.3 עמודי תוך

| עמוד | URL | קובץ | תיאור |
| --- | --- | --- | --- |
| אודות | /about/ | public/about/index.html | אודות הפורטל |
| פרסום | /advertise/ | public/advertise/index.html | אפשרויות פרסום |
| צור קשר | /contact/ | public/contact/index.html | טופס יצירת קשר |
| שאלות נפוצות | /faq/ | public/faq/index.html | שאלות ותשובות |
| פרטיות | /privacy/ | public/privacy/index.html | מדיניות פרטיות |
| תנאי שימוש | /terms/ | public/terms/index.html | תנאי שימוש באתר |

---

## 5. מערכת הבלוג

### איך הבלוג עובד?

מערכת הבלוג מבוססת על קבצי Markdown בתיקיית `content/blog/` שמומרים ל-HTML בזמן build באמצעות סקריפט `build-blog.js`.

**זרימת עבודה:**
1. כותבים מאמר חדש ב-`content/blog/YYYY-MM-DD-slug.md` עם Front Matter ב-YAML
2. Netlify מריץ `node build-blog.js` בזמן ה-deploy
3. `build-blog.js` קורא כל קובץ .md וממיר עליו את התבנית `blog-post-template.html`
4. הקובץ המומר נשמר ב-`public/blog/[slug]/index.html`
5. `build-blog.js` גם מעדכן אוטומטית את `public/blog/index.html` (רשימת הבלוג)

### מבנה קובץ Markdown (Front Matter)

```yaml
---
title: "כותרת המאמר"
date: "2026-03-17"
author: "שם הכותב"
category: "קטגוריה"
tags: ["תגית1", "תגית2"]
image: "/images/my-image.webp"
description: "תיאור קצר ל-meta description"
---

תוכן המאמר ב-Markdown כאן...
```

### מאמרי בלוג קיימים

| כותרת | URL | תאריך |
| --- | --- | --- |
| 10 דברים לעשות בטבריה | /blog/10-things-to-do-in-tiberias/ | 17.3.2026 |
| חופי ופארקי מים | /blog/tiberias-beaches-water-parks/ | 19.3.2026 |
| מדריך מסעדות | /blog/tiberias-restaurants-guide/ | 21.3.2026 |
| מערות Tiberium | /blog/tiberium-light-water-show-tiberias/ | 23.3.2026 |
| התיאטרון הרומאי | /blog/roman-theater-tiberias-archeological-site/ | 24.3.2026 |
| מורשת יהודית | /blog/jewish-heritage-tiberias-holy-sites/ | 25.3.2026 |
| חופשה עם כלב | /blog/vacation-with-dog-tiberias-pet-boarding/ | 26.3.2026 |
| טיילת הנדבה | /blog/tiberias-promenade-guide/ | 27.3.2026 |

---

## 6. מערכת מלונות

### קובץ hotels.json

ניתן ל-`public/api/hotels.json`. מכיל מערך JSON של כל המלונות. האתר טוען אותו ב- JavaScript בדף הבית.

**מבנה אובייקט מלון ב-hotels.json:**

```json
{
  "id": "unique-hotel-id",
    "name": "שם המלון",
      "description": "תיאור קצרצר",
        "address": "כתובת",
          "rooms": 48,
            "stars": 4,
              "kosher": true,
                "pool": true,
                  "restaurant": true,
                    "bar": true,
                      "parking": true,
                        "wifi": true,
                          "spa": false,
                            "family": false,
                              "boutique": true,
                                "rating": 8.4,
                                  "reviews": 146,
                                    "price_from": 650,
                                      "booking_url": "https://www.booking.com/...",
                                        "image": "/images/hotel-name.webp",
                                          "image_jpg": "/images/hotel-name.jpg",
                                            "category": "boutique"
                                            }
                                            ```

                                            ### עדכון נתוני מלונות

                                            נתוני המלונות מנוהלים ב-**Google Sheets**. הסקריפט `scripts/download-images.js` מוריד תמונות ומעדכן נתונים אוטומטית דרך GitHub Actions.

                                            **לעדכון מלון ידנית:**
                                            1. פתח `public/api/hotels.json` ב-VS Code או דרך הגיתהב (https://github.com/OhanaMichael/tiberias-v3/blob/main/public/api/hotels.json)
                                            2. ערוך את הנתונים (הוסף/עדכון/מחק מלון)
                                            3. Commit + Push ל-main ⇒ Netlify יפרסם אוטומטי

                                            ---

                                            ## 7. Netlify Functions

                                            קיימות 2 Netlify Functions (serverless) בתיקיית `netlify/functions/`:

                                            ### track-click.js

                                            **Endpoint:** `POST /.netlify/functions/track-click` (מופנה ל: `/api/track-click`)
                                            **תפקיד:** רישום קליק על כפתור ההזמנה בטבלת Supabase למטרות אנליטיקה
                                            **Body:** `{ hotel_id, hotel_name, timestamp }`
                                            **משתני סביבה נדרשים:** `SUPABASE_URL`, `SUPABASE_KEY`

                                            ### get-analytics.js

                                            **Endpoint:** `GET /.netlify/functions/get-analytics` (מופנה ל: `/api/analytics`)
                                            **תפקיד:** קריאת נתוני קליקים מטבלת Supabase לדשבורד אדמין
                                            **עימוד Admin:** ניתן לגשת אל /admin/ (חסום ב-robots.txt, לא מוסף ל-Google)
                                            **משתני סביבה נדרשים:** `SUPABASE_URL`, `SUPABASE_KEY`

                                            ---

                                            ## 8. תהליך Build ו-Deploy

                                            ### קובץ netlify.toml

                                            ```toml
                                            [build]
                                              command = "node build-blog.js"    # פקודת build
                                                publish = "public"                # תיקיית פרסום
                                                  functions = "netlify/functions"   # תיקיית functions
                                                  [build.environment]
                                                    NODE_VERSION = "18"               # גרסת Node.js

                                                    [[redirects]]                       # /api/hotels מופנה ל-JSON סטטי
                                                      from = "/api/hotels"
                                                        to = "/api/hotels.json"
                                                          status = 200
                                                            force = true

                                                            [[redirects]]                       # /api/* מופנה ל-Functions
                                                              from = "/api/*"
                                                                to = "/.netlify/functions/:splat"
                                                                  status = 200

                                                                  [[headers]]                         # כותרות אבטחה לכל הדפים
                                                                    for = "/*"
                                                                      [headers.values]
                                                                          X-Frame-Options = "DENY"
                                                                              X-XSS-Protection = "1; mode=block"
                                                                                  X-Content-Type-Options = "nosniff"

                                                                                  [[headers]]                         # Cache ל-blog (1 שעה)
                                                                                    for = "/blog/*"
                                                                                      [headers.values]
                                                                                          Cache-Control = "public, max-age=3600"
                                                                                          ```

                                                                                          ### זרימת Deploy

                                                                                          1. Push ל-`main` branch ב-GitHub
                                                                                          2. Netlify מזהה את ה-push אוטומטית
                                                                                          3. Netlify מריץ `node build-blog.js` (Build command)
                                                                                          4. כל תיקיית `public/` מפורסמת
                                                                                          5. האתר החי מתעדכן ב~2-3 דקות
                                                                                          6. מעקב Build: https://app.netlify.com/projects/hotels-tiberias/deploys

                                                                                          ### ביצוע Build מקומי

                                                                                          ```bash
                                                                                          # בתיקיית הפרוייקט
                                                                                          git clone https://github.com/OhanaMichael/tiberias-v3.git
                                                                                          cd tiberias-v3
                                                                                          npm install
                                                                                          node build-blog.js       # בניית בלוג

                                                                                          # לפיתוח מקומי עם Netlify CLI:
                                                                                          npm install -g netlify-cli
                                                                                          netlify dev              # יפעיל ב http://localhost:8888
                                                                                          ```

                                                                                          ---

                                                                                          ## 9. GitHub Actions

                                                                                          ### update-hotels.yml

                                                                                          **נתיב:** `.github/workflows/update-hotels.yml`
                                                                                          **תזמונות:** כל יום ב-05:00 UTC (08:00 שעון ישראל) + אפשרות הפעלה ידנית

                                                                                          **מה ה-Action עושה:**
                                                                                          1. Checkout לקוד ה-repository
                                                                                          2. התקנת Node.js 18 ו-npm install
                                                                                          3. הרץ `scripts/download-images.js` עם `continue-on-error: true`
                                                                                          4. אם יש שינויים - Commit ו-Push אוטומטי ב-"Auto-update hotels from Google Sheets"

                                                                                          **Secrets נדרשים ב-GitHub:**
                                                                                          - `PAT_TOKEN` - Personal Access Token ל-GitHub (push ל-repo)
                                                                                          - `GOOGLE_SHEETS_API_KEY` - API Key ל-Google Sheets (קריאת הגיליון)

                                                                                          **הפעלה ידנית:** כנסו ל: https://github.com/OhanaMichael/tiberias-v3/actions/workflows/update-hotels.yml ולחצו על כפתור "Run workflow"

                                                                                          ---

                                                                                          ## 10. SEO

                                                                                          ### דומיין ראשי

                                                                                          **`https://www.hotels-tiberias.co.il`** - זהו הדומיין הראשי והיחיד. כל URL באתר חייב לכלול את www.

                                                                                          ### sitemap.xml

                                                                                          **נתיב:** `public/sitemap.xml`
                                                                                          **URL:** https://www.hotels-tiberias.co.il/sitemap.xml
                                                                                          מכיל 19 URLs - כל דפי האתר + כל מאמרי בלוג. כל URL בפורמט: `https://www.hotels-tiberias.co.il/...`

                                                                                          ### robots.txt

                                                                                          ```
                                                                                          User-agent: *
                                                                                          Disallow: /admin/        # חסימת דף האדמין
                                                                                          Allow: /

                                                                                          Sitemap: https://www.hotels-tiberias.co.il/sitemap.xml
                                                                                          ```

                                                                                          ### Canonical Tags

                                                                                          כל דף מכיל `<link rel="canonical" href="https://www.hotels-tiberias.co.il/...">` מדויק. **חשוב:** canonical חייב תמיד לכלול www.

                                                                                          ### Open Graph ו-hreflang

                                                                                          כל דף מכיל:
                                                                                          - `<meta property="og:url" content="https://www.hotels-tiberias.co.il/...">` - לשיתוף ברשתות חברתיות
                                                                                          - `<link rel="alternate" hreflang="he" href="https://www.hotels-tiberias.co.il/...">` - לגוגל לדעת השפה

                                                                                          ### הוספת URL ל-sitemap.xml

                                                                                          כאשר מוסיפים דף חדש, יש להוסיף את ה-URL ל-`public/sitemap.xml`:

                                                                                          ```xml
                                                                                          <url>
                                                                                            <loc>https://www.hotels-tiberias.co.il/new-page/</loc>
                                                                                              <lastmod>2026-05-06</lastmod>
                                                                                                <changefreq>monthly</changefreq>
                                                                                                  <priority>0.7</priority>
                                                                                                  </url>
                                                                                                  ```

                                                                                                  ---

                                                                                                  ## 11. Google Search Console

                                                                                                  **Property:** `sc-domain:hotels-tiberias.co.il`
                                                                                                  **URL Console:** https://search.google.com/search-console/index?resource_id=sc-domain%3Ahotels-tiberias.co.il

                                                                                                  ### בעיות שתוקנו (מאי 2026)

                                                                                                  | בעיה | מספר דפים | סיבה | פתרון |
                                                                                                  | --- | --- | --- | --- |
                                                                                                  | שגיאת הפנייה | 6 | URL עם פריפיקס כפול | canonical בלא www גרם פנייה פניםית |
                                                                                                  | דף חלופי עם תג קנוני | 1 | דף בית | תוקן |
                                                                                                  | נסרק אך לא נכלל | 9 | canonical בלא www | תוקן |
                                                                                                  | נסרק לא נכלל כרגע | 1 | בלוג vacation-with-dog | תוקן |
                                                                                                  | נחסם robots.txt | 1 | /admin/ | מותכוון (שירותי) |

                                                                                                  ### פעולות שבוצעו לתיקון

                                                                                                  עדכון מאי 2026: Commit `189f1ac` - עדכון כל 175 הופעות ב-31 קבצים מ-`hotels-tiberias.co.il` ל-`www.hotels-tiberias.co.il`.

                                                                                                  ### שליחת Sitemap

                                                                                                  Search Console ⇒ Sitemaps ⇒ הגש `https://www.hotels-tiberias.co.il/sitemap.xml`

                                                                                                  ### בקשת אינדוקס

                                                                                                  Search Console ⇒ בדיקת URL ⇒ הדבק URL ⇒ לחץ "בקש אינדוקס" לכל דף שלא נוסף

                                                                                                  ---

                                                                                                  ## 12. ניהול ותחזוקה

                                                                                                  ### משימות תחזוקה שוטפות

                                                                                                  | משימה | תדירות | איך |
                                                                                                  | --- | --- | --- |
                                                                                                  | עדכון מלונות | אוטומטי יומי | GitHub Actions + Google Sheets |
                                                                                                  | מעקב SEO | שבועי | Google Search Console |
                                                                                                  | בדיקת Deploy | אחרי כל Push | Netlify Deploys Dashboard |
                                                                                                  | עדכון בלוג | לפי צורך | הוספת .md + Push |
                                                                                                  | Sync מקומי | אחרי שינויים | `git pull origin main` |
                                                                                                  | בדיקת Analytics | שבועי | /admin/ Dashboard |

                                                                                                  ### סינך קוד מקומי

                                                                                                  תיקיית פרוייקט מקומית: `C:\Users\micky\OneDrive\מסמכים\עסקי\ניהול פרוייקטים\פורטל בתי מלון\tiberias-v3`

                                                                                                  כדי לסנך שינויים מ-GitHub למחשב המקומי:

                                                                                                  ```bash
                                                                                                  cd "C:\Users\micky\OneDrive\מסמכים\עסקי\ניהול פרוייקטים\פורטל בתי מלון\tiberias-v3"
                                                                                                  git pull origin main
                                                                                                  ```

                                                                                                  ---

                                                                                                  ## 13. הוספת תוכן חדש

                                                                                                  ### הוספת מאמר בלוג

                                                                                                  1. צור קובץ `content/blog/YYYY-MM-DD-slug.md`
                                                                                                  2. הוסף Front Matter (ראה דוגמה לעיל)
                                                                                                  3. כתוב תוכן ב-Markdown
                                                                                                  4. הוסף תמונה מתאימה ל-`public/images/` (מומלץ WebP)
                                                                                                  5. הוסף URL ל-`public/sitemap.xml`
                                                                                                  6. Commit + Push ⇒ Netlify יריץ `build-blog.js` ויצור HTML אוטומטי
                                                                                                  7. לאחר פרסום - בקש אינדוקס ב-Google Search Console

                                                                                                  ### הוספת מלון חדש

                                                                                                  1. פתח `public/api/hotels.json`
                                                                                                  2. הוסף אובייקט JSON חדש למערך (ראה מבנה לעיל)
                                                                                                  3. הוסף תמונה ל-`public/images/` (WebP + JPG)
                                                                                                  4. Commit + Push

                                                                                                  ---

                                                                                                  ## 14. פרטי גישה

                                                                                                  ### חשבונות ומערכות

                                                                                                  | מערכת | משתמש | איך לגשת |
                                                                                                  | --- | --- | --- |
                                                                                                  | GitHub | OhanaMichael | https://github.com/OhanaMichael/tiberias-v3 |
                                                                                                  | Netlify | micky.ohana@gmail.com | https://app.netlify.com/projects/hotels-tiberias |
                                                                                                  | Google Search Console | micky.ohana@gmail.com | https://search.google.com/search-console |
                                                                                                  | Supabase | (לפי הגדרות סביבה) | משתני סביבה ב-Netlify |

                                                                                                  ### משתני סביבה Netlify (נדרשים)

                                                                                                  | משתנה | תיאור |
                                                                                                  | --- | --- |
                                                                                                  | `SUPABASE_URL` | URL חשבון ה-Supabase |
                                                                                                  | `SUPABASE_KEY` | anon/service_role key של Supabase |
                                                                                                  | `GOOGLE_SHEETS_API_KEY` | API Key לקריאת Google Sheets (מאוחסן ב-GitHub Secrets) |

                                                                                                  ### משתני סביבה GitHub Secrets (נדרשים ל-Actions)

                                                                                                  | Secret | תיאור |
                                                                                                  | --- | --- |
                                                                                                  | `PAT_TOKEN` | Personal Access Token לפעולות Git push אוטומטיות |
                                                                                                  | `GOOGLE_SHEETS_API_KEY` | API Key לקריאת הגיליון |

                                                                                                  > **אזהרה:** אל לשמור את ה-PAT_TOKEN בקובץ בתוך ה-Repository! חייב להיות רק ב-GitHub Secrets.

                                                                                                  ---

                                                                                                  ## 15. פתרון בעיות

                                                                                                  ### האתר לא התעדכן אחרי Push

                                                                                                  1. בדוק https://app.netlify.com/projects/hotels-tiberias/deploys
                                                                                                  2. אם ה-Build נכשל - קרא את לוג ה-Build
                                                                                                  3. סיבות נפוצות: שגיאת תחביר ב-build-blog.js, קובץ .md עם שגיאה ב YAML

                                                                                                  ### המלונות לא מופיעים בדף הבית

                                                                                                  1. בדוק https://www.hotels-tiberias.co.il/api/hotels (חייב להחזיר JSON)
                                                                                                  2. בדוק שקובץ `public/api/hotels.json` קיים ו-וולידי
                                                                                                  3. בדוק Console בדפדפן לשגיאות JS

                                                                                                  ### בלוג לא מופיע אחרי הוספת מאמר

                                                                                                  1. בדוק את לוג ה-build ב-Netlify
                                                                                                  2. בדוק Front Matter - נקודתיים כפולות, פיסוקים לא נכונים
                                                                                                  3. בדוק שה-slug בשם הקובץ תואם לניסון (אותיות קטנות, מקפות ביניים)

                                                                                                  ### בעיות עם Supabase / Analytics

                                                                                                  1. בדוק שמשתני `SUPABASE_URL` ו-`SUPABASE_KEY` מוגדרים ב-Netlify Environment
                                                                                                  2. בדוק לוג Function ב-Netlify

                                                                                                  ### GitHub Actions נכשל

                                                                                                  1. בדוק את לוג ה-Action ב: https://github.com/OhanaMichael/tiberias-v3/actions
                                                                                                  2. סיבות: API Key לא תקף, Google Sheets לא זמין, PAT_TOKEN פג, שגיאת רשת
                                                                                                  3. הערה: ה-Action מוגדר עם `continue-on-error: true` על שלב הסקריפט - לכן אפילו בכשל הוא לא מעצור את כל ה-Actions
                                                                                                  ---

                                                                                                  ## 16. היסטוריית שינויים עיקריים

                                                                                                  | תאריך | Commit | תיאור |
                                                                                                  | --- | --- | --- |
                                                                                                  | מרץ 2026 | ראשוני | יצירת ה-Repository והאתר הסטטי |
                                                                                                  | אפריל 2026 | 2344591 | Redirect /api/hotels ל-JSON סטטי |
                                                                                                  | אפריל 2026 | 20d7097 | הוספת תמונות מלונות מקומיות (WebP + JPG) |
                                                                                                  | מאי 2026 | 99296dd | continue-on-error ל-GitHub Actions |
                                                                                                  | מאי 2026 | **189f1ac** | **SEO: עדכון כל 175 URLs ל-www.hotels-tiberias.co.il** |

                                                                                                  ---

                                                                                                  ## קישורים מרכזיים

                                                                                                  | שם | קישור |
                                                                                                  | --- | --- |
                                                                                                  | אתר חי | https://www.hotels-tiberias.co.il |
                                                                                                  | GitHub | https://github.com/OhanaMichael/tiberias-v3 |
                                                                                                  | Netlify | https://app.netlify.com/projects/hotels-tiberias |
                                                                                                  | Netlify Deploys | https://app.netlify.com/projects/hotels-tiberias/deploys |
                                                                                                  | Netlify Functions | https://app.netlify.com/projects/hotels-tiberias/functions |
                                                                                                  | Netlify Env Vars | https://app.netlify.com/projects/hotels-tiberias/configuration/env |
                                                                                                  | GitHub Actions | https://github.com/OhanaMichael/tiberias-v3/actions |
                                                                                                  | GitHub Secrets | https://github.com/OhanaMichael/tiberias-v3/settings/secrets/actions |
                                                                                                  | Search Console | https://search.google.com/search-console |
                                                                                                  | Sitemap | https://www.hotels-tiberias.co.il/sitemap.xml |
                                                                                                  | robots.txt | https://www.hotels-tiberias.co.il/robots.txt |
                                                                                                  | API Hotels | https://www.hotels-tiberias.co.il/api/hotels |

                                                                                                  ---

                                                                                                  *תיעוד זה נוצר במאי 2026 על ידי סקירה מלאה של כל הרכיבים והמערכות בפרוייקט לצורך מתן תיעוד מלא לפרוייקט.*