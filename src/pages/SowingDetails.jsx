import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { sowingAndHarvestService } from '../services/sowing-and-harvest.service.js'
import { cropService } from '../services/crop.service.js'
import { fieldService } from '../services/field.service.js'
import { taskService } from '../services/task.service.js'
import { operationService } from '../services/operation.service.js'
import { getForecastByCoords } from '../services/weather.service.js'
import { WeeklyRecommendations } from '../cmps/WeeklyRecommendations.jsx'
import { seasonService } from '../services/seasons.service.js'
import {
  Leaf,
  MapPin,
  CalendarDays,
  Clock3,
  CheckCircle,
  XCircle,
  FileText,
  Droplets,
  Sun,
  CloudRain,
  FlaskConical,
  TrendingUp,
  StickyNote,
  Info,
  Wrench,
  PlusCircle,
  Scissors,
} from 'lucide-react'
import { Loader } from '../cmps/Loader.jsx'

export function SowingDetails() {
  const { sowingId } = useParams()
  const [sowing, setSowing] = useState(null)
  const [field, setField] = useState(null)
  const [crop, setCrop] = useState(null)
  const [tasks, setTasks] = useState([])
  const [forecast, setForecast] = useState([])
  const [preferredSeasonName, setPreferredSeasonName] = useState('')
  const [operations, setOperations] = useState([])

  const navigate = useNavigate()

  useEffect(() => {
    if (!sowingId) return
    loadData()
  }, [sowingId])

  async function loadData() {
    try {
      const sowingRecord = await sowingAndHarvestService.getById(sowingId)
      setSowing(sowingRecord)

      const [field, crop, allTasks, allOperations] = await Promise.all([
        fieldService.getById(sowingRecord.fieldId),
        cropService.getById(sowingRecord.cropId),
        taskService.query(),
        operationService.query(),
      ])
      setField(field)
      setCrop(crop)
      setOperations(allOperations)

      if (crop.preferredSeasonId) {
        const season = await seasonService.getById(crop.preferredSeasonId)
        setPreferredSeasonName(season?.name || crop.preferredSeasonId)
      }

      const sowingDate = new Date(sowingRecord.sowingDate)
      const relevantTasks = allTasks.filter((task) => task.fieldId === field._id && new Date(task.startDate) >= sowingDate)
      setTasks(relevantTasks)

      if (field.location?.lat && field.location?.lng) {
        const forecastData = await getForecastByCoords(field.location.lat, field.location.lng)
        setForecast(forecastData)
      }
    } catch (err) {
      console.error('שגיאה בטעינת נתונים:', err)
    }
  }

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('he-IL')
  const formatNumber = (num) => (typeof num === 'number' ? num.toLocaleString('he-IL') : num)

  const getExpectedEndDate = () => {
    if (!sowing || !crop) return '—'
    const date = new Date(sowing.sowingDate)
    date.setDate(date.getDate() + crop.growthTime)
    return formatDate(date)
  }

  const taskColorMap = {}
  const colorPalette = ['#e0f7fa', '#fce4ec', '#f3e5f5', '#fff3e0', '#f1f8e9', '#ede7f6', '#f9fbe7']
  let colorIndex = 0
  function getTaskColor(taskDescription) {
    if (!taskColorMap[taskDescription]) {
      taskColorMap[taskDescription] = colorPalette[colorIndex % colorPalette.length]
      colorIndex++
    }
    return taskColorMap[taskDescription]
  }

  if (!sowing || !field || !crop) return <Loader />

  const totalCost = tasks.reduce((acc, task) => {
    if (task.status === 'cancelled') return acc
    const operation = operations.find((op) => op._id === task.operationId)
    const costPerUnit = operation?.costPerUnit || 0
    return acc + (field.size || 0) * costPerUnit
  }, 0)

  const translateStatus = (status) => {
    switch (status) {
      case 'pending':
        return 'ממתינה'
      case 'in-progress':
        return 'בתהליך'
      case 'done':
        return 'הושלמה'
      case 'cancelled':
        return 'בוטלה'
      default:
        return status
    }
  }

  return (
    <section className='sowing-details'>
      <h1>ניהול הגידול בחלקה: {field.fieldName}</h1>

      <div className='actions-bar'>
        <button className='btn' onClick={() => navigate(`/harvest/${sowing._id}`)}>
          <Scissors size={16} /> בצע קציר
        </button>
        <button className='btn' onClick={() => navigate(`/tasks/add?fieldId=${sowing.fieldId}`)}>
          <PlusCircle size={16} /> הוסף משימה
        </button>
      </div>

      <section className='sowing-info'>
        <h2>🌱 פרטי הגידול</h2>
        <div className='sowing-grid'>
          <div>
            <p>
              <Leaf size={18} /> <strong>גידול:</strong> {crop.cropName}
            </p>
            <p>
              <MapPin size={18} /> <strong>מיקום:</strong> {field.location?.name || '---'}
            </p>
            <p>
              <CalendarDays size={18} /> <strong>תאריך זריעה:</strong> {formatDate(sowing.sowingDate)}
            </p>
            <p>
              <Clock3 size={18} /> <strong>תאריך סיום משוער:</strong> {getExpectedEndDate()}
            </p>
          </div>
          <div>
            <p>
              {sowing.isActive ? <CheckCircle size={18} color='green' /> : <XCircle size={18} color='red' />} <strong>סטטוס פעיל:</strong>{' '}
              {sowing.isActive ? 'כן' : 'לא'}
            </p>
            <p>
              <FileText size={18} /> <strong>סך קציר:</strong> {sowing.harvestLogs?.reduce((sum, log) => sum + Number(log.amount), 0)} ק"ג
            </p>
            <p>
              <StickyNote size={18} /> <strong>הערות קציר אחרונות:</strong>
            </p>
            <ul>
              {sowing.harvestLogs?.map((log, idx) => (
                <li key={idx}>
                  {formatDate(log.date)} - {log.amount} ק"ג{log.notes ? ` - ${log.notes}` : ''}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p>
              <Wrench size={18} /> <strong>סה"כ עלות גידול מוערך:</strong> ₪{formatNumber(totalCost)}
            </p>
          </div>
        </div>
      </section>

      <section className='crop-card'>
        <h2>🧾 כרטיס יבול</h2>
        <ul>
          <li>
            <Clock3 size={16} /> זמן גדילה: {crop.growthTime} ימים
          </li>
          <li>
            <Sun size={16} /> טמפרטורה: {crop.minTemp}° - {crop.maxTemp}°
          </li>
          <li>
            <Droplets size={16} /> לחות: {crop.minHumidity}% - {crop.maxHumidity}%
          </li>
          <li>
            <CloudRain size={16} /> משקעים: {crop.minRainfall} מ"מ - {crop.maxRainfall} מ"מ
          </li>
          <li>
            <Sun size={16} /> שעות אור: {crop.minSunlightHours} שעות ביום
          </li>
          <li>
            <Droplets size={16} /> השקיה: {formatNumber(crop.waterRecommendation)} מ"מ ליום למ"ר
          </li>
          <li>
            <FlaskConical size={16} /> דישון: {formatNumber(crop.fertilizerRecommendation)} גרם למ"ר
          </li>
          <li>
            <TrendingUp size={16} /> ערך עסקי: {formatNumber(crop.businessMinValue)} - {formatNumber(crop.businessMaxValue)} ק"ג
          </li>
          <li>
            <CalendarDays size={16} /> עונה מועדפת: {preferredSeasonName || '—'}
          </li>
          <li>
            <CloudRain size={16} /> רגישות לגשם בקציר: {crop.isSensitiveToRain ? 'כן' : 'לא'}
          </li>
          <li>
            <Info size={16} /> תנאים נוספים: {crop.additionalConditions}
          </li>
          <li>
            <StickyNote size={16} /> הערות: {crop.notes}
          </li>
        </ul>

        <button className='btn btn-small' onClick={() => navigate(`/crop/${crop._id}`)}>
          <Info size={14} /> לצפייה
        </button>
      </section>

      <section className='weather-dss'>
        <h2>🌦️ תחזית שבועית והמלצות</h2>
        <WeeklyRecommendations crop={crop} field={field} forecastData={forecast} existingTasks={tasks} />
      </section>

      <section className='task-list'>
        <h2>🛠️ משימות שבוצעו מאז הזריעה</h2>
        <div className='task-timeline'>
          {tasks
            .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
            .map((task) => {
              const operation = operations.find((op) => op._id === task.operationId)
              const operationName = operation?.operationName || '---'
              const costPerUnit = operation?.costPerUnit || 0
              const estimatedCost = (field.size || 0) * costPerUnit

              const isCancelled = task.status === 'cancelled'
              const textStyle = isCancelled ? { textDecoration: 'line-through', opacity: 0.6 } : {}

              return (
                <div className='timeline-entry' key={task._id} style={{ backgroundColor: getTaskColor(task.taskDescription) }}>
                  <div className='timeline-icon'>
                    <Wrench size={16} />
                  </div>
                  <div className='timeline-content'>
                    <div className='timeline-date'>{formatDate(task.startDate)}</div>
                    <div className='timeline-desc' style={textStyle}>
                      <strong>{operationName}</strong> – {task.taskDescription} ({translateStatus(task.status)})<br />
                      {task.comments && <small>תוצאה: {task.comments}</small>}
                      <br />
                      {!isCancelled && <small>מחיר מוערך: ₪{estimatedCost.toLocaleString('he-IL')}</small>}
                    </div>
                    <button className='btn btn-small' onClick={() => navigate(`/tasks/${task._id}`)}>
                      <Info size={14} /> לצפייה
                    </button>
                  </div>
                </div>
              )
            })}
        </div>

        <div className='task-legend'>
          <h3>🎨 מקרא צבעים:</h3>
          <ul>
            {Object.entries(taskColorMap).map(([desc, color]) => (
              <li key={desc}>
                <span className='legend-color' style={{ backgroundColor: color }}></span>
                {desc}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </section>
  )
}
