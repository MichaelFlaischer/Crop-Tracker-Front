import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useNavigate } from 'react-router-dom'
import { showSuccessMsg, showErrorMsg } from '../services/event-bus.service'
import { userService } from '../services/user.service'
import { roleService } from '../services/role.service'

const schema = yup.object().shape({
  FullName: yup.string().required('יש להזין שם מלא'),
  Username: yup.string().required('יש להזין שם משתמש'),
  Password: yup.string().min(6, 'סיסמה חייבת להיות לפחות 6 תווים').required('יש להזין סיסמה'),
  Email: yup.string().email('אימייל לא תקין').notRequired(),
  PhoneNumber: yup
    .string()
    .matches(/^05\d{8}$/, 'מספר טלפון לא תקין')
    .notRequired(),
  StartDate: yup.date().typeError('יש להזין תאריך תקין').notRequired(),
  Salary: yup.number().typeError('יש להזין מספר').min(0, 'שכר לא יכול להיות שלילי').notRequired(),
  Address: yup.string().notRequired(),
  RoleID: yup.number().required('יש לבחור תפקיד'),
  RoleName: yup.string().required('שם תפקיד נדרש'),
  isAdmin: yup.string().oneOf(['true', 'false']),
  Status: yup.string().oneOf(['Active', 'Inactive']),
})

export function UserAdd() {
  const navigate = useNavigate()
  const [roles, setRoles] = useState([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
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
      RoleName: '',
      isAdmin: 'false',
      Status: 'Active',
    },
  })

  useEffect(() => {
    loadRoles()
  }, [])

  async function loadRoles() {
    try {
      const rolesFromServer = await roleService.query()
      setRoles(rolesFromServer)

      // ברירת מחדל לפי התפקיד הראשון ברשימה
      const defaultRole = rolesFromServer.find((r) => r.RoleID === 2) || rolesFromServer[0]
      if (defaultRole) {
        setValue('RoleID', defaultRole.RoleID)
        setValue('RoleName', defaultRole.RoleName)
        setValue('isAdmin', defaultRole.IsAdmin ? 'true' : 'false')
      }
    } catch (err) {
      showErrorMsg('שגיאה בטעינת התפקידים')
    }
  }

  async function onSubmit(user) {
    try {
      user.Salary = +user.Salary
      user.RoleID = +user.RoleID

      const userToSend = {
        ...user,
        IsAdmin: user.isAdmin === 'true',
      }

      delete userToSend.isAdmin

      await userService.add(userToSend)
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
          שם משתמש:
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
          <select
            {...register('RoleID')}
            onChange={(e) => {
              const selectedId = +e.target.value
              const selectedRole = roles.find((role) => role.RoleID === selectedId)
              if (selectedRole) {
                setValue('RoleID', selectedRole.RoleID)
                setValue('RoleName', selectedRole.RoleName)
                setValue('isAdmin', selectedRole.IsAdmin ? 'true' : 'false')
              }
            }}
          >
            {roles.map((role) => (
              <option key={role._id} value={role.RoleID}>
                {role.RoleName}
              </option>
            ))}
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
          <span>{watch('isAdmin') === 'true' ? 'כן' : 'לא'}</span>
        </label>

        {/* מוסתרים אך דרושים לשמירה */}
        <input type='hidden' {...register('RoleName')} />
        <input type='hidden' {...register('isAdmin')} />

        <div className='form-actions'>
          <button type='submit' className='btn'>
            שמור
          </button>
          <button type='button' className='btn cancel-btn' onClick={() => navigate('/user')}>
            ביטול
          </button>
        </div>
      </form>
    </section>
  )
}
