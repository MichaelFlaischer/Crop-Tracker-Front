import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { GoogleMap, Marker, Polygon, DrawingManager, useJsApiLoader } from '@react-google-maps/api'
import { fieldService } from '../services/field.service.js'
import { showSuccessMsg, showErrorMsg } from '../services/event-bus.service.js'

const containerStyle = {
  width: '100%',
  height: '100%',
}

const center = { lat: 31.25, lng: 34.4 }
const GOOGLE_LIBRARIES = ['drawing', 'places', 'geometry']

export function FieldEdit() {
  const [field, setField] = useState(null)
  const [searchInput, setSearchInput] = useState('')
  const [polygonCoords, setPolygonCoords] = useState([])
  const mapRef = useRef()
  const navigate = useNavigate()
  const { fieldId } = useParams()

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_LIBRARIES,
  })

  useEffect(() => {
    async function loadField() {
      try {
        const data = await fieldService.getById(fieldId)
        if (!data) throw new Error('חלקה לא נמצאה')
        setField(data)
        setSearchInput(data.location?.name || '')
        setPolygonCoords(data.polygonPath || [])
      } catch (err) {
        showErrorMsg('שגיאה בטעינת החלקה')
        console.error(err)
        navigate('/field')
      }
    }
    loadField()
  }, [fieldId])

  function handleSearch() {
    const geocoder = new window.google.maps.Geocoder()
    geocoder.geocode({ address: searchInput }, (results, status) => {
      if (status === 'OK') {
        const { lat, lng } = results[0].geometry.location
        const latVal = lat()
        const lngVal = lng()
        setField((prev) => ({
          ...prev,
          location: {
            ...prev.location,
            lat: latVal,
            lng: lngVal,
            name: searchInput,
          },
        }))
        mapRef.current.panTo({ lat: latVal, lng: lngVal })
        mapRef.current.setZoom(17)
      } else {
        showErrorMsg('מיקום לא נמצא')
      }
    })
  }

  function onPolygonComplete(polygon) {
    const path = polygon
      .getPath()
      .getArray()
      .map((coord) => ({ lat: coord.lat(), lng: coord.lng() }))

    setPolygonCoords(path)

    const area = calculateArea(path)

    setField((prev) => ({
      ...prev,
      polygonPath: path,
      size: area,
    }))

    polygon.setMap(null)
  }

  function calculateArea(path) {
    const areaInMeters = window.google.maps.geometry.spherical.computeArea(path.map((p) => new window.google.maps.LatLng(p.lat, p.lng)))
    return (areaInMeters / 1000).toFixed(2)
  }

  function onMapDoubleClick(e) {
    const lat = e.latLng.lat()
    const lng = e.latLng.lng()
    const name = `${lat.toFixed(6)}, ${lng.toFixed(6)}`

    setField((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        lat,
        lng,
        name,
      },
    }))
    setSearchInput(name)
  }

  function isFieldValid() {
    if (!field.fieldName?.trim()) {
      showErrorMsg('יש להזין שם חלקה')
      return false
    }
    if (!field.location?.lat || !field.location?.lng) {
      showErrorMsg('יש לבחור מיקום חוקי לחלקה על המפה או באמצעות חיפוש')
      return false
    }
    const sizeVal = parseFloat(field.size)
    if (isNaN(sizeVal) || sizeVal <= 0) {
      showErrorMsg('יש להזין שטח חלקה חוקי (בדונם)')
      return false
    }
    return true
  }

  async function onSaveField() {
    if (!isFieldValid()) return

    try {
      await fieldService.save(field)
      showSuccessMsg('החלקה עודכנה בהצלחה')
      navigate('/field')
    } catch (err) {
      console.error('שגיאה בעדכון:', err)
      showErrorMsg('שגיאה בעדכון חלקה')
    }
  }

  function onCancel() {
    navigate('/field')
  }

  if (!isLoaded || !field) return <p>טוען את פרטי החלקה...</p>

  return (
    <section className='field-edit-layout' style={{ display: 'flex', gap: '2rem' }}>
      <div className='field-form' style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2>עריכת חלקה לגידול יבולים</h2>

        <label>שם החלקה:</label>
        <input type='text' value={field.fieldName} onChange={(e) => setField({ ...field, fieldName: e.target.value })} />

        <label>כתובת או קואורדינטות (למיקום החלקה):</label>
        <div className='search-box' style={{ display: 'flex', gap: '0.5rem' }}>
          <input type='text' value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          <button onClick={handleSearch}>🔍 חפש</button>
        </div>

        <label>הערות:</label>
        <textarea value={field.notes} onChange={(e) => setField({ ...field, notes: e.target.value })} />

        <label>שטח החלקה (בדונם):</label>
        <input type='number' step='0.01' value={field.size} onChange={(e) => setField({ ...field, size: e.target.value })} />

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className='btn-save' onClick={onSaveField}>
            שמור חלקה
          </button>
          <button className='btn-cancel' onClick={onCancel}>
            בטל
          </button>
        </div>
      </div>

      <div className='map-wrapper' style={{ flex: 2, height: '80vh' }}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={8}
          onLoad={(map) => {
            mapRef.current = map
            map.setOptions({ gestureHandling: 'greedy' })
          }}
          onDblClick={onMapDoubleClick}
          mapTypeId='hybrid'
        >
          {field.location.lat && <Marker position={{ lat: field.location.lat, lng: field.location.lng }} />}

          {polygonCoords.length > 2 && (
            <Polygon
              path={polygonCoords}
              options={{
                fillColor: '#facc15',
                fillOpacity: 0.3,
                strokeColor: '#ca8a04',
                strokeWeight: 2,
              }}
            />
          )}

          <DrawingManager
            onPolygonComplete={onPolygonComplete}
            options={{
              drawingControl: true,
              drawingControlOptions: {
                position: window.google.maps.ControlPosition.TOP_CENTER,
                drawingModes: ['polygon'],
              },
              polygonOptions: {
                fillColor: '#facc15',
                fillOpacity: 0.3,
                strokeColor: '#ca8a04',
                strokeWeight: 2,
                clickable: false,
                editable: false,
                zIndex: 1,
              },
            }}
          />
        </GoogleMap>
      </div>
    </section>
  )
}
