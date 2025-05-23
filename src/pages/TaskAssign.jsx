import { useEffect, useState } from 'react'
import { taskService } from '../services/task.service.js'
import { employeesInTaskService } from '../services/employees-in-task.service.js'
import { userService } from '../services/user.service.js'
import { fieldService } from '../services/field.service.js'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service.js'

export function TaskAssign() {
  const [tasks, setTasks] = useState([])
  const [employeeAssignments, setEmployeeAssignments] = useState([])
  const [myTasks, setMyTasks] = useState([])
  const [fields, setFields] = useState([])
  const [notesMap, setNotesMap] = useState({})
  const [statusMap, setStatusMap] = useState({})

  const loggedInUser = userService.getLoggedInUser()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [allTasks, allAssignments, allFields] = await Promise.all([taskService.query(), employeesInTaskService.query(), fieldService.query()])

      setTasks(allTasks)
      setEmployeeAssignments(allAssignments)
      setFields(allFields)

      const userAssignments = allAssignments.filter((assign) => assign.employeeId === loggedInUser._id)

      const taskMap = userAssignments.map((assign) => ({
        task: allTasks.find((task) => task._id === assign.taskId),
        assignment: assign,
      }))

      setMyTasks(taskMap)

      const initialNotes = {}
      const initialStatus = {}
      userAssignments.forEach((assign) => {
        initialNotes[assign._id] = assign.employeeNotes || ''
        initialStatus[assign._id] = assign.status || 'pending'
      })

      setNotesMap(initialNotes)
      setStatusMap(initialStatus)
    } catch (err) {
      showErrorMsg('שגיאה בטעינת הנתונים')
    }
  }

  function formatDate(dateStr) {
    try {
      return new Date(dateStr).toLocaleDateString('he-IL')
    } catch {
      return '--'
    }
  }

  function translateStatus(status) {
    const map = {
      pending: 'בהמתנה',
      'in-progress': 'בתהליך',
      done: 'הושלמה',
      delayed: 'נדחתה',
      missed: 'לא בוצעה',
    }
    return map[status] || status
  }

  function getFieldName(fieldId) {
    const field = fields.find((f) => f._id === fieldId)
    return field?.fieldName || '-'
  }

  function handleStatusChange(assignmentId, newStatus) {
    setStatusMap((prev) => ({ ...prev, [assignmentId]: newStatus }))
  }

  function handleNotesChange(assignmentId, newNote) {
    setNotesMap((prev) => ({ ...prev, [assignmentId]: newNote }))
  }

  async function onSave(assignmentId) {
    const assignment = employeeAssignments.find((a) => a._id === assignmentId)
    if (!assignment) return

    const updated = {
      ...assignment,
      status: statusMap[assignmentId],
      employeeNotes: notesMap[assignmentId],
    }

    try {
      await employeesInTaskService.update(updated)
      showSuccessMsg('עודכן בהצלחה')
    } catch {
      showErrorMsg('שגיאה בשמירה')
    }
  }

  const activeTasks = myTasks.filter(({ assignment }) => ['pending', 'in-progress'].includes(assignment.status))
  const finishedTasks = myTasks.filter(({ assignment }) => ['done', 'delayed', 'missed'].includes(assignment.status))

  return (
    <section className='task-assign main-layout'>
      <h1>המשימות שלי</h1>

      <h2>משימות פעילות</h2>
      {activeTasks.length === 0 ? (
        <p>לא שובצת למשימות פעילות</p>
      ) : (
        <table className='my-task-table'>
          <thead>
            <tr>
              <th>תיאור פעולה</th>
              <th>שדה</th>
              <th>תאריך התחלה</th>
              <th>שעת התחלה</th>
              <th>תאריך סיום</th>
              <th>שעת סיום</th>
              <th>סטטוס</th>
              <th>הערות</th>
              <th>עדכון</th>
            </tr>
          </thead>
          <tbody>
            {activeTasks.map(({ task, assignment }) => (
              <tr key={assignment._id}>
                <td>{task.taskDescription}</td>
                <td>{getFieldName(task.fieldId)}</td>
                <td>{formatDate(task.startDate)}</td>
                <td>{task.startTime}</td>
                <td>{formatDate(task.endDate)}</td>
                <td>{task.endTime}</td>
                <td>
                  <select value={statusMap[assignment._id]} onChange={(e) => handleStatusChange(assignment._id, e.target.value)}>
                    <option value='pending'>בהמתנה</option>
                    <option value='in-progress'>בתהליך</option>
                    <option value='done'>הושלמה</option>
                    <option value='delayed'>נדחתה</option>
                    <option value='missed'>לא בוצעה</option>
                  </select>
                </td>
                <td>
                  <input type='text' value={notesMap[assignment._id]} onChange={(e) => handleNotesChange(assignment._id, e.target.value)} />
                </td>
                <td>
                  <button onClick={() => onSave(assignment._id)}>💾 שמור</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>משימות שהושלמו / נדחו</h2>
      {finishedTasks.length === 0 ? (
        <p>אין משימות שהושלמו או נדחו</p>
      ) : (
        <table className='my-task-table'>
          <thead>
            <tr>
              <th>תיאור פעולה</th>
              <th>שדה</th>
              <th>תאריך התחלה</th>
              <th>שעת התחלה</th>
              <th>תאריך סיום</th>
              <th>שעת סיום</th>
              <th>סטטוס</th>
              <th>הערות</th>
            </tr>
          </thead>
          <tbody>
            {finishedTasks.map(({ task, assignment }) => (
              <tr key={assignment._id}>
                <td>{task.taskDescription}</td>
                <td>{getFieldName(task.fieldId)}</td>
                <td>{formatDate(task.startDate)}</td>
                <td>{task.startTime}</td>
                <td>{formatDate(task.endDate)}</td>
                <td>{task.endTime}</td>
                <td>{translateStatus(assignment.status)}</td>
                <td>{assignment.employeeNotes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
