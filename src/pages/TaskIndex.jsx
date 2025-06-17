import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { taskService } from '../services/task.service.js'
import { fieldService } from '../services/field.service.js'
import { cropService } from '../services/crop.service.js'
import { sowingAndHarvestService } from '../services/sowing-and-harvest.service.js'
import { employeesInTaskService } from '../services/employees-in-task.service.js'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service.js'
import { ResponsiveTable } from '../cmps/ResponsiveTable.jsx'

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

  const deliveryTableData = deliveryTasks.map((task) => ({
    _id: task._id,
    customerName: task.taskDescription?.replace('משלוח ללקוח: ', ''),
    orderId: task.fieldId,
    deliveryDate: formatDate(task.startDate),
    requiredEmployees: task.requiredEmployees,
    status: statusMap[task.status] || task.status,
  }))

  const regularTableData = regularTasks.map((task) => ({
    _id: task._id,
    taskDescription: task.taskDescription,
    fieldName: task.fieldName,
    cropName: task.cropName,
    startDate: formatDate(task.startDate),
    startTime: task.startTime,
    endDate: formatDate(task.endDate),
    endTime: task.endTime,
    requiredEmployees: task.requiredEmployees,
    assignedEmployees: assignedMap[task._id] || 0,
    status: statusMap[task.status] || task.status,
  }))

  return (
    <section className='task-index'>
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
        <button className='btn btn-secondary' onClick={() => setFilter({ status: 'all', filterDate: '', sortBy: 'startDateAsc' })}>
          איפוס
        </button>
        <button className='btn btn-primary' onClick={onAdd}>
          ➕ הוספת משימה חדשה
        </button>
      </div>

      {deliveryTasks.length > 0 && (
        <>
          <h2>🚚 משימות משלוח ללקוח</h2>
          <ResponsiveTable
            columns={[
              { key: 'customerName', label: 'שם הלקוח' },
              { key: 'orderId', label: 'מספר הזמנה' },
              { key: 'deliveryDate', label: 'תאריך הספקה' },
              { key: 'requiredEmployees', label: 'עובדים נדרש' },
              { key: 'status', label: 'סטטוס' },
            ]}
            data={deliveryTableData}
            filterBy={{}}
            onFilterChange={() => {}}
            onClearFilters={() => {}}
            filterFields={[]}
            sortOptions={[]}
            renderActions={(task) => (
              <>
                <button className='btn btn-view' onClick={() => navigate(`/order/${task.orderId}`)}>
                  📦 לפרטי ההזמנה
                </button>
                <button className='btn btn-edit' onClick={() => onViewDetails(task._id)}>
                  ✏️ עריכת משימה
                </button>
              </>
            )}
          />
        </>
      )}

      {isLoading ? (
        <p>טוען נתונים...</p>
      ) : regularTasks.length === 0 ? (
        <p>לא נמצאו משימות תואמות</p>
      ) : (
        <>
          <h2>🌿 משימות רגילות</h2>
          <ResponsiveTable
            columns={[
              { key: 'taskDescription', label: 'שם פעולה' },
              { key: 'fieldName', label: 'חלקה' },
              { key: 'cropName', label: 'יבול' },
              { key: 'startDate', label: 'תאריך התחלה' },
              { key: 'startTime', label: 'שעת התחלה' },
              { key: 'endDate', label: 'תאריך סיום' },
              { key: 'endTime', label: 'שעת סיום' },
              { key: 'requiredEmployees', label: 'עובדים נדרש' },
              { key: 'assignedEmployees', label: 'עובדים שובצו' },
              { key: 'status', label: 'סטטוס' },
            ]}
            data={regularTableData}
            filterBy={{ name: filter.filterDate, sort: filter.sortBy }}
            onFilterChange={() => {}}
            onClearFilters={() => setFilter({ status: 'all', filterDate: '', sortBy: 'startDateAsc' })}
            filterFields={[{ name: 'name', label: 'שם פעולה', type: 'text' }]}
            sortOptions={[
              { value: 'startDateAsc', label: 'תאריך התחלה (עולה)' },
              { value: 'startDateDesc', label: 'תאריך התחלה (יורד)' },
              { value: 'endDateAsc', label: 'תאריך סיום (עולה)' },
              { value: 'endDateDesc', label: 'תאריך סיום (יורד)' },
            ]}
            renderActions={(task) => (
              <>
                <button className='btn btn-view' onClick={() => onViewDetails(task._id)}>
                  📄 פרטים
                </button>
                <button className='btn btn-edit' onClick={() => onEdit(task._id)}>
                  ✏️ עריכה
                </button>
                <button className='btn btn-delete' onClick={() => onDelete(task._id)}>
                  🗑️ מחיקה
                </button>
              </>
            )}
          />
        </>
      )}
    </section>
  )
}
