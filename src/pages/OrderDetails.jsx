import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { customerOrderService } from '../services/customer-order.service.js'
import { customerOrderItemService } from '../services/customer-order-item.service.js'
import { clientService } from '../services/client.service.js'
import { cropService } from '../services/crop.service.js'
import { warehouseService } from '../services/warehouse.service.js'
import { userService } from '../services/user.service.js'
import { employeesInTaskService } from '../services/employees-in-task.service.js'
import { taskService } from '../services/task.service.js'
import { format, isValid } from 'date-fns'
import { Loader } from '../cmps/Loader.jsx'

const DELIVERY_OPERATION_ID = '68354fa1d29fa199e95c04d8'

const statusToHebrew = (status) => {
  switch (status?.toLowerCase()) {
    case 'draft':
    case 'טיוטה':
      return 'טיוטה'
    case 'approved':
    case 'מאושרת':
      return 'מאושרת'
    case 'delivered':
    case 'סופקה':
      return 'סופקה'
    case 'cancelled':
    case 'מבוטלת':
      return 'מבוטלת'
    case 'missed':
      return 'בוטל'
    case 'pending':
      return 'ממתין'
    case 'delayed':
      return 'דחה את המשימה'
    case 'in-progress':
      return 'בתהליך'
    case 'done':
      return 'הושלם'
    default:
      return status
  }
}

function formatDate(dateStr) {
  return isValid(new Date(dateStr)) ? format(new Date(dateStr), 'dd/MM/yyyy') : '—'
}

