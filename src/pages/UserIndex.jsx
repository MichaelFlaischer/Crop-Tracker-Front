import { useEffect, useState } from 'react'
import { userService } from '../services/user.service'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service'
import { useNavigate } from 'react-router-dom'
import { ResponsiveTable } from '../cmps/ResponsiveTable.jsx'

export function UserIndex() {
  const [users, setUsers] = useState([])
  const [filterBy, setFilterBy] = useState({ name: '', sort: '' })
  const navigate = useNavigate()

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    try {
      const users = await userService.query()
      setUsers(users)
    } catch (err) {
      showErrorMsg('שגיאה בטעינת העובדים')
    }
  }

  async function onRemove(userId, fullName) {
    const confirm = window.prompt(`האם אתה בטוח שברצונך למחוק את העובד "${fullName}"?\nהקלד "מחק" לאישור:`)
    if (confirm !== 'מחק') return

    try {
      await userService.remove(userId)
      setUsers((prev) => prev.filter((u) => u._id !== userId))
      showSuccessMsg('העובד נמחק')
    } catch (err) {
      showErrorMsg('שגיאה במחיקת העובד')
    }
  }

  function translateStatus(status) {
    switch (status) {
      case 'Active':
        return 'פעיל'
      case 'Inactive':
        return 'לא פעיל'
      default:
        return status || '—'
    }
  }

  function handleFilterChange({ target }) {
    const { name, value } = target
    setFilterBy((prev) => ({ ...prev, [name]: value }))
  }

  function clearFilters() {
    setFilterBy({ name: '', sort: '' })
  }

  const tableData = users.map((user) => ({
    _id: user._id,
    fullName: user.fullName,
    username: user.username,
    roleName: user.roleName || '—',
    email: user.email,
    phoneNumber: user.phoneNumber,
    status: translateStatus(user.status),
    isAdmin: user.isAdmin ? '✔️' : '❌',
  }))

  const sortedData = [...tableData]
  if (filterBy.sort === 'name') {
    sortedData.sort((a, b) => a.fullName.localeCompare(b.fullName))
  } else if (filterBy.sort === 'role') {
    sortedData.sort((a, b) => a.roleName.localeCompare(b.roleName))
  }

  const filteredData = sortedData.filter((user) => user.fullName.toLowerCase().includes(filterBy.name.toLowerCase()))

  return (
    <section className='user-index'>
      <h2>רשימת עובדים</h2>

      <button className='btn btn-primary' onClick={() => navigate('/user/add')}>
        ➕ הוסף עובד
      </button>

      <ResponsiveTable
        columns={[
          { key: 'fullName', label: 'שם מלא' },
          { key: 'username', label: 'שם משתמש' },
          { key: 'roleName', label: 'תפקיד' },
          { key: 'email', label: 'אימייל' },
          { key: 'phoneNumber', label: 'טלפון' },
          { key: 'status', label: 'סטטוס' },
          { key: 'isAdmin', label: 'תפקיד ניהולי' },
        ]}
        data={filteredData}
        filterBy={filterBy}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
        filterFields={[{ name: 'name', label: 'שם עובד', type: 'text' }]}
        sortOptions={[
          { value: 'name', label: 'שם עובד' },
          { value: 'role', label: 'תפקיד' },
        ]}
        renderActions={(user) => (
          <>
            <button className='btn btn-edit' onClick={() => navigate(`/user/edit/${user._id}`)}>
              ✏️ עריכה
            </button>
            <button className='btn btn-delete' onClick={() => onRemove(user._id, user.fullName)}>
              🗑️ מחיקה
            </button>
          </>
        )}
      />
    </section>
  )
}
