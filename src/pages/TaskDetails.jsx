import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { taskService } from '../services/task.service.js'
import { employeesInTaskService } from '../services/employees-in-task.service.js'
import { userService } from '../services/user.service.js'
import { fieldService } from '../services/field.service.js'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service.js'

export function TaskDetails() {
  const { taskId } = useParams()
  const navigate = useNavigate()
  const [task, setTask] = useState(null)
  const [employees, setEmployees] = useState([])
  const [users, setUsers] = useState([])
  const [fieldName, setFieldName] = useState('')
  const [newAssignments, setNewAssignments] = useState({
    employeeIds: [],
    actualStart: '',
    actualEnd: '',
    employeeNotes: '',
  })

  const statusMap = {
    pending: 'בהמתנה',
    'in-progress': 'בתהליך',
    done: 'הושלמה',
    delayed: 'נדחתה',
    missed: 'לא בוצעה',
  }

  useEffect(() => {
    loadTaskDetails()
  }, [])

  async function loadTaskDetails() {
    try {
      const [task, allEmployees, users, fields] = await Promise.all([
        taskService.getById(taskId),
        employeesInTaskService.query(),
        userService.query(),
        fieldService.query(),
      ])

      const taskEmployees = allEmployees.filter((e) => e.taskId === taskId)
      const field = fields.find((f) => f._id === task.fieldId)

      setTask(task)
      setEmployees(taskEmployees)
      setUsers(users)
      setFieldName(field?.fieldName || '-')
    } catch (err) {
      showErrorMsg('שגיאה בטעינת פרטי משימה')
    }
  }

  function formatDate(str) {
    if (!str) return '--/--/----'
    const date = new Date(str)
    return date.toLocaleDateString('he-IL')
  }

  function formatTime(str) {
    return str ? new Date(str).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : '--:--'
  }

  function handleRemove(assignmentId) {
    const confirmRemove = window.confirm('האם אתה בטוח שברצונך להסיר את העובד מהמשימה?')
    if (!confirmRemove) return

    employeesInTaskService
      .remove(assignmentId)
      .then(() => {
        setEmployees((prev) => prev.filter((e) => e._id !== assignmentId))
        showSuccessMsg('העובד הוסר מהמשימה')
      })
      .catch(() => showErrorMsg('שגיאה בהסרת עובד'))
  }

  function handleAddAssignment(ev) {
    ev.preventDefault()
    const { employeeIds, actualStart, actualEnd, employeeNotes } = newAssignments
    if (!employeeIds.length) return

    const inserts = employeeIds.map((id) => ({
      taskId,
      employeeId: id,
      actualStart,
      actualEnd,
      employeeNotes,
      assignedAt: new Date(),
      status: 'in-progress',
    }))

    Promise.all(inserts.map((rec) => employeesInTaskService.add(rec)))
      .then((added) => {
        setEmployees((prev) => [...prev, ...added])
        setNewAssignments({ employeeIds: [], actualStart: '', actualEnd: '', employeeNotes: '' })
        showSuccessMsg('העובד(ים) נוספו בהצלחה')
      })
      .catch(() => showErrorMsg('שגיאה בהוספת עובד(ים)'))
  }

  const assignedIds = employees.map((e) => e.employeeId)
  const unassignedUsers = users.filter((u) => !assignedIds.includes(u._id))

  const statusNote =
    employees.length < task?.requiredEmployees
      ? 'יש פחות עובדים מהנדרש'
      : employees.length === task?.requiredEmployees
      ? 'כמות מדויקת של עובדים שובצה'
      : 'יש יותר מדי עובדים שובצו מהנדרש'

  if (!task) return <section className='task-details'>טוען פרטים...</section>

  return (
    <section className='task-details main-layout'>
      <div className='task-actions'>
        <button onClick={() => navigate('/tasks')}>⬅ חזור לרשימת המשימות</button>
        <button onClick={() => navigate(`/tasks/edit/${taskId}`)}>✏ עריכת משימה זו</button>
      </div>
      <h1>פרטי משימה</h1>
      <div className='task-summary'>
        <p>
          <strong>תיאור פעולה:</strong> {task.taskDescription}
        </p>
        <p>
          <strong>שדה:</strong> {fieldName}
        </p>
        <p>
          <strong>תאריך התחלה:</strong> {formatDate(task.startDate)} {task.startTime}
        </p>
        <p>
          <strong>תאריך סיום:</strong> {formatDate(task.endDate)} {task.endTime}
        </p>
        <p>
          <strong>סטטוס:</strong> {statusMap[task.status]}
        </p>
        <p>
          <strong>כמות עובדים נדרשת:</strong> {task.requiredEmployees}
        </p>
        <p>
          <strong>משובצים כעת:</strong> {employees.length} עובדים — {statusNote}
        </p>
      </div>

      <h2>עובדים שובצו</h2>
      {employees.length === 0 ? (
        <p>לא שובצו עובדים למשימה זו.</p>
      ) : (
        <table className='assigned-employees-table'>
          <thead>
            <tr>
              <th>שם עובד</th>
              <th>תפקיד</th>
              <th>סטטוס</th>
              <th>תאריך התחלה בפועל</th>
              <th>שעה התחלה בפועל</th>
              <th>תאריך סיום בפועל</th>
              <th>שעה סיום בפועל</th>
              <th>הערות</th>
              <th>הסרה</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => {
              const emp = users.find((u) => u._id === e.employeeId)
              return (
                <tr key={e._id}>
                  <td>{emp?.FullName || '-'}</td>
                  <td>{emp?.RoleName || '-'}</td>
                  <td>{statusMap[e.status] || e.status}</td>
                  <td>{formatDate(e.actualStart)}</td>
                  <td>{formatTime(e.actualStart)}</td>
                  <td>{formatDate(e.actualEnd)}</td>
                  <td>{formatTime(e.actualEnd)}</td>
                  <td>{e.employeeNotes || '-'}</td>
                  <td>
                    <button onClick={() => handleRemove(e._id)}>🗑️ הסר</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      <h2>הוספת עובדים למשימה</h2>
      <form onSubmit={handleAddAssignment} className='add-employee-form'>
        <table>
          <thead>
            <tr>
              <th>בחירת עובדים</th>
              <th>שעת התחלה בפועל</th>
              <th>שעת סיום בפועל</th>
              <th>הערות</th>
              <th>פעולה</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <select
                  multiple
                  required
                  value={newAssignments.employeeIds}
                  onChange={(e) =>
                    setNewAssignments((prev) => ({
                      ...prev,
                      employeeIds: Array.from(e.target.selectedOptions, (opt) => opt.value),
                    }))
                  }
                >
                  {unassignedUsers.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.FullName}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  type='datetime-local'
                  value={newAssignments.actualStart}
                  onChange={(e) => setNewAssignments((prev) => ({ ...prev, actualStart: e.target.value }))}
                />
              </td>
              <td>
                <input
                  type='datetime-local'
                  value={newAssignments.actualEnd}
                  onChange={(e) => setNewAssignments((prev) => ({ ...prev, actualEnd: e.target.value }))}
                />
              </td>
              <td>
                <input
                  type='text'
                  value={newAssignments.employeeNotes}
                  onChange={(e) => setNewAssignments((prev) => ({ ...prev, employeeNotes: e.target.value }))}
                  placeholder='הערות'
                />
              </td>
              <td>
                <button type='submit'>➕ הוסף</button>
              </td>
            </tr>
          </tbody>
        </table>
      </form>
    </section>
  )
}
