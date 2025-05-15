import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useNavigate } from 'react-router-dom'
import { showSuccessMsg, showErrorMsg } from '../services/event-bus.service'
import { userService } from '../services/user.service'

// סכמה לוולידציה
const schema = yup.object().shape({
  FullName: yup.string().required('יש להזין שם מלא'),
  Username: yup.string().required('יש להזין שם עובד'),
  Password: yup.string().min(6, 'סיסמה חייבת להיות לפחות 6 תווים').required('יש להזין סיסמה'),
  Email: yup.string().email('אימייל לא תקין').optional(),
  PhoneNumber: yup
    .string()
    .matches(/^05\d{8}$/, 'מספר טלפון לא תקין')
    .optional(),
  StartDate: yup.date().typeError('יש להזין תאריך תקין').optional(),
  Salary: yup.number().typeError('יש להזין מספר').min(0, 'שכר לא יכול להיות שלילי').optional(),
  Address: yup.string().optional(),
  RoleID: yup.number().oneOf([1, 2], 'ערך לא חוקי').required(),
  isAdmin: yup.string().oneOf(['true', 'false']),
  Status: yup.string().oneOf(['Active', 'Inactive']),
})

export function UserAdd() {
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      FullName: '',
      Username: '',
      Password: '',
      Email: '',
      PhoneNumber: '',
      StartDate: '',
      Salary: '',
      Address: '',
      RoleID: 2,
      isAdmin: 'false',
      Status: 'Active',
    },
  })

  async function onSubmit(user) {
    try {
      user.Salary = +user.Salary
      user.RoleID = +user.RoleID
      await userService.add(user)
      showSuccessMsg('העובד נוסף בהצלחה!')
      navigate('/user')
    } catch (err) {
      showErrorMsg('שגיאה בהוספת העובד')
    }
  }

  return (
    <section className='user-add main-layout'>
      <h2>הוספת עובד חדש</h2>
      <form onSubmit={handleSubmit(onSubmit)} className='user-form'>
        <label>
          שם מלא:
          <input {...register('FullName')} />
          {errors.FullName && <span>{errors.FullName.message}</span>}
        </label>

        <label>
          שם עובד:
          <input {...register('Username')} />
          {errors.Username && <span>{errors.Username.message}</span>}
        </label>

        <label>
          סיסמה:
          <input type='password' {...register('Password')} />
          {errors.Password && <span>{errors.Password.message}</span>}
        </label>

        <label>
          אימייל:
          <input type='email' {...register('Email')} />
          {errors.Email && <span>{errors.Email.message}</span>}
        </label>

        <label>
          טלפון:
          <input {...register('PhoneNumber')} />
          {errors.PhoneNumber && <span>{errors.PhoneNumber.message}</span>}
        </label>

        <label>
          תאריך התחלה:
          <input type='date' {...register('StartDate')} />
          {errors.StartDate && <span>{errors.StartDate.message}</span>}
        </label>

        <label>
          כתובת:
          <input {...register('Address')} />
          {errors.Address && <span>{errors.Address.message}</span>}
        </label>

        <label>
          משכורת:
          <input type='number' {...register('Salary')} />
          {errors.Salary && <span>{errors.Salary.message}</span>}
        </label>

        <label>
          תפקיד:
          <select {...register('RoleID')}>
            <option value={1}>מנהל</option>
            <option value={2}>עובד</option>
          </select>
          {errors.RoleID && <span>{errors.RoleID.message}</span>}
        </label>

        <label>
          סטטוס:
          <select {...register('Status')}>
            <option value='Active'>פעיל</option>
            <option value='Inactive'>לא פעיל</option>
          </select>
          {errors.Status && <span>{errors.Status.message}</span>}
        </label>

        <label>
          האם אדמין:
          <select {...register('isAdmin')}>
            <option value='true'>כן</option>
            <option value='false'>לא</option>
          </select>
          {errors.isAdmin && <span>{errors.isAdmin.message}</span>}
        </label>

        <button className='btn'>שמור</button>
      </form>
    </section>
  )
}
