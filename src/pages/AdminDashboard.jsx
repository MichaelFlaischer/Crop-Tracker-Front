import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { FaBoxOpen, FaUsers, FaChartLine, FaSeedling } from 'react-icons/fa'
import { cropService } from '../services/crop.service.js'
import { userService } from '../services/user.service.js'
import { clientService } from '../services/client.service.js'
import { customerOrderService } from '../services/customer-order.service.js'
import { taskService } from '../services/task.service.js'
import { fieldService } from '../services/field.service.js'
import { sowingAndHarvestService } from '../services/sowing-and-harvest.service.js'
import { employeesInTaskService } from '../services/employees-in-task.service.js'
import { Link } from 'react-router-dom'

export function AdminDashboard() {
  const [stats, setStats] = useState([])
  const [barData, setBarData] = useState([])
  const [taskStatusPieData, setTaskStatusPieData] = useState([])
  const [cropDistributionData, setCropDistributionData] = useState([])
  const [todayTasks, setTodayTasks] = useState([])
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
      const [crops, users, clients, orders, tasks, fields, sowingAndHarvestList, assignments] = await Promise.all([
        cropService.query(),
        userService.query(),
        clientService.query(),
        customerOrderService.query(),
        taskService.query(),
        fieldService.query(),
        sowingAndHarvestService.query(),
        employeesInTaskService.query(),
      ])

      const ordersPerMonth = {}

      orders.forEach((order) => {
        const rawDate = order.deliveredAt || order.desiredDeliveryDate || order.orderDate || order.createdAt
        if (!rawDate) return

        const date = new Date(rawDate)
        if (isNaN(date)) return

        const month = String(date.getMonth() + 1).padStart(2, '0')
        const year = date.getFullYear()
        const key = `${month}/${year}`

        ordersPerMonth[key] = (ordersPerMonth[key] || 0) + 1
      })

      const barDataArr = Object.entries(ordersPerMonth)
        .sort(([a], [b]) => {
          const [monthA, yearA] = a.split('/').map(Number)
          const [monthB, yearB] = b.split('/').map(Number)

          const dateA = new Date(yearA, monthA - 1)
          const dateB = new Date(yearB, monthB - 1)

          return dateA - dateB
        })
        .map(([monthYear, count]) => ({
          name: monthYear,
          Orders: count,
        }))

      const statusTranslationMap = {
        pending: 'מתוכננת',
        'in-progress': 'בביצוע',
        done: 'הושלמה',
        באיחור: 'באיחור',
        מתוכננת: 'מתוכננת',
        בביצוע: 'בביצוע',
        הושלמה: 'הושלמה',
      }

      const taskStatusCount = {}

      tasks.forEach((task) => {
        const rawStatus = task.status || 'מתוכננת'
        const status = statusTranslationMap[rawStatus] || rawStatus
        taskStatusCount[status] = (taskStatusCount[status] || 0) + 1
      })

      const taskStatusPieArr = Object.entries(taskStatusCount).map(([status, count]) => ({
        name: status,
        value: count,
      }))

      const cropDistribution = {}

      sowingAndHarvestList
        .filter((s) => s.isActive === true)
        .forEach((sowing) => {
          const crop = crops.find((c) => c._id?.toString?.() === sowing.cropId?.toString?.())
          const cropName = crop?.cropName || `ID ${sowing.cropId}`
          cropDistribution[cropName] = (cropDistribution[cropName] || 0) + 1
        })

      const cropDistributionArr = Object.entries(cropDistribution).map(([cropName, count]) => ({
        name: cropName,
        value: count,
      }))

      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const deliveryOperationId = '68354fa1d29fa199e95c04d8'

      const myAssignments = assignments.filter((a) => a.employeeId === userId)
      const enrichedTasks = myAssignments
        .map((a) => {
          const task = tasks.find((t) => t._id === a.taskId)
          const field = fields.find((f) => f._id === task?.fieldId)
          const client = clients.find((c) => c._id === task?.clientId)
          if (!task) return null
          return {
            ...task,
            fieldName: field?.fieldName || '-',
            clientName: client?.fullName || client?.companyName || '-',
            status: a.status,
            assignmentId: a._id,
          }
        })
        .filter(Boolean)

      setStats([
        { label: 'סה״כ יבולים', value: crops.length, icon: <FaSeedling /> },
        { label: 'סה״כ עובדים', value: users.length, icon: <FaUsers /> },
        { label: 'סה״כ לקוחות', value: clients.length, icon: <FaBoxOpen /> },
        { label: 'סה״כ הזמנות', value: orders.length, icon: <FaChartLine /> },
      ])
      setBarData(barDataArr)
      setTaskStatusPieData(taskStatusPieArr)
      setCropDistributionData(cropDistributionArr)
      setTodayTasks(enrichedTasks.filter((t) => isSameDate(t.startDate, today) && t.operationId !== deliveryOperationId))
      setTodayDeliveries(enrichedTasks.filter((t) => isSameDate(t.startDate, today) && t.operationId === deliveryOperationId))
    } catch (err) {
      console.error('שגיאה בטעינת הנתונים:', err)
    }
  }

  const COLORS = ['#00C49F', '#FF8042', '#FFBB28', '#0088FE', '#FF6699', '#AA55FF']

  return (
    <section className='admin-dashboard'>
      <h1>דשבורד ניהולי</h1>

      <div className='stat-cards'>
        {stats.map((s, idx) => (
          <div key={idx} className='stat-card'>
            <div className='icon'>{s.icon}</div>
            <h3>{s.label}</h3>
            <p>{s.value}</p>
          </div>
        ))}
      </div>

      <section className='charts-container'>
        <div className='chart'>
          <h3>הזמנות לפי תאריך</h3>
          <ResponsiveContainer width='100%' height={250}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='name' />
              <YAxis />
              <Tooltip />
              <Bar dataKey='Orders' fill='#3a8dff' />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className='chart'>
          <h3>סטטוס משימות</h3>
          <ResponsiveContainer width='100%' height={250}>
            <PieChart>
              <Pie data={taskStatusPieData} dataKey='value' outerRadius={80} label>
                {taskStatusPieData.map((entry, index) => (
                  <Cell key={`cell-task-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className='chart'>
          <h3>פילוח גידול יבולים פעילים בחלקות</h3>
          <ResponsiveContainer width='100%' height={250}>
            <PieChart>
              <Pie data={cropDistributionData} dataKey='value' outerRadius={80} label>
                {cropDistributionData.map((entry, index) => (
                  <Cell key={`cell-crop-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className='today-section'>
        <h3>משימות מתוכננות להיום</h3>
        <ul className='today-tasks'>
          {todayTasks.map((task) => (
            <li key={task._id}>
              {task.taskDescription} — שדה: {task.fieldName} <Link to={`/tasks/${task._id}`}>[צפייה בפרטי משימה]</Link>
            </li>
          ))}
        </ul>

        <h3>משלוחים מתוכננים להיום</h3>
        <ul className='today-deliveries'>
          {todayDeliveries.map((delivery) => (
            <li key={delivery._id}>
              {delivery.clientName} — {delivery.taskDescription} <Link to={`/order/${delivery.fieldId}`}>[צפייה בפרטי משלוח]</Link>
            </li>
          ))}
        </ul>
      </section>
    </section>
  )
}
