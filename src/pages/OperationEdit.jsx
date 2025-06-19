import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

import { operationService } from '../services/operation.service.js'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service.js'

const schema = yup.object().shape({
  operationName: yup.string().required('יש להזין שם פעולה'),
  costPerUnit: yup.number().typeError('יש להזין מספר').required('יש להזין עלות').min(0, 'הערך חייב להיות חיובי'),
  unitDescription: yup.string().required('יש להזין יחידת מידה'),
  executionNotes: yup.string(),
})

export function OperationEdit() {
  const { operationId } = useParams()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onTouched',
  })

  useEffect(() => {
    if (!operationId) {
      showErrorMsg('מזהה פעולה חסר')
      navigate('/operations')
      return
    }
    loadOperation()
  }, [operationId])

  async function loadOperation() {
    try {
      const operation = await operationService.getById(operationId)
      if (!operation) throw new Error('פעולה לא נמצאה')

      reset({
        ...operation,
        costPerUnit: Number(operation.costPerUnit),
      })
    } catch (err) {
      console.error(err)
      showErrorMsg('שגיאה בטעינת פעולה לעריכה')
    } finally {
      setIsLoading(false)
    }
  }

  async function onSubmit(data) {
    setIsSubmitting(true)
    try {
      await operationService.save({ ...data, _id: operationId })
      showSuccessMsg('הפעולה עודכנה בהצלחה')
      navigate('/operations')
    } catch (err) {
      console.error(err)
      showErrorMsg('שגיאה בעדכון פעולה')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className='operation-edit'>
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
            הערות
            <textarea {...register('executionNotes')} />
          </label>

          <div className='buttons'>
            <button type='submit' disabled={isSubmitting}>
              💾 שמור שינויים
            </button>
            <button type='button' onClick={() => navigate('/operations')} disabled={isSubmitting}>
              בטל
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
