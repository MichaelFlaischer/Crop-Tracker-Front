import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cropService } from '../services/crop.service.js'
import { warehouseService } from '../services/warehouse.service.js'
import { sowingAndHarvestService } from '../services/sowing-and-harvest.service.js'
import { fieldService } from '../services/field.service.js'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service.js'

export function CropIndex() {
  const [crops, setCrops] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [sowings, setSowings] = useState([])
  const [fields, setFields] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setIsLoading(true)
    try {
      const [crops, warehouses, sowings, fields] = await Promise.all([
        cropService.query(),
        warehouseService.query(),
        sowingAndHarvestService.query(),
        fieldService.query(),
      ])
      setCrops(crops)
      setWarehouses(warehouses)
      setSowings(sowings)
      setFields(fields)
    } catch (err) {
      console.error('שגיאה בטעינת נתונים', err)
      showErrorMsg('שגיאה בטעינת נתונים')
    } finally {
      setIsLoading(false)
    }
  }

  function onViewDetails(cropId) {
    navigate(`/crop/${cropId}`)
  }

  function onEditCrop(cropId) {
    navigate(`/crop/edit/${cropId}`)
  }

  async function onDeleteCrop(cropId) {
    const crop = crops.find((c) => c._id === cropId)
    const isConfirmed = window.confirm(`האם אתה בטוח שברצונך למחוק את היבול "${crop?.cropName}"?`)
    if (!isConfirmed) return
    try {
      await cropService.remove(cropId)
      showSuccessMsg('היבול נמחק בהצלחה')
      setCrops((prev) => prev.filter((c) => c._id !== cropId))
    } catch (err) {
      console.error('שגיאה במחיקת יבול', err)
      showErrorMsg('שגיאה במחיקת יבול')
    }
  }

  function onAddCrop() {
    navigate('/crop/add')
  }

  function getCropSummary(cropId) {
    const cropIdStr = cropId.toString()
    const crop = crops.find((c) => c._id?.toString() === cropIdStr)

    const inWarehouses = warehouses.reduce((acc, w) => {
      const cropStock = w.cropsStock?.filter((cs) => cs.cropId?.toString() === cropIdStr) || []
      const total = cropStock.reduce((sum, cs) => sum + (cs.quantity || 0), 0)
      return acc + total
    }, 0)

    const growingInFields = sowings
      .filter((s) => s.cropId?.toString() === cropIdStr && s.isActive)
      .map((s) => {
        const field = fields.find((f) => f._id?.toString() === s.fieldId?.toString())
        const sowingDate = new Date(s.sowingDate)
        let expectedHarvest = 'לא ידוע'
        if (crop?.growthTime) {
          const estimatedDate = new Date(sowingDate)
          estimatedDate.setDate(estimatedDate.getDate() + crop.growthTime)
          expectedHarvest = estimatedDate
        }
        return {
          fieldName: field?.fieldName || 'שדה לא מזוהה',
          sowingDate: sowingDate,
          expectedHarvest: expectedHarvest,
        }
      })

    return { inWarehouses, growingInFields }
  }

  if (isLoading) return <div className='loader'>טוען נתונים...</div>

  return (
    <section className='crop-index main-layout'>
      <h1>רשימת יבולים</h1>
      <button className='btn-add' onClick={onAddCrop}>
        ➕ הוספת יבול חדש
      </button>

      {crops.length === 0 ? (
        <p>לא נמצאו יבולים.</p>
      ) : (
        <table className='crop-table'>
          <thead>
            <tr>
              <th>שם היבול</th>
              <th>תיאור</th>
              <th>כמות במחסן (ק״ג)</th>
              <th>גידול פעיל</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {crops.map((crop) => {
              const summary = getCropSummary(crop._id)
              return (
                <tr key={crop._id}>
                  <td>{crop.cropName}</td>
                  <td>{crop.description}</td>
                  <td>{summary.inWarehouses.toLocaleString('he-IL')}</td>
                  <td>
                    {summary.growingInFields.length === 0 ? (
                      '—'
                    ) : (
                      <ul>
                        {summary.growingInFields.map((f, idx) => (
                          <li key={idx}>
                            <strong>{f.fieldName}</strong> | שתילה: {f.sowingDate.toLocaleDateString('he-IL')} | קציר צפוי:{' '}
                            {typeof f.expectedHarvest === 'string' ? f.expectedHarvest : f.expectedHarvest.toLocaleDateString('he-IL')}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className='actions'>
                    <button onClick={() => onViewDetails(crop._id)}>צפייה</button>
                    <button onClick={() => onEditCrop(crop._id)}>עריכה</button>
                    <button className='danger' onClick={() => onDeleteCrop(crop._id)}>
                      מחיקה
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </section>
  )
}
