import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { cropService } from '../services/crop.service'
import { seasonService } from '../services/seasons.service'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service'
import { Slider, TextField, Button, Switch, FormControlLabel } from '@mui/material'

const schema = yup.object().shape({
  cropName: yup.string().required('יש להזין שם יבול'),
  description: yup.string(),
  growthTime: yup.number().required('יש להזין זמן גדילה').positive(),
  minTemp: yup.number().required(),
  maxTemp: yup.number().required().moreThan(yup.ref('minTemp')),
  businessMinValue: yup.number().required(),
  businessMaxValue: yup.number().required().moreThan(yup.ref('businessMinValue')),
  minHumidity: yup.number().required(),
  maxHumidity: yup.number().required().moreThan(yup.ref('minHumidity')),
  minRainfall: yup.number().required(),
  maxRainfall: yup.number().required().moreThan(yup.ref('minRainfall')),
  minSunlightHours: yup.number().required('יש להזין מינימום שעות אור').min(0, 'חייב להיות 0 ומעלה'),
  preferredSeasonId: yup.string().required('יש לבחור עונה מועדפת'),
  isSensitiveToRain: yup.boolean().required(),
  waterRecommendation: yup.number().nullable(),
  fertilizerRecommendation: yup.number().nullable(),
  additionalConditions: yup.string(),
  notes: yup.string(),
})

