export function RolePreview({ role, onRemove, onEdit }) {
  return (
    <article className='role-preview'>
      <h3>{role.RoleName}</h3>
      <p>תיאור: {role.Description}</p>
      <p>מנהל: {role.IsAdmin ? 'כן' : 'לא'}</p>
      <div className='actions'>
        <button className='edit-btn' onClick={onEdit}>
          ✏️ ערוך
        </button>
        <button className='remove-btn' onClick={onRemove}>
          🗑️ מחק
        </button>
      </div>
    </article>
  )
}
