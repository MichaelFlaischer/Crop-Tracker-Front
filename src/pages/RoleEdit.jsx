import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { roleService } from '../services/role.service'
import { showSuccessMsg, showErrorMsg } from '../services/event-bus.service'

export function RoleEdit() {
  const [role, setRole] = useState(null)
  const { roleId } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    loadRole()
  }, [])

  async function loadRole() {
    try {
      const fetchedRole = await roleService.getById(roleId)
      setRole({
        ...fetchedRole,
        isAdmin: !!fetchedRole.isAdmin,
      })
    } catch (err) {
      showErrorMsg('שגיאה בטעינת פרטי התפקיד')
    }
  }

  function handleChange({ target }) {
    const { name, type, value, checked } = target
    const val = type === 'checkbox' ? checked : value
    setRole((prev) => ({ ...prev, [name]: val }))
  }

  async function onSave(ev) {
    ev.preventDefault()
    try {
      await roleService.save({
        ...role,
        isAdmin: !!role.isAdmin,
      })
      showSuccessMsg('התפקיד עודכן בהצלחה')
      navigate('/roles')
    } catch (err) {
      showErrorMsg('שגיאה בשמירת התפקיד')
    }
  }

  if (!role) return <p>טוען נתונים...</p>

  return (
    <section className='role-edit'>
      <h1>✏️ עריכת תפקיד במערכת</h1>
      <p className='page-description'>
        כאן ניתן לערוך את שם התפקיד, התיאור שלו, ולהגדיר האם מדובר בתפקיד עם הרשאות מנהל מערכת (גישה מלאה לכל הפונקציות והדוחות).
      </p>

      <form onSubmit={onSave} className='role-form'>
        <label>
          שם התפקיד *<br />
          <input type='text' name='roleName' value={role.roleName} onChange={handleChange} required placeholder='לדוג׳: מנהל רכש, עובד מחסן' />
        </label>

        <label>
          תיאור התפקיד <br />
          <textarea name='description' value={role.description} onChange={handleChange} placeholder='תיאור קצר של תחומי האחריות של התפקיד' />
        </label>

        <label className='checkbox-label'>
          <input type='checkbox' name='isAdmin' checked={role.isAdmin} onChange={handleChange} />
          תפקיד זה מעניק הרשאות מנהל מערכת (גישה מלאה לכל המודולים)
        </label>

        <div className='form-actions'>
          <button type='submit' className='btn'>
            💾 שמור שינויים
          </button>
          <button type='button' className='btn cancel-btn' onClick={() => navigate('/roles')}>
            ❌ ביטול
          </button>
        </div>
      </form>
    </section>
  )
}
