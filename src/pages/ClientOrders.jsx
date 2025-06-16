import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { customerOrderService } from '../services/customer-order.service.js'
import { clientService } from '../services/client.service.js'
import { format, isValid } from 'date-fns'

export function ClientOrders() {
  const [orders, setOrders] = useState([])
  const [collapsed, setCollapsed] = useState({ טיוטה: false, מאושרת: false, סופקה: false, מבוטלת: false })
  const [client, setClient] = useState(null)
  const { clientId } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    loadClient()
    loadOrders()
  }, [])

  async function loadClient() {
    try {
      const data = await clientService.getById(clientId)
      setClient(data)
    } catch (err) {
      console.error('שגיאה בטעינת לקוח:', err)
    }
  }

  async function loadOrders() {
    try {
      const data = await customerOrderService.query()
      setOrders(data.filter((order) => String(order.customerId) === String(clientId)))
    } catch (err) {
      console.error('שגיאה בטעינת הזמנות:', err)
    }
  }

  function getDaysLeft(dateStr) {
    if (!dateStr || !isValid(new Date(dateStr))) return null
    const deliveryDate = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    deliveryDate.setHours(0, 0, 0, 0)
    const diffTime = deliveryDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays >= 0 ? diffDays : null
  }

  function getDaysColor(daysLeft) {
    if (daysLeft === null) return ''
    if (daysLeft <= 2) return 'danger'
    if (daysLeft <= 5) return 'warning'
    return 'safe'
  }

  async function updateOrderStatus(orderId, status, note = '') {
    const confirm = window.confirm(`האם אתה בטוח שברצונך לבצע את הפעולה: שינוי סטטוס ל-${status}?`)
    if (!confirm) return

    try {
      const order = orders.find((o) => o._id === orderId)
      await customerOrderService.update(orderId, { ...order, status, notes: note || order.notes })
      if (status === 'סופקה') {
        await fetch(`/api/task/mark-delivered/${orderId}`, { method: 'PUT' })
      }
      loadOrders()
    } catch (err) {
      console.error('שגיאה בעדכון סטטוס:', err)
    }
  }

  function toggleCollapse(status) {
    setCollapsed((prev) => ({ ...prev, [status]: !prev[status] }))
  }

  function renderTable(status, title) {
    const filtered = orders.filter((order) => order.status === status)
    return (
      <section className={`order-section status-${status}`}>
        <h2 className='cursor' onClick={() => toggleCollapse(status)}>
          {title} ({filtered.length}) {collapsed[status] ? '➕' : '➖'}
        </h2>
        {!collapsed[status] && (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>תאריך הספקה</th>
                <th>נותרו ימים</th>
                <th>סכום</th>
                <th>הערות</th>
                <th>פעולות</th>
                <th>פרטים</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order, idx) => {
                const daysLeft = getDaysLeft(order?.desiredDeliveryDate)
                const colorClass = getDaysColor(daysLeft)
                const formattedDate =
                  order.desiredDeliveryDate && isValid(new Date(order.desiredDeliveryDate)) && new Date(order.desiredDeliveryDate).getFullYear() > 1971
                    ? format(new Date(order.desiredDeliveryDate), 'dd/MM/yyyy')
                    : ''

                return (
                  <tr key={order._id} className={`status-${order.status}`}>
                    <td>{idx + 1}</td>
                    <td>{formattedDate}</td>
                    <td className={colorClass}>{daysLeft !== null ? `${daysLeft} ימים` : ''}</td>
                    <td>{order.totalAmount} ₪</td>
                    <td>{order.notes}</td>
                    <td>
                      {status === 'טיוטה' && (
                        <>
                          <button onClick={() => navigate(`/order/edit/${order._id}`)}>✏️ עריכה</button>
                          <button onClick={() => navigate(`/order/update-qty/${order._id}`)}>🚚 הקמת משלוח בפועל</button>
                          <button
                            onClick={() => {
                              const reason = window.prompt('נא להזין סיבת ביטול ההזמנה:')
                              if (reason) updateOrderStatus(order._id, 'מבוטלת', reason)
                            }}
                          >
                            ❌ ביטול הזמנה
                          </button>
                        </>
                      )}
                      {status === 'מאושרת' && (
                        <>
                          <button onClick={() => updateOrderStatus(order._id, 'סופקה')}>✔️ אישור הספקת משלוח</button>
                        </>
                      )}
                    </td>
                    <td>
                      <button className='blue-btn' onClick={() => navigate(`/order/${order._id}`)}>
                        🔍 פרטים
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

  return (
    <section className='client-orders'>
      <h1>הזמנות לקוח: {client?.customerName || `מס' ${clientId}`}</h1>
      {renderTable('טיוטה', 'טיוטה')}
      {renderTable('מאושרת', 'מאושרת')}
      {renderTable('סופקה', 'סופקה')}
      {renderTable('מבוטלת', 'מבוטלת')}
    </section>
  )
}
