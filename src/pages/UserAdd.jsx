import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useNavigate } from 'react-router-dom'
import { showSuccessMsg, showErrorMsg } from '../services/event-bus.service'
import { userService } from '../services/user.service'
import { roleService } from '../services/role.service'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { registerLocale } from 'react-datepicker'
import he from 'date-fns/locale/he'
registerLocale('he', he)

const schema = yup.object().shape({
  fullName: yup.string().required('יש להזין שם מלא'),
  username: yup.string().required('יש להזין שם משתמש'),
  password: yup.string().min(6, 'סיסמה חייבת להיות לפחות 6 תווים').required('יש להזין סיסמה'),
  email: yup.string().email('אימייל לא תקין').notRequired(),
  phoneNumber: yup
    .string()
    .matches(/^05\d{8}$/, 'מספר טלפון לא תקין')
    .notRequired(),
  startDate: yup.date().typeError('יש להזין תאריך תקין').notRequired(),
  salary: yup.number().typeError('יש להזין מספר').min(0, 'שכר לא יכול להיות שלילי').notRequired(),
  address: yup.string().notRequired(),
  roleId: yup.string().required('יש לבחור תפקיד'),
  roleName: yup.string().required('שם תפקיד נדרש'),
  isAdmin: yup.boolean().default(false),
  status: yup.string().oneOf(['Active', 'Inactive']),
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
      fullName: '',
      username: '',
      password: '',
      email: '',
      phoneNumber: '',
      startDate: '',
      salary: '',
      address: '',
      roleId: '',
      roleName: '',
      isAdmin: false,
      status: 'Active',
    },
  })

  useEffect(() => {
    loadRoles()
  }, [])

  async function loadRoles() {
    try {
      const rolesFromServer = await roleService.query()
      setRoles(rolesFromServer)

      const defaultRole = rolesFromServer[0]
      if (defaultRole) {
        setValue('roleId', defaultRole.roleId)
        setValue('roleName', defaultRole.roleName)
        setValue('isAdmin', !!defaultRole.isAdmin)
      }
    } catch (err) {
      showErrorMsg('שגיאה בטעינת התפקידים')
    }
  }

  async function onSubmit(user) {
    try {
      const userToSend = {
        fullName: user.fullName,
        username: user.username,
        password: user.password,
        email: user.email,
        phoneNumber: user.phoneNumber,
        startDate: user.startDate,
        salary: +user.salary,
        address: user.address,
        roleId: user.roleId,
        roleName: user.roleName,
        isAdmin: !!user.isAdmin,
        status: user.status,
      }

      await userService.add(userToSend)
      showSuccessMsg('העובד נוסף בהצלחה!')
      navigate('/user')
    } catch (err) {
      showErrorMsg('שגיאה בהוספת העובד')
    }
  }

  return (
    <section className='user-add'>
      <h2>הוספת עובד חדש</h2>
      <form onSubmit={handleSubmit(onSubmit)} className='user-form'>
        <label>
          שם מלא:
          <input {...register('fullName')} />
          {errors.fullName && <span>{errors.fullName.message}</span>}
        </label>

        <label>
          שם משתמש:
          <input {...register('username')} />
          {errors.username && <span>{errors.username.message}</span>}
        </label>

        <label>
          סיסמה:
          <input type='password' {...register('password')} />
          {errors.password && <span>{errors.password.message}</span>}
        </label>

        <label>
          אימייל:
          <input type='email' {...register('email')} />
          {errors.email && <span>{errors.email.message}</span>}
        </label>

        <label>
          טלפון:
          <input {...register('phoneNumber')} />
          {errors.phoneNumber && <span>{errors.phoneNumber.message}</span>}
        </label>

        <label>
          תאריך התחלה:
          <DatePicker
            selected={watch('startDate') ? new Date(watch('startDate')) : null}
            onChange={(date) => {
              const iso = date?.toISOString()
              setValue('startDate', iso)
            }}
            dateFormat='dd/MM/yyyy'
            placeholderText='בחר תאריך (יום/חודש/שנה)'
            locale='he'
            className='custom-datepicker'
          />
          {errors.startDate && <span>{errors.startDate.message}</span>}
        </label>

        <label>
          כתובת:
          <input {...register('address')} />
          {errors.address && <span>{errors.address.message}</span>}
        </label>

        <label>
          משכורת:
          <input type='number' {...register('salary')} />
          {errors.salary && <span>{errors.salary.message}</span>}
        </label>

        <label>
          תפקיד:
          <select
            {...register('roleId')}
            onChange={(e) => {
              const selectedId = e.target.value
              const selectedRole = roles.find((role) => role.roleId === selectedId)
              if (selectedRole) {
                setValue('roleId', selectedRole.roleId)
                setValue('roleName', selectedRole.roleName)
                setValue('isAdmin', !!selectedRole.isAdmin)
              }
            }}
          >
            {roles.map((role) => (
              <option key={role._id} value={role.roleId}>
                {role.roleName}
              </option>
            ))}
          </select>
          {errors.roleId && <span>{errors.roleId.message}</span>}
        </label>

        <label>
          סטטוס:
          <select {...register('status')}>
            <option value='Active'>פעיל</option>
            <option value='Inactive'>לא פעיל</option>
          </select>
          {errors.status && <span>{errors.status.message}</span>}
        </label>

        <label>
          האם תפקיד ניהולי:
          <span>{watch('isAdmin') ? 'כן' : 'לא'}</span>
        </label>

        <input type='hidden' {...register('roleName')} />
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
