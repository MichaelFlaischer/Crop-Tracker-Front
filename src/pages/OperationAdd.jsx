import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { operationService } from '../services/operation.service.js'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service.js'

const schema = yup.object().shape({
  operationName: yup.string().required('יש להזין שם פעולה'),
  costPerUnit: yup.number().required('יש להזין עלות').min(0, 'הערך חייב להיות חיובי'),
  unitDescription: yup.string().required('יש להזין יחידת מידה'),
  executionNotes: yup.string(),
})

export function OperationAdd() {
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onTouched',
  })

  async function onSubmit(data) {
    try {
      await operationService.save(data)
      showSuccessMsg('הפעולה נוספה בהצלחה 🎉')
      navigate('/operations')
    } catch (err) {
      console.error('שגיאה בהוספה', err)
      showErrorMsg('שגיאה בהוספת פעולה')
    }
  }

  return (
    <section className='operation-add main-layout'>
      <h1>הוספת פעולה חדשה</h1>
      <form onSubmit={handleSubmit(onSubmit)} className='form'>
        <label>
          שם פעולה *
          <input type='text' {...register('operationName')} />
          {errors.operationName && <span className='error'>{errors.operationName.message}</span>}
        </label>

        <label>
          עלות ליחידה *
          <input type='number' step='0.01' {...register('costPerUnit')} />
          {errors.costPerUnit && <span className='error'>{errors.costPerUnit.message}</span>}
        </label>

        <label>
          יחידת מידה *
          <input type='text' {...register('unitDescription')} />
          {errors.unitDescription && <span className='error'>{errors.unitDescription.message}</span>}
        </label>

        <label>
          הערות
          <textarea {...register('executionNotes')} />
        </label>

        <div className='buttons'>
          <button type='submit'>💾 שמור פעולה</button>
          <button type='button' onClick={() => navigate('/operations')}>
            בטל
          </button>
        </div>
      </form>
    </section>
  )
}
