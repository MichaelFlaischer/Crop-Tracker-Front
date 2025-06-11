import { useLocation, useNavigate } from 'react-router-dom'
import { Bar, Line } from 'react-chartjs-2'
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend, PointElement, LineElement } from 'chart.js'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, PointElement, LineElement)

export function WeatherSimulationResult() {
  const location = useLocation()
  const navigate = useNavigate()

  const {
    analyzedDays,
    suitableDaysCount,
    unsuitableDaysCount,
    totalIrrigationDays,
    totalDrainageDays,
    optimalSowing,
    topSowingDates,
    minTemperature,
    maxTemperature,
    minRainfall,
    maxRainfall,
    selectedFieldName,
    selectedCropName,
    growthPeriodInDays,
  } = location.state || {}

  if (!analyzedDays) {
    return (
      <section className='weather-simulation-result'>
        <h2>לא הועברו נתונים לעמוד התוצאות.</h2>
        <button onClick={() => navigate('/weather-simulation')}>חזור</button>
      </section>
    )
  }

  const isRainfallConditionUsed = typeof minRainfall === 'number' && typeof maxRainfall === 'number'

  const formatDate = (isoDateStr) => {
    const [year, month, day] = isoDateStr.split('-')
    return `${day}/${month}/${year}`
  }

  const barChartData = {
    labels: analyzedDays.map((day) => formatDate(day.date)),
    datasets: [
      {
        label: 'יום מתאים (1) / לא מתאים (0)',
        data: analyzedDays.map((day) => (day.isSuitable ? 1 : 0)),
        backgroundColor: analyzedDays.map((day) => (day.isSuitable ? 'rgba(75, 192, 192, 0.6)' : 'rgba(255, 99, 132, 0.6)')),
      },
    ],
  }

  const barChartOptions = {
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          callback: (value) => (value === 1 ? 'מתאים' : 'לא מתאים'),
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  }

  const tempChartData = {
    labels: analyzedDays.map((day) => formatDate(day.date)),
    datasets: [
      {
        label: 'טמפ׳ מקסימלית (°C)',
        data: analyzedDays.map((day) => day.tempMax),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.3,
      },
      {
        label: 'טמפ׳ מינימלית (°C)',
        data: analyzedDays.map((day) => day.tempMin),
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.3,
      },
      {
        label: 'טמפ׳ מינ׳ מותרת',
        data: Array(analyzedDays.length).fill(minTemperature),
        borderColor: 'rgba(0, 200, 0, 0.7)',
        borderDash: [5, 5],
        pointRadius: 0,
      },
      {
        label: 'טמפ׳ מקס׳ מותרת',
        data: Array(analyzedDays.length).fill(maxTemperature),
        borderColor: 'rgba(200, 0, 0, 0.7)',
        borderDash: [5, 5],
        pointRadius: 0,
      },
    ],
  }

  const tempChartOptions = {
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  }

  const precipitationChartData = {
    labels: analyzedDays.map((day) => formatDate(day.date)),
    datasets: [
      {
        label: 'משקעים יומיים (מ״מ)',
        data: analyzedDays.map((day) => day.precipitation),
        borderColor: 'rgba(153, 102, 255, 1)',
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        tension: 0.3,
      },
      ...(isRainfallConditionUsed
        ? [
            {
              label: 'משקעים מינ׳ מותר',
              data: Array(analyzedDays.length).fill(minRainfall),
              borderColor: 'rgba(0, 200, 0, 0.7)',
              borderDash: [5, 5],
              pointRadius: 0,
            },
            {
              label: 'משקעים מקס׳ מותר',
              data: Array(analyzedDays.length).fill(maxRainfall),
              borderColor: 'rgba(200, 0, 0, 0.7)',
              borderDash: [5, 5],
              pointRadius: 0,
            },
          ]
        : []),
    ],
  }

  const precipitationChartOptions = {
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  return (
    <section className='weather-simulation-result' style={{ maxWidth: '1000px', margin: 'auto', padding: '2rem' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>תוצאות - סימולציית מזג אוויר</h1>

      <section style={{ background: '#f9f9f9', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
        <h2>פרטי הסימולציה:</h2>
        <p>
          <strong>שדה:</strong> {selectedFieldName || 'לא נבחר'}
        </p>
        <p>
          <strong>יבול:</strong> {selectedCropName || 'על פי נתונים שהוזנו ידנית'}
        </p>
        <p>
          <strong>טמפ׳ מינימלית:</strong> {minTemperature}°C | <strong>טמפ׳ מקסימלית:</strong> {maxTemperature}°C
        </p>
        {isRainfallConditionUsed && (
          <p>
            <strong>טווח משקעים:</strong> {minRainfall} מ״מ - {maxRainfall} מ״מ
          </p>
        )}
        {growthPeriodInDays && (
          <p>
            <strong>מס׳ ימי גידול ממוצע:</strong> {growthPeriodInDays} ימים
          </p>
        )}
      </section>

      <p>
        ימים מתאימים: <strong>{suitableDaysCount}</strong> / {analyzedDays.length}
      </p>
      <p>
        ימים לא מתאימים: <strong>{unsuitableDaysCount}</strong>
      </p>

      {optimalSowing && (
        <p style={{ marginTop: '1rem' }}>
          <strong>תאריך זריעה מיטבי:</strong> {formatDate(optimalSowing.bestStartDate)} — {(optimalSowing.bestScore * 100).toFixed(1)}% ימים מתאימים בתקופת
          הגידול
        </p>
      )}

      <p style={{ marginTop: '1rem', fontStyle: 'italic', color: '#555' }}>
        {isRainfallConditionUsed
          ? 'תנאי משקעים נלקחו בחשבון (לצורך ניתוח השקיה וניקוז), אך לא משפיעים על התאמה הכללית.'
          : 'תנאי משקעים לא הופעלו — ניתן להשקות/לנקז במידת הצורך.'}
      </p>

      {topSowingDates && topSowingDates.length > 0 && (
        <section style={{ marginTop: '2rem' }}>
          <h3>תאריכים מומלצים לזריעה</h3>
          <table border='1' cellPadding='5' style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th>תאריך זריעה</th>
                <th>אחוז ימים מתאימים בתקופת גידול</th>
                {isRainfallConditionUsed && (
                  <>
                    <th>ימי השקייה</th>
                    <th>ימי ניקוז</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {topSowingDates.map((item, idx) => (
                <tr key={idx}>
                  <td>{formatDate(item.startDate)}</td>
                  <td>{(item.suitableRatio * 100).toFixed(1)}%</td>
                  {isRainfallConditionUsed && (
                    <>
                      <td>{item.irrigationDays}</td>
                      <td>{item.drainageDays}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <div className='charts'>
        <div style={{ marginTop: '2rem' }}>
          <h3>גרף התאמת ימים</h3>
          <Bar data={barChartData} options={barChartOptions} />
        </div>

        <div style={{ marginTop: '2rem' }}>
          <h3>גרף טמפ' מקסימלית ומינימלית לאורך הימים</h3>
          <Line data={tempChartData} options={tempChartOptions} />
        </div>

        <div style={{ marginTop: '2rem' }}>
          <h3>גרף משקעים יומיים לאורך הימים</h3>
          <Line data={precipitationChartData} options={precipitationChartOptions} />
        </div>
      </div>

      <button style={{ marginTop: '2rem', padding: '0.5rem 1rem', fontSize: '1rem' }} onClick={() => navigate('/weather-simulation')}>
        חזור
      </button>
    </section>
  )
}
