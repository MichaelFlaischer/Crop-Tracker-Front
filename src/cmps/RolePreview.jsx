export function RolePreview({ role, onRemove, onEdit }) {
  return (
    <article className='role-preview'>
      <h3>{role.roleName}</h3>
      <p>
        <strong>תיאור:</strong> {role.description || 'ללא תיאור'}
      </p>
      <p>
        <strong>הרשאות ניהול:</strong> {role.isAdmin ? '✔️ כן' : '❌ לא'}
      </p>

      <div className='actions'>
        <button onClick={onEdit}>✏️ ערוך</button>
        <button onClick={onRemove}>🗑️ מחק</button>
      </div>
    </article>
  )
}
