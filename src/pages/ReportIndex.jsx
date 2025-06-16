import { useEffect, useState } from 'react'
import { cropService } from '../services/crop.service.js'
import { sowingAndHarvestService } from '../services/sowing-and-harvest.service.js'
import { warehouseService } from '../services/warehouse.service.js'
import { customerOrderItemService } from '../services/customer-order-item.service.js'
import { fieldService } from '../services/field.service.js'

export function ReportIndex() {
  const [report, setReport] = useState({})

  useEffect(() => {
    loadReport()
  }, [])

  async function loadReport() {
    try {
      const [crops, records, warehouses, orderItems, fields] = await Promise.all([
        cropService.query(),
        sowingAndHarvestService.query(),
        warehouseService.query(),
        customerOrderItemService.query(),
        fieldService.query(),
      ])

      const cropMap = crops.reduce((map, crop) => {
        map[crop._id] = crop.cropName
        return map
      }, {})

      const fieldMap = fields.reduce((map, field) => {
        map[field._id] = field.fieldName
        return map
      }, {})

      const totalCrops = crops.length

      const warehouseBreakdown = warehouses.map((wh) => {
        const total = wh.cropsStock?.reduce((s, item) => s + (item.quantity || 0), 0) || 0
        const crops = wh.cropsStock?.map((item) => ({ cropId: item.cropId, quantity: item.quantity, cropName: cropMap[item.cropId] || item.cropId })) || []
        return {
          warehouseName: wh.name || wh.warehouseName || 'מחסן ללא שם',
          total,
          crops,
        }
      })

      const totalInventoryKg = warehouseBreakdown.reduce((sum, wh) => sum + wh.total, 0)

      const totalOrderItems = orderItems.length

      const activeFieldRecords = records.filter((rec) => rec.isActive)
      const activeFields = activeFieldRecords.length
      const activeFieldsList = activeFieldRecords.map((rec) => fieldMap[rec.fieldId] || rec.fieldId)

      setReport({
        totalCrops,
        cropNames: crops.map((c) => c.cropName),
        totalInventoryKg,
        warehouseBreakdown,
        totalOrderItems,
        activeFields,
        activeFieldsList,
      })
    } catch (err) {
      console.error('שגיאה בטעינת סקירה כללית:', err)
    }
  }

  return (
    <section className='report-index main-layout'>
      <h1>📊 סקירה כללית של המערכת</h1>

      <p style={{ marginBottom: '1.5rem' }}>
        עמוד זה מציג מבט כולל על מצב המערכת: כמות היבולים, מלאי במחסנים, היקף הפריטים בהזמנות וחלקות שבהן מתבצע גידול פעיל.
      </p>

      <ul className='report-summary'>
        <li>
          🌱 <strong>מספר היבולים במערכת:</strong> {report.totalCrops} <br />
          (כולל כל סוגי היבולים - פעילים ולא פעילים)
          <ul>
            {report.cropNames?.map((name, idx) => (
              <li key={idx}>{name}</li>
            ))}
          </ul>
        </li>

        <li>
          📦 <strong>סה"כ מלאי נוכחי בכל המחסנים:</strong> {report.totalInventoryKg?.toLocaleString('he-IL')} ק"ג
          <br />
          (כולל כלל הכמויות מכל היבולים בכל המחסנים)
          <ul>
            {report.warehouseBreakdown?.map((wh, idx) => (
              <li key={idx}>
                <strong>{wh.warehouseName}:</strong> {wh.total.toLocaleString('he-IL')} ק"ג
                <ul>
                  {wh.crops.map((c, i) => (
                    <li key={i}>
                      {c.cropName}: {c.quantity?.toLocaleString('he-IL')} ק"ג
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </li>

        <li>
          📋 <strong>סה"כ פריטים בכל ההזמנות:</strong> {report.totalOrderItems}
        </li>

        <li>
          🧑‍🌾 <strong>חלקות לגידול יבולים עם גידול פעיל:</strong> {report.activeFields} <br />
          (מספר החלקות שבהן מתבצע גידול פעיל לפי רשומות זריעה)
          <ul>
            {report.activeFieldsList?.map((fieldName, idx) => (
              <li key={idx}>{fieldName}</li>
            ))}
          </ul>
        </li>
      </ul>
    </section>
  )
}
