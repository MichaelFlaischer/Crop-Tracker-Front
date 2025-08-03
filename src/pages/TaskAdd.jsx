import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useNavigate, useSearchParams } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { registerLocale } from 'react-datepicker'
import he from 'date-fns/locale/he'

import { taskService } from '../services/task.service.js'
import { fieldService } from '../services/field.service.js'
import { operationService } from '../services/operation.service.js'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service.js'
import { Loader } from '../cmps/Loader.jsx'

registerLocale('he', he)

const DELIVERY_TASK_OPERATION_ID = '68354fa1d29fa199e95c04d8'

const schema = yup.object().shape({
  taskDescription: yup.string().required('יש להזין תיאור פעולה'),
  fieldId: yup.string().required('יש לבחור חלקה'),
  operationId: yup.string().required('יש לבחור פעולה'),
  startDate: yup.date().required('יש להזין תאריך התחלה'),
  endDate: yup.date().min(yup.ref('startDate'), 'תאריך הסיום חייב להיות אחרי ההתחלה').required('יש להזין תאריך סיום'),
  startTime: yup.string().required('יש להזין שעת התחלה'),
  endTime: yup.string().required('יש להזין שעת סיום'),
  requiredEmployees: yup.number().typeError('יש להזין מספר').min(1, 'לפחות עובד אחד נדרש'),
  notes: yup.string(),
})

export function TaskAdd() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fieldIdFromUrl = searchParams.get('fieldId') || ''

  const [fields, setFields] = useState([])
  const [operations, setOperations] = useState([])
  const [isReady, setIsReady] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      taskDescription: '',
      fieldId: '',
      operationId: '',
      startDate: null,
      endDate: null,
      startTime: '',
      endTime: '',
      requiredEmployees: '',
      notes: '',
    },
  })

  useEffect(() => {
    loadFormOptions()
  }, [])

  useEffect(() => {
    if (!isReady) return

    const fieldExists = fields.some((f) => f._id.toString() === fieldIdFromUrl)

    reset({
      taskDescription: '',
      fieldId: fieldExists ? fieldIdFromUrl : '',
      operationId: '',
      startDate: null,
      endDate: null,
      startTime: '',
      endTime: '',
      requiredEmployees: '',
      notes: '',
    })
  }, [isReady, fields, fieldIdFromUrl, reset])

  async function loadFormOptions() {
    try {
      const [fields, operations] = await Promise.all([fieldService.query(), operationService.query()])
      setFields(fields)
      setOperations(operations)
      setIsReady(true)
    } catch (err) {
      console.error('שגיאה בטעינת חלקות/פעולות:', err)
      showErrorMsg('שגיאה בטעינת חלקות או פעולות')
    } finally {
      setIsLoading(false)
    }
  }

  async function onSubmit(data) {
    try {
      await taskService.add({ ...data, status: 'in-progress', comments: '' })
      showSuccessMsg('המשימה נוספה בהצלחה 🎉')
      navigate('/tasks')
    } catch (err) {
      console.error('שגיאה בהוספת משימה:', err)
      showErrorMsg('שגיאה בהוספת משימה')
    }
  }

  if (isLoading) return <Loader />

  return (
    <section className='task-add'>
      <h1>הוספת משימה חדשה</h1>
      <form className='form styled-form' onSubmit={handleSubmit(onSubmit)}>
        <label>
          תיאור פעולה
          <input type='text' {...register('taskDescription')} />
          {errors.taskDescription && <span className='error'>{errors.taskDescription.message}</span>}
        </label>

        <label>
          חלקה
          <select {...register('fieldId')} disabled={!!fieldIdFromUrl}>
            <option value=''>בחר חלקה</option>
            {fields.map((f) => (
              <option key={f._id} value={f._id}>
                {f.fieldName}
              </option>
            ))}
          </select>
          {errors.fieldId && <span className='error'>{errors.fieldId.message}</span>}
        </label>

        <label>
          פעולה
          <select {...register('operationId')}>
            <option value=''>בחר פעולה</option>
            {operations
              .filter((op) => op._id !== DELIVERY_TASK_OPERATION_ID)
              .map((op) => (
                <option key={op._id} value={op._id}>
                  {op.operationName}
                </option>
              ))}
          </select>
          {errors.operationId && <span className='error'>{errors.operationId.message}</span>}
        </label>

        <label>
          תאריך התחלה
          <Controller
            control={control}
            name='startDate'
            render={({ field }) => (
              <DatePicker
                placeholderText='בחר תאריך התחלה'
                dateFormat='dd/MM/yyyy'
                locale='he'
                className='custom-datepicker'
                {...field}
                selected={field.value ? new Date(field.value) : null}
              />
            )}
          />
          {errors.startDate && <span className='error'>{errors.startDate.message}</span>}
        </label>

        <label>
          שעת התחלה
          <input type='time' placeholder='08:00' {...register('startTime')} />
          {errors.startTime && <span className='error'>{errors.startTime.message}</span>}
        </label>

        <label>
          תאריך סיום
          <Controller
            control={control}
            name='endDate'
            render={({ field }) => (
              <DatePicker
                placeholderText='בחר תאריך סיום'
                dateFormat='dd/MM/yyyy'
                locale='he'
                className='custom-datepicker'
                {...field}
                selected={field.value ? new Date(field.value) : null}
              />
            )}
          />
          {errors.endDate && <span className='error'>{errors.endDate.message}</span>}
        </label>

        <label>
          שעת סיום
          <input type='time' placeholder='16:00' {...register('endTime')} />
          {errors.endTime && <span className='error'>{errors.endTime.message}</span>}
        </label>

        <label>
          כמות עובדים נדרשת
          <input type='number' {...register('requiredEmployees')} />
          {errors.requiredEmployees && <span className='error'>{errors.requiredEmployees.message}</span>}
        </label>

        <label>
          הערות לביצוע המשימה
          <textarea {...register('notes')} />
        </label>

        <div className='actions'>
          <button type='submit'>💾 שמור משימה</button>
          <button type='button' className='btn-cancel' onClick={() => navigate('/tasks')}>
            ❌ ביטול
          </button>
        </div>
      </form>
    </section>
  )
}
