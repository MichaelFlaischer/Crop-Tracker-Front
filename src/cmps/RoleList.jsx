import { RolePreview } from './RolePreview'

export function RoleList({ roles, onRemoveRole, onEditRole }) {
  if (!roles.length) return <p>לא נמצאו תפקידים</p>

  return (
    <ul className='role-list'>
      {roles.map((role) => (
        <li key={role._id}>
          <RolePreview role={role} onRemove={() => onRemoveRole(role._id)} onEdit={() => onEditRole(role._id)} />
        </li>
      ))}
    </ul>
  )
}
