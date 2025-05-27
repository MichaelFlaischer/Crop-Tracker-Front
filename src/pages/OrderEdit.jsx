import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { customerOrderService } from '../services/customer-order.service.js'
import { customerOrderItemService } from '../services/customer-order-item.service.js'
import { clientService } from '../services/client.service.js'
import { cropService } from '../services/crop.service.js'
import { warehouseService } from '../services/warehouse.service.js'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { registerLocale } from 'react-datepicker'
import he from 'date-fns/locale/he'
registerLocale('he', he)

export function OrderEdit() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [items, setItems] = useState([])
  const [clients, setClients] = useState([])
  const [crops, setCrops] = useState([])
  const [cropStats, setCropStats] = useState({})
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [orderId])

  async function loadData() {
    try {
      const o = await customerOrderService.getById(orderId)
      const i = await customerOrderItemService.queryByOrderId(orderId)
      const c = await clientService.query()
      const cropList = await cropService.query()
      const updatedItems = i.map((item) => ({ ...item, deliveredQuantity: undefined }))

      setOrder(o)
      setItems(updatedItems)
      setClients(c)
      setCrops(cropList)
    } catch (err) {
      console.error('שגיאה בטעינת נתונים לעריכה:', err)
    }
  }

  async function updateCropStats(cropId) {
    if (!cropId || cropStats[cropId]) return
    try {
      const warehouses = await warehouseService.queryByCrop(cropId)
      const totalInWarehouses = warehouses.reduce((sum, w) => sum + (w.quantity || 0), 0)
      const draftItems = await customerOrderItemService.queryByCropAndStatus(cropId, 'טיוטה')
      const approvedItems = await customerOrderItemService.queryByCropAndStatus(cropId, 'מאושרת')
      const reservedInOrders = [...draftItems, ...approvedItems].reduce((sum, i) => sum + (i.quantity || 0), 0)
      const available = totalInWarehouses - reservedInOrders

      setCropStats((prev) => ({
        ...prev,
        [cropId]: { totalInWarehouses, reservedInOrders, available },
      }))
    } catch (err) {
      console.error('שגיאה בטעינת מידע על יבול:', err)
    }
  }

  function handleChange(field, value) {
    setOrder((prev) => ({ ...prev, [field]: value }))
  }

  function handleItemChange(idx, field, value) {
    const updated = [...items]
    updated[idx][field] = value
    setItems(updated)
    if (field === 'cropId') updateCropStats(value)
  }

  function addItemRow() {
    setItems((prev) => [...prev, { cropId: '', quantity: '', price: '' }])
  }

  async function removeItemRow(idx) {
    const item = items[idx]
    const isExisting = !!item._id

    if (isExisting) {
      const confirm = window.confirm('האם אתה בטוח שברצונך למחוק את הפריט מההזמנה?')
      if (!confirm) return

      try {
        await customerOrderItemService.remove(item._id)
        setItems((prev) => prev.filter((_, i) => i !== idx))
      } catch (err) {
        console.error('שגיאה במחיקת פריט מההזמנה:', err)
        alert('שגיאה במחיקת הפריט. נסה שוב.')
      }
    } else {
      setItems((prev) => prev.filter((_, i) => i !== idx))
    }
  }

  function calcTotal() {
    return items.reduce((sum, item) => {
      const q = +item.quantity || 0
      const p = +item.price || 0
      return sum + q * p
    }, 0)
  }

  async function onSave(ev) {
    ev.preventDefault()
    if (!order.customerId || !order.desiredDeliveryDate || items.some((i) => !i.cropId || !i.quantity || !i.price)) {
      alert('אנא מלא את כל השדות הנדרשים')
      return
    }

    const updatedOrder = {
      ...order,
      status: 'טיוטה',
      totalAmount: calcTotal(),
    }

    try {
      await customerOrderService.update(orderId, updatedOrder)
      for (const item of items) {
        if (!item._id) {
          const newItem = { ...item, customerOrderId: orderId, deliveredQuantity: 0 }
          await customerOrderItemService.add(newItem)
        } else {
          await customerOrderItemService.update(item._id, item)
        }
      }
      navigate('/orders/view')
    } catch (err) {
      console.error('שגיאה בשמירת ההזמנה:', err)
    }
  }

  if (!order) return <div>טוען נתונים...</div>

  const selectedClient = clients.find((c) => String(c._id) === String(order.customerId))

  return (
    <section className='order-edit'>
      <h1>✏️ עריכת הזמנה #{orderId}</h1>

      <form onSubmit={onSave}>
        <div className='form-grid'>
          <label>
            לקוח:
            <select value={order.customerId} onChange={(e) => handleChange('customerId', e.target.value)} required>
              <option value=''>בחר לקוח</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.customerName}
                </option>
              ))}
            </select>
          </label>

          <label>
            תאריך הספקה רצוי:
            <DatePicker
              selected={order.desiredDeliveryDate ? new Date(order.desiredDeliveryDate) : null}
              onChange={(date) => {
                const iso = date?.toISOString().split('T')[0]
                handleChange('desiredDeliveryDate', iso)
              }}
              dateFormat='dd/MM/yyyy'
              placeholderText='בחר תאריך'
              locale='he'
              className='custom-datepicker'
            />
          </label>

          <label style={{ flex: '1 1 100%' }}>
            הערות להזמנה:
            <textarea value={order.notes || ''} onChange={(e) => handleChange('notes', e.target.value)} placeholder='הערות להזמנה' />
          </label>
        </div>

        {selectedClient && (
          <div className='client-info'>
            <div>
              <strong>איש קשר:</strong> {selectedClient.contactPerson}
            </div>
            <div>
              <strong>טלפון:</strong> {selectedClient.phoneNumber}
            </div>
            <div>
              <strong>כתובת:</strong> {selectedClient.address}
            </div>
          </div>
        )}

        <h3>פריטים:</h3>
        {items.map((item, idx) => {
          const stats = cropStats[item.cropId]
          return (
            <div key={idx} className='item-row'>
              <select value={item.cropId} onChange={(e) => handleItemChange(idx, 'cropId', e.target.value)} required>
                <option value=''>בחר יבול</option>
                {crops.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.cropName}
                  </option>
                ))}
              </select>
              <input type='number' placeholder='כמות' value={item.quantity} onChange={(e) => handleItemChange(idx, 'quantity', +e.target.value)} required />
              <input type='number' placeholder='מחיר' value={item.price} onChange={(e) => handleItemChange(idx, 'price', +e.target.value)} required />
              <button type='button' onClick={() => removeItemRow(idx)}>
                ❌
              </button>
              {stats && (
                <div className='crop-info'>
                  <div className='inventory-total'>סה״כ במחסנים: {stats.totalInWarehouses}</div>
                  <div className='reserved'>שובץ להזמנות: {stats.reservedInOrders}</div>
                  <div className='available'>זמין לשיבוץ: {stats.available}</div>
                </div>
              )}
            </div>
          )
        })}

        <button type='button' onClick={addItemRow}>
          ➕ הוסף פריט
        </button>

        <div className='summary'>
          <strong>סה״כ: {calcTotal().toFixed(2)} ₪</strong>
        </div>

        <div className='actions'>
          <button type='submit'>💾 שמור</button>
          <button type='button' onClick={() => navigate('/orders/view')}>
            ביטול
          </button>
        </div>
      </form>
    </section>
  )
}
