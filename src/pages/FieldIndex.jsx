import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { fieldService } from '../services/field.service.js'
import { sowingAndHarvestService } from '../services/sowing-and-harvest.service.js'
import { cropService } from '../services/crop.service.js'
import { getDailyWeatherSummary, getRecommendedHarvestDays } from '../services/weather.service.js'
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'

const GOOGLE_LIBRARIES = ['drawing', 'places', 'geometry']

export function FieldIndex() {
  const [fields, setFields] = useState([])
  const [activeFieldId, setActiveFieldId] = useState(null)
  const [filter, setFilter] = useState('all')
  const mapRef = useRef(null)
  const navigate = useNavigate()

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_LIBRARIES,
  })

  useEffect(() => {
    async function loadData() {
      try {
        const [fieldsData, records, crops] = await Promise.all([fieldService.query(), sowingAndHarvestService.query(), cropService.query()])

        const enrichedFields = await Promise.all(
          fieldsData.map(async (field) => {
            const record = records.find((rec) => rec.fieldId === field._id && rec.isActive)
            const crop = record ? crops.find((c) => c._id.toString() === record.cropId.toString()) : null
            const harvestedAmount = record ? record.harvestLogs.reduce((acc, log) => acc + Number(log.amount), 0) : 0

            let expectedEndDate = null
            let smartStatus = null
            let harvestRecommendations = []

            if (record && crop?.growthTime) {
              const sowingDate = new Date(record.sowingDate)
              expectedEndDate = new Date(sowingDate)
              expectedEndDate.setDate(sowingDate.getDate() + crop.growthTime)

              const today = new Date()
              const totalDays = (expectedEndDate - sowingDate) / (1000 * 60 * 60 * 24)
              const elapsedDays = (today - sowingDate) / (1000 * 60 * 60 * 24)
              const percentage = (elapsedDays / totalDays) * 100

              if (percentage < 50) smartStatus = '📈 מוקדם לקצירה'
              else if (percentage < 85) smartStatus = '⏳ מתקרב לקצירה'
              else if (percentage <= 105) smartStatus = '✅ זמן קציר אופטימלי'
              else smartStatus = '⚠️ עבר זמן קציר'

              if (smartStatus === '✅ זמן קציר אופטימלי' && field.location?.lat && field.location?.lng) {
                try {
                  const recommendedDays = await getRecommendedHarvestDays(field.location.lat, field.location.lng, crop)
                  harvestRecommendations = recommendedDays.map((day) => day.date)
                } catch (err) {
                  console.error('שגיאה בתחזית ימים לקציר:', err)
                }
              }
            }

            let weather = null
            let weatherOk = true
            if (record && crop && field.location?.lat && field.location?.lng) {
              try {
                weather = await getDailyWeatherSummary(field.location.lat, field.location.lng)
                weatherOk =
                  weather.temp >= crop.minTemp && weather.temp <= crop.maxTemp && weather.humidity >= crop.minHumidity && weather.humidity <= crop.maxHumidity
              } catch (err) {
                console.error('שגיאה בתחזית:', field.fieldName, err)
              }
            }

            return {
              ...field,
              isActive: !!record,
              cropName: crop?.cropName || null,
              growthTime: crop?.growthTime || null,
              sowingDate: record?.sowingDate || null,
              expectedEndDate,
              harvestLogs: record?.harvestLogs || [],
              harvestedAmount,
              sowingId: record?._id,
              weather,
              weatherOk,
              smartStatus,
              harvestRecommendations,
            }
          })
        )

        setFields(enrichedFields)
      } catch (err) {
        console.error('שגיאה בטעינת נתונים:', err)
      }
    }

    loadData()
  }, [])

  function focusOnField(lat, lng, fieldId) {
    if (!mapRef.current) return
    setActiveFieldId(fieldId)
    mapRef.current.panTo({ lat, lng })
    mapRef.current.setZoom(13)
  }

  function centerAllFields() {
    if (!mapRef.current || fields.length === 0) return
    const bounds = new window.google.maps.LatLngBounds()
    fields.forEach((field) => {
      bounds.extend({ lat: field.location.lat, lng: field.location.lng })
    })
    mapRef.current.fitBounds(bounds)
    setActiveFieldId(null)
  }

  function onEdit(fieldId) {
    navigate(`/field/edit/${fieldId}`)
  }

  function onAdd() {
    navigate(`/field/add`)
  }

  async function onRemove(fieldId) {
    const isConfirmed = window.confirm('האם אתה בטוח שברצונך למחוק את החלקה?')
    if (!isConfirmed) return
    try {
      await fieldService.remove(fieldId)
      setFields((prev) => prev.filter((f) => f._id !== fieldId))
    } catch (err) {
      console.error('שגיאה במחיקת חלקה:', err)
    }
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr)
    return date.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const filteredFields = fields.filter((field) => {
    if (filter === 'all') return true
    if (filter === 'active') return field.isActive
    if (filter === 'inactive') return !field.isActive
  })

  if (!isLoaded) return <p>טוען מפה...</p>

  return (
    <div className='field-index' style={{ display: 'flex', gap: '1.5rem' }}>
      <div className='field-list' style={{ flex: '1', maxHeight: '80vh', overflowY: 'auto' }}>
        <h2>רשימת חלקות לגידול יבולים</h2>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <button
            onClick={centerAllFields}
            style={{ padding: '0.5rem 1rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            מרכז מפה
          </button>
          <button
            onClick={onAdd}
            style={{ padding: '0.5rem 1rem', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            הוסף חלקה
          </button>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px' }}>
            <option value='all'>הצג הכל</option>
            <option value='active'>רק פעילים</option>
            <option value='inactive'>רק לא פעילים</option>
          </select>
        </div>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {filteredFields.map((field, idx) => (
            <li
              key={field._id}
              style={{
                marginBottom: '1rem',
                padding: '1rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: activeFieldId === field._id ? '#e0f2fe' : field.isActive ? '#ecfdf5' : '#f9fafb',
              }}
            >
              <p style={{ fontWeight: 'bold', color: field.isActive ? '#16a34a' : '#9ca3af', marginBottom: '0.5rem' }}>
                {field.isActive ? '🟢 חלקה פעילה – גידול בעיצומו' : '⚪ חלקה פנויה – אין גידול פעיל'}
              </p>
              <strong>
                {idx + 1}. {field.fieldName}
              </strong>
              <p>📍 {field.location.name}</p>
              <p>📐 שטח החלקה: {field.size} דונם</p>
              <p>📋 {field.notes || '---'}</p>
              {field.isActive && (
                <>
                  <p>
                    🌾 גידול: <strong>{field.cropName}</strong>
                  </p>
                  <p>📅 תאריך שתילה: {formatDate(field.sowingDate)}</p>
                  <p>
                    🗓️ צפי סיום:{' '}
                    {field.expectedEndDate
                      ? `${formatDate(field.expectedEndDate)} (${Math.max(
                          Math.ceil((new Date(field.expectedEndDate) - new Date()) / (1000 * 60 * 60 * 24)),
                          0
                        )} ימים נותרו)`
                      : '---'}
                  </p>
                  <p title={field.harvestLogs.map((log) => `${formatDate(log.date)} - ${log.amount} ק"ג`).join('\n')}>
                    🍃 עד כה נקצר: {Number(field.harvestedAmount ?? 0).toFixed(2)} ק"ג
                  </p>
                  <p>
                    🧠 סטטוס גידול: <strong>{field.smartStatus}</strong>
                  </p>
                  {field.smartStatus === '✅ זמן קציר אופטימלי' && field.harvestRecommendations.length > 0 && (
                    <p>
                      📅 ימים מומלצים לקציר לפי תחזית:
                      <ul>
                        {field.harvestRecommendations.map((d, i) => (
                          <li key={i}>{formatDate(d)}</li>
                        ))}
                      </ul>
                    </p>
                  )}
                  <button
                    onClick={() => navigate(`/harvest/${field.sowingId}`)}
                    title='בצע קציר'
                    style={{ backgroundColor: '#22c55e', color: 'white', padding: '0.4rem 0.75rem', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    בצע קציר
                  </button>
                </>
              )}
              {!field.isActive && (
                <button
                  onClick={() => navigate(`/sowing/add?fieldId=${field._id}`)}
                  title='שתול יבול'
                  style={{ backgroundColor: '#10b981', color: 'white', padding: '0.4rem 0.75rem', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                  שתול יבול
                </button>
              )}
              {field.weather && (
                <div style={{ marginTop: '0.75rem', backgroundColor: '#f0f9ff', padding: '0.5rem', borderRadius: '6px' }}>
                  <p>
                    <strong>🌤️ תחזית מזג אוויר:</strong>
                  </p>
                  <p>
                    טמפ׳: {field.weather.temp}°C | לחות: {field.weather.humidity}% | UV: {field.weather.uvi}
                  </p>
                  <p>
                    🧠 הערכת התאמה ליבול:
                    <span style={{ color: field.weatherOk ? 'green' : 'red', fontWeight: 'bold' }}>
                      {field.weatherOk ? ' תנאים מתאימים ✅' : ' תנאים לא מתאימים ⚠️'}
                    </span>
                  </p>
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  onClick={() => focusOnField(field.location.lat, field.location.lng, field._id)}
                  title='הצג על המפה'
                  style={{ backgroundColor: '#3b82f6', color: 'white', padding: '0.4rem 0.75rem', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                  הצג על המפה
                </button>
                <button
                  onClick={() => onEdit(field._id)}
                  disabled={field.isActive}
                  title={field.isActive ? 'לא ניתן לערוך חלקה שבה מתנהל גידול פעיל' : 'ערוך את החלקה'}
                  style={{
                    backgroundColor: field.isActive ? '#fcd34d80' : '#facc15',
                    color: '#1f2937',
                    padding: '0.4rem 0.75rem',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: field.isActive ? 'not-allowed' : 'pointer',
                  }}
                >
                  ערוך
                </button>
                <button
                  onClick={() => onRemove(field._id)}
                  disabled={field.isActive}
                  title={field.isActive ? 'לא ניתן למחוק חלקה שבה מתנהל גידול פעיל' : 'מחק את החלקה'}
                  style={{
                    backgroundColor: field.isActive ? '#f8717180' : '#ef4444',
                    color: 'white',
                    padding: '0.4rem 0.75rem',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: field.isActive ? 'not-allowed' : 'pointer',
                  }}
                >
                  מחק
                </button>
              </div>
            </li>
          ))}
        </ul>
        <p style={{ marginTop: '1rem', fontWeight: 'bold' }}>
          סה"כ חלקות: {fields.length} | חלקות פעילות: {fields.filter((f) => f.isActive).length}
        </p>
      </div>
      <div className='map-container' style={{ flex: '2', height: '80vh', borderRadius: '12px', overflow: 'hidden' }}>
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={{ lat: 31.25, lng: 34.4 }}
          zoom={8}
          onLoad={(map) => (mapRef.current = map)}
          options={{ scrollwheel: true, gestureHandling: 'greedy' }}
        >
          {filteredFields.map((field, idx) => (
            <Marker
              key={field._id}
              position={{ lat: field.location.lat, lng: field.location.lng }}
              label={{ text: String(idx + 1), color: activeFieldId === field._id ? '#facc15' : 'white' }}
              title={field.fieldName}
            />
          ))}
        </GoogleMap>
      </div>
    </div>
  )
}
