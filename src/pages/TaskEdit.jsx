import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { registerLocale } from 'react-datepicker'
import he from 'date-fns/locale/he'

import { taskService } from '../services/task.service.js'
import { fieldService } from '../services/field.service.js'
import { operationService } from '../services/operation.service.js'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service.js'

registerLocale('he', he)

const schema = yup.object().shape({
  taskDescription: yup.string().required('יש להזין תיאור פעולה'),
  fieldId: yup.string().required('יש לבחור שדה'),
  operationId: yup.string().required('יש לבחור פעולה'),
  startDate: yup.date().required('יש להזין תאריך התחלה'),
  endDate: yup.date().min(yup.ref('startDate'), 'תאריך הסיום חייב להיות אחרי התחלה').required('יש להזין תאריך סיום'),
  startTime: yup.string().required('יש להזין שעת התחלה'),
  endTime: yup.string().required('יש להזין שעת סיום'),
  requiredEmployees: yup.number().required('יש להזין כמות עובדים נדרשת').min(1, 'לפחות עובד אחד נדרש'),
  status: yup.string().required('יש לבחור סטטוס'),
  notes: yup.string(),
})

export function TaskEdit() {
  const { taskId } = useParams()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [fields, setFields] = useState([])
  const [operations, setOperations] = useState([])

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

  const startDate = watch('startDate')
  const endDate = watch('endDate')

  useEffect(() => {
    loadFormData()
  }, [])

  async function loadFormData() {
    try {
      const [task, fields, operations] = await Promise.all([taskService.getById(taskId), fieldService.query(), operationService.query()])

      if (!task) throw new Error('לא נמצאה משימה')

      setFields(fields)
      setOperations(operations)

      reset({
        ...task,
        startDate: task.startDate ? new Date(task.startDate) : null,
        endDate: task.endDate ? new Date(task.endDate) : null,
      })
    } catch (err) {
      console.error('שגיאה בטעינת משימה:', err)
      showErrorMsg('שגיאה בטעינת הנתונים')
    } finally {
      setIsLoading(false)
    }
  }

  async function onSubmit(data) {
    try {
      await taskService.update(taskId, data)
      showSuccessMsg('המשימה עודכנה בהצלחה')
      navigate('/tasks')
    } catch (err) {
      console.error('שגיאה בעדכון משימה:', err)
      showErrorMsg('שגיאה בעדכון משימה')
    }
  }

  return (
    <section className='task-edit main-layout'>
      <h1>עריכת משימה</h1>
      {isLoading ? (
        <p>טוען...</p>
      ) : (
        <form className='form' onSubmit={handleSubmit(onSubmit)}>
          <label>
            תיאור פעולה
            <input type='text' {...register('taskDescription')} />
            {errors.taskDescription && <span className='error'>{errors.taskDescription.message}</span>}
          </label>

          <label>
            חלקה
            <select {...register('fieldId')}>
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
              {operations.map((op) => (
                <option key={op._id} value={op._id}>
                  {op.operationName}
                </option>
              ))}
            </select>
            {errors.operationId && <span className='error'>{errors.operationId.message}</span>}
          </label>

          <label>
            תאריך התחלה
            <DatePicker
              selected={startDate}
              onChange={(date) => setValue('startDate', date)}
              dateFormat='dd/MM/yyyy'
              locale='he'
              className='date-input'
              placeholderText='בחר תאריך התחלה'
            />
            {errors.startDate && <span className='error'>{errors.startDate.message}</span>}
          </label>

          <label>
            שעת התחלה
            <input type='time' {...register('startTime')} />
            {errors.startTime && <span className='error'>{errors.startTime.message}</span>}
          </label>

          <label>
            תאריך סיום
            <DatePicker
              selected={endDate}
              onChange={(date) => setValue('endDate', date)}
              dateFormat='dd/MM/yyyy'
              locale='he'
              className='date-input'
              placeholderText='בחר תאריך סיום'
            />
            {errors.endDate && <span className='error'>{errors.endDate.message}</span>}
          </label>

          <label>
            שעת סיום
            <input type='time' {...register('endTime')} />
            {errors.endTime && <span className='error'>{errors.endTime.message}</span>}
          </label>

          <label>
            מספר עובדים נדרש
            <input type='number' {...register('requiredEmployees')} />
            {errors.requiredEmployees && <span className='error'>{errors.requiredEmployees.message}</span>}
          </label>

          <label>
            סטטוס
            <select {...register('status')}>
              <option value='pending'>בהמתנה</option>
              <option value='in-progress'>בתהליך</option>
              <option value='done'>הושלמה</option>
              <option value='delayed'>נדחתה</option>
              <option value='missed'>לא בוצעה</option>
            </select>
            {errors.status && <span className='error'>{errors.status.message}</span>}
          </label>

          <label>
            הערות למשימה
            <textarea {...register('notes')} />
          </label>

          <div className='actions'>
            <button type='submit'>💾 שמור שינויים</button>
            <button type='button' className='btn-cancel' onClick={() => navigate('/tasks')}>
              ❌ ביטול
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
