export function About() {
  return (
    <section className='about' style={{ padding: '0 1em' }}>
      <h2>אודות מערכת FarmERP</h2>

      <p>
        מערכת <strong>FarmERP</strong> פותחה כחלק מפרויקט הגמר לתואר ראשון בהנדסה תעשייה וניהול – התמחות במערכות מידע. המערכת נועדה לתת מענה כולל לניהול תהליכים
        חקלאיים ותפעוליים בעסק קטן, תוך דגש על ניהול מלאי, משימות, שדות, יבולים, עובדים והזמנות לקוח.
      </p>

      <h3>מטרות המערכת</h3>
      <ul>
        <li>לייעל את ניהול הפעילות היומיומית של העסק החקלאי</li>
        <li>לאפשר תיעוד ובקרה של תהליכים בשטח ובמחסן</li>
        <li>לאפשר ניתוח נתונים ותמיכה בקבלת החלטות</li>
      </ul>
      <h3>טכנולוגיות עיקריות</h3>
      <ul>
        <li>
          <strong>Frontend:</strong> <span dir='ltr'>React, React Router, Redux</span>
        </li>
        <li>
          <strong>Backend:</strong> <span dir='ltr'>Node.js, Express.js</span>
        </li>
        <li>
          <strong>Database:</strong> <span dir='ltr'>MongoDB Node.js Driver</span>
        </li>
        <li>
          <strong>UI:</strong> <span dir='ltr'>HTML5, CSS3, SCSS</span>
        </li>
        <li>
          <strong>שימוש ב API חיצוני:</strong> <span dir='ltr'>Weather API</span> לצורך המלצות זריעה, קציר והשקיה
        </li>
        <li>
          <strong>כלים נוספים:</strong> <span dir='ltr'>Google Maps API, Chart.js, Cloudinary, Render, Vercel</span>
        </li>
      </ul>

      <h3>צוות הפרויקט</h3>
      <p>
        הפיתוח המלא של המערכת – צד שרת, צד לקוח, API, ניהול נתונים, מערך הרשאות, דוחות, והאינטגרציות – בוצע על ידי <strong>מיכאל פליישר</strong>.
      </p>
      <p>
        ניתוח הצרכים, זיהוי בעיות תפעוליות בעסק החקלאי, ואיסוף הדרישות – בוצעו על ידי <strong>שיר עזרא</strong>.
      </p>

      <h3>החלטות תכנון</h3>
      <p>
        לאור מגבלות זמן ואופי העסק, הוחלט להתמקד בתהליכי ליבה ולהימנע מתוספות כמו ניתוחי תפוקה לעובדים, גרפים מתקדמים, או ייצוא PDF. המערכת נבנתה כך שתוכל
        להתרחב בעתיד לפיצ'רים אלו.
      </p>

      <h3>תודה וסיכום</h3>
      <p>
        אנו מודים לבעל העסק על שיתוף הפעולה לאורך הדרך, ולמנחי הפרויקט על ההכוונה. המערכת FarmERP מדגימה כיצד ניתן ליישם עקרונות הנדסה וניהול מערכות מידע לפתרון
        אתגרים בעולם החקלאות – בצורה פרקטית, מדויקת ומודולרית.
      </p>
    </section>
  )
}
