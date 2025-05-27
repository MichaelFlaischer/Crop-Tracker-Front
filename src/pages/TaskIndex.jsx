import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { taskService } from '../services/task.service.js'
import { fieldService } from '../services/field.service.js'
import { cropService } from '../services/crop.service.js'
import { sowingAndHarvestService } from '../services/sowing-and-harvest.service.js'
import { employeesInTaskService } from '../services/employees-in-task.service.js'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service.js'

export function TaskIndex() {
  const [tasks, setTasks] = useState([])
  const [assignedMap, setAssignedMap] = useState({})
  const [filter, setFilter] = useState({ status: 'all', filterDate: '', sortBy: 'startDateAsc' })
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  const DELIVERY_OPERATION_ID = '68354fa1d29fa199e95c04d8'

  const statusMap = {
    pending: 'בהמתנה',
    'in-progress': 'בתהליך',
    done: 'הושלמה',
    delayed: 'נדחתה',
    missed: 'לא בוצעה',
  }

  useEffect(() => {
    loadAllData()
  }, [])

  async function loadAllData() {
    try {
      const [taskData, fields, sowings, crops, employees] = await Promise.all([
        taskService.query(),
        fieldService.query(),
        sowingAndHarvestService.query(),
        cropService.query(),
        employeesInTaskService.query(),
      ])

      const fieldMap = fields.reduce((acc, field) => {
        acc[field._id] = field.fieldName
        return acc
      }, {})

      const sowingMap = sowings.reduce((acc, sow) => {
        acc[sow.fieldId] = sow.cropId
        return acc
      }, {})

      const cropMap = crops.reduce((acc, crop) => {
        acc[crop._id] = crop.cropName
        return acc
      }, {})

      const assignedMap = {}
      employees.forEach((emp) => {
        assignedMap[emp.taskId] = (assignedMap[emp.taskId] || 0) + 1
      })
      setAssignedMap(assignedMap)

      const tasksWithDetails = taskData.map((task) => {
        const fieldName = fieldMap[task.fieldId] || '—'
        const cropId = sowingMap[task.fieldId]
        const cropName = cropMap[cropId] || '—'
        return {
          ...task,
          fieldName,
          cropName,
        }
      })

      setTasks(tasksWithDetails)
    } catch (err) {
      console.error('שגיאה בטעינת נתונים:', err)
      showErrorMsg('שגיאה בטעינת נתונים')
    } finally {
      setIsLoading(false)
    }
  }

  function onAdd() {
    navigate('/tasks/add')
  }

  function onEdit(id) {
    navigate(`/tasks/edit/${id}`)
  }

  function onViewDetails(taskId) {
    navigate(`/tasks/${taskId}`)
  }

  async function onDelete(id) {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק את המשימה?')) return
    try {
      await taskService.remove(id)
      setTasks((prev) => prev.filter((task) => task._id !== id))
      showSuccessMsg('המשימה נמחקה בהצלחה')
    } catch (err) {
      console.error('שגיאה במחיקת משימה:', err)
      showErrorMsg('שגיאה במחיקת משימה')
    }
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr)
    return d.toLocaleDateString('he-IL')
  }

  const filteredAllTasks = tasks
    .filter((task) => {
      const statusMatch = filter.status === 'all' || task.status === filter.status
      const filterDate = filter.filterDate ? new Date(filter.filterDate) : null
      const fromMatch = !filterDate || new Date(task.startDate) <= filterDate
      const toMatch = !filterDate || new Date(task.endDate) >= filterDate
      return statusMatch && fromMatch && toMatch
    })
    .sort((a, b) => {
      if (filter.sortBy === 'startDateAsc') return new Date(a.startDate) - new Date(b.startDate)
      if (filter.sortBy === 'startDateDesc') return new Date(b.startDate) - new Date(a.startDate)
      if (filter.sortBy === 'endDateAsc') return new Date(a.endDate) - new Date(b.endDate)
      if (filter.sortBy === 'endDateDesc') return new Date(b.endDate) - new Date(a.endDate)
      return 0
    })

  const deliveryTasks = filteredAllTasks.filter((t) => t.operationId?.toString() === DELIVERY_OPERATION_ID)
  const regularTasks = filteredAllTasks.filter((t) => t.operationId?.toString() !== DELIVERY_OPERATION_ID)

  return (
    <section className='task-index main-layout'>
      <h1>רשימת משימות</h1>

      <div className='filter-bar'>
        <select value={filter.status} onChange={(e) => setFilter((prev) => ({ ...prev, status: e.target.value }))}>
          <option value='all'>כל הסטטוסים</option>
          <option value='pending'>בהמתנה</option>
          <option value='in-progress'>בתהליך</option>
          <option value='done'>הושלמה</option>
          <option value='delayed'>נדחתה</option>
          <option value='missed'>לא בוצעה</option>
        </select>
        <input type='date' value={filter.filterDate} onChange={(e) => setFilter((prev) => ({ ...prev, filterDate: e.target.value }))} />
        <select value={filter.sortBy} onChange={(e) => setFilter((prev) => ({ ...prev, sortBy: e.target.value }))}>
          <option value='startDateAsc'>מיון לפי התחלה (עולה)</option>
          <option value='startDateDesc'>מיון לפי התחלה (יורד)</option>
          <option value='endDateAsc'>מיון לפי סיום (עולה)</option>
          <option value='endDateDesc'>מיון לפי סיום (יורד)</option>
        </select>
        <button className='btn-reset' onClick={() => setFilter({ status: 'all', filterDate: '', sortBy: 'startDateAsc' })}>
          איפוס
        </button>
        <button className='btn-add' onClick={onAdd}>
          ➕ הוספת משימה חדשה
        </button>
      </div>

      {deliveryTasks.length > 0 && (
        <>
          <h2>🚚 משימות משלוח ללקוח</h2>
          <table className='delivery-task-table'>
            <thead>
              <tr>
                <th>שם הלקוח</th>
                <th>מספר הזמנה</th>
                <th>תאריך הספקה</th>
                <th>כמות עובדים נדרשים</th>
                <th>סטטוס</th>
                <th>לפרטי ההזמנה</th>
              </tr>
            </thead>
            <tbody>
              {deliveryTasks.map((task) => (
                <tr key={task._id}>
                  <td>{task.taskDescription?.replace('משלוח ללקוח: ', '')}</td>
                  <td>{task.fieldId}</td>
                  <td>{formatDate(task.startDate)}</td>
                  <td>{task.requiredEmployees}</td>
                  <td className={`status ${task.status}`}>{statusMap[task.status]}</td>
                  <td>
                    <button onClick={() => navigate(`/order/${task.fieldId}`)}>📦 לפרטי ההזמנה</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {isLoading ? (
        <p>טוען נתונים...</p>
      ) : regularTasks.length === 0 ? (
        <p>לא נמצאו משימות תואמות</p>
      ) : (
        <>
          <h2>🌿 משימות רגילות</h2>
          <table className='task-table'>
            <thead>
              <tr>
                <th>שם פעולה</th>
                <th>שדה</th>
                <th>יבול</th>
                <th>תאריך התחלה</th>
                <th>שעת התחלה</th>
                <th>תאריך סיום</th>
                <th>שעת סיום</th>
                <th>כמות עובדים נדרשים</th>
                <th>כמות עובדים שובצו</th>
                <th>סטטוס</th>
                <th>📄 פרטים</th>
                <th>🛠️ פעולות</th>
              </tr>
            </thead>
            <tbody>
              {regularTasks.map((task) => (
                <tr key={task._id}>
                  <td>{task.taskDescription}</td>
                  <td>{task.fieldName}</td>
                  <td>{task.cropName}</td>
                  <td>{formatDate(task.startDate)}</td>
                  <td>{task.startTime}</td>
                  <td>{formatDate(task.endDate)}</td>
                  <td>{task.endTime}</td>
                  <td>{task.requiredEmployees}</td>
                  <td>{assignedMap[task._id] || 0}</td>
                  <td className={`status ${task.status}`}>{statusMap[task.status] || task.status}</td>
                  <td>
                    <button title='פרטים' onClick={() => onViewDetails(task._id)}>
                      📄
                    </button>
                  </td>
                  <td>
                    <button title='עריכה' onClick={() => onEdit(task._id)}>
                      ✏️
                    </button>
                    <button className='danger' title='מחיקה' onClick={() => onDelete(task._id)}>
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  )
}
