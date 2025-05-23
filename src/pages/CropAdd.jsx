import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { cropService } from '../services/crop.service.js'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service.js'
import { Slider, TextField } from '@mui/material'

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
  waterRecommendation: yup.number().nullable(),
  fertilizerRecommendation: yup.number().nullable(),
  additionalConditions: yup.string(),
  notes: yup.string(),
})

export function CropAdd() {
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onTouched',
  })

  const [tempRange, setTempRange] = useState([30, 10])
  const [humidityRange, setHumidityRange] = useState([80, 40])
  const [businessRange, setBusinessRange] = useState([100, 50])

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

  function onCancel() {
    navigate('/crop')
  }

  async function onSubmit(data) {
    try {
      const savedCrop = await cropService.save(data)
      showSuccessMsg('היבול נוסף בהצלחה 🎉')
      navigate(`/crop/${savedCrop._id}`)
    } catch (err) {
      console.error('שגיאה בהוספה', err)
      showErrorMsg('שגיאה בהוספת יבול')
    }
  }

  return (
    <section className='crop-add main-layout'>
      <h1>הוספת יבול חדש</h1>
      <form onSubmit={handleSubmit(onSubmit)} className='form'>
        <label>
          שם היבול *
          <input type='text' {...register('cropName')} />
          {errors.cropName && <span className='error'>{errors.cropName.message}</span>}
        </label>

        <label>
          תיאור
          <textarea {...register('description')} />
        </label>

        <label>
          זמן גדילה (ימים) *
          <input type='number' {...register('growthTime')} />
          {errors.growthTime && <span className='error'>{errors.growthTime.message}</span>}
        </label>

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

        {/* ערכים עסקיים */}
        <div className='slider-field'>
          <label>📈 ערך עסקי רצוי</label>
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

        <label>
          השקיה מומלצת (מ"מ ליום)
          <input type='number' step='0.1' {...register('waterRecommendation')} />
        </label>

        <label>
          דישון מומלץ (גרם/מ"ר)
          <input type='number' step='0.1' {...register('fertilizerRecommendation')} />
        </label>

        <label>
          תנאים נוספים
          <textarea {...register('additionalConditions')} />
        </label>

        <label>
          הערות
          <textarea {...register('notes')} />
        </label>

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
