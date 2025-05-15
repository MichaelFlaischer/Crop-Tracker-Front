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
      console.error('Error saving role:', err)
    }
  }

  function onCancel() {
    navigate('/roles')
  }

  return (
    <section className='role-add'>
      <h1>הוספת תפקיד חדש</h1>
      <form onSubmit={onSaveRole}>
        <label>
          שם התפקיד:
          <input type='text' name='name' value={role.name} onChange={handleChange} required />
        </label>

        <label>
          תיאור:
          <textarea name='description' value={role.description} onChange={handleChange} />
        </label>

        <label className='checkbox-label'>
          <input type='checkbox' name='isAdmin' checked={role.isAdmin} onChange={handleChange} />
          תפקיד זה מוגדר כמנהל
        </label>

        <div className='form-actions'>
          <button type='submit'>💾 שמור</button>
          <button type='button' onClick={onCancel}>
            ❌ ביטול
          </button>
        </div>
      </form>
    </section>
  )
}
