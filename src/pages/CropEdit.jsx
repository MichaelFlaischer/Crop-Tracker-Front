import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { cropService } from '../services/crop.service'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service'
import { Slider, TextField, Button } from '@mui/material'

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
      setHumidityRange([crop.maxHumidity, crop.minHumidity])
      setBusinessRange([crop.businessMaxValue, crop.businessMinValue])
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

  function onCancel() {
    navigate('/crop')
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
          <label>📈 ערך עסקי רצוי (ק״ג)</label>
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

        <label>השקיה מומלצת (מ"מ ליום)</label>
        <input type='number' step='0.1' {...register('waterRecommendation')} />

        <label>דישון מומלץ (גרם/מ"ר)</label>
        <input type='number' step='0.1' {...register('fertilizerRecommendation')} />

        <label>תנאים נוספים</label>
        <textarea {...register('additionalConditions')} />

        <label>הערות</label>
        <textarea {...register('notes')} />

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
