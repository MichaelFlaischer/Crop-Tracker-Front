import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { FaBoxOpen, FaUsers, FaChartLine, FaSeedling } from 'react-icons/fa'

export function AdminDashboard() {
  const stats = [
    { label: 'סה״כ יבולים', value: 120, icon: <FaSeedling /> },
    { label: 'סה״כ עובדים', value: 45, icon: <FaUsers /> },
    { label: 'סה״כ לקוחות', value: 78, icon: <FaBoxOpen /> },
    { label: 'סה״כ הזמנות', value: 95, icon: <FaChartLine /> },
  ]

  const barData = [
    { name: 'ינואר', Orders: 30 },
    { name: 'פברואר', Orders: 50 },
    { name: 'מרץ', Orders: 70 },
    { name: 'אפריל', Orders: 60 },
    { name: 'מאי', Orders: 90 },
  ]

  const pieData = [
    { name: 'פעיל', value: 35 },
    { name: 'לא פעיל', value: 10 },
  ]

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
    </section>
  )
}
