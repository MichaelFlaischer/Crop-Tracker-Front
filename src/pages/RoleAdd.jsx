import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { roleService } from '../services/role.service'

export function RoleAdd() {
  const [role, setRole] = useState({
    name: '',
    description: '',
    isAdmin: false,
  })
  const navigate = useNavigate()

  function handleChange({ target }) {
    const { name, value, type, checked } = target
    const val = type === 'checkbox' ? checked : value
    setRole((prevRole) => ({ ...prevRole, [name]: val }))
  }

  async function onSaveRole(ev) {
    ev.preventDefault()
    try {
      await roleService.save(role)
      navigate('/roles')
    } catch (err) {
      console.error('שגיאה בשמירת תפקיד:', err)
    }
  }

  function onCancel() {
    navigate('/roles')
  }

  return (
    <section className='role-add main-layout'>
      <h1>➕ הוספת תפקיד חדש למערכת</h1>
      <p className='page-description'>
        כאן ניתן להגדיר תפקיד חדש עבור משתמשים במערכת. ניתן לציין שם תפקיד, תיאור, ולהחליט האם מדובר בתפקיד עם הרשאות מנהל מערכת.
      </p>

      <form onSubmit={onSaveRole} className='form'>
        <label>
          שם התפקיד *<br />
          <input type='text' name='name' value={role.name} onChange={handleChange} required placeholder='לדוג׳: מנהל לוגיסטיקה, עובד שדה' />
        </label>

        <label>
          תיאור התפקיד <br />
          <textarea name='description' value={role.description} onChange={handleChange} placeholder='תיאור קצר של תחומי האחריות של התפקיד' />
        </label>

        <label className='checkbox-label'>
          <input type='checkbox' name='isAdmin' checked={role.isAdmin} onChange={handleChange} />
          תפקיד זה מעניק הרשאות מנהל מערכת (גישה מלאה לכל הפונקציות והדוחות)
        </label>

        <div className='form-actions'>
          <button type='submit'>💾 שמירה</button>
          <button type='button' onClick={onCancel}>
            ❌ ביטול
          </button>
        </div>
      </form>
    </section>
  )
}
