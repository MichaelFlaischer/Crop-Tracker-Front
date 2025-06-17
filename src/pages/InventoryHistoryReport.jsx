import { useEffect, useState } from 'react'
import { sowingAndHarvestService } from '../services/sowing-and-harvest.service.js'
import { cropService } from '../services/crop.service.js'
import { fieldService } from '../services/field.service.js'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { registerLocale } from 'react-datepicker'
import he from 'date-fns/locale/he'

registerLocale('he', he)

export function InventoryHistoryReport() {
  const [records, setRecords] = useState([])
  const [crops, setCrops] = useState([])
  const [fields, setFields] = useState([])
  const [filter, setFilter] = useState({ from: '', to: '' })
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [sowingData, cropsData, fieldsData] = await Promise.all([sowingAndHarvestService.query(), cropService.query(), fieldService.query()])
      setRecords(sowingData)
      setCrops(cropsData)
      setFields(fieldsData)
    } catch (err) {
      console.error('❌ שגיאה בטעינת נתונים', err)
    }
  }

  const cropsMap = crops.reduce((map, crop) => {
    map[crop._id] = crop.cropName
    return map
  }, {})

  const fieldsMap = fields.reduce((map, field) => {
    map[field._id] = field.fieldName
    return map
  }, {})

  function formatDate(dateStr) {
    const date = new Date(dateStr)
    if (!(date instanceof Date) || isNaN(date)) return '—'
    return date.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  let serialCounter = 1
  let filteredRows = records.flatMap((record, i) => {
    const cropName = cropsMap[String(record.cropId)] || 'לא ידוע'
    const fieldName = fieldsMap[String(record.fieldId)] || 'לא ידוע'
    const sowingDateObj = record.sowingDate ? new Date(record.sowingDate) : null
    const sowingDate = sowingDateObj ? formatDate(record.sowingDate) : '—'

    if (!Array.isArray(record.harvestLogs) || record.harvestLogs.length === 0) {
      return [
        {
          id: `${i}-empty`,
          serialNumber: serialCounter++,
          cropName,
          fieldName,
          sowingDate,
          harvestDate: '—',
          amount: '—',
          notes: 'אין קצירים',
          daysSinceSowing: '—',
          sortHarvestDate: null,
          sortSowingDate: sowingDateObj,
          sortDaysSinceSowing: null,
          sortAmount: null,
        },
      ]
    }

    return record.harvestLogs
      .map((log, j) => {
        const harvestDateObj = new Date(log.date)
        if (!(harvestDateObj instanceof Date) || isNaN(harvestDateObj)) return null

        const from = filter.from ? new Date(filter.from) : null
        const to = filter.to ? new Date(filter.to) : null
        if (from && harvestDateObj < from) return null
        if (to && harvestDateObj > to) return null

        const daysSinceSowing = sowingDateObj && !isNaN(sowingDateObj) ? Math.round((harvestDateObj - sowingDateObj) / (1000 * 60 * 60 * 24)) : '—'

        return {
          id: `${i}-${j}`,
          serialNumber: serialCounter++,
          cropName,
          fieldName,
          sowingDate,
          harvestDate: formatDate(log.date),
          amount: log.amount,
          notes: log.notes || '',
          daysSinceSowing,
          sortHarvestDate: harvestDateObj,
          sortSowingDate: sowingDateObj,
          sortDaysSinceSowing: daysSinceSowing,
          sortAmount: log.amount,
        }
      })
      .filter(Boolean)
  })

  if (sortConfig.key) {
    filteredRows.sort((a, b) => {
      let valA = a[sortConfig.key]
      let valB = b[sortConfig.key]

      if (['harvestDate', 'sowingDate', 'daysSinceSowing', 'amount'].includes(sortConfig.key)) {
        const keyMap = {
          harvestDate: 'sortHarvestDate',
          sowingDate: 'sortSowingDate',
          daysSinceSowing: 'sortDaysSinceSowing',
          amount: 'sortAmount',
        }
        valA = a[keyMap[sortConfig.key]]
        valB = b[keyMap[sortConfig.key]]
      }

      if (valA === '—') return 1
      if (valB === '—') return -1

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }

  function handleSort(key) {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  function exportToExcel() {
    const data = filteredRows.map((row) => ({
      'מס"ד': row.serialNumber,
      יבול: row.cropName,
      חלקה: row.fieldName,
      'תאריך שתילה': row.sowingDate,
      'תאריך קציר': row.harvestDate,
      'ימים מהשתילה': row.daysSinceSowing,
      כמות: row.amount,
      הערות: row.notes,
    }))

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'דוח קציר')
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' })
    saveAs(blob, 'דוח_קציר.xlsx')
  }

  return (
    <section className='inventory-history-report'>
      <h2>📋 כל רשומות השתילה והקציר לפי חלקות</h2>

      <div className='filters'>
        <label>
          מתאריך:
          <DatePicker
            selected={filter.from ? new Date(filter.from) : null}
            onChange={(date) => setFilter((prev) => ({ ...prev, from: date ? date.toISOString() : '' }))}
            dateFormat='dd/MM/yyyy'
            locale='he'
            className='custom-datepicker'
            placeholderText='בחר תאריך התחלה'
          />
        </label>
        <label>
          עד תאריך:
          <DatePicker
            selected={filter.to ? new Date(filter.to) : null}
            onChange={(date) => setFilter((prev) => ({ ...prev, to: date ? date.toISOString() : '' }))}
            dateFormat='dd/MM/yyyy'
            locale='he'
            className='custom-datepicker'
            placeholderText='בחר תאריך סיום'
          />
        </label>
        <button onClick={exportToExcel}>📤 ייצוא לאקסל</button>
      </div>

      <table className='history-table'>
        <thead>
          <tr>
            <th onClick={() => handleSort('serialNumber')}>מס"ד</th>
            <th onClick={() => handleSort('cropName')}>יבול</th>
            <th onClick={() => handleSort('fieldName')}>חלקה</th>
            <th onClick={() => handleSort('sowingDate')}>תאריך שתילה</th>
            <th onClick={() => handleSort('harvestDate')}>תאריך קציר</th>
            <th onClick={() => handleSort('daysSinceSowing')}>ימים מהשתילה</th>
            <th onClick={() => handleSort('amount')}>כמות</th>
            <th onClick={() => handleSort('notes')}>הערות</th>
          </tr>
        </thead>
        <tbody>
          {filteredRows.length === 0 ? (
            <tr>
              <td colSpan='8'>אין נתונים להצגה</td>
            </tr>
          ) : (
            filteredRows.map((row) => (
              <tr key={row.id}>
                <td data-label='מס"ד'>{row.serialNumber}</td>
                <td data-label='יבול'>{row.cropName}</td>
                <td data-label='חלקה'>{row.fieldName}</td>
                <td data-label='תאריך שתילה'>{row.sowingDate}</td>
                <td data-label='תאריך קציר'>{row.harvestDate}</td>
                <td data-label='ימים מהשתילה'>{row.daysSinceSowing}</td>
                <td data-label='כמות'>{row.amount}</td>
                <td data-label='הערות'>{row.notes}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  )
}
