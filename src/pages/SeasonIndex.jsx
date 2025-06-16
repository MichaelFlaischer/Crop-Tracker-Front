import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { seasonService } from '../services/seasons.service'
import { showErrorMsg } from '../services/event-bus.service'

export function SeasonIndex() {
  const [seasons, setSeasons] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    loadSeasons()
  }, [])

  async function loadSeasons() {
    try {
      const data = await seasonService.query()
      const sorted = [...data].sort((a, b) => {
        const isPastA = isPast(a.endDate) ? 1 : 0
        const isPastB = isPast(b.endDate) ? 1 : 0
        return isPastA - isPastB
      })
      setSeasons(sorted)
    } catch (err) {
      showErrorMsg('שגיאה בטעינת העונות')
    }
  }

  function onEdit(seasonId) {
    navigate(`/seasons/edit/${seasonId}`)
  }

  function isPast(dateStr) {
    const [day, month, year] = dateStr.split(/[\/\-]/).map(Number)
    const parsedDate = new Date(`${year}-${month}-${day}`)
    return parsedDate < new Date()
  }

  return (
    <section className='season-index main-layout'>
      <h1>🌦️ ניהול עונות</h1>
      <p className='page-description'>כאן תוכל לצפות בעונות ולהתאים את התאריכים והתנאים. עונות שהסתיימו מסומנות באדום.</p>

      {seasons.length === 0 ? (
        <p className='no-seasons'>לא קיימות עונות במערכת.</p>
      ) : (
        <>
          {/* טבלה למסכים גדולים */}
          <div className='season-table-wrapper'>
            <table className='season-table'>
              <thead>
                <tr>
                  <th>שם</th>
                  <th>קוד</th>
                  <th>התחלה</th>
                  <th>סיום</th>
                  <th>טמפ'</th>
                  <th>משקעים</th>
                  <th>לחות</th>
                  <th>תיאור</th>
                  <th>הערה</th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {seasons.map((s) => (
                  <tr key={s._id} className={isPast(s.endDate) ? 'past-season' : ''}>
                    <td>{s.name}</td>
                    <td>{s.season}</td>
                    <td>{s.startDate}</td>
                    <td>{s.endDate}</td>
                    <td>{s.avgTemperature}°C</td>
                    <td>{s.avgRainfall} מ״מ</td>
                    <td>{s.avgHumidity}%</td>
                    <td>{s.description}</td>
                    <td>{isPast(s.endDate) ? '⚠️ הסתיימה' : '—'}</td>
                    <td>
                      <button className='edit-btn' onClick={() => onEdit(s._id)}>
                        ✏️ ערוך
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* תצוגת כרטיסים למסכים קטנים */}
          <div className='season-cards'>
            {seasons.map((s) => (
              <div key={s._id} className={`season-card ${isPast(s.endDate) ? 'past' : ''}`}>
                <h3>{s.name}</h3>
                <p>
                  <strong>קוד:</strong> {s.season}
                </p>
                <p>
                  <strong>תאריכים:</strong> {s.startDate} - {s.endDate}
                </p>
                <p>
                  <strong>טמפ':</strong> {s.avgTemperature}°C
                </p>
                <p>
                  <strong>משקעים:</strong> {s.avgRainfall} מ״מ
                </p>
                <p>
                  <strong>לחות:</strong> {s.avgHumidity}%
                </p>
                <p>
                  <strong>תיאור:</strong> {s.description}
                </p>
                <p className='note'>{isPast(s.endDate) ? '⚠️ העונה הסתיימה - יש לעדכן' : '—'}</p>
                <button className='edit-btn' onClick={() => onEdit(s._id)}>
                  ✏️ ערוך
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
