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
    <section className='weather-simulation-result'>
      <h1>תוצאות - סימולציית מזג אוויר עבור חלקת יבול</h1>

      <section>
        <h2>פרטי הסימולציה:</h2>
        <p>
          <strong>חלקת יבול:</strong> {selectedFieldName || 'לא נבחרה'}
        </p>
        <p>
          <strong>יבול:</strong> {selectedCropName || 'נתונים ידניים'}
        </p>
        <p>
          <strong>טמפ׳:</strong> {minTemperature}°C - {maxTemperature}°C
        </p>
        {isRainfallConditionUsed && (
          <p>
            <strong>טווח משקעים:</strong> {minRainfall} מ״מ - {maxRainfall} מ״מ
          </p>
        )}
        {growthPeriodInDays && (
          <p>
            <strong>מס׳ ימי גידול:</strong> {growthPeriodInDays} ימים
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
        <p>
          <strong>תאריך זריעה מיטבי:</strong> {formatDate(optimalSowing.bestStartDate)} — {(optimalSowing.bestScore * 100).toFixed(1)}%
        </p>
      )}

      <p className='note'>
        {isRainfallConditionUsed ? 'תנאי משקעים שימשו לחישוב השקיה/ניקוז, לא להתאמה כללית.' : 'תנאי משקעים לא הופעלו — ניתן להשקות או לנקז במידת הצורך.'}
      </p>

      {topSowingDates?.length > 0 && (
        <>
          <section className='desktop-table'>
            <h3>תאריכים מומלצים לזריעה</h3>
            <table>
              <thead>
                <tr>
                  <th>תאריך</th>
                  <th>אחוז ימים מתאימים</th>
                  {isRainfallConditionUsed && (
                    <>
                      <th>ימי השקיה</th>
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

          <section className='mobile-cards'>
            {topSowingDates.map((item, idx) => (
              <div key={idx} className='forecast-card'>
                <h4>{formatDate(item.startDate)}</h4>
                <p>אחוז ימים מתאימים: {(item.suitableRatio * 100).toFixed(1)}%</p>
                {isRainfallConditionUsed && (
                  <p>
                    השקיה: {item.irrigationDays} | ניקוז: {item.drainageDays}
                  </p>
                )}
              </div>
            ))}
          </section>
        </>
      )}

      <div className='charts'>
        <div>
          <h3>גרף התאמת ימים</h3>
          <Bar data={barChartData} options={barChartOptions} />
        </div>

        <div>
          <h3>גרף טמפרטורות</h3>
          <Line data={tempChartData} options={tempChartOptions} />
        </div>

        <div>
          <h3>גרף משקעים</h3>
          <Line data={precipitationChartData} options={precipitationChartOptions} />
        </div>
      </div>

      <button onClick={() => navigate('/weather-simulation')}>חזור</button>
    </section>
  )
}
