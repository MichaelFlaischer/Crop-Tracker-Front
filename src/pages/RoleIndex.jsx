import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { roleService } from '../services/role.service'
import { RoleList } from '../cmps/RoleList'
import { showSuccessMsg, showErrorMsg } from '../services/event-bus.service'

export function RoleIndex() {
  const [roles, setRoles] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    loadRoles()
  }, [])

  async function loadRoles() {
    try {
      const roles = await roleService.query()
      setRoles(roles)
    } catch (err) {
      console.error('Failed to load roles', err)
      showErrorMsg('אירעה שגיאה בטעינת התפקידים')
    }
  }

  async function onRemoveRole(roleId) {
    try {
      await roleService.remove(roleId)
      showSuccessMsg('התפקיד נמחק בהצלחה')
      loadRoles()
    } catch (err) {
      console.error('Failed to remove role', err)
      showErrorMsg('אירעה שגיאה במחיקת התפקיד')
    }
  }

  function onEditRole(roleId) {
    navigate(`/roles/edit/${roleId}`)
  }

  return (
    <section className='role-index'>
      <h1>ניהול תפקידים</h1>

      <Link to='/roles/add'>
        <button className='add-role-btn'>➕ הוסף תפקיד</button>
      </Link>

      <RoleList roles={roles} onRemoveRole={onRemoveRole} onEditRole={onEditRole} />
    </section>
  )
}
