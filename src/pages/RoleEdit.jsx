import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { roleService } from '../services/role.service'

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
      setRole(fetchedRole)
    } catch (err) {
      console.error('שגיאה בטעינת התפקיד', err)
    }
  }

  function handleChange({ target }) {
    const { name, value } = target
    setRole((prev) => ({ ...prev, [name]: value }))
  }

  async function onSave(ev) {
    ev.preventDefault()
    try {
      await roleService.save(role)
      navigate('/roles')
    } catch (err) {
      console.error('שגיאה בשמירת התפקיד', err)
    }
  }

  if (!role) return <p>טוען...</p>

  return (
    <section className='role-edit'>
      <h1>עריכת תפקיד</h1>
      <form onSubmit={onSave}>
        <label>
          שם התפקיד:
          <input type='text' name='name' value={role.name} onChange={handleChange} required />
        </label>

        <label>
          תיאור:
          <textarea name='description' value={role.description} onChange={handleChange} />
        </label>

        <button type='submit'>שמור שינויים</button>
      </form>
    </section>
  )
}
