import { useEffect, useState } from 'react'
import { FaTasks, FaTruck, FaSeedling } from 'react-icons/fa'
import { employeesInTaskService } from '../services/employees-in-task.service.js'
import { taskService } from '../services/task.service.js'
import { fieldService } from '../services/field.service.js'
import { showErrorMsg } from '../services/event-bus.service.js'
import { Link } from 'react-router-dom'

export function WorkerDashboard() {
  const [todayTasks, setTodayTasks] = useState([])
  const [weeklyStats, setWeeklyStats] = useState([])
  const [todayDeliveries, setTodayDeliveries] = useState([])
  const userId = sessionStorage.getItem('loggedinUser') ? JSON.parse(sessionStorage.getItem('loggedinUser'))._id : null

  useEffect(() => {
    loadDashboardData()
  }, [])

  function isSameDate(dateStr, today) {
    const d = new Date(dateStr)
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate()
  }

  async function loadDashboardData() {
    try {
      const [assignments, allTasks, fields] = await Promise.all([employeesInTaskService.query(), taskService.query(), fieldService.query()])

      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const deliveryOpId = '68354fa1d29fa199e95c04d8'

      const myAssignments = assignments.filter((a) => a.employeeId === userId)
      const enrichedTasks = myAssignments
        .map((a) => {
          const task = allTasks.find((t) => t._id === a.taskId)
          const field = fields.find((f) => f._id === task?.fieldId)
          if (!task) return null
          return {
            ...task,
            fieldName: field?.fieldName || '-',
            status: a.status,
            assignmentId: a._id,
          }
        })
        .filter(Boolean)

      const todayTasksArr = enrichedTasks.filter((t) => isSameDate(t.startDate, today) && t.operationId !== deliveryOpId)

      const todayDeliveriesArr = enrichedTasks.filter((t) => isSameDate(t.startDate, today) && t.operationId === deliveryOpId)

      const weekAgo = new Date()
      weekAgo.setDate(now.getDate() - 7)
      const monthAgo = new Date()
      monthAgo.setDate(now.getDate() - 30)

      const weeklyCompleted = enrichedTasks.filter((t) => t.status === 'done' && new Date(t.startDate) >= weekAgo)
      const monthlyCompleted = enrichedTasks.filter((t) => t.status === 'done' && new Date(t.startDate) >= monthAgo)

      setTodayTasks(todayTasksArr)
      setTodayDeliveries(todayDeliveriesArr)
      setWeeklyStats([
        { label: 'בוצעו השבוע', value: weeklyCompleted.length },
        { label: 'בוצעו החודש', value: monthlyCompleted.length },
      ])
    } catch (err) {
      showErrorMsg('שגיאה בטעינת נתוני הדשבורד')
      console.error(err)
    }
  }

  return (
    <section className='worker-dashboard'>
      <h1>שלום וברוך הבא לעבודה! 👩‍🌾</h1>

      <section className='dashboard-cards'>
        <div className='card'>
          <FaTasks className='icon' />
          <h3>המשימות שלך להיום</h3>
          <ul>
            {todayTasks.map((task) => (
              <li key={task._id}>
                {task.taskDescription} — חלקת יבול: {task.fieldName} — <Link to={`/tasks/${task._id}`}>[צפה בפרטי המשימה]</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className='card'>
          <FaTruck className='icon' />
          <h3>משלוחים להיום</h3>
          <ul>
            {todayDeliveries.map((task) => (
              <li key={task._id}>
                {task.taskDescription} — <Link to={`/tasks/${task._id}`}>[צפה בפרטי המשלוח]</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className='card'>
          <FaSeedling className='icon' />
          <h3>משימות שבוצעו</h3>
          <ul>
            {weeklyStats.map((stat, idx) => (
              <li key={idx}>
                {stat.label}: {stat.value}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </section>
  )
}
