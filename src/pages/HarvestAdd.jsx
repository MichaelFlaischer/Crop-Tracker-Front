import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { sowingAndHarvestService } from '../services/sowing-and-harvest.service.js'
import { fieldService } from '../services/field.service.js'
import { cropService } from '../services/crop.service.js'
import { warehouseService } from '../services/warehouse.service.js'
import { getWeeklyWeatherSummary } from '../services/weather.service.js'
import { Switch } from '@headlessui/react'

export function HarvestAdd() {
  const { sowingId } = useParams()
  const [sowingRecord, setSowingRecord] = useState(null)
  const [fieldName, setFieldName] = useState('')
  const [cropName, setCropName] = useState('')
  const [estimatedHarvestDate, setEstimatedHarvestDate] = useState('')
  const [daysLeft, setDaysLeft] = useState(0)
  const [smartStatus, setSmartStatus] = useState('')
  const [recommendedDays, setRecommendedDays] = useState([])
  const [weatherSuitabilityMsg, setWeatherSuitabilityMsg] = useState('')
  const [weatherIssues, setWeatherIssues] = useState([])
  const [timeline, setTimeline] = useState([])
  const [log, setLog] = useState({ date: new Date().toISOString().slice(0, 10), amount: '', notes: '', completeHarvest: false, warehouseId: '' })
  const [warehouses, setWarehouses] = useState([])
  const [warehouseCapacities, setWarehouseCapacities] = useState({})
  const navigate = useNavigate()

  useEffect(() => {
    async function loadRecord() {
      try {
        const record = await sowingAndHarvestService.getById(sowingId)
        setSowingRecord(record)

        const [field, crop, allWarehouses] = await Promise.all([
          fieldService.getById(record.fieldId),
          cropService.getById(record.cropId),
          warehouseService.query(),
        ])

        setFieldName(field?.fieldName || record.fieldId)
        setCropName(crop?.cropName || record.cropId)
        setWarehouses(allWarehouses)

        const capacityInfo = {}
        allWarehouses.forEach((wh) => {
          const used = wh.cropsStock?.reduce((sum, cs) => sum + cs.quantity, 0) || 0
          capacityInfo[wh._id] = wh.capacity - used
        })
        setWarehouseCapacities(capacityInfo)

        if (record.sowingDate && crop?.growthTime && field?.location) {
          const sowingDate = new Date(record.sowingDate)
          const now = new Date()
          const harvestEstimate = new Date(sowingDate)
          harvestEstimate.setDate(sowingDate.getDate() + crop.growthTime)
          setEstimatedHarvestDate(harvestEstimate.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' }))

          const msPerDay = 1000 * 60 * 60 * 24
          const diff = Math.ceil((harvestEstimate - now) / msPerDay)
          setDaysLeft(diff > 0 ? diff : 0)

          const totalDays = crop.growthTime
          const elapsedDays = Math.ceil((now - sowingDate) / msPerDay)
          const percentage = (elapsedDays / totalDays) * 100
          let status = '⏳'
          if (percentage < 50) status = '📈 מוקדם לקצירה'
          else if (percentage < 85) status = '⏳ מתקרב לקצירה'
          else if (percentage <= 105) status = '✅ זמן קציר אופטימלי'
          else status = '⚠️ עבר זמן קציר'
          setSmartStatus(status)

          const earlyDate = new Date(sowingDate)
          earlyDate.setDate(sowingDate.getDate() + totalDays * 0.5)
          const approachingDate = new Date(sowingDate)
          approachingDate.setDate(sowingDate.getDate() + totalDays * 0.85)
          const optimalDateEnd = new Date(sowingDate)
          optimalDateEnd.setDate(sowingDate.getDate() + totalDays * 1.05)
          const pastDate = new Date(optimalDateEnd)
          pastDate.setDate(pastDate.getDate() + 7)

          setTimeline([
            { label: '📈 מוקדם לקצירה', start: sowingDate, end: earlyDate },
            { label: '⏳ מתקרב לקצירה', start: earlyDate, end: approachingDate },
            { label: '✅ זמן קציר אופטימלי', start: approachingDate, end: optimalDateEnd },
            { label: '⚠️ עבר זמן קציר', start: optimalDateEnd, end: pastDate },
          ])

          const weather = await getWeeklyWeatherSummary(field.location.lat, field.location.lng)

          const suitableDays = weather
            .filter((d) => d.tempMin >= crop.minTemp && d.tempMax <= crop.maxTemp && d.humidity >= crop.minHumidity && d.humidity <= crop.maxHumidity)
            .map((d) => new Date(d.date))

          setRecommendedDays(suitableDays)

          const selectedHarvestDate = new Date(log.date)
          const weatherForDate = weather.find((d) => new Date(d.date).toDateString() === selectedHarvestDate.toDateString())

          if (!weatherForDate) {
            setWeatherSuitabilityMsg('⚠️ אין תחזית זמינה לתאריך זה. לא ניתן לקבוע אם התנאים מתאימים.')
            setWeatherIssues([])
          } else {
            const issues = []
            if (weatherForDate.tempMin < crop.minTemp) issues.push(`טמפ' מינימלית נמוכה (${weatherForDate.tempMin}° < ${crop.minTemp}°)`)
            if (weatherForDate.tempMax > crop.maxTemp) issues.push(`טמפ' מקסימלית גבוהה (${weatherForDate.tempMax}° > ${crop.maxTemp}°)`)
            if (weatherForDate.humidity < crop.minHumidity) issues.push(`לחות נמוכה (${weatherForDate.humidity}% < ${crop.minHumidity}%)`)
            if (weatherForDate.humidity > crop.maxHumidity) issues.push(`לחות גבוהה (${weatherForDate.humidity}% > ${crop.maxHumidity}%)`)

            if (issues.length === 0) {
              setWeatherSuitabilityMsg('✅ תנאי מזג האוויר מתאימים לביצוע קציר בתאריך זה.')
            } else {
              setWeatherSuitabilityMsg('⚠️ תנאי מזג האוויר אינם אידיאליים לקציר בתאריך שנבחר:')
            }
            setWeatherIssues(issues)
          }
        }
      } catch (err) {
        console.error('שגיאה בטעינת נתוני שתילה:', err)
      }
    }
    loadRecord()
  }, [sowingId, log.date])

  function handleChange(ev) {
    const { name, value } = ev.target
    setLog((prev) => ({ ...prev, [name]: value }))
  }

  function toggleCompleteHarvest(val) {
    setLog((prev) => ({ ...prev, completeHarvest: val }))
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    const selectedCapacity = warehouseCapacities[log.warehouseId] || 0
    if (+log.amount > selectedCapacity) {
      alert('לא ניתן להעביר יותר יבול מהקיבולת הפנויה במחסן הנבחר')
      return
    }
    try {
      await sowingAndHarvestService.addHarvestLog(sowingId, log)

      const selectedWarehouse = warehouses.find((wh) => wh._id === log.warehouseId)
      if (selectedWarehouse) {
        const updatedStock = [...(selectedWarehouse.cropsStock || [])]
        const existingCrop = updatedStock.find((cs) => cs.cropId === sowingRecord.cropId)
        const now = new Date().toISOString()
        if (existingCrop) {
          existingCrop.quantity += +log.amount
          existingCrop.lastUpdated = now
        } else {
          updatedStock.push({ cropId: sowingRecord.cropId, quantity: +log.amount, lastUpdated: now })
        }
        await warehouseService.save({ ...selectedWarehouse, cropsStock: updatedStock })
      }

      navigate('/field')
    } catch (err) {
      console.error('שגיאה בביצוע קציר:', err)
    }
  }

  if (!sowingRecord) return <p>טוען נתונים...</p>

  return (
    <section className='harvest-add'>
      <h1>בצע קציר</h1>

      <div className='info-box'>
        <p>
          🧑‍🌾 חלקה: <strong>{fieldName}</strong>
        </p>
        <p>
          🌾 יבול: <strong>{cropName}</strong>
        </p>
        <p>
          📅 תאריך שתילה:{' '}
          <strong>{new Date(sowingRecord.sowingDate).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })}</strong>
        </p>
        {estimatedHarvestDate && (
          <p>
            🗓️ תאריך קציר משוער: <strong>{estimatedHarvestDate}</strong> <span style={{ fontSize: '0.85rem', color: '#6b7280' }}> ({daysLeft} ימים נותרו)</span>
          </p>
        )}
        {smartStatus && (
          <p>
            🧠 סטטוס חכם: <strong>{smartStatus}</strong>
          </p>
        )}
        {timeline.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <h3>📅 טבלת תקופות קציר:</h3>
            <table style={{ width: '100%', textAlign: 'center', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {timeline.map((item, idx) => (
                    <th key={idx} style={{ borderBottom: '1px solid #ccc', padding: '8px' }}>
                      {item.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {timeline.map((item, idx) => {
                    const now = new Date()
                    const isActive = now >= item.start && now <= item.end
                    return (
                      <td
                        key={idx}
                        style={{
                          backgroundColor: isActive ? '#d1fae5' : '#fff',
                          fontWeight: isActive ? 'bold' : 'normal',
                          padding: '8px',
                        }}
                      >
                        {item.start.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })} -{' '}
                        {item.end.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </td>
                    )
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <label>
          תאריך קציר:
          <input type='date' name='date' value={log.date} onChange={handleChange} required />
        </label>
        {weatherSuitabilityMsg && <p>{weatherSuitabilityMsg}</p>}

        {weatherIssues.length > 0 && (
          <ul style={{ color: '#b91c1c', fontSize: '0.9rem' }}>
            {weatherIssues.map((issue, idx) => (
              <li key={idx}>• {issue}</li>
            ))}
          </ul>
        )}

        <label>
          כמות שנקצרה (בק"ג):
          <input type='number' name='amount' value={log.amount} onChange={handleChange} required />
        </label>
        <p style={{ fontSize: '0.85rem', color: '#374151', margin: '0.25rem 0 0.75rem' }}>
          מקסימום להעברה למחסן: {warehouseCapacities[log.warehouseId] || 0} ק"ג
        </p>

        <label>
          מחסן להעברה:
          <select name='warehouseId' value={log.warehouseId} onChange={handleChange} required>
            <option value=''>בחר מחסן</option>
            {warehouses.map((wh) => (
              <option key={wh._id} value={wh._id}>
                {wh.warehouseName}
              </option>
            ))}
          </select>
        </label>

        <label>
          הערות:
          <textarea name='notes' value={log.notes} onChange={handleChange}></textarea>
        </label>

        <div className='toggle-box'>
          <span>סיום גידול – החלקה מוכנה לשתילה חדשה</span>
          <Switch
            checked={log.completeHarvest}
            onChange={toggleCompleteHarvest}
            className='headlessui-switch'
            data-headlessui-state={log.completeHarvest ? 'checked' : ''}
          >
            <span className='sr-only'>סיום גידול</span>
            <span className='headlessui-switch-thumb' data-headlessui-state={log.completeHarvest ? 'checked' : ''} />
          </Switch>
        </div>

        <div className='form-actions'>
          <button type='submit' className='submit-btn'>
            {log.completeHarvest ? 'שמור וסיים גידול' : 'שמור קציר'}
          </button>
          <button type='button' onClick={() => navigate('/field')} className='cancel-btn'>
            ביטול
          </button>
        </div>
      </form>
    </section>
  )
}
