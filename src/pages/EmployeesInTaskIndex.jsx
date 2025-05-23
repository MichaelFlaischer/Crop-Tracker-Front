import { useEffect, useState } from 'react'
import { employeesInTaskService } from '../services/employees-in-task.service.js'
import { taskService } from '../services/task.service.js'
import { userService } from '../services/user.service.js'
import { showErrorMsg } from '../services/event-bus.service.js'

export function EmployeesInTaskIndex() {
  const [records, setRecords] = useState([])
  const [tasksMap, setTasksMap] = useState({})
  const [usersMap, setUsersMap] = useState({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [records, tasks, users] = await Promise.all([employeesInTaskService.query(), taskService.query(), userService.query()])
      const taskMap = tasks.reduce((acc, t) => {
        acc[t._id] = t
        return acc
      }, {})
      const userMap = users.reduce((acc, u) => {
        acc[u._id] = u
        return acc
      }, {})

      setRecords(records)
      setTasksMap(taskMap)
      setUsersMap(userMap)
    } catch (err) {
      console.error('שגיאה בטעינת נתוני שיבוץ עובדים:', err)
      showErrorMsg('שגיאה בטעינת הנתונים')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className='employees-in-task-index main-layout'>
      <h1>שיבוץ עובדים למשימות</h1>
      {isLoading ? (
        <p>טוען נתונים...</p>
      ) : (
        <table className='employees-task-table'>
          <thead>
            <tr>
              <th>שם העובד</th>
              <th>משימה</th>
              <th>שובץ בתאריך</th>
              <th>סטטוס</th>
              <th>שעת התחלה</th>
              <th>שעת סיום</th>
              <th>הערות</th>
            </tr>
          </thead>
          <tbody>
            {records.map((rec) => (
              <tr key={rec._id}>
                <td>{usersMap[rec.employeeId]?.FullName || 'לא ידוע'}</td>
                <td>{tasksMap[rec.taskId]?.title || 'לא ידוע'}</td>
                <td>{new Date(rec.assignedAt).toLocaleString('he-IL')}</td>
                <td>{translateStatus(rec.status)}</td>
                <td>{rec.actualStart ? new Date(rec.actualStart).toLocaleTimeString('he-IL') : '-'}</td>
                <td>{rec.actualEnd ? new Date(rec.actualEnd).toLocaleTimeString('he-IL') : '-'}</td>
                <td>{rec.employeeNotes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

function translateStatus(status) {
  switch (status) {
    case 'waiting':
      return 'בהמתנה'
    case 'in-progress':
      return 'בתהליך'
    case 'completed':
      return 'הושלם'
    case 'missed':
      return 'הוחמץ'
    default:
      return status
  }
}
