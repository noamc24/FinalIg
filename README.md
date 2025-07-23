# FinalIg
 הוראות להפעלת פרויקט
ודא שיש לך Node.js מותקן

ודא שיש לך MongoDB מותקן

פתח טרמינל בתיקייה של הפרויקט והתקן את התלויות:

bash: npm install

שחזר את מסד הנתונים מתוך הגיבוי (אם אתה משתמש ב־Mongo בענן, שנה את ה-URI בהתאם):
bash: mongorestore --uri="mongodb://localhost:27017/" finalIg-backup

הפעל את השרת:
bash: node app.js

היכנס לדפדפן:
http://localhost:3000

!ברוך הבא לאינסטגרם שלנו