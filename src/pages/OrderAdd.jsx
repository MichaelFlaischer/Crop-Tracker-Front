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
      status: 'טיוטה',
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
      <h1>📝 הזמנה חדשה</h1>

      <form onSubmit={onSave}>
        <div className='form-grid'>
          <label>
            לקוח:
            <select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} required>
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
              selected={desiredDeliveryDate ? new Date(desiredDeliveryDate) : null}
              onChange={(date) => {
                const iso = date?.toISOString().split('T')[0] // נשמור כתאריך ISO
                setDesiredDeliveryDate(iso)
              }}
              dateFormat='dd/MM/yyyy'
              placeholderText='בחר תאריך'
              locale='he'
              className='custom-datepicker'
            />
          </label>

          <label style={{ flex: '1 1 100%' }}>
            הערות להזמנה:
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder='הערות מיוחדות (לא חובה)' rows='3' />
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

              <input type='number' placeholder='כמות' value={item.quantity} onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)} required />
              <input type='number' placeholder='מחיר' value={item.price} onChange={(e) => handleItemChange(idx, 'price', e.target.value)} required />
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
          <button type='submit'>💾 שמירה</button>
          <button type='button' onClick={() => navigate('/orders/view')}>
            ביטול
          </button>
        </div>
      </form>
    </section>
  )
}
