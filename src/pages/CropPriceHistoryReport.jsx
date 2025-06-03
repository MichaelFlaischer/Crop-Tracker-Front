import { useEffect, useState } from 'react'
import { customerOrderItemService } from '../services/customer-order-item.service.js'
import { customerOrderService } from '../services/customer-order.service.js'
import { cropService } from '../services/crop.service.js'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

export function CropPriceHistoryReport() {
  const [items, setItems] = useState([])
  const [orders, setOrders] = useState([])
  const [crops, setCrops] = useState([])
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [itemData, orderData, cropData] = await Promise.all([customerOrderItemService.query(), customerOrderService.query(), cropService.query()])
      setItems(itemData)
      setOrders(orderData)
      setCrops(cropData)
    } catch (err) {
      console.error('❌ שגיאה בטעינת נתונים', err)
    }
  }

  const cropMap = crops.reduce((map, crop) => {
    map[crop._id] = crop.cropName
    return map
  }, {})

  const orderMap = orders.reduce((map, order) => {
    map[order._id] = order.orderDate
    return map
  }, {})

  const formatDate = (str) => {
    const d = new Date(str)
    return isNaN(d) ? '—' : d.toLocaleDateString('he-IL')
  }

  let serial = 1
  const rows = items.map((item, idx) => {
    const cropName = cropMap[String(item.cropId)] || '—'
    const orderDateStr = orderMap[item.customerOrderId] || null
    const orderDate = formatDate(orderDateStr)
    const price = +item.price || 0
    return {
      id: item._id || idx,
      serial: serial++,
      cropName,
      orderDate,
      price: `${price.toFixed(2)} ש"ח`,
      quantity: +item.quantity || 0,
      sortDate: new Date(orderDateStr),
      sortPrice: price,
      sortQuantity: +item.quantity || 0,
    }
  })

  if (sortConfig.key) {
    rows.sort((a, b) => {
      const valA = a[`sort${sortConfig.key}`] ?? a[sortConfig.key]
      const valB = b[`sort${sortConfig.key}`] ?? b[sortConfig.key]
      if (valA === '—') return 1
      if (valB === '—') return -1
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
      יבול: row.cropName,
      'תאריך הזמנה': row.orderDate,
      'מחיר ליחידה (ש"ח)': row.price,
      'כמות מוזמנת': row.quantity,
    }))
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'היסטוריית מחירי יבול')
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' })
    saveAs(blob, 'היסטוריית_מחירי_יבול.xlsx')
  }

  return (
    <section className='crop-price-history'>
      <h2>🌾 היסטוריית מחירי יבולים</h2>
      <button onClick={exportToExcel}>📤 ייצוא לאקסל</button>
      <table>
        <thead>
          <tr>
            <th onClick={() => handleSort('serial')}>מס"ד</th>
            <th onClick={() => handleSort('cropName')}>שם יבול</th>
            <th onClick={() => handleSort('Date')}>תאריך הזמנה</th>
            <th onClick={() => handleSort('Price')}>מחיר ליחידה (ש"ח)</th>
            <th onClick={() => handleSort('Quantity')}>כמות מוזמנת</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.serial}</td>
              <td>{row.cropName}</td>
              <td>{row.orderDate}</td>
              <td>{row.price}</td>
              <td>{row.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