export function OrderDetails() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [items, setItems] = useState([])
  const [client, setClient] = useState(null)
  const [cropsMap, setCropsMap] = useState({})
  const [warehousesMap, setWarehousesMap] = useState({})
  const [usersMap, setUsersMap] = useState({})
  const [users, setUsers] = useState([])
  const [deliveryEmployees, setDeliveryEmployees] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadOrder()
    loadWarehouses()
    loadUsers()
  }, [orderId])

  async function loadOrder() {
    setIsLoading(true)
    try {
      const o = await customerOrderService.getById(orderId)
      const i = await customerOrderItemService.queryByOrderId(orderId)
      const c = await clientService.getById(o.customerId)
      const allCrops = await cropService.query()
      const map = {}
      allCrops.forEach((crop) => (map[crop._id] = crop.cropName))

      setOrder(o)
      setItems(i)
      setClient(c)
      setCropsMap(map)

      const status = statusToHebrew(o.status)
      if (['מאושרת', 'סופקה'].includes(status)) {
        const tasks = await taskService.query()
        const deliveryTask = tasks.find((t) => String(t.fieldId) === String(o._id) && String(t.operationId) === DELIVERY_OPERATION_ID)
        if (deliveryTask) {
          const assignments = await employeesInTaskService.query()
          const relevant = assignments.filter((a) => a.taskId === deliveryTask._id)
          setDeliveryEmployees(relevant)
        }
      }
    } catch (err) {
      console.error('שגיאה בטעינת פרטי הזמנה:', err)
    } finally {
      setIsLoading(false)
    }
  }

  async function loadWarehouses() {
    const warehouses = await warehouseService.query()
    const map = {}
    warehouses.forEach((w) => (map[w._id] = w.warehouseName))
    setWarehousesMap(map)
  }

  async function loadUsers() {
    const users = await userService.query()
    const map = {}
    users.forEach((u) => (map[u._id] = u.fullName))
    setUsersMap(map)
    setUsers(users)
  }

  function getDaysLeft() {
    if (!order?.desiredDeliveryDate || !isValid(new Date(order.desiredDeliveryDate))) return null
    const deliveryDate = new Date(order.desiredDeliveryDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    deliveryDate.setHours(0, 0, 0, 0)
    const diff = Math.ceil((deliveryDate - today) / (1000 * 60 * 60 * 24))
    return diff >= 0 ? diff : null
  }

  async function updateStatus(newStatus, reason = '') {
    const updated = {
      ...order,
      status: newStatus,
      deliveredAt: newStatus === 'סופקה' ? new Date().toISOString() : order.deliveredAt,
      notes: reason ? (order.notes || '') + `\nסיבת ביטול: ${reason}` : order.notes,
    }
    await customerOrderService.update(orderId, updated)
    loadOrder()
  }

  if (isLoading) return <Loader />
  if (!order || !client) return <div>טוען פרטי הזמנה...</div>

  const daysLeft = getDaysLeft()

  function getUserById(id) {
    return users.find((u) => u._id === id)
  }

  return (
    <section className='order-details'>
      <h1>📦 פרטי הזמנה מלאה במערכת Crop-Tracker #{orderId}</h1>
      <button type='button' onClick={() => navigate('/orders/view')} className='back-btn'>
        ⬅ חזרה לרשימת ההזמנות
      </button>

      <div className='order-summary'>
        <h2>🧑‍💼 פרטי לקוח להזמנה זו</h2>
        <p>
          <strong>שם:</strong> {client.customerName}
        </p>
        <p>
          <strong>איש קשר:</strong> {client.contactPerson}
        </p>
        <p>
          <strong>טלפון:</strong> {client.phoneNumber}
        </p>
        <p>
          <strong>כתובת:</strong> {client.address}
        </p>
      </div>

      <div className='order-info'>
        <h2>🗓️ פרטי ההזמנה</h2>
        <p>
          <strong>תאריך הקמת ההזמנה:</strong> {order.orderDate && isValid(new Date(order.orderDate)) ? format(new Date(order.orderDate), 'dd/MM/yyyy') : '—'}
        </p>
        <p>
          <strong>סטטוס:</strong> <span>{statusToHebrew(order.status)}</span>
        </p>
        <p>
          <strong>תאריך הספקה:</strong>{' '}
          {order.desiredDeliveryDate && isValid(new Date(order.desiredDeliveryDate)) ? format(new Date(order.desiredDeliveryDate), 'dd/MM/yyyy') : '—'}
        </p>
        {['מאושרת', 'סופקה'].includes(statusToHebrew(order.status)) && order.approvedBy && (
          <p>
            <strong>אושרה על ידי:</strong> {usersMap[order.approvedBy] || order.approvedBy}
          </p>
        )}
        {statusToHebrew(order.status) === 'סופקה' && order.deliveredAt && isValid(new Date(order.deliveredAt)) && (
          <p>
            <strong>תאריך סופקה בפועל:</strong> {format(new Date(order.deliveredAt), 'dd/MM/yyyy')}
          </p>
        )}
        {['טיוטה', 'מאושרת'].includes(statusToHebrew(order.status)) && daysLeft !== null && (
          <p>
            <strong>נותרו ימים להספקה:</strong> {daysLeft}
          </p>
        )}
        <p>
          <strong>סה"כ:</strong> {order.totalAmount} ₪
        </p>
        <p>
          <strong>הערות להזמנה:</strong> {order.notes || '—'}
        </p>
      </div>

      <div className='order-items'>
        <h2>📋 פריטים הכלולים בהזמנה</h2>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>שם יבול</th>
              <th>כמות (ק"ג)</th>
              <th>מחיר ליח׳ (₪)</th>
              <th>סה"כ שורה</th>
              <th>פירוט לפי מחסן</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item._id}>
                <td>{idx + 1}</td>
                <td>{cropsMap[item.cropId] || item.cropId}</td>
                <td>{item.quantity}</td>
                <td>{item.price} ₪</td>
                <td>{(item.quantity * item.price).toFixed(2)} ₪</td>
                <td>
                  {item.warehouseBreakdown?.length ? (
                    <table className='warehouse-breakdown-table'>
                      <caption>פירוט שיבוץ למחסנים</caption>
                      <thead>
                        <tr>
                          <th>מחסן</th>
                          <th>כמות (ק"ג)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.warehouseBreakdown.map((w, i) => (
                          <tr key={i}>
                            <td>{warehousesMap[w.warehouseId] || w.warehouseId}</td>
                            <td>{w.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deliveryEmployees.length > 0 && (
        <div className='delivery-employees'>
          <h2>👷 עובדים ששובצו למשלוח עבור הזמנה זו</h2>
          <table>
            <thead>
              <tr>
                <th>שם עובד</th>
                <th>פלאפון</th>
                <th>סטטוס</th>
                <th>הערה</th>
              </tr>
            </thead>
            <tbody>
              {deliveryEmployees.map((emp, idx) => {
                const user = getUserById(emp.employeeId)
                return (
                  <tr key={idx}>
                    <td>{user?.fullName || emp.employeeId}</td>
                    <td>{user?.phoneNumber || '—'}</td>
                    <td>{statusToHebrew(emp.status)}</td>
                    <td>{emp.note || '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className='actions'>
        {statusToHebrew(order.status) === 'טיוטה' && (
          <>
            <button onClick={() => navigate(`/order/edit/${order._id}`)}>✏️ ערוך</button>
            <button onClick={() => navigate(`/order/update-qty/${order._id}`)}>🚚 הקמת משלוח בפועל</button>
            <button
              onClick={() => {
                const reason = window.prompt('נא להזין סיבת ביטול ההזמנה:')
                if (reason) updateStatus('מבוטלת', reason)
              }}
            >
              ❌ ביטול הזמנה (דורש הזנת סיבה)
            </button>
          </>
        )}
        {statusToHebrew(order.status) === 'מאושרת' && (
          <button
            className='btn-approve'
            onClick={() => {
              const confirm = window.confirm('האם אתה בטוח שברצונך לאשר את הספקת המשלוח עבור הזמנה זו?')
              if (confirm) updateStatus('סופקה')
            }}
          >
            ✔️ אישור הספקת משלוח
          </button>
        )}
        {order.status === 'draft' && <button onClick={handleCancelOrder}>ביטול הזמנה</button>}
      </div>
    </section>
  )
}
