import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { customerOrderService } from '../services/customer-order.service.js'
import { clientService } from '../services/client.service.js'
import { format, isValid } from 'date-fns'

export function OrderIndex() {
  const [orders, setOrders] = useState([])
  const [clients, setClients] = useState([])
  const [filterBy, setFilterBy] = useState({
    status: 'טיוטה',
    sort: '',
    customerName: '',
    totalMin: '',
    totalMax: '',
    deliveryFrom: '',
    deliveryTo: '',
  })
  const navigate = useNavigate()

  useEffect(() => {
    loadOrders()
    loadClients()
  }, [])

  async function loadOrders() {
    try {
      const data = await customerOrderService.query()
      setOrders(data)
    } catch (err) {
      console.error('שגיאה בטעינת הזמנות:', err)
    }
  }

  async function loadClients() {
    try {
      const data = await clientService.query()
      setClients(data)
    } catch (err) {
      console.error('שגיאה בטעינת לקוחות:', err)
    }
  }

  function getClientName(customerId) {
    const client = clients.find((c) => String(c._id) === String(customerId))
    return client?.customerName || '—'
  }

  function handleFilterChange({ target }) {
    const { name, value } = target
    setFilterBy((prev) => ({ ...prev, [name]: value }))
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
    try {
      const order = orders.find((o) => o._id === orderId)
      await customerOrderService.update(orderId, { ...order, status, notes: note || order.notes })
      loadOrders()
    } catch (err) {
      console.error('שגיאה בעדכון סטטוס:', err)
    }
  }

  function filteredOrders() {
    let filtered = [...orders]
    const { status, customerName, totalMin, totalMax, deliveryFrom, deliveryTo } = filterBy

    if (status) filtered = filtered.filter((o) => o.status === status)
    if (customerName) {
      filtered = filtered.filter((o) => getClientName(o.customerId).includes(customerName))
    }
    if (totalMin) filtered = filtered.filter((o) => o.totalAmount >= +totalMin)
    if (totalMax) filtered = filtered.filter((o) => o.totalAmount <= +totalMax)

    if (deliveryFrom || deliveryTo) {
      filtered = filtered.filter((o) => {
        if (!o.desiredDeliveryDate || !isValid(new Date(o.desiredDeliveryDate))) return false
        const d = new Date(o.desiredDeliveryDate)
        if (deliveryFrom && d < new Date(deliveryFrom)) return false
        if (deliveryTo && d > new Date(deliveryTo)) return false
        return true
      })
    }

    if (filterBy.sort === 'deliveryDate') {
      filtered.sort((a, b) => new Date(a.desiredDeliveryDate) - new Date(b.desiredDeliveryDate))
    }
    return filtered
  }

  return (
    <section className='order-index'>
      <div className='header-bar'>
        <h1>רשימת הזמנות</h1>
        <button className='add-btn' onClick={() => navigate('/order/add')}>
          ➕ יצירת הזמנה חדשה
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>
              לקוח
              <br />
              <input name='customerName' placeholder='סינון לפי שם לקוח' onChange={handleFilterChange} />
            </th>
            <th>
              תאריך הספקה
              <br />
              <input name='deliveryFrom' type='date' onChange={handleFilterChange} />
              <input name='deliveryTo' type='date' onChange={handleFilterChange} />
            </th>
            <th>
              סטטוס
              <br />
              <select name='status' value={filterBy.status} onChange={handleFilterChange}>
                <option value=''>כל הסטטוסים</option>
                <option value='טיוטה'>טיוטה</option>
                <option value='מאושרת'>מאושרת</option>
                <option value='סופקה'>סופקה</option>
                <option value='מבוטלת'>מבוטלת</option>
              </select>
            </th>
            <th>
              סכום הזמנה
              <br />
              <input name='totalMin' type='number' placeholder='מינימום' onChange={handleFilterChange} />
              <input name='totalMax' type='number' placeholder='מקסימום' onChange={handleFilterChange} />
            </th>
            <th>
              מיון
              <br />
              <select name='sort' value={filterBy.sort} onChange={handleFilterChange}>
                <option value=''>ללא מיון</option>
                <option value='deliveryDate'>מיון לפי תאריך הספקה</option>
              </select>
            </th>
          </tr>
        </thead>
      </table>

      <table>
        <tbody>
          <tr>
            <th>#</th>
            <th>לקוח</th>
            <th>תאריך הספקה</th>
            <th>נותרו ימים</th>
            <th>סטטוס</th>
            <th>סכום הזמנה</th>
            <th>הערות</th>
            <th>פעולות</th>
            <th>פרטים</th>
          </tr>

          {filteredOrders().map((order, idx) => {
            const daysLeft = getDaysLeft(order?.desiredDeliveryDate)
            const colorClass = getDaysColor(daysLeft)
            const formattedDate =
              order.desiredDeliveryDate && isValid(new Date(order.desiredDeliveryDate)) && new Date(order.desiredDeliveryDate).getFullYear() > 1971
                ? format(new Date(order.desiredDeliveryDate), 'dd/MM/yyyy')
                : ''

            return (
              <tr key={order._id} className={`status-${order.status}`}>
                <td>{idx + 1}</td>
                <td>{getClientName(order.customerId)}</td>
                <td>{formattedDate}</td>
                <td className={colorClass}>{daysLeft !== null ? `${daysLeft} ימים` : ''}</td>
                <td>{order.status}</td>
                <td>{order.totalAmount} ₪</td>
                <td>{order.notes}</td>
                <td>
                  {order.status === 'טיוטה' && (
                    <>
                      <button onClick={() => navigate(`/order/edit/${order._id}`)}>✏️ עריכה</button>
                      <button
                        onClick={() => {
                          if (window.confirm('האם אתה בטוח שברצונך להקים משלוח בפועל עבור הזמנה זו?')) navigate(`/order/update-qty/${order._id}`)
                        }}
                      >
                        🚚 הקמת משלוח בפועל
                      </button>
                      <button
                        onClick={() => {
                          const reason = window.prompt('נא להזין סיבת ביטול ההזמנה:')
                          if (reason && window.confirm('האם אתה בטוח שברצונך לבטל את ההזמנה?')) updateOrderStatus(order._id, 'מבוטלת', reason)
                        }}
                      >
                        ❌ ביטול הזמנה
                      </button>
                    </>
                  )}
                  {order.status === 'מאושרת' && (
                    <>
                      <button
                        onClick={() => {
                          if (window.confirm('האם אתה בטוח שברצונך לאשר הספקת משלוח להזמנה זו?')) updateOrderStatus(order._id, 'הושלמה')
                        }}
                      >
                        ✔️ אישור הספקת משלוח
                      </button>
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
    </section>
  )
}
