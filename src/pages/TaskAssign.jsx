import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { taskService } from '../services/task.service.js'
import { employeesInTaskService } from '../services/employees-in-task.service.js'
import { userService } from '../services/user.service.js'
import { fieldService } from '../services/field.service.js'
import { customerOrderService } from '../services/customer-order.service.js'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service.js'
import { Loader } from '../cmps/Loader.jsx'

export function TaskAssign() {
  const [tasks, setTasks] = useState([])
  const [employeeAssignments, setEmployeeAssignments] = useState([])
  const [myTasks, setMyTasks] = useState([])
  const [fields, setFields] = useState([])
  const [ordersMap, setOrdersMap] = useState({})
  const [notesMap, setNotesMap] = useState({})
  const [statusMap, setStatusMap] = useState({})
  const [isLoading, setIsLoading] = useState(true)

  const loggedInUser = userService.getLoggedInUser()
  const navigate = useNavigate()
  const DELIVERY_TASK_OPERATION_ID = '68354fa1d29fa199e95c04d8'

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [allTasks, allAssignments, allFields, allOrders] = await Promise.all([
        taskService.query(),
        employeesInTaskService.query(),
        fieldService.query(),
        customerOrderService.query(),
      ])

      setTasks(allTasks)
      setEmployeeAssignments(allAssignments)
      setFields(allFields)

      const orderMap = allOrders.reduce((acc, order) => {
        acc[order._id] = order.address
        return acc
      }, {})
      setOrdersMap(orderMap)

      const userAssignments = allAssignments.filter((assign) => assign.employeeId === loggedInUser._id)

      const taskMap = userAssignments
        .map((assign) => {
          const task = allTasks.find((task) => task._id?.toString() === assign.taskId)
          return task ? { task, assignment: assign } : null
        })
        .filter(Boolean)

      setMyTasks(taskMap)

      const initialNotes = {}
      const initialStatus = {}
      userAssignments.forEach((assign) => {
        initialNotes[assign._id] = assign.employeeNotes || ''
        initialStatus[assign._id] = assign.status || 'in-progress'
      })

      setNotesMap(initialNotes)
      setStatusMap(initialStatus)
    } catch (err) {
      showErrorMsg('שגיאה בטעינת הנתונים')
    } finally {
      setIsLoading(false)
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

    const status = statusMap[assignmentId]
    const now = new Date().toISOString()

    const updated = {
      ...assignment,
      status,
      employeeNotes: notesMap[assignmentId],
      actualEnd: ['done', 'delayed', 'missed'].includes(status) ? now : assignment.actualEnd,
    }

    try {
      await employeesInTaskService.update(updated)
      showSuccessMsg('עודכן בהצלחה')
      await loadData()
    } catch {
      showErrorMsg('שגיאה בשמירה')
    }
  }

  const deliveryTasks = myTasks.filter(({ task }) => (task?.operationId?.toString?.() || '') === DELIVERY_TASK_OPERATION_ID)
  const regularTasks = myTasks.filter(({ task }) => (task?.operationId?.toString?.() || '') !== DELIVERY_TASK_OPERATION_ID)

  const activeRegular = regularTasks.filter(({ assignment }) => ['pending', 'in-progress'].includes(assignment.status))
  const finishedRegular = regularTasks
    .filter(({ assignment }) => ['done', 'delayed', 'missed'].includes(assignment.status))
    .sort((a, b) => new Date(a.task.endDate) - new Date(b.task.endDate))

  const groupTasks = (taskList) => {
    const active = taskList
      .filter(({ assignment }) => ['pending', 'in-progress'].includes(assignment.status))
      .filter(({ task }) => task?.startDate)
      .sort((a, b) => new Date(a.task.startDate) - new Date(b.task.startDate))

    const finished = taskList
      .filter(({ assignment }) => ['done', 'delayed', 'missed'].includes(assignment.status))
      .filter(({ task }) => task?.endDate)
      .sort((a, b) => new Date(a.task.endDate) - new Date(b.task.endDate))

    return { active, finished }
  }

  const { active: activeDelivery, finished: finishedDelivery } = groupTasks(deliveryTasks)

  const renderDeliveryTable = (title, tasks, editable = false) => (
    <>
      <h3>{title}</h3>
      {tasks.length === 0 ? (
        <p>אין משימות להצגה</p>
      ) : (
        <table className='my-task-table'>
          <thead>
            <tr>
              <th>תיאור משלוח</th>
              <th>תאריך משלוח</th>
              <th>סטטוס</th>
              {editable ? <th>הערות</th> : <th>הערות שבוצעו</th>}
              {editable && <th>עדכון</th>}
              <th>📦 צפייה בפרטי הזמנה</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(({ task, assignment }) => (
              <tr key={assignment._id}>
                <td>{task.taskDescription}</td>
                <td>{formatDate(task.startDate)}</td>
                <td>
                  {editable ? (
                    <select value={statusMap[assignment._id]} onChange={(e) => handleStatusChange(assignment._id, e.target.value)}>
                      <option value='in-progress'>בתהליך</option>
                      <option value='done'>הושלמה</option>
                      <option value='delayed'>נדחתה</option>
                      <option value='missed'>לא בוצעה</option>
                    </select>
                  ) : (
                    translateStatus(assignment.status)
                  )}
                </td>
                <td>
                  {editable ? (
                    <input type='text' value={notesMap[assignment._id]} onChange={(e) => handleNotesChange(assignment._id, e.target.value)} />
                  ) : (
                    assignment.employeeNotes || '-'
                  )}
                </td>
                {editable && (
                  <td>
                    <button onClick={() => onSave(assignment._id)}>💾 שמור</button>
                  </td>
                )}
                <td>
                  <button onClick={() => window.open(`/order/${task.fieldId}`, '_blank')}>🔍 צפייה</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )

  const renderRegularTable = (title, tasks, editable = false) => (
    <>
      <h3>{title}</h3>
      {tasks.length === 0 ? (
        <p>אין משימות להצגה</p>
      ) : (
        <table className='my-task-table'>
          <thead>
            <tr>
              <th>תיאור פעולה</th>
              <th>חלקה</th>
              <th>תאריך התחלה</th>
              <th>שעת התחלה</th>
              <th>תאריך סיום</th>
              <th>שעת סיום</th>
              <th>סטטוס</th>
              {editable ? <th>הערות</th> : <th>הערות שבוצעו</th>}
              {editable && <th>עדכון</th>}
            </tr>
          </thead>
          <tbody>
            {tasks.map(({ task, assignment }) => (
              <tr key={assignment._id}>
                <td>{task.taskDescription}</td>
                <td>{getFieldName(task.fieldId)}</td>
                <td>{formatDate(task.startDate)}</td>
                <td>{task.startTime}</td>
                <td>{formatDate(task.endDate)}</td>
                <td>{task.endTime}</td>
                <td>
                  {editable ? (
                    <select value={statusMap[assignment._id]} onChange={(e) => handleStatusChange(assignment._id, e.target.value)}>
                      <option value='in-progress'>בתהליך</option>
                      <option value='done'>הושלמה</option>
                      <option value='delayed'>נדחתה</option>
                      <option value='missed'>לא בוצעה</option>
                    </select>
                  ) : (
                    translateStatus(assignment.status)
                  )}
                </td>
                <td>
                  {editable ? (
                    <input type='text' value={notesMap[assignment._id]} onChange={(e) => handleNotesChange(assignment._id, e.target.value)} />
                  ) : (
                    assignment.employeeNotes || '-'
                  )}
                </td>
                {editable && (
                  <td>
                    <button onClick={() => onSave(assignment._id)}>💾 שמור</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )

  if (isLoading) return <Loader />

  return (
    <section className='task-assign'>
      <h1>המשימות שלי</h1>

      <h2>🚚 משימות משלוח</h2>
      {renderDeliveryTable('משימות משלוח פעילות', activeDelivery, true)}
      {renderDeliveryTable('משימות משלוח שהושלמו / נדחו / לא בוצעו', finishedDelivery)}

      <h2>🌿 משימות רגילות</h2>
      {renderRegularTable('משימות פעילות', activeRegular, true)}
      {renderRegularTable('משימות שהושלמו / נדחו / לא בוצעו', finishedRegular)}
    </section>
  )
}
