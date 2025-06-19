import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { customerOrderService } from '../services/customer-order.service.js'
import { clientService } from '../services/client.service.js'
import { cropService } from '../services/crop.service.js'
import { customerOrderItemService } from '../services/customer-order-item.service.js'
import { warehouseService } from '../services/warehouse.service.js'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { registerLocale } from 'react-datepicker'
import he from 'date-fns/locale/he'
registerLocale('he', he)

export function OrderAdd() {
  const [clients, setClients] = useState([])
  const [crops, setCrops] = useState([])
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [desiredDeliveryDate, setDesiredDeliveryDate] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([{ cropId: '', quantity: '', price: '' }])
  const [cropStats, setCropStats] = useState({})

  const navigate = useNavigate()

  useEffect(() => {
    loadClients()
    loadCrops()
  }, [])

  async function loadClients() {
    try {
      const data = await clientService.query()
      setClients(data)
    } catch (err) {
      console.error('שגיאה בטעינת לקוחות:', err)
    }
  }

  async function loadCrops() {
    try {
      const data = await cropService.query()
      setCrops(data)
    } catch (err) {
      console.error('שגיאה בטעינת יבולים:', err)
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

  function handleItemChange(idx, field, value) {
    const updated = [...items]
    updated[idx][field] = value
    setItems(updated)
    if (field === 'cropId') updateCropStats(value)
  }

  function addItemRow() {
    setItems((prev) => [...prev, { cropId: '', quantity: '', price: '' }])
  }

  function removeItemRow(idx) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
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
    if (!selectedCustomerId || !desiredDeliveryDate || items.some((i) => !i.cropId || !i.quantity || !i.price)) {
      alert('אנא מלא את כל השדות הנדרשים')
      return
    }

    const order = {
      customerId: selectedCustomerId,
      orderDate: new Date().toISOString(),
      desiredDeliveryDate,
      status: 'Draft',
      totalAmount: calcTotal(),
      notes,
    }

    try {
      const savedOrder = await customerOrderService.add(order)

      const itemsToSave = items.map((i) => ({
        customerOrderId: savedOrder._id,
        cropId: i.cropId,
        quantity: +i.quantity,
        price: +i.price,
        deliveredQuantity: 0,
      }))

      for (const item of itemsToSave) {
        await customerOrderItemService.add(item)
      }

      navigate('/orders/view')
    } catch (err) {
      console.error('שגיאה בשמירת הזמנה ופריטים:', err)
    }
  }

  const selectedClient = clients.find((c) => String(c._id) === selectedCustomerId)

  return (
    <section className='order-add'>
      <h1>📦 יצירת הזמנה חדשה במערכת Crop-Tracker</h1>
      <p className='form-note'>
        כאן תוכל ליצור הזמנה חדשה ללקוח. <br />
        לאחר שמירת ההזמנה, תוכל לעדכן את המלאי בהתאם למשלוחים בפועל.
      </p>

      <form onSubmit={onSave}>
        <div className='form-grid'>
          <label>
            לקוח *:
            <select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} required>
              <option value=''>בחר לקוח מהרשימה</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.customerName}
                </option>
              ))}
            </select>
          </label>

          <label>
            תאריך הספקה רצוי *:
            <DatePicker
              selected={desiredDeliveryDate ? new Date(desiredDeliveryDate) : null}
              onChange={(date) => {
                const iso = date?.toISOString().split('T')[0]
                setDesiredDeliveryDate(iso)
              }}
              dateFormat='dd/MM/yyyy'
              placeholderText='בחר תאריך (יום/חודש/שנה)'
              locale='he'
              className='custom-datepicker'
            />
          </label>

          <label style={{ flex: '1 1 100%' }}>
            הערות להזמנה (לא חובה):
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder='הערות מיוחדות להזמנה' rows='3' />
          </label>
        </div>

        {selectedClient && (
          <div className='client-info'>
            <h4>🧑‍💼 פרטי לקוח:</h4>
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

        <h3>📝 פרטי פריטים להזמנה:</h3>
        <p className='form-note'>יש להוסיף את פרטי הפריטים הכלולים בהזמנה (יבול, כמות ומחיר).</p>

        {items.map((item, idx) => {
          const stats = cropStats[item.cropId]
          return (
            <div key={idx} className='item-row'>
              <label>
                יבול:
                <select value={item.cropId} onChange={(e) => handleItemChange(idx, 'cropId', e.target.value)} required>
                  <option value=''>בחר יבול</option>
                  {crops.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.cropName}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                כמות (ק״ג):
                <input type='number' value={item.quantity} onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)} required />
              </label>

              <label>
                מחיר ליח׳ (₪):
                <input type='number' value={item.price} onChange={(e) => handleItemChange(idx, 'price', e.target.value)} required />
              </label>

              <button type='button' onClick={() => removeItemRow(idx)}>
                ❌ הסר פריט
              </button>

              {stats && (
                <div className='crop-info'>
                  <div className='inventory-total'>סה״כ במלאי במחסנים: {stats.totalInWarehouses} ק״ג</div>
                  <div className='reserved'>כמות משוריינת להזמנות קיימות: {stats.reservedInOrders} ק״ג</div>
                  <div className='available'>כמות זמינה לשיבוץ: {stats.available} ק״ג</div>
                </div>
              )}
            </div>
          )
        })}

        <button type='button' onClick={addItemRow}>
          ➕ הוסף פריט להזמנה
        </button>

        <div className='summary'>
          <strong>סה״כ עלות הזמנה: {calcTotal().toFixed(2)} ₪</strong>
        </div>

        <div className='actions'>
          <button type='submit'>💾 שמירת הזמנה</button>
          <button type='button' onClick={() => navigate('/orders/view')}>
            ביטול
          </button>
        </div>
      </form>
    </section>
  )
}
