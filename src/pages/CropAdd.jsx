import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { cropService } from '../services/crop.service.js'
import { seasonService } from '../services/seasons.service.js'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service.js'
import { Slider, TextField, Switch, FormControlLabel } from '@mui/material'

const schema = yup.object().shape({
  cropName: yup.string().required('יש להזין שם יבול'),
  description: yup.string(),
  growthTime: yup.number().required('יש להזין זמן גדילה').positive('חייב להיות חיובי'),
  minTemp: yup.number().required(),
  maxTemp: yup.number().required().moreThan(yup.ref('minTemp'), 'טמפ׳ מקס׳ צריכה להיות גדולה מהמינ׳'),
  businessMinValue: yup.number().required(),
  businessMaxValue: yup.number().required().moreThan(yup.ref('businessMinValue'), 'ערך מקס׳ צריך להיות גדול מהמינ׳'),
  minHumidity: yup.number().required(),
  maxHumidity: yup.number().required().moreThan(yup.ref('minHumidity'), 'לחות מקס׳ צריכה להיות גדולה מהמינ׳'),
  minRainfall: yup.number().required(),
  maxRainfall: yup.number().required().moreThan(yup.ref('minRainfall'), 'ערך מקס׳ צריך להיות גדול מהמינ׳'),
  minSunlightHours: yup.number().required('יש להזין מינימום שעות אור').min(0, 'חייב להיות 0 ומעלה'),
  preferredSeasonId: yup.string().required('יש לבחור עונה מועדפת'),
  isSensitiveToRain: yup.boolean().required(),
  waterRecommendation: yup.number().nullable(),
  fertilizerRecommendation: yup.number().nullable(),
  additionalConditions: yup.string(),
  notes: yup.string(),
})

export function CropAdd() {
  const navigate = useNavigate()
  const [tempRange, setTempRange] = useState([30, 10])
  const [humidityRange, setHumidityRange] = useState([80, 40])
  const [businessRange, setBusinessRange] = useState([1000, 300])
  const [rainfallRange, setRainfallRange] = useState([100, 30])
  const [seasons, setSeasons] = useState([])
  const [selectedSeasonId, setSelectedSeasonId] = useState('')
  const [seasonMatchMessage, setSeasonMatchMessage] = useState(null)
  const [isSensitiveToRain, setIsSensitiveToRain] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onTouched',
  })

  useEffect(() => {
    seasonService.query().then(setSeasons)
  }, [])

  useEffect(() => {
    if (!selectedSeasonId) return

    const season = seasons.find((s) => s._id === selectedSeasonId)
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
  }, [selectedSeasonId, tempRange, humidityRange, rainfallRange, seasons])

  const handleSliderChange = (setter, minKey, maxKey) => (event, newValue) => {
    setter([newValue[1], newValue[0]])
    setValue(minKey, newValue[0])
    setValue(maxKey, newValue[1])
  }

  const handleInputChange = (val, index, range, setter, key) => {
    const newRange = [...range]
    newRange[index] = +val
    setter(newRange)
    setValue(key, +val)
  }

  function handleSeasonSelect(e) {
    const seasonId = e.target.value
    setSelectedSeasonId(seasonId)
    setValue('preferredSeasonId', seasonId)

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

  function onCancel() {
    navigate('/crop')
  }

  async function onSubmit(data) {
    try {
      const savedCrop = await cropService.save({
        ...data,
        isSensitiveToRain,
      })
      showSuccessMsg('היבול נוסף בהצלחה 🎉')
      navigate(`/crop/${savedCrop._id}`)
    } catch (err) {
      console.error('שגיאה בהוספה', err)
      showErrorMsg('שגיאה בהוספת יבול')
    }
  }

  return (
    <section className='crop-add'>
      <h1>הוספת יבול</h1>
      <form onSubmit={handleSubmit(onSubmit)} className='form'>
        <label>שם היבול *</label>
        <input type='text' {...register('cropName')} />
        {errors.cropName && <span className='error'>{errors.cropName.message}</span>}

        <label>תיאור</label>
        <textarea {...register('description')} />

        <label>⏳ זמן גדילה (ימים) *</label>
        <input type='number' {...register('growthTime')} />
        {errors.growthTime && <span className='error'>{errors.growthTime.message}</span>}

        <label>🌞 מינימום שעות אור (שעות ביום)</label>
        <input type='number' min='0' step='0.1' {...register('minSunlightHours')} />
        {errors.minSunlightHours && <span className='error'>{errors.minSunlightHours.message}</span>}

        {/* טווח טמפרטורה */}
        <div className='slider-field'>
          <label>🌡️ טווח טמפרטורה (°C)</label>
          <Slider
            value={[tempRange[1], tempRange[0]]}
            onChange={handleSliderChange(setTempRange, 'minTemp', 'maxTemp')}
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
          {errors.maxTemp && <span className='error'>{errors.maxTemp.message}</span>}
        </div>

        {/* טווח לחות */}
        <div className='slider-field'>
          <label>💧 טווח לחות (%)</label>
          <Slider
            value={[humidityRange[1], humidityRange[0]]}
            onChange={handleSliderChange(setHumidityRange, 'minHumidity', 'maxHumidity')}
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
          {errors.maxHumidity && <span className='error'>{errors.maxHumidity.message}</span>}
        </div>

        {/* טווח משקעים אידיאלי */}
        <div className='slider-field'>
          <label>🌦️ טווח משקעים אידיאלי (מ"מ)</label>
          <Slider
            value={[rainfallRange[1], rainfallRange[0]]}
            onChange={handleSliderChange(setRainfallRange, 'minRainfall', 'maxRainfall')}
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
          {errors.maxRainfall && <span className='error'>{errors.maxRainfall.message}</span>}
        </div>

        {/* ערך עסקי */}
        <div className='slider-field'>
          <label>📈 ערך עסקי רצוי (ק"ג)</label>
          <Slider
            value={[businessRange[1], businessRange[0]]}
            onChange={handleSliderChange(setBusinessRange, 'businessMinValue', 'businessMaxValue')}
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
          {errors.businessMaxValue && <span className='error'>{errors.businessMaxValue.message}</span>}
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
        <select
          value={selectedSeasonId}
          onChange={(e) => {
            const seasonId = e.target.value
            setSelectedSeasonId(seasonId)
            setValue('preferredSeasonId', seasonId)
          }}
        >
          <option value=''>בחר עונה מועדפת</option>
          {seasons.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>
        {errors.preferredSeasonId && <span className='error'>{errors.preferredSeasonId.message}</span>}

        {seasonMatchMessage && (
          <div
            style={{
              color: seasonMatchMessage.type === 'match' ? '#388e3c' : '#d32f2f',
              fontWeight: 'bold',
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
              name='isSensitiveToRain'
              color='primary'
            />
          }
          label='רגיש למשקעים בזמן הקציר'
        />

        <div className='form-actions'>
          <button type='submit'>✔️ שמור יבול</button>
          <button type='button' className='btn-cancel' onClick={onCancel}>
            ❌ ביטול
          </button>
        </div>
      </form>
    </section>
  )
}
