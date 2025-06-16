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
        <>
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
              {records.length === 0 ? (
                <tr>
                  <td colSpan='7' style={{ textAlign: 'center', color: '#999' }}>
                    אין רשומות שיבוץ להצגה
                  </td>
                </tr>
              ) : (
                records.map((rec) => (
                  <tr key={rec._id}>
                    <td>{usersMap[rec.employeeId]?.FullName || 'לא ידוע'}</td>
                    <td>{tasksMap[rec.taskId]?.title || 'לא ידוע'}</td>
                    <td>{new Date(rec.assignedAt).toLocaleDateString('he-IL')}</td>
                    <td>{translateStatus(rec.status)}</td>
                    <td>
                      {rec.actualStart && !isNaN(new Date(rec.actualStart))
                        ? new Date(rec.actualStart).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
                        : '-'}
                    </td>
                    <td>
                      {rec.actualEnd && !isNaN(new Date(rec.actualEnd))
                        ? new Date(rec.actualEnd).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
                        : '-'}
                    </td>
                    <td>{rec.employeeNotes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <section className='records-cards'>
            {records.map((rec) => (
              <div className='record-card' key={rec._id}>
                <div className='field'>
                  <span>שם העובד:</span>
                  <span className='value'>{usersMap[rec.employeeId]?.FullName || 'לא ידוע'}</span>
                </div>
                <div className='field'>
                  <span>משימה:</span>
                  <span className='value'>{tasksMap[rec.taskId]?.title || 'לא ידוע'}</span>
                </div>
                <div className='field'>
                  <span>שובץ בתאריך:</span>
                  <span className='value'>{new Date(rec.assignedAt).toLocaleDateString('he-IL')}</span>
                </div>
                <div className='field'>
                  <span>סטטוס:</span>
                  <span className='value'>{translateStatus(rec.status)}</span>
                </div>
                <div className='field'>
                  <span>שעת התחלה:</span>
                  <span className='value'>
                    {rec.actualStart && !isNaN(new Date(rec.actualStart))
                      ? new Date(rec.actualStart).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
                      : '-'}
                  </span>
                </div>
                <div className='field'>
                  <span>שעת סיום:</span>
                  <span className='value'>
                    {rec.actualEnd && !isNaN(new Date(rec.actualEnd))
                      ? new Date(rec.actualEnd).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
                      : '-'}
                  </span>
                </div>
                <div className='field'>
                  <span>הערות:</span>
                  <span className='value'>{rec.employeeNotes || '-'}</span>
                </div>
              </div>
            ))}
          </section>
        </>
      )}
    </section>
  )
}

const statusMap = {
  waiting: 'בהמתנה',
  'in-progress': 'בתהליך',
  completed: 'הושלם',
  missed: 'הוחמץ',
}

function translateStatus(status) {
  return statusMap[status] || status
}