export function CropEdit() {
  const { cropId } = useParams()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [tempRange, setTempRange] = useState([30, 10])
  const [humidityRange, setHumidityRange] = useState([80, 40])
  const [businessRange, setBusinessRange] = useState([1000, 500])
  const [rainfallRange, setRainfallRange] = useState([100, 30])
  const [isSensitiveToRain, setIsSensitiveToRain] = useState(false)
  const [seasons, setSeasons] = useState([])
  const [selectedSeasonId, setSelectedSeasonId] = useState('')
  const [seasonMatchMessage, setSeasonMatchMessage] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onTouched',
  })

  useEffect(() => {
    seasonService.query().then(setSeasons)
    loadCrop()
  }, [cropId])

  useEffect(() => {
    checkSeasonMatch(selectedSeasonId)
  }, [tempRange, humidityRange, rainfallRange, selectedSeasonId])

  async function loadCrop() {
    try {
      const crop = await cropService.getById(cropId)
      if (!crop) throw new Error('לא נמצא יבול')
      reset(crop)
      setTempRange([crop.maxTemp, crop.minTemp])
      setHumidityRange([crop.maxHumidity, crop.minHumidity])
      setBusinessRange([crop.businessMaxValue, crop.businessMinValue])
      setRainfallRange([crop.maxRainfall, crop.minRainfall])
      setIsSensitiveToRain(crop.isSensitiveToRain)
      setSelectedSeasonId(crop.preferredSeasonId)
      setValue('minSunlightHours', crop.minSunlightHours)
    } catch (err) {
      showErrorMsg('שגיאה בטעינת היבול')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSlider = (setter, fieldMin, fieldMax) => (e, newVal) => {
    setter([newVal[1], newVal[0]])
    setValue(fieldMin, newVal[0])
    setValue(fieldMax, newVal[1])
  }

  const handleInputChange = (val, index, range, setter, field) => {
    const newRange = [...range]
    newRange[index] = +val
    setter(newRange)
    setValue(field, +val)
  }

  function handleSeasonSelect(e) {
    const seasonId = e.target.value
    setSelectedSeasonId(seasonId)
    setValue('preferredSeasonId', seasonId)
  }

  function checkSeasonMatch(seasonId) {
    const season = seasons.find((s) => s._id === seasonId)
    if (!season) return

    const isTempOk = tempRange[1] <= season.avgTemperature && tempRange[0] >= season.avgTemperature
    const isHumidityOk = humidityRange[1] <= season.avgHumidity && humidityRange[0] >= season.avgHumidity
    const isRainOk = rainfallRange[1] <= season.avgRainfall && rainfallRange[0] >= season.avgRainfall

    if (isTempOk && isHumidityOk && isRainOk) {
      setSeasonMatchMessage({
        type: 'match',
        text: '✅ העונה מתאימה לפי הפרמטרים שהוגדרו',
      })
    } else {
      const suitableSeasons = seasons
        .filter((s) => {
          const tempOk = tempRange[1] <= s.avgTemperature && tempRange[0] >= s.avgTemperature
          const humidityOk = humidityRange[1] <= s.avgHumidity && humidityRange[0] >= s.avgHumidity
          const rainOk = rainfallRange[1] <= s.avgRainfall && rainfallRange[0] >= s.avgRainfall
          return tempOk && humidityOk && rainOk
        })
        .map((s) => s.name)

      let recommendation = '⚠️ העונה אינה תואמת לכל התנאים של היבול'
      if (suitableSeasons.length) {
        recommendation += `\n✅ עונות שמתאימות לפי התנאים: ${suitableSeasons.join(', ')}`
      }

      setSeasonMatchMessage({
        type: 'mismatch',
        text: recommendation,
      })
    }
  }

  async function onSubmit(data) {
    try {
      const savedCrop = await cropService.save({ ...data, isSensitiveToRain, _id: cropId })
      showSuccessMsg('היבול עודכן בהצלחה')
      navigate(`/crop/${savedCrop._id}`)
    } catch (err) {
      console.error(err)
      showErrorMsg('שגיאה בעדכון יבול')
    }
  }

  function onCancel() {
    navigate('/crop')
  }

  if (isLoading) return <div className='loader'>טוען...</div>

  return (
    <section className='crop-edit'>
      <h1>עריכת יבול</h1>
      <form onSubmit={handleSubmit(onSubmit)} className='form'>
        <label>שם היבול *</label>
        <input type='text' {...register('cropName')} />
        {errors.cropName && <span className='error'>{errors.cropName.message}</span>}

        <label>תיאור</label>
        <textarea {...register('description')} />

        <label>⏳ זמן גדילה (ימים)</label>
        <input type='number' {...register('growthTime')} />
        {errors.growthTime && <span className='error'>{errors.growthTime.message}</span>}

        <label>🌞 מינימום שעות אור (שעות ביום)</label>
        <input type='number' min='0' step='0.1' {...register('minSunlightHours')} />
        {errors.minSunlightHours && <span className='error'>{errors.minSunlightHours.message}</span>}

        <div className='slider-field'>
          <label>🌡️ טווח טמפרטורה (°C)</label>
          <Slider
            value={[tempRange[1], tempRange[0]]}
            onChange={handleSlider(setTempRange, 'minTemp', 'maxTemp')}
            valueLabelDisplay='auto'
            disableSwap
            min={-10}
            max={60}
            step={0.1}
          />
          <div className='inputs-inline'>
            <TextField
              label='מקס׳'
              type='number'
              value={tempRange[0]}
              onChange={(e) => handleInputChange(e.target.value, 0, tempRange, setTempRange, 'maxTemp')}
              size='small'
            />
            <TextField
              label='מינ׳'
              type='number'
              value={tempRange[1]}
              onChange={(e) => handleInputChange(e.target.value, 1, tempRange, setTempRange, 'minTemp')}
              size='small'
            />
          </div>
        </div>

        <div className='slider-field'>
          <label>💧 טווח לחות (%)</label>
          <Slider
            value={[humidityRange[1], humidityRange[0]]}
            onChange={handleSlider(setHumidityRange, 'minHumidity', 'maxHumidity')}
            valueLabelDisplay='auto'
            disableSwap
            min={0}
            max={100}
            step={0.1}
          />
          <div className='inputs-inline'>
            <TextField
              label='מקס׳'
              type='number'
              value={humidityRange[0]}
              onChange={(e) => handleInputChange(e.target.value, 0, humidityRange, setHumidityRange, 'maxHumidity')}
              size='small'
            />
            <TextField
              label='מינ׳'
              type='number'
              value={humidityRange[1]}
              onChange={(e) => handleInputChange(e.target.value, 1, humidityRange, setHumidityRange, 'minHumidity')}
              size='small'
            />
          </div>
        </div>

        <div className='slider-field'>
          <label>🌦️ טווח משקעים אידיאלי (מ"מ)</label>
          <Slider
            value={[rainfallRange[1], rainfallRange[0]]}
            onChange={handleSlider(setRainfallRange, 'minRainfall', 'maxRainfall')}
            valueLabelDisplay='auto'
            disableSwap
            min={0}
            max={500}
            step={1}
          />
          <div className='inputs-inline'>
            <TextField
              label='מקס׳'
              type='number'
              value={rainfallRange[0]}
              onChange={(e) => handleInputChange(e.target.value, 0, rainfallRange, setRainfallRange, 'maxRainfall')}
              size='small'
            />
            <TextField
              label='מינ׳'
              type='number'
              value={rainfallRange[1]}
              onChange={(e) => handleInputChange(e.target.value, 1, rainfallRange, setRainfallRange, 'minRainfall')}
              size='small'
            />
          </div>
        </div>

        <div className='slider-field'>
          <label>📈 ערך עסקי רצוי (ק"ג)</label>
          <Slider
            value={[businessRange[1], businessRange[0]]}
            onChange={handleSlider(setBusinessRange, 'businessMinValue', 'businessMaxValue')}
            valueLabelDisplay='auto'
            disableSwap
            min={0}
            max={10000}
            step={1}
          />
          <div className='inputs-inline'>
            <TextField
              label='מקס׳'
              type='number'
              value={businessRange[0]}
              onChange={(e) => handleInputChange(e.target.value, 0, businessRange, setBusinessRange, 'businessMaxValue')}
              size='small'
            />
            <TextField
              label='מינ׳'
              type='number'
              value={businessRange[1]}
              onChange={(e) => handleInputChange(e.target.value, 1, businessRange, setBusinessRange, 'businessMinValue')}
              size='small'
            />
          </div>
        </div>

        <label>🚿 השקיה מומלצת (מ"מ ליום)</label>
        <input type='number' step='0.1' {...register('waterRecommendation')} />

        <label>🧪 דישון מומלץ (גרם/מ"ר)</label>
        <input type='number' step='0.1' {...register('fertilizerRecommendation')} />

        <label>📝 תנאים נוספים</label>
        <textarea {...register('additionalConditions')} />

        <label>📌 הערות</label>
        <textarea {...register('notes')} />

        <label>🗓️ עונה מועדפת</label>
        <select value={selectedSeasonId} onChange={handleSeasonSelect}>
          <option value=''>בחר עונה</option>
          {seasons.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>
        {selectedSeasonId && (
          <div
            style={{
              margin: '0.5rem 0 1rem',
              padding: '1rem',
              backgroundColor: '#f1f8ff',
              border: '1px solid #b6d4fe',
              borderRadius: '8px',
              fontSize: '0.95rem',
              color: '#333',
            }}
          >
            {(() => {
              const season = seasons.find((s) => s._id === selectedSeasonId)
              if (!season) return null
              return (
                <>
                  <strong>🟢 פרטי העונה שנבחרה:</strong>
                  <br />
                  🌡️ טמפרטורה ממוצעת: {season.avgTemperature}°C
                  <br />
                  💧 לחות ממוצעת: {season.avgHumidity}%<br />
                  🌧️ משקעים ממוצעים: {season.avgRainfall} מ"מ
                </>
              )
            })()}
          </div>
        )}

        {errors.preferredSeasonId && <span className='error'>{errors.preferredSeasonId.message}</span>}

        {seasonMatchMessage && (
          <div
            style={{
              color: seasonMatchMessage.type === 'match' ? '#388e3c' : '#d32f2f',
              fontWeight: 'bold',
              whiteSpace: 'pre-line',
              marginBottom: '1rem',
            }}
          >
            {seasonMatchMessage.text}
          </div>
        )}

        <FormControlLabel
          control={
            <Switch
              checked={isSensitiveToRain}
              onChange={(e) => {
                setIsSensitiveToRain(e.target.checked)
                setValue('isSensitiveToRain', e.target.checked)
              }}
              color='primary'
            />
          }
          label='רגיש למשקעים'
        />

        <div className='form-actions'>
          <Button variant='contained' color='primary' type='submit'>
            💾 שמור שינויים
          </Button>
          <Button variant='outlined' color='secondary' onClick={onCancel}>
            ❌ ביטול
          </Button>
        </div>
      </form>
    </section>
  )
}
