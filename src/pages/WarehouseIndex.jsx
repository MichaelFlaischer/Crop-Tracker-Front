import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'
import { warehouseService } from '../services/warehouse.service.js'
import { cropService } from '../services/crop.service.js'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service.js'

const containerStyle = {
  width: '100%',
  height: '100%',
}

const GOOGLE_MAP_LIBRARIES = ['geometry', 'places']

const center = { lat: 32.0, lng: 35.0 }

export function WarehouseIndex() {
  const [warehouses, setWarehouses] = useState([])
  const [cropsMap, setCropsMap] = useState({})
  const [activeWarehouseId, setActiveWarehouseId] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const mapRef = useRef(null)
  const navigate = useNavigate()

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAP_LIBRARIES,
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [warehouseData, cropData] = await Promise.all([warehouseService.query(), cropService.query()])

      const cropMap = cropData.reduce((acc, crop) => {
        acc[String(crop._id)] = crop.cropName
        return acc
      }, {})

      setCropsMap(cropMap)
      setWarehouses(warehouseData)
    } catch (err) {
      console.error('Failed to load warehouses or crops:', err)
      showErrorMsg('שגיאה בטעינת נתונים')
    }
  }

  async function onDeleteWarehouse(id) {
    if (!confirm('האם אתה בטוח שברצונך למחוק את המחסן?')) return
    try {
      await warehouseService.remove(id)
      setWarehouses((prev) => prev.filter((wh) => wh._id !== id))
      showSuccessMsg('המחסן נמחק בהצלחה')
    } catch (err) {
      console.error('מחיקת מחסן נכשלה:', err)
      showErrorMsg('שגיאה במחיקת מחסן')
    }
  }

  function getUsedCapacity(cropsStock = []) {
    return cropsStock.reduce((sum, crop) => sum + crop.quantity, 0)
  }

  function getCapacityStatus(used, capacity) {
    if (used === 0) return 'ריק'
    if (used === capacity) return 'מלא'
    if (used >= capacity * 0.95) return 'כמעט מלא'
    return 'חלקי'
  }

  function getTooltipText(cropsStock = []) {
    return cropsStock.map((crop) => `${cropsMap[String(crop.cropId)] || 'לא ידוע'}: ${crop.quantity} ק"ג`).join(' | ')
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  function focusOnWarehouse(lat, lng, id) {
    if (!mapRef.current) return
    setActiveWarehouseId(id)
    mapRef.current.panTo({ lat, lng })
    mapRef.current.setZoom(13)
  }

  function resetMapView() {
    if (!mapRef.current) return
    mapRef.current.panTo(center)
    mapRef.current.setZoom(8)
    setActiveWarehouseId(null)
  }

  const filteredWarehouses = warehouses.filter((wh) => {
    const used = getUsedCapacity(wh.cropsStock)
    const status = getCapacityStatus(used, wh.capacity)
    return filterStatus === 'all' || status === filterStatus
  })

  return (
    <section className='warehouse-index split-layout'>
      <div className='cards-container'>
        <h1>ניהול מחסנים</h1>
        <div className='filter-controls'>
          <label>סנן לפי סטטוס: </label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value='all'>הכל</option>
            <option value='ריק'>ריק</option>
            <option value='חלקי'>חלקי</option>
            <option value='כמעט מלא'>כמעט מלא</option>
            <option value='מלא'>מלא</option>
          </select>
        </div>

        <button onClick={() => navigate('/warehouse/add')} className='btn add-btn'>
          ➕ הוסף מחסן
        </button>
        <button onClick={resetMapView} className='btn reset-btn'>
          🎯 הצג את כל המחסנים
        </button>

        <div className='warehouse-cards'>
          {filteredWarehouses.map((wh) => {
            const used = getUsedCapacity(wh.cropsStock)
            const usagePercentage = Math.round((used / wh.capacity) * 100)
            const status = getCapacityStatus(used, wh.capacity)

            let lastUpdatedCrop = null
            if (wh.cropsStock?.length > 0) {
              const latest = wh.cropsStock
                .filter((c) => !!c.lastUpdated)
                .map((c) => new Date(c.lastUpdated))
                .filter((d) => !isNaN(d))
              if (latest.length > 0) {
                lastUpdatedCrop = latest.reduce((latest, curr) => (curr > latest ? curr : latest))
              }
            }

            return (
              <div
                key={wh._id}
                className={`warehouse-card ${wh._id === activeWarehouseId ? 'active' : ''}`}
                onClick={() => wh.location?.coordinates && focusOnWarehouse(wh.location.coordinates.lat, wh.location.coordinates.lng, wh._id)}
              >
                <h2>{wh.warehouseName}</h2>
                <p>
                  <strong>אזור:</strong> {wh.location?.region || 'לא צויין'}
                </p>
                <p>
                  <strong>קיבולת:</strong> {wh.capacity} ק"ג
                </p>
                <p title={getTooltipText(wh.cropsStock)}>
                  <strong>בשימוש:</strong> {used} ק"ג ({usagePercentage}%)
                </p>
                <p className={`status ${status === 'ריק' ? 'empty' : status === 'כמעט מלא' ? 'full' : 'partial'}`}>
                  <strong>סטטוס:</strong> {status}
                </p>
                {wh.notes && (
                  <p>
                    <strong>הערות:</strong> {wh.notes}
                  </p>
                )}
                {lastUpdatedCrop && (
                  <p>
                    <strong>עודכן לאחרונה:</strong> {formatDate(lastUpdatedCrop)}
                  </p>
                )}
                <button className='btn edit-btn' onClick={() => navigate(`/warehouse/edit/${wh._id}`)}>
                  ערוך
                </button>
                {used === 0 ? (
                  <button className='btn delete-btn' onClick={() => onDeleteWarehouse(wh._id)}>
                    מחק
                  </button>
                ) : (
                  <button className='btn delete-btn disabled' title='לא ניתן למחוק מחסן שמכיל יבול' disabled>
                    מחק
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className='map-container'>
        {isLoaded && (
          <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={8} onLoad={(map) => (mapRef.current = map)}>
            {warehouses.map(
              (wh) =>
                wh.location?.coordinates && (
                  <Marker
                    key={wh._id}
                    position={{
                      lat: wh.location.coordinates.lat,
                      lng: wh.location.coordinates.lng,
                    }}
                    onClick={() => focusOnWarehouse(wh.location.coordinates.lat, wh.location.coordinates.lng, wh._id)}
                    label={wh.warehouseName}
                    title={getTooltipText(wh.cropsStock)}
                  />
                )
            )}
          </GoogleMap>
        )}
      </div>
    </section>
  )
}
