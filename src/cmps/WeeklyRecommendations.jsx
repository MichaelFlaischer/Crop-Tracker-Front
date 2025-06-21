import { useNavigate } from 'react-router-dom'
import { taskService } from '../services/task.service.js'

const operationMap = {
  '💧 יש להגביר השקיה': '68380101b55f947484df5064',
  '🚱 יש להפחית השקיה': '6838151db55f947484df506f',
  '💦 יש לנקז מים': '68380101b55f947484df5065',
  '🌡️ שקול הצללה זמנית': '6838151db55f947484df5070',
  '💦 השקיה מרובה בשעות החום': '68380101b55f947484df5064',
  '❄️ שקול הגנה תרמית לצמח': '68380101b55f947484df5067',
  '💨 שקול אמצעים לשבירת רוח': '68380101b55f947484df5068',
  '☁️ שקול שימוש בדשנים מעודדי פוטוסינתזה': '68380101b55f947484df5069',
  '🌧️ הכן ניקוז נאות למניעת עודף מים': '68380101b55f947484df506a',
  '🌬️ שקול הפחתת ריסוס למניעת התנדפות': '6838151db55f947484df5071',
  '🌞 שקול להשקות מוקדם בבוקר': '6838151db55f947484df5072',
  '🌧️ שקול לדחות דישון עד לאחר הגשם': '6838151db55f947484df5073',
  '🌡️ שקול קירור באמצעות ערפול': '6838151db55f947484df5074',
  '💨 שקול חיזוק מבני תמיכה בצמחים': '6838151db55f947484df5075',
  '🌫️ שקול שיפור אוורור למניעת לחות': '6838151db55f947484df5076',
  '🪰 שקול ניטור מזיקים כתוצאה מתנאי מזג אוויר': '6838151db55f947484df5077',
}

export function WeeklyRecommendations({ crop, field, forecastData, existingTasks }) {
  const navigate = useNavigate()

  if (!forecastData?.list) return <p>לא קיימת תחזית זמינה</p>

  const formatDate = (iso) => {
    const [year, month, day] = iso.split('-')
    return `${day}/${month}/${year}`
  }

  const groupedByDay = {}
  forecastData.list.forEach((entry) => {
    const rawDate = new Date(entry.dt * 1000)
    const date = rawDate.toISOString().split('T')[0]
    if (!groupedByDay[date]) groupedByDay[date] = []
    groupedByDay[date].push(entry)
  })

  const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length

  const dailySummary = Object.entries(groupedByDay).map(([date, entries]) => {
    const temps = entries.map((e) => e.main.temp)
    const humidities = entries.map((e) => e.main.humidity)
    const windSpeeds = entries.map((e) => e.wind.speed)
    const rain = entries.reduce((sum, e) => sum + (e.rain?.['3h'] || 0), 0)
    const clouds = entries.map((e) => e.clouds.all)

    const tempAvg = avg(temps)
    const humidityAvg = avg(humidities)
    const windAvg = avg(windSpeeds)
    const cloudsAvg = avg(clouds)

    const suitable = crop && tempAvg >= crop.minTemp && tempAvg <= crop.maxTemp && humidityAvg >= crop.minHumidity && humidityAvg <= crop.maxHumidity

    const recommendations = []
    if (crop) {
      const isTooDry = humidityAvg < crop.minHumidity
      const isTooHumid = humidityAvg > crop.maxHumidity
      const isTooHot = tempAvg > crop.maxTemp
      const isTooCold = tempAvg < crop.minTemp

      if (isTooDry) recommendations.push('💧 יש להגביר השקיה')
      if (isTooHumid) {
        recommendations.push('🚱 יש להפחית השקיה')
        recommendations.push('💦 יש לנקז מים')
      }
      if (isTooHot && !isTooHumid) {
        recommendations.push('🌡️ שקול הצללה זמנית')
        recommendations.push('💦 השקיה מרובה בשעות החום')
      }
      if (isTooCold) recommendations.push('❄️ שקול הגנה תרמית לצמח')
      if (windAvg > 8) {
        recommendations.push('💨 שקול אמצעים לשבירת רוח')
        recommendations.push('🌬️ שקול הפחתת ריסוס למניעת התנדפות')
        recommendations.push('💨 שקול חיזוק מבני תמיכה בצמחים')
      }
      if (cloudsAvg > 70) recommendations.push('☁️ שקול שימוש בדשנים מעודדי פוטוסינתזה')
      if (rain > 10) recommendations.push('🌧️ הכן ניקוז נאות למניעת עודף מים')
    }

    return {
      date,
      tempAvg: tempAvg.toFixed(1),
      humidityAvg: humidityAvg.toFixed(1),
      windAvg: windAvg.toFixed(1),
      cloudsAvg: cloudsAvg.toFixed(1),
      totalRain: rain.toFixed(1),
      suitable,
      recommendations,
    }
  })

  return (
    <div className='forecast-summary'>
      <table className='forecast-table'>
        <thead>
          <tr>
            <th>תאריך</th>
            <th>טמפ׳</th>
            <th>לחות</th>
            <th>רוח</th>
            <th>עננות</th>
            <th>גשם</th>
            <th>התאמה</th>
            <th>המלצות</th>
          </tr>
        </thead>
        <tbody>
          {dailySummary.map((day) => (
            <tr key={day.date}>
              <td>{formatDate(day.date)}</td>
              <td>{day.tempAvg}°C</td>
              <td>{day.humidityAvg}%</td>
              <td>{day.windAvg} מ"ש</td>
              <td>{day.cloudsAvg}%</td>
              <td>{day.totalRain} מ"מ</td>
              <td className={day.suitable ? 'suitable' : 'not-suitable'}>{day.suitable ? '✅ מתאים' : '⚠️ לא מתאים'}</td>
              <td>
                <ul className='recommendation-list'>
                  {day.recommendations.map((rec, idx) => {
                    const taskExists = existingTasks.some(
                      (task) => task.fieldId === field._id && task.taskDescription === rec && task.startDate?.startsWith(day.date)
                    )
                    const operationId = operationMap[rec]

                    return (
                      <li key={idx}>
                        {rec}{' '}
                        {!taskExists && operationId && (
                          <button
                            className='create-task-btn'
                            onClick={async () => {
                              const taskToAdd = {
                                taskDescription: rec,
                                fieldId: field._id,
                                operationId,
                                startDate: day.date,
                                endDate: day.date,
                                startTime: '08:00',
                                endTime: '17:00',
                                requiredEmployees: 1,
                                status: 'pending',
                                comments: '',
                                notes: 'נוצר על פי תחזית DSS',
                              }

                              try {
                                const newTask = await taskService.add(taskToAdd)
                                if (newTask && newTask._id) {
                                  navigate(`/tasks/${newTask._id}`)
                                }
                              } catch (err) {
                                alert('שגיאה ביצירת המשימה')
                              }
                            }}
                          >
                            צור משימה
                          </button>
                        )}
                        {taskExists && <span className='task-exists'>📝 קיימת משימה</span>}
                      </li>
                    )
                  })}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
