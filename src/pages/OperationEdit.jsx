import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { registerLocale } from 'react-datepicker'
import he from 'date-fns/locale/he'

import { operationService } from '../services/operation.service.js'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service.js'

registerLocale('he', he)

const schema = yup.object().shape({
  operationName: yup.string().required('יש להזין שם פעולה'),
  costPerUnit: yup.number().required('יש להזין עלות').min(0, 'הערך חייב להיות חיובי'),
  unitDescription: yup.string().required('יש להזין יחידת מידה'),
  executionNotes: yup.string(),
  executionDate: yup.date().required('יש לבחור תאריך ביצוע'),
})

export function OperationEdit() {
  const { operationId } = useParams()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onTouched',
  })

  useEffect(() => {
    loadOperation()
  }, [operationId])

  async function loadOperation() {
    try {
      const operation = await operationService.getById(operationId)
      if (!operation) throw new Error('פעולה לא נמצאה')

      reset({
        ...operation,
        executionDate: operation.executionDate ? new Date(operation.executionDate) : null,
      })
    } catch (err) {
      console.error(err)
      showErrorMsg('שגיאה בטעינת פעולה לעריכה')
    } finally {
      setIsLoading(false)
    }
  }

  async function onSubmit(data) {
    try {
      const updated = await operationService.save({ ...data, _id: operationId })
      showSuccessMsg('הפעולה עודכנה בהצלחה')
      navigate('/operations')
    } catch (err) {
      console.error(err)
      showErrorMsg('שגיאה בעדכון פעולה')
    }
  }

  return (
    <section className='operation-edit main-layout'>
      <h1>עריכת פעולה במערכת Crop-Tracker</h1>
      <p className='form-note'>
        כאן ניתן לעדכן את פרטי הפעולה לשיבוץ במשימות השונות. <br />* שדות חובה
      </p>

      {isLoading ? (
        <p>טוען נתונים...</p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className='form'>
          <label>
            שם פעולה *
            <input type='text' {...register('operationName')} />
            {errors.operationName && <span className='error'>{errors.operationName.message}</span>}
          </label>

          <label>
            עלות ליחידה (₪) *
            <input type='number' step='0.01' placeholder='₪ ליחידת מידה' {...register('costPerUnit')} />
            {errors.costPerUnit && <span className='error'>{errors.costPerUnit.message}</span>}
          </label>

          <label>
            יחידת מידה *
            <input type='text' placeholder='ק״ג, מ״ר, שעה עבודה וכו׳' {...register('unitDescription')} />
            {errors.unitDescription && <span className='error'>{errors.unitDescription.message}</span>}
          </label>

          <label>
            תאריך ביצוע *
            <Controller
              control={control}
              name='executionDate'
              render={({ field }) => (
                <DatePicker
                  {...field}
                  selected={field.value}
                  onChange={(date) => field.onChange(date)}
                  dateFormat='dd/MM/yyyy'
                  locale='he'
                  placeholderText='בחר תאריך (יום/חודש/שנה)'
                  className='custom-datepicker'
                />
              )}
            />
            {errors.executionDate && <span className='error'>{errors.executionDate.message}</span>}
          </label>

          <label>
            הערות
            <textarea {...register('executionNotes')} />
          </label>

          <div className='buttons'>
            <button type='submit'>💾 שמור שינויים</button>
            <button type='button' onClick={() => navigate('/operations')}>
              בטל
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
