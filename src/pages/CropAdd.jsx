// CropAdd.jsx
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
  minValue: yup.number().required(),
  maxValue: yup.number().required().moreThan(yup.ref('minValue'), 'לחות מקס׳ צריכה להיות גדולה מהמינ׳'),
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

  const handleTempChange = (event, newValue) => {
    setTempRange([newValue[1], newValue[0]])
    setValue('minTemp', newValue[0])
    setValue('maxTemp', newValue[1])
  }

  const handleHumidityChange = (event, newValue) => {
    setHumidityRange([newValue[1], newValue[0]])
    setValue('minValue', newValue[0])
    setValue('maxValue', newValue[1])
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

        <div className='slider-field'>
          <label>🌡️ טווח טמפרטורה (°C)</label>
          <div dir='rtl'>
            <Slider value={[tempRange[1], tempRange[0]]} onChange={handleTempChange} valueLabelDisplay='auto' disableSwap min={-10} max={60} step={0.1} />
          </div>
          <div className='inputs-inline'>
            <TextField
              label='מקס׳'
              type='number'
              value={tempRange[0]}
              onChange={(e) => {
                const val = +e.target.value
                setTempRange([val, tempRange[1]])
                setValue('maxTemp', val)
              }}
              size='small'
            />

            <TextField
              label='מינ׳'
              type='number'
              value={tempRange[1]}
              onChange={(e) => {
                const val = +e.target.value
                setTempRange([tempRange[0], val])
                setValue('minTemp', val)
              }}
              size='small'
            />
          </div>
          {errors.maxTemp && <span className='error'>{errors.maxTemp.message}</span>}
        </div>

        <div className='slider-field'>
          <label>💧 טווח לחות (%)</label>
          <div dir='rtl'>
            <Slider
              value={[humidityRange[1], humidityRange[0]]}
              onChange={handleHumidityChange}
              valueLabelDisplay='auto'
              disableSwap
              min={0}
              max={100}
              step={0.1}
            />
          </div>
          <div className='inputs-inline'>
            <TextField
              label='מקס׳'
              type='number'
              value={humidityRange[0]}
              onChange={(e) => {
                const val = +e.target.value
                setHumidityRange([val, humidityRange[1]])
                setValue('maxValue', val)
              }}
              size='small'
            />

            <TextField
              label='מינ׳'
              type='number'
              value={humidityRange[1]}
              onChange={(e) => {
                const val = +e.target.value
                setHumidityRange([humidityRange[0], val])
                setValue('minValue', val)
              }}
              size='small'
            />
          </div>
          {errors.maxValue && <span className='error'>{errors.maxValue.message}</span>}
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

        <button type='submit'>✔️ שמור יבול</button>
      </form>
    </section>
  )
}
