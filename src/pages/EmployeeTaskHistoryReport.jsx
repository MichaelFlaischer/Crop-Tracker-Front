import { useEffect, useState } from 'react'
import { taskService } from '../services/task.service.js'
import { employeesInTaskService } from '../services/employees-in-task.service.js'
import { customerOrderService } from '../services/customer-order.service.js'
import { clientService } from '../services/client.service.js'
import { fieldService } from '../services/field.service.js'
import { cropService } from '../services/crop.service.js'
import { userService } from '../services/user.service.js'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

export function EmployeeTaskHistoryReport() {
  const [tasks, setTasks] = useState([])
  const [orders, setOrders] = useState([])
  const [clients, setClients] = useState([])
  const [fields, setFields] = useState([])
  const [crops, setCrops] = useState([])
  const [users, setUsers] = useState([])
  const [assignments, setAssignments] = useState([])
  const [sortBy, setSortBy] = useState({ key: null, asc: true })
  const DELIVERY_OPERATION_ID = '68354fa1d29fa199e95c04d8'

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [allTasks, allOrders, allClients, allFields, allCrops, allUsers, allAssignments] = await Promise.all([
        taskService.query(),
        customerOrderService.query(),
        clientService.query(),
        fieldService.query(),
        cropService.query(),
        userService.query(),
        employeesInTaskService.query(),
      ])

      setTasks(allTasks)
      setOrders(allOrders)
      setClients(allClients)
      setFields(allFields)
      setCrops(allCrops)
      setUsers(allUsers)
      setAssignments(allAssignments)
    } catch (err) {
      console.error('שגיאה בטעינת נתונים:', err)
    }
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr)
    return isNaN(d) ? '—' : d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  function translateStatus(status) {
    const map = {
      pending: 'בהמתנה',
      'in-progress': 'בתהליך',
      done: 'הושלמה',
      delayed: 'נדחתה',
      missed: 'לא בוצעה',
      cancelled: 'בוטלה',
    }
    return map[status] || status
  }

  function handleSort(key) {
    setSortBy((prev) => ({ key, asc: prev.key === key ? !prev.asc : true }))
  }

  const userMap = users.reduce((map, user) => {
    map[user._id] = user.fullName
    return map
  }, {})

  const clientMap = clients.reduce((map, client) => {
    map[client._id] = client.customerName
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

  const getEmployeesForTask = (taskId) => {
    return assignments.filter((a) => a.taskId === taskId).map((a) => userMap[a.employeeId] || '—')
  }

  const getClientNameByOrderId = (orderId) => {
    const order = orders.find((o) => o._id === orderId)
    if (!order) return '—'
    return clientMap[order.customerId] || '—'
  }

  const deliveryTasks = tasks.filter((t) => t.operationId === DELIVERY_OPERATION_ID)
  const regularTasks = tasks.filter((t) => t.operationId !== DELIVERY_OPERATION_ID)

  const sortedDelivery = [...deliveryTasks].sort((a, b) => {
    const key = sortBy.key
    if (!key) return 0
    const valA = a[key] || ''
    const valB = b[key] || ''
    return sortBy.asc ? new Date(valA).getTime() - new Date(valB).getTime() : new Date(valB).getTime() - new Date(valA).getTime()
  })

  const sortedRegular = [...regularTasks].sort((a, b) => {
    const key = sortBy.key
    if (!key) return 0
    const valA = a[key] || ''
    const valB = b[key] || ''
    return sortBy.asc ? new Date(valA).getTime() - new Date(valB).getTime() : new Date(valB).getTime() - new Date(valA).getTime()
  })

  return (
    <section className='employee-task-history'>
      <h2>📋 היסטוריית משימות ומשלוחים</h2>

      <h3>🚚 משלוחים</h3>
      <table>
        <thead>
          <tr>
            <th>מס"ד</th>
            <th>שם לקוח</th>
            <th>מספר הזמנה</th>
            <th>תאריך הספקה</th>
            <th>סטטוס</th>
            <th>עובדים שביצעו</th>
          </tr>
        </thead>
        <tbody>
          {sortedDelivery.map((task, idx) => (
            <tr key={task._id}>
              <td>{idx + 1}</td>
              <td>{getClientNameByOrderId(task.fieldId)}</td>
              <td>{task.fieldId}</td>
              <td>{formatDate(task.startDate)}</td>
              <td>{translateStatus(task.status)}</td>
              <td>{getEmployeesForTask(task._id).join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>🌿 משימות שוטפות</h3>
      <table>
        <thead>
          <tr>
            <th>מס"ד</th>
            <th>שם פעולה</th>
            <th>שדה</th>
            <th>תאריך התחלה</th>
            <th>שעת התחלה</th>
            <th>תאריך סיום</th>
            <th>שעת סיום</th>
            <th>סטטוס</th>
            <th>עובדים שביצעו</th>
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
              <td>{getEmployeesForTask(task._id).join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
