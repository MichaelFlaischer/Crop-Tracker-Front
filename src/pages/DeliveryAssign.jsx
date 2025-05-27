import { useEffect, useState } from 'react'
import { customerOrderService } from '../services/customer-order.service.js'

export function DeliveryAssign() {
  const [orders, setOrders] = useState([])
  const [assignments, setAssignments] = useState({}) // { orderId: { driver: '', date: '' } }

  useEffect(() => {
    loadOrders()
  }, [])

  async function loadOrders() {
    try {
      const allOrders = await customerOrderService.query()
      const approved = allOrders.filter((order) => order.status === 'מאושרת')
      setOrders(approved)
    } catch (err) {
      console.error('שגיאה בטעינת הזמנות:', err)
    }
  }

  function handleChange(orderId, field, value) {
    setAssignments((prev) => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        [field]: value,
      },
    }))
  }

  async function assignDelivery(orderId) {
    const assignment = assignments[orderId]
    if (!assignment?.driver || !assignment?.date) {
      alert('יש למלא נהג ותאריך משלוח')
      return
    }

    try {
      const updatedOrder = {
        ...orders.find((o) => o._id === orderId),
        status: 'סופקה',
        deliveredAt: assignment.date,
        deliveryInfo: {
          driver: assignment.driver,
        },
      }
      await customerOrderService.update(orderId, updatedOrder)
      alert('המשלוח שובץ בהצלחה')
      loadOrders()
    } catch (err) {
      console.error('שגיאה בשיבוץ משלוח:', err)
    }
  }

  return (
    <section className='delivery-assign'>
      <h1>🚛 שיבוץ משלוחים להזמנות מאושרות</h1>

      {orders.length === 0 ? (
        <p>אין הזמנות מאושרות לשיבוץ.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>מס׳ הזמנה</th>
              <th>לקוח</th>
              <th>תאריך</th>
              <th>סה״כ</th>
              <th>נהג</th>
              <th>תאריך משלוח</th>
              <th>פעולה</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id}>
                <td>{order._id}</td>
                <td>{order.customerId}</td>
                <td>{order.orderDate?.slice(0, 10)}</td>
                <td>{order.totalAmount?.toFixed(2)} ₪</td>
                <td>
                  <input
                    type='text'
                    placeholder='שם נהג'
                    value={assignments[order._id]?.driver || ''}
                    onChange={(e) => handleChange(order._id, 'driver', e.target.value)}
                  />
                </td>
                <td>
                  <input type='date' value={assignments[order._id]?.date || ''} onChange={(e) => handleChange(order._id, 'date', e.target.value)} />
                </td>
                <td>
                  <button onClick={() => assignDelivery(order._id)}>📦 שבץ</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
