import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { fieldService } from '../services/field.service.js'
import { cropService } from '../services/crop.service.js'
import { sowingAndHarvestService } from '../services/sowing-and-harvest.service.js'

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

export function SowingAdd() {
  const [fields, setFields] = useState([])
  const [crops, setCrops] = useState([])
  const [formData, setFormData] = useState({ fieldId: '', cropId: '', sowingDate: null, notes: '' })
  const [selectedFieldName, setSelectedFieldName] = useState('')
  const [selectedCropDays, setSelectedCropDays] = useState(null)
  const [selectedCropNotes, setSelectedCropNotes] = useState('')
  const [selectedCropDescription, setSelectedCropDescription] = useState('')
  const [errors, setErrors] = useState({})
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    async function loadData() {
      const [fetchedFields, fetchedCrops] = await Promise.all([fieldService.query(), cropService.query()])
      setFields(fetchedFields)
      setCrops(fetchedCrops)

      const prefillFieldId = searchParams.get('fieldId')
      if (prefillFieldId) {
        const field = fetchedFields.find((f) => f._id.toString() === prefillFieldId)
        if (field) setSelectedFieldName(field.fieldName)
        setFormData((prev) => ({ ...prev, fieldId: prefillFieldId }))
      }
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
    }
  }

  function validateForm() {
    const newErrors = {}

    if (!formData.cropId) newErrors.cropId = 'יש לבחור יבול'
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

  return (
    <section className='sowing-add'>
      <h1>שתילה חדשה</h1>
      <form onSubmit={handleSubmit}>
        <label>
          שדה נבחר:
          <div style={{ padding: '0.5rem', backgroundColor: '#f3f4f6', borderRadius: '6px', border: '1px solid #ccc' }}>{selectedFieldName || '---'}</div>
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
          {(selectedCropDays !== null || selectedCropNotes || selectedCropDescription) && (
            <div style={{ marginTop: '0.5rem' }}>
              {selectedCropDays !== null && (
                <div style={{ fontSize: '0.9rem', color: '#374151' }}>
                  ⏱️ זמן גידול צפוי: {selectedCropDays} ימים <span title='מספר הימים עד לקציר בהתאם לסוג היבול'>❔</span>
                </div>
              )}
              {selectedCropNotes && (
                <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                  📝 הערות: {selectedCropNotes} <span title='הערות כלליות על הגידול או על תנאים מומלצים'>🛈</span>
                </div>
              )}
              {selectedCropDescription && (
                <div style={{ fontSize: '0.9rem', color: '#4b5563' }}>
                  📘 תיאור: {selectedCropDescription} <span title='מידע כללי על סוג היבול'>ℹ️</span>
                </div>
              )}
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
