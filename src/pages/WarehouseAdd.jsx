import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleMap, Marker, useJsApiLoader, StandaloneSearchBox } from '@react-google-maps/api'
import { warehouseService } from '../services/warehouse.service.js'
import { showSuccessMsg, showErrorMsg } from '../services/event-bus.service.js'
import * as yup from 'yup'

const containerStyle = {
  width: '100%',
  height: '400px',
}

const defaultCenter = {
  lat: 32.0,
  lng: 35.0,
}

const GOOGLE_MAP_LIBRARIES = ['geometry', 'places']

const warehouseSchema = yup.object().shape({
  warehouseName: yup.string().required('יש להזין שם מחסן'),
  location: yup.object().shape({
    region: yup.string().required('יש להזין אזור'),
    coordinates: yup.object().shape({
      lat: yup.number().required(),
      lng: yup.number().required(),
    }),
  }),
  capacity: yup.number().required('יש להזין קיבולת').positive('הקיבולת חייבת להיות מספר חיובי'),
  notes: yup.string(),
})

export function WarehouseAdd() {
  const [warehouse, setWarehouse] = useState({
    warehouseName: '',
    location: {
      region: '',
      coordinates: { lat: 32.0, lng: 35.0 },
    },
    capacity: '',
    notes: '',
  })

  const [errors, setErrors] = useState({})
  const mapRef = useRef(null)
  const searchBoxRef = useRef(null)
  const searchInputRef = useRef(null)
  const navigate = useNavigate()

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAP_LIBRARIES,
    id: 'shared-google-loader',
  })

  function handleChange({ target }) {
    const { name, value } = target
    if (name === 'lat' || name === 'lng') {
      setWarehouse((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          coordinates: {
            ...prev.location.coordinates,
            [name]: +value,
          },
        },
      }))
    } else if (name === 'region') {
      setWarehouse((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          region: value,
        },
      }))
    } else {
      setWarehouse((prev) => ({ ...prev, [name]: name === 'capacity' ? +value : value }))
    }
  }

  function onMapClick(e) {
    const { latLng } = e
    const lat = latLng.lat()
    const lng = latLng.lng()
    setWarehouse((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        coordinates: { lat, lng },
      },
    }))
  }

  function onPlacesChanged() {
    const places = searchBoxRef.current.getPlaces()
    if (places && places.length > 0) {
      const location = places[0].geometry.location
      const lat = location.lat()
      const lng = location.lng()
      setWarehouse((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          coordinates: { lat, lng },
        },
      }))
      mapRef.current.panTo({ lat, lng })
    }
  }

  function handleSearchPanTo() {
    const address = searchInputRef.current?.value
    if (!address) return

    const geocoder = new window.google.maps.Geocoder()
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location
        const lat = location.lat()
        const lng = location.lng()
        setWarehouse((prev) => ({
          ...prev,
          location: {
            ...prev.location,
            coordinates: { lat, lng },
          },
        }))
        mapRef.current?.panTo({ lat, lng })
      } else {
        showErrorMsg('לא נמצאה כתובת מתאימה')
      }
    })
  }

  async function onSave(ev) {
    ev.preventDefault()
    try {
      await warehouseSchema.validate(warehouse, { abortEarly: false })
      await warehouseService.save(warehouse)
      showSuccessMsg('המחסן נוסף בהצלחה')
      navigate('/warehouse')
    } catch (err) {
      if (err.name === 'ValidationError') {
        const formattedErrors = err.inner.reduce((acc, curr) => {
          acc[curr.path] = curr.message
          return acc
        }, {})
        setErrors(formattedErrors)
      } else {
        console.error('שגיאה בהוספת מחסן:', err)
        showErrorMsg('שגיאה בהוספת מחסן')
      }
    }
  }

  if (!isLoaded) return <p>טוען מפה...</p>

  return (
    <section className='warehouse-add main-layout'>
      <h1>הוסף מחסן חדש</h1>
      <div className='form-map-container'>
        <form onSubmit={onSave} className='warehouse-form'>
          <label>
            שם מחסן:
            <input type='text' name='warehouseName' value={warehouse.warehouseName} onChange={handleChange} />
            {errors.warehouseName && <span className='error'>{errors.warehouseName}</span>}
          </label>

          <label>
            אזור:
            <input type='text' name='region' value={warehouse.location.region} onChange={handleChange} />
            {errors['location.region'] && <span className='error'>{errors['location.region']}</span>}
          </label>

          <label>
            קיבולת (בק"ג):
            <input type='number' name='capacity' value={warehouse.capacity} onChange={handleChange} />
            {errors.capacity && <span className='error'>{errors.capacity}</span>}
          </label>

          <label>
            הערות:
            <textarea name='notes' value={warehouse.notes} onChange={handleChange}></textarea>
          </label>

          <button className='btn save-btn'>שמור</button>
          <button type='button' className='btn cancel-btn' onClick={() => navigate('/warehouse')}>
            ביטול
          </button>
        </form>

        <div className='map-section'>
          <h2>בחר מיקום על גבי מפה</h2>
          <div className='search-row'>
            <StandaloneSearchBox onLoad={(ref) => (searchBoxRef.current = ref)} onPlacesChanged={onPlacesChanged}>
              <input ref={searchInputRef} type='text' placeholder='חפש כתובת או מקום...' />
            </StandaloneSearchBox>
            <button onClick={handleSearchPanTo}>הצג</button>
          </div>

          <div className='map-container'>
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={warehouse.location.coordinates || defaultCenter}
              zoom={8}
              onClick={onMapClick}
              onLoad={(map) => (mapRef.current = map)}
              options={{ gestureHandling: 'greedy', scrollwheel: true }}
            >
              <Marker position={warehouse.location.coordinates} />
            </GoogleMap>
          </div>

          <div className='coordinates-display'>
            <p>
              <strong>קו רוחב:</strong> {warehouse.location.coordinates.lat.toFixed(6)} | <strong>קו אורך:</strong>{' '}
              {warehouse.location.coordinates.lng.toFixed(6)}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
