import { useEffect, useState } from 'react'
import { customerOrderService } from '../services/customer-order.service.js'
import { clientService } from '../services/client.service.js'
import { userService } from '../services/user.service.js'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { Loader } from '../cmps/Loader.jsx'

export function CustomerOrderHistoryReport() {
  const [orders, setOrders] = useState([])
  const [clients, setClients] = useState([])
  const [users, setUsers] = useState([])
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setIsLoading(true)
    try {
      const [ordersData, clientsData, usersData] = await Promise.all([customerOrderService.query(), clientService.query(), userService.query()])
      setOrders(ordersData)
      setClients(clientsData)
      setUsers(usersData)
    } catch (err) {
      console.error('❌ שגיאה בטעינת נתונים', err)
    } finally {
      setIsLoading(false)
    }
  }

  const clientMap = clients.reduce((map, client) => {
    map[client._id] = client.customerName
    return map
  }, {})

  const userMap = users.reduce((map, user) => {
    map[user._id] = user.fullName || user.username || 'לא ידוע'
    return map
  }, {})

  const statusLabels = {
    Draft: 'טיוטה',
    Approved: 'מאושרת',
    Delivered: 'סופקה',
    Cancelled: 'מבוטלת',
  }

  const formatDate = (str) => {
    const d = new Date(str)
    return isNaN(d) ? '—' : d.toLocaleDateString('he-IL')
  }

  const calcGap = (date1, date2) => {
    if (!date1 || !date2) return '—'
    const d1 = new Date(date1)
    const d2 = new Date(date2)
    if (isNaN(d1) || isNaN(d2)) return '—'
    return Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + ' ימים'
  }

  let serial = 1
  const rows = orders.map((order, idx) => {
    const clientName = clientMap[String(order.customerId)] || 'לא ידוע'
    const totalAmount = +order.totalAmount || 0
    const orderDateObj = new Date(order.orderDate)
    const deliveryDateObj = new Date(order.desiredDeliveryDate)
    const deliveredDateObj = new Date(order.deliveredAt)
    return {
      id: order._id || idx,
      serial: serial++,
      clientName,
      orderDate: formatDate(order.orderDate),
      desiredDeliveryDate: formatDate(order.desiredDeliveryDate),
      deliveredAt: formatDate(order.deliveredAt),
      status: statusLabels[order.status] || order.status,
      totalAmount: `${totalAmount.toLocaleString()} ש"ח`,
      notes: order.notes || '',
      approvedBy: userMap[order.approvedBy] || '—',
      approvedAt: formatDate(order.approvedAt),
      gapOrderToDesired: calcGap(order.orderDate, order.desiredDeliveryDate),
      gapDesiredToActual: calcGap(order.desiredDeliveryDate, order.deliveredAt),
      sortOrderDate: orderDateObj,
      sortDelivery: deliveryDateObj,
      sortDeliveredAt: deliveredDateObj,
      sortApprovedAt: new Date(order.approvedAt),
      sortAmount: totalAmount,
    }
  })

  if (sortConfig.key) {
    rows.sort((a, b) => {
      const keyMap = {
        orderDate: 'sortOrderDate',
        desiredDeliveryDate: 'sortDelivery',
        deliveredAt: 'sortDeliveredAt',
        approvedAt: 'sortApprovedAt',
        totalAmount: 'sortAmount',
      }
      let valA = keyMap[sortConfig.key] ? a[keyMap[sortConfig.key]] : a[sortConfig.key]
      let valB = keyMap[sortConfig.key] ? b[keyMap[sortConfig.key]] : b[sortConfig.key]
      if (valA === '—' || valA === undefined || valA === null) return 1
      if (valB === '—' || valB === undefined || valB === null) return -1

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
    const data = rows.map((row) => ({
      'מס"ד': row.serial,
      לקוח: row.clientName,
      'תאריך הזמנה': row.orderDate,
      'תאריך אספקה רצוי': row.desiredDeliveryDate,
      'תאריך אספקה בפועל': row.deliveredAt,
      'פער (ימים) מהזמנה לרצוי': row.gapOrderToDesired,
      'פער (ימים) מרצוי לאספקה בפועל': row.gapDesiredToActual,
      סטטוס: row.status,
      'סה"כ (ש"ח)': row.totalAmount,
      'מאושר ע"י': row.approvedBy,
      'תאריך אישור': row.approvedAt,
      הערות: row.notes,
    }))
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'היסטוריית הזמנות')
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' })
    saveAs(blob, 'היסטוריית_הזמנות.xlsx')
  }

  if (isLoading) return <Loader />

  return (
    <section className='order-history-report'>
      <h2>📦 היסטוריית הזמנות לקוחות</h2>
      <button onClick={exportToExcel}>📤 ייצוא לאקסל</button>

      <table>
        <thead>
          <tr>
            <th onClick={() => handleSort('serial')}>מס"ד</th>
            <th onClick={() => handleSort('clientName')}>לקוח</th>
            <th onClick={() => handleSort('orderDate')}>תאריך הזמנה</th>
            <th onClick={() => handleSort('desiredDeliveryDate')}>תאריך אספקה רצוי</th>
            <th>פער (ימים) מהזמנה לרצוי</th>
            <th>תאריך אספקה בפועל</th>
            <th>פער (ימים) מרצוי לאספקה בפועל</th>
            <th onClick={() => handleSort('status')}>סטטוס</th>
            <th onClick={() => handleSort('totalAmount')}>סה"כ (ש"ח)</th>
            <th onClick={() => handleSort('approvedBy')}>מאושר ע"י</th>
            <th onClick={() => handleSort('approvedAt')}>תאריך אישור</th>
            <th onClick={() => handleSort('notes')}>הערות</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td data-label='מס"ד'>{row.serial}</td>
              <td data-label='לקוח'>{row.clientName}</td>
              <td data-label='תאריך הזמנה'>{row.orderDate}</td>
              <td data-label='תאריך אספקה רצוי'>{row.desiredDeliveryDate}</td>
              <td data-label='פער (ימים) מהזמנה לרצוי'>{row.gapOrderToDesired}</td>
              <td data-label='תאריך אספקה בפועל'>{row.deliveredAt}</td>
              <td data-label='פער (ימים) מרצוי לאספקה בפועל'>{row.gapDesiredToActual}</td>
              <td data-label='סטטוס'>{row.status}</td>
              <td data-label='סה"כ (ש"ח)'>{row.totalAmount}</td>
              <td data-label='מאושר ע"י'>{row.approvedBy}</td>
              <td data-label='תאריך אישור'>{row.approvedAt}</td>
              <td data-label='הערות'>{row.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
