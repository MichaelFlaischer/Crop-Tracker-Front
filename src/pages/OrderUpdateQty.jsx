import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { customerOrderService } from '../services/customer-order.service.js'
import { customerOrderItemService } from '../services/customer-order-item.service.js'
import { clientService } from '../services/client.service.js'
import { cropService } from '../services/crop.service.js'
import { warehouseService } from '../services/warehouse.service.js'
import { taskService } from '../services/task.service.js'
import { employeesInTaskService } from '../services/employees-in-task.service.js'
import { userService } from '../services/user.service.js'
import { format } from 'date-fns'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { registerLocale } from 'react-datepicker'
import he from 'date-fns/locale/he'
import { Loader } from '../cmps/Loader.jsx'

registerLocale('he', he)

export function OrderUpdateQty() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [items, setItems] = useState([])
  const [client, setClient] = useState(null)
  const [warehousesMap, setWarehousesMap] = useState({})
  const [cropsMap, setCropsMap] = useState({})
  const [users, setUsers] = useState([])
  const [assignments, setAssignments] = useState([])
  const [deliveryDate, setDeliveryDate] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()
  const loggedInUser = useSelector((storeState) => storeState.userModule.loggedInUser)

  useEffect(() => {
    loadData()
  }, [orderId])

  async function loadData() {
    setIsLoading(true)
    const o = await customerOrderService.getById(orderId)
    const i = await customerOrderItemService.queryByOrderId(orderId)
    const c = await clientService.getById(o.customerId)
    const crops = await cropService.query()
    const users = await userService.query()

    const cropMap = {}
    crops.forEach((c) => (cropMap[c._id] = c.cropName))

    const warehouseMap = {}
    for (const item of i) {
      const list = await warehouseService.queryByCrop(item.cropId)
      warehouseMap[item.cropId] = list
    }

    setOrder(o)
    setItems(i.map((item) => ({ ...item, actualDelivery: item.quantity, warehousesUsed: [], warehouseBreakdown: [] })))
    setClient(c)
    setWarehousesMap(warehouseMap)
    setUsers(users)
    setCropsMap(cropMap)
    setDeliveryDate(o.desiredDeliveryDate ? new Date(o.desiredDeliveryDate) : '')
    setIsLoading(false)
  }

  function handleWarehouseQtyChange(itemIdx, warehouseId, value) {
    const updated = [...items]
    const whUsed = updated[itemIdx].warehousesUsed.filter((w) => w.warehouseId !== warehouseId)
    const breakdown = updated[itemIdx].warehouseBreakdown.filter((w) => w.warehouseId !== warehouseId)
    if (value > 0) {
      whUsed.push({ warehouseId, quantity: +value })
      breakdown.push({ warehouseId, quantity: +value })
    }
    updated[itemIdx].warehousesUsed = whUsed
    updated[itemIdx].warehouseBreakdown = breakdown
    setItems(updated)
  }

  function handleAssignmentChange(idx, field, value) {
    const updated = [...assignments]
    updated[idx] = { ...updated[idx], [field]: value }
    setAssignments(updated)
  }

  function addAssignment() {
    setAssignments((prev) => [...prev, { userId: '', note: '' }])
  }

  function removeAssignment(idx) {
    setAssignments((prev) => prev.filter((_, i) => i !== idx))
  }

  async function onSave() {
    try {
      if (!assignments.length) {
        return alert('יש להוסיף לפחות עובד אחד לשיבוץ המשלוח.')
      }

      for (const item of items) {
        const totalFromWarehouses = item.warehousesUsed.reduce((sum, w) => sum + w.quantity, 0)
        if (totalFromWarehouses !== item.actualDelivery) {
          return alert(`סה״כ הכמות שסופקה ליבול "${cropsMap[item.cropId]}" שונה מהכמות שסומנה כסופקה בפועל.`)
        }
      }

      if (assignments.some((a) => !a.userId)) {
        return alert('אנא בחר עובד לכל שיבוץ.')
      }

      for (const item of items) {
        await customerOrderItemService.update(item._id, {
          deliveredQuantity: item.actualDelivery,
          warehouseBreakdown: item.warehouseBreakdown,
        })

        for (const w of item.warehousesUsed) {
          await warehouseService.updateCropQuantity(w.warehouseId, item.cropId, -w.quantity)
        }
      }

      await customerOrderService.update(orderId, {
        status: 'מאושרת',
        approvedAt: new Date().toISOString(),
        approvedBy: loggedInUser?._id || null,
        desiredDeliveryDate: deliveryDate,
      })

      const task = await taskService.add({
        operationId: '68354fa1d29fa199e95c04d8',
        fieldId: order._id,
        comments: `הזמנה #${order._id} ללקוח ${client.customerName}, הספקה ב-${format(new Date(deliveryDate), 'dd/MM/yyyy')}`,
        status: 'in-progress',
        requiredEmployees: assignments.length,
        startDate: deliveryDate,
        endDate: deliveryDate,
        startTime: '08:00',
        endTime: '17:00',
        taskDescription: `משלוח ללקוח: ${client.customerName}`,
      })

      for (const assignment of assignments) {
        await employeesInTaskService.add({
          taskId: task._id,
          employeeId: assignment.userId,
          note: assignment.note,
          status: 'in-progress',
          assignedAt: new Date().toISOString(),
          actualStart: new Date().toISOString(),
          actualEnd: null,
          employeeNotes: '',
        })
      }

      alert('ההזמנה אושרה ונשמרה בהצלחה ✅')
      navigate(`/orders/view`)
    } catch (err) {
      console.error('שגיאה באישור ההזמנה:', err)
    }
  }

  if (isLoading) return <Loader />

  if (!order || !client) return <div>טוען נתונים...</div>

  return (
    <section className='order-update-qty'>
      <h1>
        📦 אישור ואספקת הזמנה #{orderId} - {client.customerName}
      </h1>

      <div className='client-details'>
        <p>
          <strong>איש קשר:</strong> {client.contactPerson}
        </p>
        <p>
          <strong>טלפון:</strong> {client.phoneNumber}
        </p>
        <p>
          <strong>כתובת:</strong> {client.address}
        </p>
        <p>
          <strong>תאריך הספקה מיועד:</strong> {deliveryDate ? format(new Date(deliveryDate), 'dd/MM/yyyy') : '—'}
        </p>
      </div>

      <table>
        <thead>
          <tr>
            <th>יבול</th>
            <th>כמות מוזמנת</th>
            <th>מחיר ליח׳</th>
            <th>כמות בפועל לאספקה</th>
            <th>סה״כ שורה</th>
            <th>פירוט חלוקה למחסנים</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={item._id}>
              <td>{cropsMap[item.cropId]}</td>
              <td>{item.quantity}</td>
              <td>{item.price} ₪</td>
              <td>
                <input
                  type='number'
                  value={item.actualDelivery}
                  onChange={(e) => {
                    const updated = [...items]
                    updated[idx].actualDelivery = +e.target.value
                    setItems(updated)
                  }}
                />
              </td>
              <td>{(item.price * item.actualDelivery).toFixed(2)} ₪</td>
              <td>
                {warehousesMap[item.cropId]?.map((wh) => (
                  <div key={wh.warehouseId}>
                    {wh.warehouseName} (יתרה: {wh.quantity} ק״ג)
                    <input
                      type='number'
                      min='0'
                      max={wh.quantity}
                      onChange={(e) => handleWarehouseQtyChange(idx, wh.warehouseId, +e.target.value)}
                      placeholder='כמות למחסן זה'
                    />
                  </div>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className='summary'>
        <strong>סה״כ הזמנה לאספקה: {items.reduce((sum, i) => sum + i.actualDelivery * i.price, 0).toFixed(2)} ₪</strong>
      </div>

      <h3>שיבוץ עובדים לביצוע המשלוח</h3>
      {assignments.map((a, idx) => (
        <div key={idx} className='assignment-row'>
          <select value={a.userId} onChange={(e) => handleAssignmentChange(idx, 'userId', e.target.value)}>
            <option value=''>בחר עובד לשיבוץ</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.fullName}
              </option>
            ))}
          </select>
          <input type='text' placeholder='הערה לעובד' value={a.note} onChange={(e) => handleAssignmentChange(idx, 'note', e.target.value)} />
          <button onClick={() => removeAssignment(idx)}>❌ הסרה</button>
        </div>
      ))}
      <button onClick={addAssignment}>➕ הוסף עובד לשיבוץ</button>

      <div className='delivery-date'>
        <label>
          תאריך משלוח:
          <DatePicker
            selected={deliveryDate ? new Date(deliveryDate) : null}
            onChange={(date) => setDeliveryDate(date)}
            dateFormat='dd/MM/yyyy'
            locale='he'
            className='custom-datepicker'
            placeholderText='בחר תאריך משלוח'
          />
        </label>
      </div>

      <div className='actions'>
        <button onClick={onSave}>✔️ אישור ואספקת ההזמנה</button>
        <button onClick={() => navigate('/orders/view')}>ביטול</button>
      </div>
    </section>
  )
}
