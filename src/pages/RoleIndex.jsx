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
      console.error('שגיאה בטעינת התפקידים:', err)
      showErrorMsg('אירעה שגיאה בטעינת רשימת התפקידים')
    }
  }

  async function onRemoveRole(roleId) {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק את התפקיד? פעולה זו אינה ניתנת לשחזור.')) return
    try {
      await roleService.remove(roleId)
      showSuccessMsg('התפקיד נמחק בהצלחה')
      loadRoles()
    } catch (err) {
      console.error('שגיאה במחיקת התפקיד:', err)
      showErrorMsg('אירעה שגיאה במחיקת התפקיד')
    }
  }

  function onEditRole(roleId) {
    navigate(`/roles/edit/${roleId}`)
  }

  return (
    <section className='role-index main-layout'>
      <h1>📋 ניהול תפקידים במערכת</h1>
      <div className='page-description'>במסך זה ניתן להוסיף, לערוך ולמחוק תפקידים במערכת. כל תפקיד מגדיר את סוג הגישה וההרשאות עבור המשתמשים שיקושרו אליו.</div>

      <Link to='/roles/add'>
        <button className='add-role-btn'>➕ הוסף תפקיד חדש</button>
      </Link>

      {roles.length === 0 ? <p>לא קיימים תפקידים במערכת.</p> : <RoleList roles={roles} onRemoveRole={onRemoveRole} onEditRole={onEditRole} />}
    </section>
  )
}
