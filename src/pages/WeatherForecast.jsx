import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fieldService } from '../services/field.service.js'
import { sowingAndHarvestService } from '../services/sowing-and-harvest.service.js'
import { cropService } from '../services/crop.service.js'
import { getForecastByCoords } from '../services/weather.service.js'
import { taskService } from '../services/task.service.js'

export function WeatherForecast() {
  const [forecastData, setForecastData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [existingTasks, setExistingTasks] = useState([])
  const [openFieldIds, setOpenFieldIds] = useState([])
  const navigate = useNavigate()

  const toggleFieldOpen = (fieldId) => {
    setOpenFieldIds((prevOpen) => (prevOpen.includes(fieldId) ? prevOpen.filter((id) => id !== fieldId) : [...prevOpen, fieldId]))
  }

  const formatDateForDisplay = (isoDate) => {
    const [year, month, day] = isoDate.split('-')
    return `${day}/${month}/${year}`
  }

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

  useEffect(() => {
    async function loadForecasts() {
      setIsLoading(true)
      try {
        const [fields, records, crops, tasks] = await Promise.all([
          fieldService.query(),
          sowingAndHarvestService.query(),
          cropService.query(),
          taskService.query(),
        ])

        setExistingTasks(tasks)

        const activeForecasts = await Promise.all(
          fields
            .filter((field) => records.find((r) => r.fieldId === field._id && r.isActive))
            .map(async (field) => {
              const record = records.find((r) => r.fieldId === field._id && r.isActive)
              const crop = record ? crops.find((c) => c._id.toString() === record.cropId.toString()) : null
              const forecast = await getForecastByCoords(field.location.lat, field.location.lng)

              if (!forecast?.list) return null

              const groupedByDay = {}
              forecast.list.forEach((entry) => {
                const rawDate = new Date(entry.dt * 1000)
                const date = rawDate.toISOString().split('T')[0]
                if (!groupedByDay[date]) groupedByDay[date] = []
                groupedByDay[date].push(entry)
              })

              const dailySummary = Object.entries(groupedByDay).map(([date, entries]) => {
                const temps = entries.map((e) => e.main.temp)
                const humidities = entries.map((e) => e.main.humidity)
                const windSpeeds = entries.map((e) => e.wind.speed)
                const rain = entries.reduce((sum, e) => sum + (e.rain?.['3h'] || 0), 0)
                const clouds = entries.map((e) => e.clouds.all)

                const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length

                const tempAvg = avg(temps)
                const humidityAvg = avg(humidities)
                const windAvg = avg(windSpeeds)
                const cloudsAvg = avg(clouds)

                const suitable = crop
                  ? tempAvg >= crop.minTemp && tempAvg <= crop.maxTemp && humidityAvg >= crop.minHumidity && humidityAvg <= crop.maxHumidity
                  : null

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

              return {
                fieldId: field._id,
                fieldName: field.fieldName,
                cropName: crop?.cropName || '---',
                locationName: field.location.name,
                summary: dailySummary,
              }
            })
        )

        setForecastData(activeForecasts.filter(Boolean))
      } catch (err) {
        console.error('שגיאה בטעינת תחזית:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadForecasts()
  }, [])

  if (isLoading) return <p>🔄 טוען תחזיות...</p>

  return (
    <section className='weekly-weather-page'>
      <h1>תחזית שבועית לפי שדות והמלצות DSS</h1>
      {forecastData.map((field) => (
        <div key={field.fieldId} className='forecast-field'>
          <div className='field-header' onClick={() => toggleFieldOpen(field.fieldId)}>
            🧭 {field.fieldName} - {field.cropName}
          </div>

          {openFieldIds.includes(field.fieldId) && (
            <div className='field-content'>
              <p>
                🌾 גידול נוכחי: <strong>{field.cropName}</strong>
              </p>

              <div className='desktop-table'>
                <table className='forecast-table'>
                  <thead>
                    <tr>
                      <th>תאריך</th>
                      <th>טמפ׳ ממוצעת</th>
                      <th>לחות ממוצעת</th>
                      <th>רוח ממוצעת</th>
                      <th>עננות</th>
                      <th>גשם מצטבר</th>
                      <th>התאמה</th>
                      <th>המלצות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {field.summary.map((day) => (
                      <tr key={day.date}>
                        <td>{formatDateForDisplay(day.date)}</td>
                        <td>{day.tempAvg}°C</td>
                        <td>{day.humidityAvg}%</td>
                        <td>{day.windAvg} מ"ש</td>
                        <td>{day.cloudsAvg}%</td>
                        <td>{day.totalRain} מ"מ</td>
                        <td className={day.suitable ? 'suitable' : 'not-suitable'}>{day.suitable ? '✅ מתאים' : '⚠️ לא מתאים'}</td>
                        <td>
                          <ul className='recommendation-list'>
                            {day.recommendations.map((rec, idx) => {
                              const taskExists = existingTasks.some((task) => task.fieldId === field.fieldId && task.startDate === day.date)
                              const operationId = operationMap[rec]

                              return (
                                <li key={idx}>
                                  {rec}
                                  {!taskExists ? (
                                    <button
                                      className='create-task-btn'
                                      onClick={async () => {
                                        const taskToAdd = {
                                          taskDescription: rec,
                                          fieldId: field.fieldId,
                                          operationId,
                                          startDate: day.date,
                                          endDate: day.date,
                                          startTime: '08:00',
                                          endTime: '17:00',
                                          requiredEmployees: 1,
                                          status: 'pending',
                                          comments: '',
                                          notes: 'המשימה נוצרה באמצעות המלצה על פי תחזית',
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
                                  ) : (
                                    <span className='task-exists'>📝 קיימת משימה</span>
                                  )}
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

              <div className='mobile-cards'>
                {field.summary.map((day) => (
                  <div className='forecast-card' key={day.date}>
                    <h4>📅 {formatDateForDisplay(day.date)}</h4>
                    <p>🌡️ טמפ׳ ממוצעת: {day.tempAvg}°C</p>
                    <p>💧 לחות ממוצעת: {day.humidityAvg}%</p>
                    <p>💨 רוח: {day.windAvg} מ"ש</p>
                    <p>☁️ עננות: {day.cloudsAvg}%</p>
                    <p>🌧️ גשם מצטבר: {day.totalRain} מ"מ</p>
                    <p className={day.suitable ? 'suitable' : 'not-suitable'}>{day.suitable ? '✅ מתאים' : '⚠️ לא מתאים'}</p>
                    <ul className='recommendation-list'>
                      {day.recommendations.map((rec, idx) => {
                        const taskExists = existingTasks.some((task) => task.fieldId === field.fieldId && task.startDate === day.date)
                        const operationId = operationMap[rec]

                        return (
                          <li key={idx}>
                            {rec}
                            {!taskExists ? (
                              <button
                                className='create-task-btn'
                                onClick={async () => {
                                  const taskToAdd = {
                                    taskDescription: rec,
                                    fieldId: field.fieldId,
                                    operationId,
                                    startDate: day.date,
                                    endDate: day.date,
                                    startTime: '08:00',
                                    endTime: '17:00',
                                    requiredEmployees: 1,
                                    status: 'pending',
                                    comments: '',
                                    notes: 'המשימה נוצרה באמצעות המלצה על פי תחזית',
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
                            ) : (
                              <span className='task-exists'>📝 קיימת משימה</span>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </section>
  )
}
