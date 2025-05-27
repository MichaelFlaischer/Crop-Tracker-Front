import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clientService } from '../services/client.service.js'

export function ClientIndex() {
  const [clients, setClients] = useState([])
  const [filteredClients, setFilteredClients] = useState([])
  const [filterBy, setFilterBy] = useState({ name: '', contact: '', sort: '' })

  const navigate = useNavigate()

  useEffect(() => {
    loadClients()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [filterBy, clients])

  async function loadClients() {
    try {
      const data = await clientService.query()
      setClients(data)
    } catch (err) {
      console.error('שגיאה בטעינת לקוחות:', err)
    }
  }

  function onEdit(clientId) {
    navigate(`/client/edit/${clientId}`)
  }

  function onViewOrders(clientId) {
    navigate(`/client/${clientId}/orders`)
  }

  async function onRemove(clientId) {
    const isSure = confirm('האם אתה בטוח שברצונך למחוק את הלקוח הזה? פעולה זו אינה ניתנת לביטול.')
    if (!isSure) return
    try {
      await clientService.remove(clientId)
      setClients((prev) => prev.filter((c) => c._id !== clientId))
    } catch (err) {
      console.error('שגיאה במחיקת לקוח:', err)
    }
  }

  function handleFilterChange({ target }) {
    const { name, value } = target
    setFilterBy((prev) => ({ ...prev, [name]: value }))
  }

  function applyFilters() {
    let filtered = [...clients]

    if (filterBy.name) {
      filtered = filtered.filter((c) => c.customerName.toLowerCase().includes(filterBy.name.toLowerCase()))
    }

    if (filterBy.contact) {
      filtered = filtered.filter((c) => c.contactPerson.toLowerCase().includes(filterBy.contact.toLowerCase()))
    }

    if (filterBy.sort === 'name') {
      filtered.sort((a, b) => a.customerName.localeCompare(b.customerName))
    } else if (filterBy.sort === 'phone') {
      filtered.sort((a, b) => a.phoneNumber.localeCompare(b.phoneNumber))
    } else if (filterBy.sort === 'email') {
      filtered.sort((a, b) => a.email.localeCompare(b.email))
    }

    setFilteredClients(filtered)
  }

  function clearFilters() {
    setFilterBy({ name: '', contact: '', sort: '' })
  }

  return (
    <section className='client-index'>
      <div className='header-bar'>
        <h1>רשימת לקוחות</h1>
        <button className='add-btn' onClick={() => navigate('/client/add')}>
          ➕ הוספת לקוח חדש
        </button>
      </div>
      <div className='filter-bar'>
        <input type='text' name='name' placeholder='סינון לפי שם לקוח' value={filterBy.name} onChange={handleFilterChange} />
        <input type='text' name='contact' placeholder='סינון לפי איש קשר' value={filterBy.contact} onChange={handleFilterChange} />
        <select name='sort' value={filterBy.sort} onChange={handleFilterChange}>
          <option value=''>מיון לפי</option>
          <option value='name'>שם לקוח</option>
          <option value='phone'>טלפון</option>
          <option value='email'>אימייל</option>
        </select>
        <button onClick={clearFilters}>איפוס</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>שם לקוח</th>
            <th>איש קשר</th>
            <th>טלפון</th>
            <th>אימייל</th>
            <th>כתובת</th>
            <th>הערות</th>
            <th>פעולות</th>
          </tr>
        </thead>
        <tbody>
          {filteredClients.map((client) => (
            <tr key={client._id}>
              <td>{client.customerName}</td>
              <td>{client.contactPerson}</td>
              <td>{client.phoneNumber}</td>
              <td>{client.email}</td>
              <td>{client.address}</td>
              <td>{client.notes}</td>
              <td>
                <button onClick={() => onViewOrders(client._id)}>📦 צפייה בהזמנות</button>
                <button onClick={() => onEdit(client._id)}>✏️ עריכה</button>
                <button onClick={() => onRemove(client._id)}>🗑️ מחיקה</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
