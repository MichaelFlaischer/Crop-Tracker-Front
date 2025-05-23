import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { operationService } from '../services/operation.service.js'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service.js'

export function OperationIndex() {
  const [operations, setOperations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadOperations()
  }, [])

  async function loadOperations() {
    try {
      const data = await operationService.query()

      setOperations(data)
    } catch (err) {
      console.error('שגיאה בטעינת פעולות:', err)
      showErrorMsg('לא ניתן לטעון פעולות')
    } finally {
      setIsLoading(false)
    }
  }

  function onAdd() {
    navigate('/operations/add')
  }

  function onEdit(id) {
    navigate(`/operations/edit/${id}`)
  }

  async function onDelete(id) {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק פעולה זו?')) return
    try {
      await operationService.remove(id)
      setOperations((prev) => prev.filter((op) => op._id !== id))
      showSuccessMsg('הפעולה נמחקה בהצלחה')
    } catch (err) {
      console.error('שגיאה במחיקה:', err)
      showErrorMsg('שגיאה במחיקת פעולה')
    }
  }

  return (
    <section className='operation-index main-layout'>
      <h1>רשימת פעולות</h1>
      <button className='btn-add' onClick={onAdd}>
        ➕ הוספת פעולה חדשה
      </button>

      {isLoading ? (
        <p>טוען נתונים...</p>
      ) : operations.length === 0 ? (
        <p>לא קיימות פעולות</p>
      ) : (
        <table className='operation-table'>
          <thead>
            <tr>
              <th>שם פעולה</th>
              <th>עלות ליחידה</th>
              <th>יחידת מידה</th>
              <th>הערות</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {operations.map((op) => (
              <tr key={op._id}>
                <td>{op.operationName}</td>
                <td>{op.costPerUnit} ₪</td>
                <td>{op.unitDescription}</td>
                <td>{op.executionNotes || '-'}</td>
                <td className='actions'>
                  <button onClick={() => onEdit(op._id)}>✏️</button>
                  <button className='danger' onClick={() => onDelete(op._id)}>
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
