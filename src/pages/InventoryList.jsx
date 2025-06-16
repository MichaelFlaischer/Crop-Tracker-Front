import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { warehouseService } from '../services/warehouse.service.js'
import { cropService } from '../services/crop.service.js'
import { sowingAndHarvestService } from '../services/sowing-and-harvest.service.js'
import { fieldService } from '../services/field.service.js'
import { customerOrderItemService } from '../services/customer-order-item.service.js'

export function InventoryList() {
  const [inventoryData, setInventoryData] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    loadInventory()
  }, [])

  async function loadInventory() {
    try {
      const [warehouses, crops, records, fields] = await Promise.all([
        warehouseService.query(),
        cropService.query(),
        sowingAndHarvestService.query(),
        fieldService.query(),
      ])

      const cropMap = crops.reduce((acc, crop) => {
        acc[crop._id] = crop
        return acc
      }, {})

      const fieldMap = fields.reduce((acc, field) => {
        acc[field._id] = field
        return acc
      }, {})

      const cropInventory = {}

      warehouses.forEach((warehouse) => {
        warehouse.cropsStock?.forEach((item) => {
          const cropId = item.cropId.toString()
          if (!cropInventory[cropId]) {
            cropInventory[cropId] = {
              crop: cropMap[cropId],
              total: 0,
              warehouses: [],
              fields: [],
              reserved: 0,
              available: 0,
              status: '',
              statusColor: '',
              recommendation: '',
            }
          }
          cropInventory[cropId].total += item.quantity
          cropInventory[cropId].warehouses.push({
            name: warehouse.warehouseName,
            quantity: item.quantity,
          })
        })
      })

      const allCropIds = Object.keys(cropInventory)

      const reservedByCrop = await Promise.all(
        allCropIds.map(async (cropId) => {
          const draftItems = await customerOrderItemService.queryByCropAndStatus(cropId, 'טיוטה')
          const approvedItems = await customerOrderItemService.queryByCropAndStatus(cropId, 'מאושרת')
          const reserved = [...draftItems, ...approvedItems].reduce((sum, item) => sum + (item.quantity || 0), 0)
          return { cropId, reserved }
        })
      )

      reservedByCrop.forEach(({ cropId, reserved }) => {
        if (cropInventory[cropId]) {
          cropInventory[cropId].reserved = reserved
          cropInventory[cropId].available = cropInventory[cropId].total - reserved
        }
      })

      records.forEach((record) => {
        if (!record.isActive) return
        const cropId = record.cropId.toString()
        const crop = cropInventory[cropId]
        const field = fieldMap[record.fieldId]
        if (!crop || !field) return

        const sowingDate = new Date(record.sowingDate)
        const expectedEnd = new Date(sowingDate)
        expectedEnd.setDate(sowingDate.getDate() + crop.crop.growthTime)

        crop.fields.push({
          name: field.fieldName,
          remainingDays: Math.max(Math.ceil((expectedEnd - new Date()) / (1000 * 60 * 60 * 24)), 0),
        })
      })

      Object.values(cropInventory).forEach((entry) => {
        const { crop, total, reserved, available } = entry
        const min = crop.businessMinValue || 0
        const max = crop.businessMaxValue || 100000

        entry.minFormatted = min.toLocaleString('he-IL')
        entry.maxFormatted = max.toLocaleString('he-IL')

        if (total < min * 0.8) {
          entry.status = '❌ נמוך מאוד'
          entry.statusColor = 'danger'
        } else if (total < min) {
          entry.status = '⚠️ מתחת לרף'
          entry.statusColor = 'warning'
        } else if (total >= min && total <= max) {
          entry.status = '✅ תקין'
          entry.statusColor = 'safe'
        } else if (total > max && total <= max * 1.2) {
          entry.status = '⚠️ כמעט עודף'
          entry.statusColor = 'warning'
        } else {
          entry.status = '❌ עודף חריג'
          entry.statusColor = 'danger'
        }

        // DSS Recommendation
        if (available < min * 0.8) {
          entry.recommendation = 'שקול שתילה של יבול נוסף'
          entry.recommendationAction = () => navigate('/field')
          entry.recommendationLabel = 'מעבר לחלקות'
        } else if (available > max * 1.2) {
          entry.recommendation = 'כדאי למכור את המלאי בעודף'
          entry.recommendationAction = () => navigate('/orders/view')
          entry.recommendationLabel = 'מעבר להזמנות'
        } else {
          entry.recommendation = ''
        }
      })

      setInventoryData(Object.values(cropInventory))
    } catch (err) {
      console.error('שגיאה בטעינת מלאי:', err)
    }
  }

  return (
    <section className='inventory-list main-layout'>
      <h1>מלאי יבול והמלצות DSS</h1>
      <div className='inventory-cards'>
        {inventoryData.map((entry) => (
          <div className={`inventory-card ${entry.statusColor}`} key={entry.crop._id}>
            <h2>{entry.crop.cropName}</h2>
            <p>
              <strong>סה"כ במלאי:</strong> {entry.total.toLocaleString('he-IL')} ק"ג
            </p>
            <p>
              <strong>שובץ להזמנות:</strong> {entry.reserved.toLocaleString('he-IL')} ק"ג
            </p>
            <p>
              <strong>זמין לשיבוץ:</strong> {entry.available.toLocaleString('he-IL')} ק"ג
            </p>
            <p>
              <strong>טווח כמות נדרש לעסק:</strong>
              <br />
              מינימום: <span>{entry.minFormatted} ק"ג</span> | מקסימום: <span>{entry.maxFormatted} ק"ג</span>
            </p>
            <p>
              <strong>סטטוס:</strong> <span className='status-label'>{entry.status}</span>
            </p>

            {entry.recommendation && (
              <div className='recommendation-box'>
                <p>
                  <strong>📌 המלצה:</strong> {entry.recommendation}
                </p>
                <button onClick={entry.recommendationAction}>{entry.recommendationLabel}</button>
              </div>
            )}

            <div>
              <h4>📦 פירוט לפי מחסנים:</h4>
              <ul>
                {entry.warehouses.map((wh, idx) => (
                  <li key={idx}>
                    {wh.name} – {wh.quantity.toLocaleString('he-IL')} ק"ג
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4>🌾 חלקות פעילות:</h4>
              {entry.fields.length ? (
                <ul>
                  {entry.fields.map((f, idx) => (
                    <li key={idx}>
                      {f.name} – {f.remainingDays} ימים לסיום
                    </li>
                  ))}
                </ul>
              ) : (
                <p>אין חלקות פעילות</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
