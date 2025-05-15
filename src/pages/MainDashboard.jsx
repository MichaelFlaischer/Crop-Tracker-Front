export function MainDashboard() {
  return (
    <section className='main-dashboard'>
      <h1>ברוכים הבאים למערכת FarmERP</h1>
      <p className='description'>מערכת לניהול חקלאות חכמה – כולל ניהול מלאי, שדות, גידולים, עובדים, לקוחות ודוחות ניתוח.</p>

      <section className='features'>
        <h3>מה תוכלו לעשות במערכת:</h3>
        <ul>
          <li>
            <span className='emoji'>📦</span> לנהל מלאי ומחסנים
          </li>
          <li>
            <span className='emoji'>🌱</span> לעקוב אחרי שדות ויבולים
          </li>
          <li>
            <span className='emoji'>👩‍🌾</span> לשבץ ולעקוב אחרי עובדים
          </li>
          <li>
            <span className='emoji'>📊</span> להפיק דוחות עסקיים ותחזיות
          </li>
        </ul>
      </section>
    </section>
  )
}
