import { useEffect, useState } from 'react'
import { userService } from '../services/user.service'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service'
import { useNavigate } from 'react-router-dom'

export function UserIndex() {
  const [users, setUsers] = useState([])
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

  return (
    <section className='user-index main-layout'>
      <h2>רשימת עובדים</h2>

      <button className='add-user-btn' onClick={() => navigate('/users/add')}>
        ➕ הוסף עובד
      </button>

      {users.length === 0 ? (
        <p>לא נמצאו עובדים.</p>
      ) : (
        <table className='user-table'>
          <thead>
            <tr>
              <th>שם מלא</th>
              <th>שם עובד</th>
              <th>תפקיד</th>
              <th>אימייל</th>
              <th>טלפון</th>
              <th>סטטוס</th>
              <th>אדמין</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>{user.FullName}</td>
                <td>{user.Username}</td>
                <td>{user.RoleName || '—'}</td>
                <td>{user.Email}</td>
                <td>{user.PhoneNumber}</td>
                <td>{user.Status}</td>
                <td>{String(user.IsAdmin).toLowerCase() === 'true' ? '✔️' : '❌'}</td>
                <td>
                  <button onClick={() => navigate(`/user/edit/${user._id}`)}>✏️</button>
                  <button onClick={() => onRemove(user._id, user.FullName)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
