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
      setSeasons(data)
    } catch (err) {
      showErrorMsg('נכשל בטעינת העונות')
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
    <section className='season-index'>
      <h2>ניהול עונות</h2>
      <table>
        <thead>
          <tr>
            <th>שם</th>
            <th>קוד עונה</th>
            <th>תאריך התחלה</th>
            <th>תאריך סיום</th>
            <th>טמפ' ממוצעת</th>
            <th>משקעים ממוצעים</th>
            <th>לחות ממוצעת</th>
            <th>תיאור</th>
            <th>הערה</th>
            <th>פעולות</th>
          </tr>
        </thead>
        <tbody>
          {seasons.map((season) => (
            <tr key={season._id} className={isPast(season.endDate) ? 'past-season' : ''}>
              <td>{season.name}</td>
              <td>{season.season}</td>
              <td>{season.startDate}</td>
              <td>{season.endDate}</td>
              <td>{season.avgTemperature}°C</td>
              <td>{season.avgRainfall} מ"מ</td>
              <td>{season.avgHumidity}%</td>
              <td>{season.description}</td>
              <td>{isPast(season.endDate) ? '⚠️ העונה הסתיימה - יש לעדכן תאריכים' : 'אין הערות'}</td>
              <td>
                <button onClick={() => onEdit(season._id)}>ערוך</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
