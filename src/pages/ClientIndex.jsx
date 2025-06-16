import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clientService } from '../services/client.service.js'
import { ResponsiveTable } from '../cmps/ResponsiveTable.jsx'

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
        <button className='btn btn-primary' onClick={() => navigate('/client/add')}>
          ➕ הוספת לקוח
        </button>
      </div>

      <ResponsiveTable
        columns={[
          { key: 'customerName', label: 'שם לקוח' },
          { key: 'contactPerson', label: 'איש קשר' },
          { key: 'phoneNumber', label: 'טלפון ליצירת קשר' },
          { key: 'email', label: 'אימייל' },
          { key: 'address', label: 'כתובת' },
          { key: 'notes', label: 'הערות' },
        ]}
        data={filteredClients}
        filterBy={filterBy}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
        filterFields={[
          { name: 'name', label: 'שם לקוח', type: 'text' },
          { name: 'contact', label: 'איש קשר', type: 'text' },
        ]}
        sortOptions={[
          { value: 'name', label: 'שם לקוח' },
          { value: 'phone', label: 'טלפון' },
          { value: 'email', label: 'אימייל' },
        ]}
        renderActions={(client) => (
          <>
            <button className='btn btn-view' onClick={() => onViewOrders(client._id)}>
              📦 הזמנות
            </button>
            <button className='btn btn-edit' onClick={() => onEdit(client._id)}>
              ✏️ עריכה
            </button>
            <button className='btn btn-delete' onClick={() => onRemove(client._id)}>
              🗑️ מחיקה
            </button>
          </>
        )}
      />
    </section>
  )
}
