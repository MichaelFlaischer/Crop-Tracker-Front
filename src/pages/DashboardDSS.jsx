import { useEffect, useState } from 'react'
import { warehouseService } from '../services/warehouse.service.js'
import { cropService } from '../services/crop.service.js'
import { sowingAndHarvestService } from '../services/sowing-and-harvest.service.js'
import { customerOrderItemService } from '../services/customer-order-item.service.js'
import { fieldService } from '../services/field.service.js'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'
import { useNavigate } from 'react-router-dom'

export function DashboardDSS() {
  const [cropStats, setCropStats] = useState([])
  const [forecastData, setForecastData] = useState([])
  const [reservedData, setReservedData] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [forecastDetails, setForecastDetails] = useState({})
  const [growthTimeData, setGrowthTimeData] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [warehouses, crops, records, fields] = await Promise.all([
        warehouseService.query(),
        cropService.query(),
        sowingAndHarvestService.query(),
        fieldService.query(),
      ])

      const cropMap = crops.reduce((acc, crop) => {
        acc[crop._id.toString()] = crop
        return acc
      }, {})

      const cropInventory = {}

      warehouses.forEach((warehouse) => {
        warehouse.cropsStock?.forEach((item) => {
          const cropId = item.cropId?.toString?.()
          if (!cropId || !cropMap[cropId]) return
          if (!cropInventory[cropId]) {
            cropInventory[cropId] = { crop: cropMap[cropId], total: 0 }
          }
          cropInventory[cropId].total += item.quantity
        })
      })

      const reservedByCrop = await Promise.all(
        Object.keys(cropInventory).map(async (cropId) => {
          const draftItems = await customerOrderItemService.queryByCropAndStatus(cropId, 'טיוטה')
          const approvedItems = await customerOrderItemService.queryByCropAndStatus(cropId, 'מאושרת')
          const reserved = [...draftItems, ...approvedItems].reduce((sum, item) => sum + (item.quantity || 0), 0)
          return { cropId, reserved }
        })
      )

      const statList = []
      const reservedList = []
      const recommendationList = []
      const growthByCrop = []

      reservedByCrop.forEach(({ cropId, reserved }) => {
        const crop = cropInventory[cropId]?.crop
        const total = cropInventory[cropId]?.total || 0
        const available = total - reserved
        const min = typeof crop.businessMinValue === 'number' ? crop.businessMinValue : 0
        const max = typeof crop.businessMaxValue === 'number' ? crop.businessMaxValue : 100000

        statList.push({ name: crop.cropName, available })
        reservedList.push({ name: crop.cropName, reserved })

        if (available < min * 0.8) {
          recommendationList.push({ crop: crop.cropName, message: '🟠 כדאי לשקול שתילה מחודשת', action: () => navigate('/field'), label: 'מעבר לשדות' })
        } else if (available > max * 1.5) {
          recommendationList.push({
            crop: crop.cropName,
            message: '🟢 מלאי גבוה מאוד – שקול שיווק או מכירה במחיר מוזל',
            action: () => navigate('/orders/view'),
            label: 'מעבר להזמנות',
          })
        } else if (reserved > total * 0.9) {
          recommendationList.push({
            crop: crop.cropName,
            message: '⚠️ רוב המלאי שובץ להזמנות – שקול הרחבת שתילה',
            action: () => navigate('/crop'),
            label: 'מעבר ליבולים',
          })
        } else if (reserved === 0) {
          recommendationList.push({
            crop: crop.cropName,
            message: '🔴 אין ביקוש – שקול הפסקת שתילה או חיזוק שיווק',
            action: () => navigate('/clients'),
            label: 'מעבר ללקוחות',
          })
        } else {
          recommendationList.push({ crop: crop.cropName, message: '✅ אין פעולה נדרשת כעת' })
        }

        if (crop && crop.growthTime) {
          growthByCrop.push({ name: crop.cropName, days: crop.growthTime })
        }
      })

      const forecastList = records
        .map((rec) => {
          const crop = cropMap[rec.cropId?.toString?.()]
          if (!crop || !rec.sowingDate) return null
          const sowingDate = new Date(rec.sowingDate)
          const endDate = new Date(sowingDate)
          endDate.setDate(sowingDate.getDate() + (crop.growthTime || 90))
          return {
            name: crop.cropName,
            endDate,
            label: endDate.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' }),
          }
        })
        .filter(Boolean)

      forecastList.sort((a, b) => a.endDate - b.endDate)

      const groupedForecast = forecastList.reduce((acc, curr) => {
        acc[curr.label] = acc[curr.label] || { count: 0, crops: [] }
        acc[curr.label].count++
        acc[curr.label].crops.push(curr.name)
        return acc
      }, {})

      Object.entries(groupedForecast).forEach(([label, data]) => {
        if (data.count > 6) {
          recommendationList.push({ crop: 'תחזית', message: `🟡 בחודש ${label} צפויים להסתיים ${data.count} גידולים – שקול לפזר שתילות` })
        }
      })

      setCropStats(statList)
      setForecastData(Object.entries(groupedForecast).map(([label, data]) => ({ label, count: data.count, tooltip: data.crops.join(', ') })))
      setReservedData(reservedList)
      setForecastDetails(groupedForecast)
      setGrowthTimeData(growthByCrop)
      setRecommendations(recommendationList)
    } catch (err) {
      console.error('שגיאה בטעינת נתוני DSS:', err)
    }
  }

  return (
    <section className='dashboard-dss'>
      <h1>📊 לוח תובנות חקלאיות</h1>

      <h2>📊 כמות זמינה לפי יבול</h2>
      <ResponsiveContainer width='100%' height={300}>
        <BarChart data={cropStats}>
          <CartesianGrid strokeDasharray='3 3' />
          <XAxis dataKey='name' />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey='available' fill='#82ca9d' name='כמות זמינה' />
        </BarChart>
      </ResponsiveContainer>

      <h2>📈 תחזית יבולים לפי חודש סיום צפוי</h2>
      <ResponsiveContainer width='100%' height={300}>
        <LineChart data={forecastData}>
          <CartesianGrid strokeDasharray='3 3' />
          <XAxis dataKey='label' />
          <YAxis />
          <Tooltip
            content={({ label }) => {
              const crops = forecastDetails[label]?.crops || []
              return (
                <div className='custom-tooltip'>
                  <p>
                    <strong>חודש:</strong> {label}
                  </p>
                  <p>
                    <strong>גידולים:</strong> {crops.join(', ')}
                  </p>
                </div>
              )
            }}
          />
          <Legend />
          <Line type='monotone' dataKey='count' stroke='#8884d8' name='מספר גידולים צפויים' />
        </LineChart>
      </ResponsiveContainer>

      <h2>📦 כמות שובצה להזמנות לפי יבול</h2>
      <ResponsiveContainer width='100%' height={300}>
        <BarChart data={reservedData}>
          <CartesianGrid strokeDasharray='3 3' />
          <XAxis dataKey='name' />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey='reserved' fill='#ffc658' name='כמות שובצה להזמנות' />
        </BarChart>
      </ResponsiveContainer>

      <h2>⏳ זמן גידול ממוצע לפי יבול</h2>
      <ResponsiveContainer width='100%' height={300}>
        <BarChart data={growthTimeData}>
          <CartesianGrid strokeDasharray='3 3' />
          <XAxis dataKey='name' />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey='days' fill='#3f51b5' name='ימי גידול' />
        </BarChart>
      </ResponsiveContainer>

      <h2>🤖 המלצות DSS</h2>
      <ul className='dss-recommendations'>
        {recommendations.map((rec, idx) => (
          <li key={idx}>
            <strong>{rec.crop}:</strong> {rec.message} {rec.action && <button onClick={rec.action}>{rec.label}</button>}
          </li>
        ))}
      </ul>
    </section>
  )
}
