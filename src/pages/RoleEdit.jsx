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
        IsAdmin: fetchedRole.IsAdmin === true || fetchedRole.IsAdmin === 'true',
      })
    } catch (err) {
      showErrorMsg('שגיאה בטעינת התפקיד')
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
      await roleService.save(role)
      showSuccessMsg('התפקיד עודכן בהצלחה')
      navigate('/roles')
    } catch (err) {
      showErrorMsg('שגיאה בשמירת התפקיד')
    }
  }

  if (!role) return <p>טוען...</p>

  return (
    <section className='role-edit main-layout'>
      <h2>עריכת תפקיד</h2>
      <form onSubmit={onSave} className='role-form'>
        <label>
          שם התפקיד:
          <input type='text' name='RoleName' value={role.RoleName} onChange={handleChange} required />
        </label>

        <label>
          תיאור:
          <textarea name='Description' value={role.Description} onChange={handleChange} />
        </label>

        <label className='checkbox-label'>
          <input type='checkbox' name='IsAdmin' checked={role.IsAdmin} onChange={handleChange} />
          תפקיד זה מוגדר כאדמין
        </label>

        <div className='form-actions'>
          <button type='submit' className='btn'>
            שמור
          </button>
          <button type='button' className='btn cancel-btn' onClick={() => navigate('/roles')}>
            ביטול
          </button>
        </div>
      </form>
    </section>
  )
}
