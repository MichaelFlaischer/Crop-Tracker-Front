import { useEffect, useState } from 'react'
import { cropService } from '../services/crop.service.js'
import { sowingAndHarvestService } from '../services/sowing-and-harvest.service.js'
import { fieldService } from '../services/field.service.js'

export function InventoryHistory() {
  const [history, setHistory] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadHistory()
  }, [])

  async function loadHistory() {
    try {
      const [records, crops, fields] = await Promise.all([sowingAndHarvestService.query(), cropService.query(), fieldService.query()])

      const cropMap = crops.reduce((acc, crop) => {
        acc[crop._id] = crop
        return acc
      }, {})

      const fieldMap = fields.reduce((acc, field) => {
        acc[field._id] = field
        return acc
      }, {})

      const historyList = []

      records.forEach((record) => {
        const crop = cropMap[record.cropId]
        const field = fieldMap[record.fieldId]
        if (!crop || !field || !record.harvests?.length) return

        record.harvests.forEach((harvest) => {
          historyList.push({
            cropName: crop.cropName,
            fieldName: field.fieldName,
            fieldSize: field.size,
            harvestDate: new Date(harvest.date).toLocaleDateString('he-IL', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            }),
            amount: harvest.amount,
            isFinal: harvest.isFinal,
            notes: harvest.notes || '-',
          })
        })
      })

      setHistory(historyList)
    } catch (err) {
      console.error('שגיאה בטעינת היסטוריית קציר:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className='inventory-history main-layout'>
      <h1>היסטוריית קציר לפי חלקות ויבולים</h1>
      {isLoading ? (
        <p>טוען נתונים...</p>
      ) : history.length === 0 ? (
        <p>לא קיימים נתוני קציר להצגה.</p>
      ) : (
        <table className='history-table'>
          <thead>
            <tr>
              <th>יבול</th>
              <th>חלקה</th>
              <th>שטח החלקה (בדונם)</th>
              <th>תאריך קציר</th>
              <th>כמות</th>
              <th>קציר סופי</th>
              <th>הערות</th>
            </tr>
          </thead>
          <tbody>
            {history.map((entry, idx) => (
              <tr key={idx}>
                <td data-label='יבול'>{entry.cropName}</td>
                <td data-label='חלקה'>{entry.fieldName}</td>
                <td data-label='שטח החלקה (בדונם)'>{entry.fieldSize}</td>
                <td data-label='תאריך קציר'>{entry.harvestDate}</td>
                <td data-label='כמות'>{entry.amount.toLocaleString('he-IL')} ק"ג</td>
                <td data-label='קציר סופי'>{entry.isFinal ? '✔️' : '⏳'}</td>
                <td data-label='הערות'>{entry.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
