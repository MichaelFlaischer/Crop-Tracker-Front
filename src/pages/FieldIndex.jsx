import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { fieldService } from '../services/field.service.js'
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'

// 🟢 יש להגדיר את libraries כקבוע גלובלי מחוץ לקומפוננטה
const GOOGLE_LIBRARIES = ['drawing', 'places', 'geometry']

export function FieldIndex() {
  const [fields, setFields] = useState([])
  const [activeFieldId, setActiveFieldId] = useState(null)
  const mapRef = useRef(null)
  const navigate = useNavigate()

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_LIBRARIES,
  })

  useEffect(() => {
    async function loadFields() {
      try {
        const data = await fieldService.query()
        setFields(data)
      } catch (err) {
        console.error('שגיאה בטעינת שדות:', err)
      }
    }
    loadFields()
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
    const isConfirmed = window.confirm('האם אתה בטוח שברצונך למחוק את השדה?')
    if (!isConfirmed) return

    try {
      await fieldService.remove(fieldId)
      setFields((prev) => prev.filter((f) => f._id !== fieldId))
    } catch (err) {
      console.error('שגיאה במחיקת שדה:', err)
    }
  }

  if (!isLoaded) return <p>טוען מפה...</p>

  return (
    <div className='field-index' style={{ display: 'flex', gap: '1.5rem' }}>
      <div className='field-list' style={{ flex: '1', maxHeight: '80vh', overflowY: 'auto' }}>
        <h2>רשימת שדות</h2>
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
            הוסף שדה
          </button>
        </div>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {fields.map((field, idx) => (
            <li
              key={field._id}
              style={{
                marginBottom: '1rem',
                padding: '1rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: activeFieldId === field._id ? '#e0f2fe' : '#f9fafb',
              }}
            >
              <strong>
                {idx + 1}. {field.fieldName}
              </strong>
              <p>📍 {field.location.name}</p>
              <p>📐 גודל: {field.size} קמ"ר</p>
              <p>📋 {field.notes || '---'}</p>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  onClick={() => focusOnField(field.location.lat, field.location.lng, field._id)}
                  style={{ backgroundColor: '#3b82f6', color: 'white', padding: '0.4rem 0.75rem', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                  הצג על המפה
                </button>
                <button
                  onClick={() => onEdit(field._id)}
                  style={{ backgroundColor: '#facc15', color: '#1f2937', padding: '0.4rem 0.75rem', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                  ערוך
                </button>
                <button
                  onClick={() => onRemove(field._id)}
                  style={{ backgroundColor: '#ef4444', color: 'white', padding: '0.4rem 0.75rem', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                  מחק
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className='map-container' style={{ flex: '2', height: '80vh', borderRadius: '12px', overflow: 'hidden' }}>
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={{ lat: 31.25, lng: 34.4 }}
          zoom={8}
          onLoad={(map) => (mapRef.current = map)}
          options={{
            scrollwheel: true,
            gestureHandling: 'greedy',
          }}
        >
          {fields.map((field, idx) => (
            <Marker
              key={field._id}
              position={{ lat: field.location.lat, lng: field.location.lng }}
              label={{
                text: String(idx + 1),
                color: activeFieldId === field._id ? '#facc15' : 'white',
              }}
              title={field.fieldName}
            />
          ))}
        </GoogleMap>
      </div>
    </div>
  )
}
