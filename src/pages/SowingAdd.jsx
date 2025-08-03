import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { fieldService } from '../services/field.service.js'
import { cropService } from '../services/crop.service.js'
import { sowingAndHarvestService } from '../services/sowing-and-harvest.service.js'
import { seasonService } from '../services/seasons.service.js'
import { getWeeklyWeatherSummary } from '../services/weather.service.js'
import { Loader } from '../cmps/Loader.jsx'

import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { registerLocale } from 'react-datepicker'
import { he } from 'date-fns/locale'

registerLocale('he', he)

function formatDateToServer(date) {
  if (!date) return ''
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isDateInRange(date, startStr, endStr) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const start = new Date(startStr)
  const end = new Date(endStr)
  start.setHours(0, 0, 0, 0)
  end.setHours(23, 59, 59, 999)
  return d >= start && d <= end
}

export function SowingAdd() {
  const [fields, setFields] = useState([])
  const [crops, setCrops] = useState([])
  const [seasons, setSeasons] = useState([])
  const [formData, setFormData] = useState({ fieldId: '', cropId: '', sowingDate: null, notes: '' })
  const [selectedFieldName, setSelectedFieldName] = useState('')
  const [selectedCropDays, setSelectedCropDays] = useState(null)
  const [selectedCropNotes, setSelectedCropNotes] = useState('')
  const [selectedCropDescription, setSelectedCropDescription] = useState('')
  const [selectedCropSeasons, setSelectedCropSeasons] = useState([])
  const [seasonRecommendation, setSeasonRecommendation] = useState('')
  const [weatherRecommendation, setWeatherRecommendation] = useState('')
  const [weatherAlternatives, setWeatherAlternatives] = useState([])
  const [preferredSeasonInfo, setPreferredSeasonInfo] = useState(null)
  const [recommendedSeasonsInfo, setRecommendedSeasonsInfo] = useState([])
  const [errors, setErrors] = useState({})
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const [fetchedFields, fetchedCrops, fetchedSeasons] = await Promise.all([fieldService.query(), cropService.query(), seasonService.query()])
      setFields(fetchedFields)
      setCrops(fetchedCrops)
      setSeasons(fetchedSeasons)

      const prefillFieldId = searchParams.get('fieldId')
      if (prefillFieldId) {
        const field = fetchedFields.find((f) => f._id.toString() === prefillFieldId)
        if (field) setSelectedFieldName(field.fieldName)
        setFormData((prev) => ({ ...prev, fieldId: prefillFieldId }))
      }
      setIsLoading(false)
    }
    loadData()
  }, [searchParams])

  function handleChange(ev) {
    const { name, value } = ev.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    if (name === 'cropId') {
      const crop = crops.find((c) => c._id.toString() === value)
      setSelectedCropDays(crop?.growthTime || null)
      setSelectedCropNotes(crop?.notes || '')
      setSelectedCropDescription(crop?.description || '')
      setSelectedCropSeasons(crop?.recommendedSeasons || [])
      setPreferredSeasonInfo(seasons.find((s) => s._id === crop?.preferredSeasonId))
      const seasonObjs = crop?.recommendedSeasons?.map((s) => seasons.find((season) => season._id === s._id)).filter(Boolean) || []
      setRecommendedSeasonsInfo(seasonObjs)
      setSeasonRecommendation('')
      setWeatherRecommendation('')
      setWeatherAlternatives([])
    }
  }

  useEffect(() => {
    async function analyzeDate() {
      if (!formData.sowingDate || !formData.cropId) return

      const crop = crops.find((c) => c._id.toString() === formData.cropId)
      if (!crop) return

      const sowingDate = new Date(formData.sowingDate)
      sowingDate.setHours(0, 0, 0, 0)
      const today = new Date()

      const matchingSeason = recommendedSeasonsInfo.find((season) => {
        const inRange = isDateInRange(sowingDate, season.startDate, season.endDate)
        return inRange
      })

      try {
        const field = fields.find((f) => f._id === formData.fieldId)
        if (!field || !field.location) return

        const weather = await getWeeklyWeatherSummary(field.location.lat, field.location.lng)

        const selectedDay = weather.find((day) => new Date(day.date).toDateString() === sowingDate.toDateString())

        if (selectedDay) {
          const isSuitable =
            selectedDay.tempMin >= crop.minTemp &&
            selectedDay.tempMax <= crop.maxTemp &&
            selectedDay.humidity >= crop.minHumidity &&
            selectedDay.humidity <= crop.maxHumidity

          setWeatherRecommendation(isSuitable ? '✅ תנאי מזג האוויר מתאימים לשתילה.' : '⚠️ תנאי מזג האוויר פחות מתאימים לשתילה.')
        } else {
          setWeatherRecommendation('⚠️ לא נמצאה תחזית עבור תאריך זה.')
        }

        const alternatives = weather
          .filter((day) => {
            const date = new Date(day.date)
            const diff = Math.abs((date - sowingDate) / (1000 * 60 * 60 * 24))
            const isSuitable =
              day.tempMin >= crop.minTemp && day.tempMax <= crop.maxTemp && day.humidity >= crop.minHumidity && day.humidity <= crop.maxHumidity
            return diff <= 7 && isSuitable && date >= today
          })
          .map((d) => d.date.toISOString())

        setWeatherAlternatives(alternatives)
      } catch (err) {
        console.error('שגיאה בבדיקת תחזית:', err)
      }
    }

    analyzeDate()
  }, [formData.sowingDate, formData.cropId])

  function validateForm() {
    const newErrors = {}

    if (!formData.cropId) newErrors.cropId = 'יש לבחור יבול'
    if (!formData.fieldId) newErrors.fieldId = 'יש לבחור חלקה לשתילה'
    if (!(formData.sowingDate instanceof Date)) newErrors.sowingDate = 'יש לבחור תאריך תקף'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    if (!validateForm()) return
    try {
      await sowingAndHarvestService.add({
        ...formData,
        sowingDate: formatDateToServer(formData.sowingDate),
      })
      navigate('/field')
    } catch (err) {
      console.error('שגיאה בהוספת שתילה:', err)
    }
  }

  function handleCancel() {
    navigate('/field')
  }

  if (isLoading) return <Loader />

  return (
    <section className='sowing-add'>
      <h1>שתילה חדשה</h1>
      <form onSubmit={handleSubmit}>
        <label>
          חלקה נבחרת:
          <div style={{ padding: '0.5rem', backgroundColor: '#f3f4f6', borderRadius: '6px', border: '1px solid #ccc' }}>{selectedFieldName || '---'}</div>
          {errors.fieldId && <span style={{ color: 'red', fontSize: '0.8rem' }}>{errors.fieldId}</span>}
        </label>

        <label>
          יבול:
          <select name='cropId' value={formData.cropId} onChange={handleChange}>
            <option value=''>בחר יבול</option>
            {crops.map((crop) => (
              <option key={crop._id} value={crop._id.toString()}>
                {crop.cropName}
              </option>
            ))}
          </select>
          {errors.cropId && <span style={{ color: 'red', fontSize: '0.8rem' }}>{errors.cropId}</span>}
          {(selectedCropDays !== null || selectedCropNotes || selectedCropDescription || selectedCropSeasons.length > 0 || preferredSeasonInfo) && (
            <div style={{ marginTop: '0.5rem' }}>
              {selectedCropDays !== null && <div style={{ fontSize: '0.9rem', color: '#374151' }}>⏱️ זמן גידול צפוי: {selectedCropDays} ימים</div>}
              {preferredSeasonInfo && (
                <div style={{ fontSize: '0.9rem', color: '#0d9488' }}>
                  ⭐ עונה מועדפת לשתילה: {preferredSeasonInfo.name} ({new Date(preferredSeasonInfo.startDate).toLocaleDateString('he-IL')} -
                  {new Date(preferredSeasonInfo.endDate).toLocaleDateString('he-IL')}){' '}
                </div>
              )}
              {recommendedSeasonsInfo.length > 0 && (
                <div style={{ fontSize: '0.9rem', color: '#2563eb' }}>
                  📅 עונות מומלצות לשתילה: {recommendedSeasonsInfo.map((s) => `${s.name} (${s.startDate} - ${s.endDate})`).join(', ')}
                </div>
              )}
              {selectedCropNotes && <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>📝 הערות: {selectedCropNotes}</div>}
              {selectedCropDescription && <div style={{ fontSize: '0.9rem', color: '#4b5563' }}>📘 תיאור: {selectedCropDescription}</div>}
            </div>
          )}
        </label>

        <label>
          תאריך שתילה:
          <DatePicker
            selected={formData.sowingDate}
            onChange={(date) => setFormData((prev) => ({ ...prev, sowingDate: date }))}
            dateFormat='dd/MM/yyyy'
            locale='he'
            placeholderText='בחר תאריך'
            className='datepicker-input'
          />
          {errors.sowingDate && <span style={{ color: 'red', fontSize: '0.8rem' }}>{errors.sowingDate}</span>}
          {seasonRecommendation && <p style={{ color: '#0d9488', fontWeight: 'bold' }}>{seasonRecommendation}</p>}
          {weatherRecommendation && <p style={{ color: '#2563eb' }}>{weatherRecommendation}</p>}
          {weatherAlternatives.length > 0 && (
            <div>
              <p style={{ fontWeight: 'bold' }}>תאריכים חלופיים לשתילה:</p>
              <ul>
                {weatherAlternatives.map((dateStr, idx) => (
                  <li key={idx}>{new Date(dateStr).toLocaleDateString('he-IL')}</li>
                ))}
              </ul>
            </div>
          )}
        </label>

        <label>
          הערות:
          <textarea name='notes' value={formData.notes} onChange={handleChange}></textarea>
        </label>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button type='submit'>שתול</button>
          <button type='button' onClick={handleCancel} style={{ backgroundColor: '#e5e7eb', color: '#111827' }}>
            ביטול
          </button>
        </div>
      </form>
    </section>
  )
}
