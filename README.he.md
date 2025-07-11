
# רוית דבוש – האתר האישי שלי ומרחב הפיתוח היצירתי 🌸

ברוכה הבאה לריפו שמפעיל את האתר האישי שלי — מרחב שמשלב עיצוב, קוד וזהות לכדי יצירה מתפתחת אחת.

זה לא סתם אתר פורטפוליו.
זהו מערכת חיה ומביעת זהות שמייצגת את מי שאני:
מפתחת פרונטאנד, חושבת יצירתית, ומעצבת של חוויות וקוד כאחד.

הוא מסודר. הוא ניתן להרחבה. וכן, הוא גם קצת מנצנץ ✨

---

## 👩‍💻 מי אני?

אני רוית דבוש — מפתחת פרונטאנד נלהבת שאוהבת קוד נקי, חוויית משתמש עמוקה, ועקרונות עיצוב מדויקים.
אני לא רק כותבת קוד — אני **חיה אותו**.

הפרויקט הזה אישי. כל קומפוננטה בו משקפת את הסטנדרטים והערכים שלי — מטיפוגרפיה מדויקת ועד אייקונים שנבחרו בקפידה.
הוא משלב רגש, דיוק וכוונה.

---

## 📁 סקירה כללית

אתר פורטפוליו דו־לשוני, בעבודת יד, המציג את המסע שלי כמפתחת פרונטאנד.
נבנה בקפדנות באמצעות Next.js, TypeScript ו־SCSS, והוא משקף את הרגישות העיצובית שלי, העומק הטכנולוגי ותשומת הלב לחוויית המשתמש.

האתר הזה הוא הרבה מעבר לפורטפוליו – הוא מערכת מבוססת קומפוננטות ומתועדת היטב, שממחישה איך אני בונה, מתעדת וחושבת כמפתחת.

הוא כולל:
- מערכת עיצוב מותאמת אישית
- Style Guide חי ומתעדכן
- ניתוב דינמי ותמיכה בשפות מרובות עם next-intl
- התאמות לנגישות
- ארכיטקטורת פרויקט מסודרת
- תהליכי עבודה מקצועיים עם Git + Jira

---

## 🧱 מבנה הפרויקט
```
Ravit-Dabush/
├─ 📁 docs/                 → תיעוד טכני של הפרויקט
├─ 📁 messages/             → קבצי תרגום לפי שפה וקומפוננטה
├─ 📁 public/               → נכסים סטטיים (תמונות, אייקונים, favicon וכו') שלא עוברים עיבוד
├─ 📁 scripts/              → סקריפטים שימושיים (למשל: יצירת אייקונים, עיצוב קובצי JSON)
├─ 📁 src/                  → קוד המקור העיקרי של האפליקציה
│  ├─ 📁 app/               → App Router של Next.js כולל ניתוב לפי שפה
│  ├─ 📁 assets/            → נכסים גולמיים (למשל SVGים מוטמעים, משאבים גרפיים)
│  ├─ 📁 components/        → קומפוננטות UI חוזרות, כל אחת בתיקייה משלה
│  ├─ 📁 i18n/              → קובצי קונפיגורציה של `next-intl` וכלי לוקליזציה
│  ├─ 📁 lib/               → פונקציות עזר, מעבדי נתונים, hooks לוגיים
│  ├─ 📁 pages/             → תמיכה אופציונלית ב־Pages Router (אם בשימוש לצד App Router)
│  ├─ 📁 styles/            → מבנה SCSS גלובלי (base, reset, mixins, tokens)
│  ├─ 📁 utils/             → פונקציות עזר קטנות (למשל: עיצוב ערכים, קבועים)
├─ 📄 README.md             → תיאור כללי של הפרויקט באנגלית
├─ 📄 README.he.md          → תיאור כללי של הפרויקט בעברית
├─ 📄 LICENSE               → רישיון מותאם אישית המגביל שימוש חוזר
```
---

## 🔄 תהליך הפיתוח
ניהול המשימות בפרויקט מתבצע באמצעות Jira עם חיבור ישיר ל־GitHub.
לכל משימה מזהה ייחודי (למשל RD-13), שמתועד לאורך כל הדרך:
- ענפים בגיט: feature/RD-13-component-name
- קומיטים: feat: create button component [RD-13]
- Pull Requests: מכילים את מזהה המשימה ומקושרים ישירות ל־Jira
- כל פיצ’ר משמעותי שייך ל־Epic מוגדר.

---

## 🛠 טכנולוגיות
- Framework: Next.js 15 (App Router)
- שפה: TypeScript
- עיצוב: SCSS (מערכת עיצוב מרכזית עם טוקנים, mixins וחוקים גלובליים)
- i18n: next-intl
- ניהול גרסאות: Git + GitHub (עם קומיטים קונבנציונליים)
- ניהול משימות: Jira (חלוקה לפי אפיקים)
- תוספים ל־VSCode: Prettier, ESLint, i18n Ally

---

## 💬 שפות נתמכות:

- עברית (RTL)
- אנגלית (LTR)

---

## ⚖️ רישיון
הפרויקט הזה **אינו קוד פתוח**.
מותר לעיין בו וללמוד ממנו, אך **שימוש חוזר או התאמה של הקוד – אינם מורשים**.
לפרטים המלאים בדק את [LICENSE](./LICENSE).

---

## 🗂️ מסמכי תיעוד נוספים
- 📘 dev.md — סביבת פיתוח, Git conventions, כלי עבודה
- 🏛 architecture.md — סקירה ארכיטקטונית, החלטות ושיקולים
- 🎨 design-system.md — טוקנים, מבנה SCSS, ו־Style Guide
- 🌍 i18n.md — פירוט על תרגום באמצעות next-intl
- ⚙️ accessibility.md — נגישות: ARIA, מקלדת, ותמיכה במסכים קוראי־מסך

> המסמכים האלו מתפתחים יחד עם הפרויקט. שום דבר כאן לא קבוע – הכל חי ונושם.

---

## 🤍 סיום אישי

זה לא רק קוד – זו השתקפות שלי.
ככל שאני מתפתחת, כך גם הפרויקט הזה.
מוזמנים לעיין, ללמוד – ואולי גם להרגיש משהו.

נכתב באהבה, עם Sass, וכנראה עם קצת יותר מדי טיקטים ב־Jira 💜