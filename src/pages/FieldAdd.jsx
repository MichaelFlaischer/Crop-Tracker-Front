import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleMap, Marker, Polygon, useJsApiLoader, DrawingManager } from '@react-google-maps/api'
import { fieldService } from '../services/field.service.js'
import { showSuccessMsg, showErrorMsg } from '../services/event-bus.service.js'

const containerStyle = {
  width: '100%',
  height: '100%',
}

const center = { lat: 31.25, lng: 34.4 }
const GOOGLE_LIBRARIES = ['drawing', 'places', 'geometry']

export function FieldAdd() {
  const [field, setField] = useState({
    fieldName: '',
    notes: '',
    size: '',
    location: { name: '', lat: null, lng: null },
    polygonPath: [],
  })

  const [searchInput, setSearchInput] = useState('')
  const [polygonCoords, setPolygonCoords] = useState([])
  const mapRef = useRef()
  const navigate = useNavigate()

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_LIBRARIES,
  })

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
    const area = window.google.maps.geometry.spherical.computeArea(path.map((p) => new window.google.maps.LatLng(p.lat, p.lng)))
    return (area / 10000).toFixed(2)
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
      showErrorMsg('יש להזין שם שדה')
      return false
    }
    if (!field.location?.lat || !field.location?.lng) {
      showErrorMsg('יש לבחור מיקום חוקי על המפה או באמצעות חיפוש')
      return false
    }
    const sizeVal = parseFloat(field.size)
    if (isNaN(sizeVal) || sizeVal <= 0) {
      showErrorMsg('יש להזין גודל שדה חוקי (בקמ"ר)')
      return false
    }
    return true
  }

  async function onSaveField() {
    if (!isFieldValid()) return

    try {
      await fieldService.save(field)
      showSuccessMsg('השדה נוסף בהצלחה')
      navigate('/field')
    } catch (err) {
      console.error('שגיאה בהוספה:', err)
      showErrorMsg('שגיאה בהוספת שדה')
    }
  }

  function onCancel() {
    navigate('/field')
  }

  if (!isLoaded) return <p>טוען מפה...</p>

  return (
    <section className='field-add-layout' style={{ display: 'flex', gap: '2rem' }}>
      <div className='field-form' style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2>הוספת שדה חדש</h2>

        <label>שם השדה:</label>
        <input type='text' value={field.fieldName} onChange={(e) => setField({ ...field, fieldName: e.target.value })} />

        <label>כתובת או קואורדינטות:</label>
        <div className='search-box' style={{ display: 'flex', gap: '0.5rem' }}>
          <input type='text' value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          <button onClick={handleSearch}>חפש</button>
        </div>

        <label>הערות:</label>
        <textarea value={field.notes} onChange={(e) => setField({ ...field, notes: e.target.value })} />

        <label>שטח (קמ"ר):</label>
        <input type='number' step='0.01' value={field.size} onChange={(e) => setField({ ...field, size: e.target.value })} />

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className='btn-save' onClick={onSaveField}>
            שמור שדה
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
                fillColor: '#34d399',
                fillOpacity: 0.3,
                strokeColor: '#10b981',
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
                fillColor: '#34d399',
                fillOpacity: 0.3,
                strokeColor: '#10b981',
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
