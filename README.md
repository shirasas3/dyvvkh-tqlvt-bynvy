# דיווח תקלות בינוי

אתר React (Vite) עצמאי, בעברית, מימין לשמאל. הלוח המשותף נשמר ב־Supabase (חינמי), בלי שרת משלך ובלי Replit.

## הרצה במחשב
```
npm install
cp .env.example .env     # ולמלא את הערכים
npm run dev
```

## הקמה (פעם אחת)

### 1. הלוח המשותף (Supabase)
1. נכנסים ל־supabase.com, פותחים פרויקט חדש (חינמי).
2. SQL Editor ← New query ← מדביקים את `supabase-setup.sql` ← Run.
3. Project Settings ← API: מעתיקים את **Project URL** ואת מפתח ה־**anon / publishable**.

### 2. התראות במייל (אופציונלי, EmailJS)
1. נכנסים ל־emailjs.com, מחברים שירות מייל (Email Services).
2. יוצרים Template. בשדה To Email כותבים את הכתובת שמקבלת התראות. בתוכן אפשר להשתמש ב־
   `{{action}}`, `{{issue_type}}`, `{{location}}`, `{{reporter_name}}`, `{{status}}`.
3. מעתיקים את Service ID, Template ID ואת ה־Public Key (Account ← General).

אם לא מגדירים EmailJS, האתר עובד כרגיל בלי התראות.

### 3. פרסום ב־GitHub Pages
1. מעלים את כל הקבצים ל־repository (כולל התיקייה `.github`).
2. Settings ← Pages ← Source: **GitHub Actions**.
3. Settings ← Secrets and variables ← Actions ← **Variables** ← מוסיפים:
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY` ובאופציונלי `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, `VITE_EMAILJS_PUBLIC_KEY`.
4. Actions ← מריצים מחדש את הפרסום (Re-run).

בלי משתני Supabase, האתר עובד במצב מקומי: התקלות נשמרות בדפדפן של המכשיר בלבד.

## חשוב לדעת
- המפתחות האלה גלויים בקוד האתר בכל מקרה, וזה בסדר: הם נועדו לזה. כמו באתר המקורי, כל מי שיש לו את הקישור יכול לצפות, להוסיף ולמחוק תקלות.
- תקלות קיימות מהאתר הישן אפשר להעביר דרך Table Editor ב־Supabase (Insert ← Import CSV).
