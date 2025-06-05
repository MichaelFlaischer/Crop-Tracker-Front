import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { cropService } from '../services/crop.service.js'
import { seasonService } from '../services/seasons.service.js'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service.js'

export function CropDetails() {
  const [crop, setCrop] = useState(null)
  const [preferredSeasonName, setPreferredSeasonName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { cropId } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    loadCrop()
  }, [cropId])

  async function loadCrop() {
    setIsLoading(true)
    try {
      const data = await cropService.getById(cropId)
      setCrop(data)
      if (data.preferredSeasonId) {
        const season = await seasonService.getById(data.preferredSeasonId)
        setPreferredSeasonName(season?.name || data.preferredSeasonId)
      }
    } catch (err) {
      console.error('שגיאה בטעינת היבול', err)
      showErrorMsg('שגיאה בטעינת היבול')
    } finally {
      setIsLoading(false)
    }
  }

  async function onDeleteCrop() {
    if (!window.confirm(`האם אתה בטוח שברצונך למחוק את היבול "${crop.cropName}"?`)) return
    try {
      await cropService.remove(crop._id)
      showSuccessMsg('היבול נמחק בהצלחה')
      navigate('/crop')
    } catch (err) {
      console.error('שגיאה במחיקת יבול', err)
      showErrorMsg('שגיאה במחיקת יבול')
    }
  }

  function onEditCrop() {
    navigate(`/crop/edit/${crop._id}`)
  }

  const formatNumber = (num) => {
    if (typeof num !== 'number') return num
    return num.toLocaleString('he-IL')
  }

  if (isLoading) return <div className='loader'>טוען פרטי יבול...</div>
  if (!crop) return <div>לא נמצאו נתונים עבור היבול המבוקש</div>

  return (
    <section className='crop-details main-layout'>
      <h1>פרטי יבול</h1>

      <table className='crop-details-table'>
        <tbody>
          <tr>
            <td>שם היבול</td>
            <td>{crop.cropName}</td>
          </tr>
          <tr>
            <td>תיאור</td>
            <td>{crop.description}</td>
          </tr>
          <tr>
            <td>⏳ זמן גדילה (ימים)</td>
            <td>{crop.growthTime}</td>
          </tr>
          <tr>
            <td>🌡️ טווח טמפרטורה</td>
            <td>
              <span style={{ color: '#1976d2', fontWeight: 'bold' }}>{crop.minTemp}°</span>
              <span style={{ margin: '0 6px', color: '#999' }}>⬅</span>
              <span style={{ color: '#ef5350', fontWeight: 'bold' }}>{crop.maxTemp}°</span>
            </td>
          </tr>
          <tr>
            <td>💧 טווח לחות</td>
            <td>
              <span style={{ color: '#1976d2', fontWeight: 'bold' }}>{crop.minHumidity}%</span>
              <span style={{ margin: '0 6px', color: '#999' }}>⬅</span>
              <span style={{ color: '#ef5350', fontWeight: 'bold' }}>{crop.maxHumidity}%</span>
            </td>
          </tr>
          <tr>
            <td>🌦️ טווח משקעים אידיאלי</td>
            <td className='rain-range'>
              <span className='min'>{crop.minRainfall} מ"מ</span>
              <span style={{ margin: '0 6px', color: '#999' }}>⬅</span>
              <span className='max'>{crop.maxRainfall} מ"מ</span>
            </td>
          </tr>

          <tr>
            <td>🌞 מינימום שעות אור</td>
            <td>{crop.minSunlightHours} שעות ביום</td>
          </tr>
          <tr>
            <td>📈 ערך עסקי רצוי (ק"ג)</td>
            <td>
              <span style={{ color: '#1976d2', fontWeight: 'bold' }}>{formatNumber(crop.businessMinValue)}</span>
              <span style={{ margin: '0 6px', color: '#999' }}>⬅</span>
              <span style={{ color: '#ef5350', fontWeight: 'bold' }}>{formatNumber(crop.businessMaxValue)}</span>
            </td>
          </tr>
          <tr>
            <td>🚿 השקיה מומלצת</td>
            <td>{formatNumber(crop.waterRecommendation)} מ"מ ליום למ"ר</td>
          </tr>
          <tr>
            <td>🧪 דישון מומלץ</td>
            <td>{formatNumber(crop.fertilizerRecommendation)} גרם למ"ר</td>
          </tr>
          <tr>
            <td>☔ רגישות לגשם בקציר</td>
            <td>{crop.isSensitiveToRain ? 'רגיש לגשם – יש להיזהר' : 'לא רגיש לגשם'}</td>
          </tr>
          <tr>
            <td>📅 עונה מועדפת</td>
            <td>{preferredSeasonName || '—'}</td>
          </tr>
          <tr>
            <td>📝 תנאים נוספים</td>
            <td>{crop.additionalConditions}</td>
          </tr>
          <tr>
            <td>📌 הערות</td>
            <td>{crop.notes}</td>
          </tr>
        </tbody>
      </table>

      <div className='actions'>
        <button onClick={() => navigate('/crop')}>⬅ חזרה לרשימה</button>
        <button onClick={onEditCrop}>✏️ עריכה</button>
        <button className='danger' onClick={onDeleteCrop}>
          🗑️ מחיקה
        </button>
      </div>
    </section>
  )
}
