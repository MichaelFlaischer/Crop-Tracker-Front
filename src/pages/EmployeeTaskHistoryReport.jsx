import { useEffect, useState } from 'react'
import { taskService } from '../services/task.service.js'
import { employeesInTaskService } from '../services/employees-in-task.service.js'
import { customerOrderService } from '../services/customer-order.service.js'
import { fieldService } from '../services/field.service.js'
import { cropService } from '../services/crop.service.js'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

export function EmployeeTaskHistoryReport() {
  const [tasks, setTasks] = useState([])
  const [orders, setOrders] = useState([])
  const [fields, setFields] = useState([])
  const [crops, setCrops] = useState([])
  const [sortBy, setSortBy] = useState({ key: null, asc: true })
  const DELIVERY_OPERATION_ID = '68354fa1d29fa199e95c04d8'

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [allTasks, allOrders, allFields, allCrops] = await Promise.all([
        taskService.query(),
        customerOrderService.query(),
        fieldService.query(),
        cropService.query(),
      ])

      setTasks(allTasks)
      setOrders(allOrders)
      setFields(allFields)
      setCrops(allCrops)
    } catch (err) {
      console.error('שגיאה בטעינת נתונים:', err)
    }
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr)
    return isNaN(d) ? '—' : d.toLocaleDateString('he-IL')
  }

  function translateStatus(status) {
    const map = {
      pending: 'בהמתנה',
      'in-progress': 'בתהליך',
      done: 'הושלמה',
      delayed: 'נדחתה',
      missed: 'לא בוצעה',
    }
    return map[status] || status
  }

  function handleSort(key) {
    setSortBy((prev) => ({
      key,
      asc: prev.key === key ? !prev.asc : true,
    }))
  }

  const orderMap = orders.reduce((map, order) => {
    map[order._id] = order
    return map
  }, {})

  const fieldMap = fields.reduce((map, field) => {
    map[field._id] = field.fieldName
    return map
  }, {})

  const cropMap = crops.reduce((map, crop) => {
    map[crop._id] = crop.cropName
    return map
  }, {})

  const deliveryTasks = tasks.filter((t) => `${t.operationId}` === `${DELIVERY_OPERATION_ID}`)
  const regularTasks = tasks.filter((t) => `${t.operationId}` !== `${DELIVERY_OPERATION_ID}`)

  const sortedDelivery = [...deliveryTasks].sort((a, b) => {
    const key = sortBy.key
    if (!key) return 0
    const valA = a[key] || ''
    const valB = b[key] || ''
    if (key.toLowerCase().includes('date')) {
      return sortBy.asc ? new Date(valA) - new Date(valB) : new Date(valB) - new Date(valA)
    }
    return sortBy.asc ? valA.localeCompare(valB) : valB.localeCompare(valA)
  })

  const sortedRegular = [...regularTasks].sort((a, b) => {
    const key = sortBy.key
    if (!key) return 0
    const valA = a[key] || ''
    const valB = b[key] || ''
    if (key.toLowerCase().includes('date')) {
      return sortBy.asc ? new Date(valA) - new Date(valB) : new Date(valB) - new Date(valA)
    }
    return sortBy.asc ? valA.localeCompare(valB) : valB.localeCompare(valA)
  })

  function exportToExcel(data, filename) {
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Data')
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' })
    saveAs(blob, filename)
  }

  return (
    <section className='employee-task-history'>
      <h2>📋 היסטוריית משימות ומשלוחים</h2>

      {deliveryTasks.length > 0 && (
        <>
          <h3>🚚 משלוחים</h3>
          <button
            onClick={() =>
              exportToExcel(
                sortedDelivery.map((task, idx) => ({
                  'מס"ד': idx + 1,
                  'שם לקוח': task.taskDescription?.replace('משלוח ללקוח: ', ''),
                  'מספר הזמנה': task.fieldId,
                  'תאריך הספקה': formatDate(task.startDate),
                  סטטוס: translateStatus(task.status),
                })),
                'משלוחים.xlsx'
              )
            }
          >
            📤 ייצוא לאקסל
          </button>
          <table>
            <thead>
              <tr>
                <th>מס"ד</th>
                <th onClick={() => handleSort('taskDescription')}>שם לקוח</th>
                <th onClick={() => handleSort('fieldId')}>מספר הזמנה</th>
                <th onClick={() => handleSort('startDate')}>תאריך הספקה</th>
                <th onClick={() => handleSort('status')}>סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {sortedDelivery.map((task, idx) => (
                <tr key={task._id}>
                  <td>{idx + 1}</td>
                  <td>{task.taskDescription?.replace('משלוח ללקוח: ', '')}</td>
                  <td>{task.fieldId}</td>
                  <td>{formatDate(task.startDate)}</td>
                  <td>{translateStatus(task.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {regularTasks.length > 0 && (
        <>
          <h3>🌿 משימות רגילות</h3>
          <button
            onClick={() =>
              exportToExcel(
                sortedRegular.map((task, idx) => ({
                  'מס"ד': idx + 1,
                  'שם פעולה': task.taskDescription,
                  שדה: fieldMap[task.fieldId] || '—',
                  יבול: cropMap[task.cropId] || '—',
                  'תאריך התחלה': formatDate(task.startDate),
                  'שעת התחלה': task.startTime,
                  'תאריך סיום': formatDate(task.endDate),
                  'שעת סיום': task.endTime,
                  סטטוס: translateStatus(task.status),
                })),
                'משימות.xlsx'
              )
            }
          >
            📤 ייצוא לאקסל
          </button>
          <table>
            <thead>
              <tr>
                <th>מס"ד</th>
                <th onClick={() => handleSort('taskDescription')}>שם פעולה</th>
                <th onClick={() => handleSort('fieldId')}>שדה</th>
                <th onClick={() => handleSort('startDate')}>תאריך התחלה</th>
                <th onClick={() => handleSort('startTime')}>שעת התחלה</th>
                <th onClick={() => handleSort('endDate')}>תאריך סיום</th>
                <th onClick={() => handleSort('endTime')}>שעת סיום</th>
                <th onClick={() => handleSort('status')}>סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {sortedRegular.map((task, idx) => (
                <tr key={task._id}>
                  <td>{idx + 1}</td>
                  <td>{task.taskDescription}</td>
                  <td>{fieldMap[task.fieldId] || '—'}</td>
                  <td>{formatDate(task.startDate)}</td>
                  <td>{task.startTime}</td>
                  <td>{formatDate(task.endDate)}</td>
                  <td>{task.endTime}</td>
                  <td>{translateStatus(task.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {deliveryTasks.length === 0 && regularTasks.length === 0 && <p>לא נמצאו משימות או משלוחים.</p>}
    </section>
  )
}
