import { useEffect, useState } from 'react'
import { sowingAndHarvestService } from '../services/sowing-and-harvest.service.js'
import { taskService } from '../services/task.service.js'
import { cropService } from '../services/crop.service.js'
import { fieldService } from '../services/field.service.js'
import TimelinesChart from 'timelines-chart'
import { Loader } from '../cmps/Loader.jsx'

export function SowingAndHarvestTimeline() {
  const [records, setRecords] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [sowingAndHarvest, allTasks, allCrops, allFields] = await Promise.all([
        sowingAndHarvestService.query(),
        taskService.query(),
        cropService.query(),
        fieldService.query(),
      ])

      const recordsWithDetails = sowingAndHarvest.map((entry) => {
        const sowingDate = new Date(entry.sowingDate)
        const harvestDate = entry.harvestDate ? new Date(entry.harvestDate) : null

        const relatedTasks = allTasks.filter((task) => {
          const taskStart = new Date(task.startDate)
          const taskEnd = new Date(task.endDate)
          return (
            task.fieldId === entry.fieldId &&
            ((taskStart >= sowingDate && (!harvestDate || taskStart <= harvestDate)) || (taskEnd >= sowingDate && (!harvestDate || taskEnd <= harvestDate)))
          )
        })

        const crop = allCrops.find((c) => c._id === entry.cropId)
        const field = allFields.find((f) => f._id === entry.fieldId)

        return {
          ...entry,
          relatedTasks,
          cropName: crop?.cropName || entry.cropId,
          fieldName: field?.fieldName || entry.fieldId,
          estimatedHarvestDays: crop?.estimatedHarvestDays || 90,
          isActive: !entry.harvestDate,
        }
      })

      const recordsWithTimeline = recordsWithDetails.map((record) => {
        let timelineEvents = []

        const sowingDate = new Date(record.sowingDate)
        timelineEvents.push({ date: sowingDate, label: 'זריעה' })

        for (const task of record.relatedTasks) {
          const taskStart = new Date(task.startDate)
          if (!isNaN(taskStart) && taskStart >= sowingDate) {
            timelineEvents.push({ date: taskStart, label: task.taskDescription })
          }
        }

        for (const log of record.harvestLogs || []) {
          const logDate = new Date(log.date)
          if (!isNaN(logDate) && logDate >= sowingDate) {
            const isFinalHarvest = record.harvestDate && new Date(record.harvestDate).toDateString() === logDate.toDateString()
            timelineEvents.push({ date: logDate, label: isFinalHarvest ? 'קציר' : 'קציר חלקי' })
          }
        }

        if (record.harvestDate) {
          const harvestDate = new Date(record.harvestDate)
          const isAlreadyIncluded = timelineEvents.some((e) => e.date.toDateString() === harvestDate.toDateString() && e.label === 'קציר')
          if (!isAlreadyIncluded) {
            timelineEvents.push({ date: harvestDate, label: 'קציר' })
          }
          timelineEvents = timelineEvents.filter((e) => e.date <= harvestDate)
        } else {
          const estimatedHarvestDate = new Date(sowingDate)
          estimatedHarvestDate.setDate(estimatedHarvestDate.getDate() + record.estimatedHarvestDays)
          timelineEvents.push({ date: estimatedHarvestDate, label: 'קציר מלא חזוי' })
        }

        timelineEvents.sort((a, b) => new Date(a.date) - new Date(b.date))

        const chartContainer = document.createElement('div')
        chartContainer.style.height = '300px'
        chartContainer.style.width = '100%'
        setTimeout(() => {
          TimelinesChart()(chartContainer).data([
            {
              group: record.fieldName,
              data: [
                {
                  label: record.cropName,
                  data: timelineEvents.map((e) => {
                    const start = new Date(e.date)
                    start.setHours(0, 1, 0, 0)
                    const end = new Date(e.date)
                    end.setHours(23, 59, 0, 0)
                    return {
                      timeRange: [start, end],
                      val: 1,
                      desc: e.label,
                    }
                  }),
                },
              ],
            },
          ])
        }, 0)

        return {
          ...record,
          timelineEvents,
          chartContainer,
        }
      })

      recordsWithTimeline.sort((a, b) => new Date(a.sowingDate) - new Date(b.sowingDate))
      setRecords(recordsWithTimeline)
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const activeRecords = records.filter((r) => r.isActive)
  const inactiveRecords = records.filter((r) => !r.isActive)

  console.log('Active Records:', activeRecords)
  console.log('Inactive Records:', inactiveRecords)

  function renderTimelineTables(timelineEvents) {
    const tables = []
    for (let i = 0; i < timelineEvents.length; i += 10) {
      const chunk = timelineEvents.slice(i, i + 10)
      tables.push(
        <div key={`chunk-${i}`} className='timeline-table'>
          {i > 0 && <p className='timeline-continue-label'>המשך לציר הזמן הקודם:</p>}
          <table className='timeline-events-table'>
            <thead>
              <tr>
                {chunk.map((e, idx) => (
                  <th key={idx}>{e.date.toLocaleDateString('he-IL')}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {chunk.map((e, idx) => (
                  <td
                    key={idx}
                    className={
                      e.label === 'זריעה' || e.label === 'קציר' || e.label === 'קציר מלא חזוי'
                        ? 'event-start-end'
                        : e.label === 'קציר חלקי'
                        ? 'event-partial-harvest'
                        : ''
                    }
                  >
                    {e.label}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )
    }
    return tables
  }

  function renderGroup(title, groupRecords) {
    return (
      <details open className='timeline-group'>
        <summary className='timeline-group-summary'>{title}</summary>
        {groupRecords.map((record, idx) => (
          <details key={idx} className='record-details'>
            <summary className='record-summary'>
              חלקה: {record.fieldName} | יבול: {record.cropName} | תאריך זריעה: {new Date(record.sowingDate).toLocaleDateString('he-IL')} | סטטוס:{' '}
              {record.isActive ? 'פעיל' : 'לא פעיל'}
            </summary>

            <p>חלקה: {record.fieldName}</p>
            <p>תאריך זריעה: {new Date(record.sowingDate).toLocaleDateString('he-IL')}</p>
            <p>תאריך קציר: {record.harvestDate ? new Date(record.harvestDate).toLocaleDateString('he-IL') : 'טרם נקצר באופן מלא'}</p>

            <h4 className='timeline-title'>ציר פעולות כרונולוגי:</h4>
            {renderTimelineTables(record.timelineEvents)}

            <div ref={(el) => el?.appendChild(record.chartContainer)} className='timeline-chart-container'></div>
          </details>
        ))}
      </details>
    )
  }

  if (isLoading) return <Loader />

  return (
    <section className='sowing-harvest-timeline'>
      <h2 className='page-title'>לוח פעילות חקלאית</h2>
      {renderGroup('🟢 חלקות פעילות', activeRecords)}
      {renderGroup('🔴 חלקות לא פעילות', inactiveRecords)}
    </section>
  )
}
