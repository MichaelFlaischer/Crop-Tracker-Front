import { FaTasks, FaRegClock, FaSeedling } from 'react-icons/fa'

export function WorkerDashboard() {
  return (
    <section className='worker-dashboard main-layout'>
      <h1>שלום וברוך הבא לעבודה! 👩‍🌾</h1>

      <section className='dashboard-cards'>
        <div className='card'>
          <FaTasks className='icon' />
          <h3>המשימות שלך להיום</h3>
          <ul>
            <li>✅ השקיה בשדה דרום</li>
            <li>✅ איסוף יבול - חממה 3</li>
            <li>🕓 דישון חלקה 4 (בשעה 16:00)</li>
          </ul>
        </div>

        <div className='card'>
          <FaRegClock className='icon' />
          <h3>נוכחות</h3>
          <p>נכנסת ב־07:03</p>
          <p>יציאה משוערת: 15:30</p>
        </div>

        <div className='card'>
          <FaSeedling className='icon' />
          <h3>פעולות שבוצעו השבוע</h3>
          <ul>
            <li>🌱 זריעה בשדה צפון</li>
            <li>🚜 חריש חלקה 5</li>
            <li>🚿 השקיה אוטומטית הושלמה</li>
          </ul>
        </div>
      </section>
    </section>
  )
}
