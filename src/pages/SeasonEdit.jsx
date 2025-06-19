import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { seasonService } from '../services/seasons.service'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service'

import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { registerLocale } from 'react-datepicker'
import he from 'date-fns/locale/he'
registerLocale('he', he)

export function SeasonEdit() {
  const [season, setSeason] = useState(null)
  const [showDateUpdateBtn, setShowDateUpdateBtn] = useState(false)
  const { seasonId } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    loadSeason()
  }, [seasonId])

  useEffect(() => {
    if (!season) return
    const isPast = new Date(season.endDate) < new Date()
    setShowDateUpdateBtn(isPast)
  }, [season?.endDate])

  async function loadSeason() {
    try {
      const data = await seasonService.getById(seasonId)
      setSeason({
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      })
    } catch (err) {
      showErrorMsg('שגיאה בטעינת נתוני העונה')
    }
  }

  function handleChange(ev) {
    const { name, value } = ev.target
    setSeason((prev) => ({ ...prev, [name]: isNaN(+value) ? value : +value }))
  }

  function isFormValid() {
    const requiredFields = ['startDate', 'endDate', 'avgTemperature', 'avgRainfall', 'avgHumidity', 'description']
    return requiredFields.every((field) => season[field] !== '' && season[field] !== null && season[field] !== undefined)
  }

  async function onSave(ev) {
    ev.preventDefault()
    if (!isFormValid()) {
      showErrorMsg('יש למלא את כל השדות הנדרשים')
      return
    }

    const confirmSave = window.confirm('האם אתה בטוח שברצונך לשמור את השינויים בעונה?')
    if (!confirmSave) return

    try {
      await seasonService.save(season)
      showSuccessMsg('העונה עודכנה בהצלחה')
      navigate('/seasons')
    } catch (err) {
      showErrorMsg('שגיאה בשמירת השינויים')
    }
  }

  function updateDatesToNextYear() {
    const updated = { ...season }
    const dateFields = ['startDate', 'endDate']
    dateFields.forEach((field) => {
      const current = new Date(updated[field])
      const nextYear = new Date(current.setFullYear(current.getFullYear() + 1))
      updated[field] = nextYear
    })
    setSeason(updated)
  }

  if (!season) return <div>טוען נתונים...</div>

  return (
    <section className='season-edit'>
      <h1>✏️ עריכת עונה - {season.name}</h1>
      <p className='page-description'>
        במסך זה ניתן לערוך את מאפייני העונה במערכת. שדות החובה כוללים את טווח התאריכים של העונה, ממוצעי טמפרטורה, משקעים ולחות, וכן תיאור כללי לעונה זו.
      </p>

      <form onSubmit={onSave}>
        <input type='hidden' name='_id' value={season._id} />

        <label>
          שם העונה (לקריאה בלבד):
          <input type='text' name='name' value={season.name} readOnly />
        </label>

        <label>
          קוד עונה (לקריאה בלבד):
          <input type='text' name='season' value={season.season} readOnly />
        </label>

        <label>
          תאריך התחלה:
          <DatePicker
            selected={season.startDate}
            onChange={(date) => setSeason((prev) => ({ ...prev, startDate: date }))}
            dateFormat='dd/MM/yyyy'
            locale='he'
            className='datepicker-input'
          />
        </label>

        <label>
          תאריך סיום:
          <DatePicker
            selected={season.endDate}
            onChange={(date) => setSeason((prev) => ({ ...prev, endDate: date }))}
            dateFormat='dd/MM/yyyy'
            locale='he'
            className='datepicker-input'
          />
        </label>

        <label>
          טמפרטורה ממוצעת (°C):
          <input type='number' name='avgTemperature' value={season.avgTemperature} onChange={handleChange} required />
        </label>

        <label>
          כמות משקעים ממוצעת (מ״מ):
          <input type='number' name='avgRainfall' value={season.avgRainfall} onChange={handleChange} required />
        </label>

        <label>
          אחוז לחות ממוצעת (%):
          <input type='number' name='avgHumidity' value={season.avgHumidity} onChange={handleChange} required />
        </label>

        <label>
          תיאור העונה:
          <textarea name='description' value={season.description} onChange={handleChange} required />
        </label>

        <div className='btns'>
          <button type='submit' className='btn-save'>
            💾 שמור שינויים
          </button>

          {showDateUpdateBtn && (
            <button type='button' onClick={updateDatesToNextYear} className='btn-update-dates'>
              📅 עדכן תאריכים לשנה הבאה
            </button>
          )}

          <button type='button' onClick={() => navigate('/seasons')} className='btn-cancel'>
            ❌ ביטול
          </button>
        </div>
      </form>
    </section>
  )
}
