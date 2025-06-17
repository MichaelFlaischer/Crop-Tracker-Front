import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { seasonService } from '../services/seasons.service'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service'

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
    const isPast = isDateInPast(season.endDate)
    setShowDateUpdateBtn(isPast)
  }, [season?.endDate])

  function isDateInPast(dateStr) {
    if (!dateStr) return false
    const [day, month, year] = dateStr.split(/[\/\-]/).map(Number)
    const date = new Date(`${year}-${month}-${day}`)
    return date < new Date()
  }

  async function loadSeason() {
    try {
      const data = await seasonService.getById(seasonId)
      setSeason(data)
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
      const [day, month, year] = updated[field].split(/[\/\-]/)
      updated[field] = `${day}/${month}/${+year + 1}`
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
          תאריך התחלה (בפורמט DD/MM/YYYY):
          <input type='text' name='startDate' value={season.startDate} onChange={handleChange} required />
        </label>

        <label>
          תאריך סיום (בפורמט DD/MM/YYYY):
          <input type='text' name='endDate' value={season.endDate} onChange={handleChange} required />
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
