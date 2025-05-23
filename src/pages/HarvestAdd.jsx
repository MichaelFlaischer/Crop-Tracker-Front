import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { sowingAndHarvestService } from '../services/sowing-and-harvest.service.js'
import { fieldService } from '../services/field.service.js'
import { cropService } from '../services/crop.service.js'
import { warehouseService } from '../services/warehouse.service.js'
import { Switch } from '@headlessui/react'

export function HarvestAdd() {
  const { sowingId } = useParams()
  const [sowingRecord, setSowingRecord] = useState(null)
  const [fieldName, setFieldName] = useState('')
  const [cropName, setCropName] = useState('')
  const [estimatedHarvestDate, setEstimatedHarvestDate] = useState('')
  const [daysLeft, setDaysLeft] = useState(0)
  const [log, setLog] = useState({ date: '', amount: '', notes: '', completeHarvest: false, warehouseId: '' })
  const [warehouses, setWarehouses] = useState([])
  const [warehouseCapacities, setWarehouseCapacities] = useState({})
  const navigate = useNavigate()

  useEffect(() => {
    async function loadRecord() {
      try {
        const record = await sowingAndHarvestService.getById(sowingId)
        setSowingRecord(record)
        setLog((prev) => ({ ...prev, date: new Date().toISOString().slice(0, 10) }))

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

        if (record.sowingDate && crop?.growthTime) {
          const sowingDate = new Date(record.sowingDate)
          const harvestEstimate = new Date(sowingDate)
          harvestEstimate.setDate(sowingDate.getDate() + crop.growthTime)
          setEstimatedHarvestDate(harvestEstimate.toLocaleDateString('he-IL'))

          const now = new Date()
          const msPerDay = 1000 * 60 * 60 * 24
          const diff = Math.ceil((harvestEstimate - now) / msPerDay)
          setDaysLeft(diff > 0 ? diff : 0)
        }
      } catch (err) {
        console.error('שגיאה בטעינת נתוני שתילה:', err)
      }
    }
    loadRecord()
  }, [sowingId])

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
          🧑‍🌾 שדה: <strong>{fieldName}</strong>
        </p>
        <p>
          🌾 יבול: <strong>{cropName}</strong>
        </p>
        <p>
          📅 תאריך שתילה: <strong>{new Date(sowingRecord.sowingDate).toLocaleDateString('he-IL')}</strong>
        </p>
        {estimatedHarvestDate && (
          <p>
            🗓️ תאריך קציר משוער: <strong>{estimatedHarvestDate}</strong>
            <span style={{ fontSize: '0.85rem', color: '#6b7280' }}> ({daysLeft} ימים נותרו)</span>
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <label>
          תאריך קציר:
          <input type='date' name='date' value={log.date} onChange={handleChange} required />
        </label>

        <label>
          כמות שנקצרה (בק"ג):
          <input
            type='number'
            name='amount'
            value={log.amount}
            onChange={handleChange}
            required
            placeholder={`מקסימום למחסן שנבחר: ${warehouseCapacities[log.warehouseId] || 0} ק"ג`}
          />
        </label>

        <label>
          מחסן להעברה (קיבולת פנויה תוצג):
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
          <span>סיום גידול – השדה מוכן לשתילה חדשה</span>
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
