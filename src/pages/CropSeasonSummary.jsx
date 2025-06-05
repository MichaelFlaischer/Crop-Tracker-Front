import { useEffect, useState } from 'react'
import { cropService } from '../services/crop.service'
import { sowingAndHarvestService } from '../services/sowing-and-harvest.service'
import { seasonService } from '../services/seasons.service'

export function CropSeasonSummary() {
  const [summaryData, setSummaryData] = useState([])
  const [openIndexes, setOpenIndexes] = useState([])

  useEffect(() => {
    loadSummary()
  }, [])

  async function loadSummary() {
    try {
      const [crops, harvests, seasons] = await Promise.all([cropService.query(), sowingAndHarvestService.query(), seasonService.query()])

      const structured = crops.map((crop) => {
        const cropHarvestLogs = harvests
          .filter((record) => +record.cropId === crop._id && (record.harvestLogs ?? []).length)
          .flatMap((record) =>
            (record.harvestLogs ?? []).map((log) => {
              const date = new Date(log.date)
              const matchedSeason = seasons.find((s) => {
                if (!s.startDate || !s.endDate) return false
                const [sd, sm] = s.startDate.split('/')
                const [ed, em] = s.endDate.split('/')
                const seasonStart = new Date(date.getFullYear(), +sm - 1, +sd)
                const seasonEnd = new Date(date.getFullYear(), +em - 1, +ed)
                if (seasonEnd < seasonStart) seasonEnd.setFullYear(seasonEnd.getFullYear() + 1)

                return date.getTime() >= seasonStart.getTime() && date.getTime() <= seasonEnd.getTime()
              })
              return {
                ...log,
                cropId: crop._id,
                cropName: crop.cropName,
                date,
                year: date.getFullYear(),
                season: matchedSeason?.name ?? null,
                amount: +log.amount || 0,
              }
            })
          )
          .filter((log) => log.season) // מסנן רק עונות תקינות

        const statsBySeason = {}

        for (const log of cropHarvestLogs) {
          if (!log.season || !log.year) continue
          if (!statsBySeason[log.season]) statsBySeason[log.season] = {}
          if (!statsBySeason[log.season][log.year]) statsBySeason[log.season][log.year] = 0
          statsBySeason[log.season][log.year] += log.amount
        }

        const averageBySeason = {}
        for (const season in statsBySeason) {
          const yearValues = Object.values(statsBySeason[season])
          const sum = yearValues.reduce((acc, val) => acc + val, 0)
          const avg = yearValues.length ? sum / yearValues.length : 0
          averageBySeason[season] = avg
        }

        let bestSeason = null
        let maxAvg = -Infinity
        for (const season in averageBySeason) {
          if (averageBySeason[season] > maxAvg) {
            maxAvg = averageBySeason[season]
            bestSeason = season
          }
        }

        return {
          cropName: crop.cropName,
          statsBySeason,
          averageBySeason,
          bestSeason,
        }
      })

      setSummaryData(structured)
    } catch (err) {
      console.error('Error loading summary:', err)
    }
  }

  function toggleCard(index) {
    setOpenIndexes((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]))
  }

  function formatNumber(num) {
    return (+num).toLocaleString('he-IL', { maximumFractionDigits: 0 })
  }

  return (
    <section className='crop-season-summary'>
      <h2> דוח קציר בפילוח עונתי</h2>
      {summaryData.map((crop, idx) => {
        const isOpen = openIndexes.includes(idx)
        return (
          <div key={idx} className='crop-summary-card'>
            <h3 onClick={() => toggleCard(idx)} style={{ cursor: 'pointer' }}>
              {crop.cropName} {isOpen ? '▲' : '▼'}
            </h3>

            {isOpen && (
              <>
                {crop.bestSeason && (
                  <p className='recommendation'>
                    העונה המומלצת לגידול: <strong>{crop.bestSeason}</strong>
                  </p>
                )}

                {Object.keys(crop.statsBySeason).length > 0 ? (
                  Object.entries(crop.statsBySeason).map(([season, yearMap], i) => (
                    <div key={i} className='season-block'>
                      <h4>עונה: {season}</h4>
                      <table className='crop-summary-table'>
                        <thead>
                          <tr>
                            <th>שנה</th>
                            <th>סה"כ קציר (ק"ג)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(yearMap).map(([year, amount], j) => (
                            <tr key={j}>
                              <td>{year}</td>
                              <td>{formatNumber(amount)}</td>
                            </tr>
                          ))}
                          <tr className='average-row'>
                            <td>ממוצע</td>
                            <td>{formatNumber(crop.averageBySeason[season])}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ))
                ) : (
                  <p>לא קיימים נתוני קציר עבור יבול זה.</p>
                )}
              </>
            )}
          </div>
        )
      })}
    </section>
  )
}
