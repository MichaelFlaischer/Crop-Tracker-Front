import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { cropService } from '../services/crop.service'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service'
import { Slider, TextField } from '@mui/material'

const schema = yup.object().shape({
  cropName: yup.string().required('יש להזין שם יבול'),
  description: yup.string(),
  growthTime: yup.number().required('יש להזין זמן גדילה').positive(),
  minTemp: yup.number().required(),
  maxTemp: yup.number().required().moreThan(yup.ref('minTemp')),
  minValue: yup.number().required(),
  maxValue: yup.number().required().moreThan(yup.ref('minValue')),
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

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onTouched',
  })

  useEffect(() => {
    loadCrop()
  }, [cropId])

  async function loadCrop() {
    try {
      const crop = await cropService.getById(cropId)
      if (!crop) throw new Error('לא נמצא יבול')
      reset(crop)
      setTempRange([crop.maxTemp, crop.minTemp])
      setHumidityRange([crop.maxValue, crop.minValue])
    } catch (err) {
      showErrorMsg('שגיאה בטעינת היבול')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTempChange = (e, newVal) => {
    setTempRange([newVal[1], newVal[0]])
    setValue('minTemp', newVal[0])
    setValue('maxTemp', newVal[1])
  }

  const handleHumidityChange = (e, newVal) => {
    setHumidityRange([newVal[1], newVal[0]])
    setValue('minValue', newVal[0])
    setValue('maxValue', newVal[1])
  }

  async function onSubmit(data) {
    try {
      const savedCrop = await cropService.save({ ...data, _id: cropId })
      showSuccessMsg('היבול עודכן בהצלחה')
      navigate(`/crop/${savedCrop._id}`)
    } catch (err) {
      console.error(err)
      showErrorMsg('שגיאה בעדכון יבול')
    }
  }

  if (isLoading) return <div className='loader'>טוען...</div>

  return (
    <section className='crop-edit main-layout'>
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
        </div>

        <label>השקיה מומלצת (מ\"מ ליום)</label>
        <input type='number' step='0.1' {...register('waterRecommendation')} />

        <label>דישון מומלץ (גרם/מ\"ר)</label>
        <input type='number' step='0.1' {...register('fertilizerRecommendation')} />

        <label>תנאים נוספים</label>
        <textarea {...register('additionalConditions')} />

        <label>הערות</label>
        <textarea {...register('notes')} />

        <button type='submit'>💾 שמור שינויים</button>
      </form>
    </section>
  )
}
