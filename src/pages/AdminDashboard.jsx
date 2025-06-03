import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { FaBoxOpen, FaUsers, FaChartLine, FaSeedling } from 'react-icons/fa'
import { cropService } from '../services/crop.service.js'
import { userService } from '../services/user.service.js'
import { clientService } from '../services/client.service.js'
import { customerOrderService } from '../services/customer-order.service.js'
import { taskService } from '../services/task.service.js'
import { fieldService } from '../services/field.service.js'
import { Link } from 'react-router-dom'

export function AdminDashboard() {
  const [stats, setStats] = useState([])
  const [barData, setBarData] = useState([])
  const [pieData, setPieData] = useState([])
  const [todayTasks, setTodayTasks] = useState([])
  const [todayDeliveries, setTodayDeliveries] = useState([])

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [crops, users, clients, orders, tasks, fields] = await Promise.all([
          cropService.query(),
          userService.query(),
          clientService.query(),
          customerOrderService.query(),
          taskService.query(),
          fieldService.query(),
        ])

        const ordersPerMonth = {}
        orders.forEach((order) => {
          const rawDate = order.deliveredAt || order.desiredDeliveryDate || order.orderDate || order.createdAt
          if (!rawDate) return

          const date = new Date(rawDate)
          if (isNaN(date)) return

          const month = date.toLocaleString('he-IL', { month: 'long' })
          const year = date.getFullYear()
          const key = `${month} ${year}`

          ordersPerMonth[key] = (ordersPerMonth[key] || 0) + 1
        })

        const barDataArr = Object.entries(ordersPerMonth).map(([monthYear, count]) => ({
          name: monthYear,
          Orders: count,
        }))

        const activeUsers = users.filter((user) => user.isActive).length
        const inactiveUsers = users.length - activeUsers

        const pieDataArr = [
          { name: 'פעיל', value: activeUsers },
          { name: 'לא פעיל', value: inactiveUsers },
        ]

        const today = new Date().toISOString().split('T')[0]
        const deliveryOperationId = '68354fa1d29fa199e95c04d8'

        const todayDeliveriesArr = tasks
          .filter((task) => task.startDate === today && task.operationId === deliveryOperationId)
          .map((task) => {
            const client = clients.find((c) => c._id === task.clientId)
            return {
              ...task,
              clientName: client?.fullName || client?.companyName || task.clientId,
            }
          })

        const todayTasksArr = tasks
          .filter((task) => task.startDate === today && task.operationId !== deliveryOperationId)
          .map((task) => {
            const field = fields.find((f) => f._id === task.fieldId)
            return {
              ...task,
              fieldName: field?.fieldName || '-',
            }
          })

        setStats([
          { label: 'סה״כ יבולים', value: crops.length, icon: <FaSeedling /> },
          { label: 'סה״כ עובדים', value: users.length, icon: <FaUsers /> },
          { label: 'סה״כ לקוחות', value: clients.length, icon: <FaBoxOpen /> },
          { label: 'סה״כ הזמנות', value: orders.length, icon: <FaChartLine /> },
        ])
        setBarData(barDataArr)
        setPieData(pieDataArr)
        setTodayTasks(todayTasksArr)
        setTodayDeliveries(todayDeliveriesArr)
      } catch (err) {
        console.error('שגיאה בטעינת הנתונים:', err)
      }
    }

    loadDashboardData()
  }, [])

  const COLORS = ['#00C49F', '#FF8042']

  return (
    <section className='admin-dashboard main-layout'>
      <h1>דשבורד מנהל 👨‍💼</h1>

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
          <h3>הזמנות לפי חודשים</h3>
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
          <h3>סטטוס עובדים</h3>
          <ResponsiveContainer width='100%' height={250}>
            <PieChart>
              <Pie data={pieData} dataKey='value' outerRadius={80} label>
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className='today-section'>
        <h3>משימות לביצוע היום</h3>
        <ul className='today-tasks'>
          {todayTasks.map((task) => (
            <li key={task._id}>
              {task.taskDescription} — שדה: {task.fieldName} <Link to={`/tasks/${task._id}`}>[צפה בפרטי המשימה]</Link>
            </li>
          ))}
        </ul>

        <h3>משלוחים להיום</h3>
        <ul className='today-deliveries'>
          {todayDeliveries.map((delivery) => (
            <li key={delivery._id}>
              {delivery.clientName} — {delivery.taskDescription} <Link to={`/tasks/${delivery._id}`}>[צפה בפרטי המשלוח]</Link>
            </li>
          ))}
        </ul>
      </section>
    </section>
  )
}
