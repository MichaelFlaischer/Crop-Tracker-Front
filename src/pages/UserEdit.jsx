import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { useNavigate, useParams } from 'react-router-dom'
import { userService } from '../services/user.service'
import { roleService } from '../services/role.service'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service'
import * as yup from 'yup'

import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { registerLocale } from 'react-datepicker'
import he from 'date-fns/locale/he'
registerLocale('he', he)

const schema = yup.object().shape({
  fullName: yup.string().required('יש להזין שם מלא'),
  username: yup.string().required('יש להזין שם משתמש'),
  email: yup.string().email('אימייל לא תקין').optional(),
  phoneNumber: yup
    .string()
    .matches(/^05\d{8}$/, 'מספר טלפון לא תקין')
    .optional(),
  startDate: yup.date().typeError('יש להזין תאריך תקין').nullable(),
  salary: yup.number().typeError('יש להזין מספר').min(0, 'שכר לא יכול להיות שלילי').optional(),
  address: yup.string().optional(),
  roleId: yup.string().required('יש לבחור תפקיד'),
  roleName: yup.string().required('שם תפקיד נדרש'),
  isAdmin: yup.boolean().default(false),
  status: yup.string().oneOf(['Active', 'Inactive']),
  Changepassword: yup.boolean().default(false),
  password: yup.string().when('Changepassword', {
    is: true,
    then: (schema) => schema.required('יש להזין סיסמה חדשה').min(6, 'לפחות 6 תווים'),
    otherwise: (schema) => schema.optional().strip(),
  }),
})

export function UserEdit() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [roles, setRoles] = useState([])
  const [ispasswordEditable, setIspasswordEditable] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      Changepassword: false,
      startDate: null,
      isAdmin: false,
    },
    shouldUnregister: true,
  })

  const isAdmin = watch('isAdmin')

  useEffect(() => {
    loadUser()
    loadRoles()
  }, [])

  async function loadUser() {
    try {
      const userFromServer = await userService.getById(userId)
      const formUser = {
        fullName: userFromServer.fullName || '',
        username: userFromServer.username || '',
        email: userFromServer.email || '',
        phoneNumber: userFromServer.phoneNumber || '',
        startDate: userFromServer.startDate ? new Date(userFromServer.startDate) : null,
        salary: userFromServer.salary || '',
        address: userFromServer.address || '',
        roleId: userFromServer.roleId || '',
        roleName: userFromServer.roleName || '',
        isAdmin: !!userFromServer.isAdmin,
        status: userFromServer.status || 'Active',
        password: '',
        Changepassword: false,
      }

      reset(formUser)
    } catch (err) {
      showErrorMsg('שגיאה בטעינת העובד')
    }
  }

  async function loadRoles() {
    try {
      const rolesFromServer = await roleService.query()
      setRoles(rolesFromServer)
    } catch (err) {
      showErrorMsg('שגיאה בטעינת התפקידים')
    }
  }

  async function onSave(formValues) {
    try {
      const userToSend = {
        ...formValues,
        _id: userId,
        salary: +formValues.salary,
        roleId: formValues.roleId,
      }

      delete userToSend.Changepassword
      if (!formValues.Changepassword) delete userToSend.password

      await userService.update(userToSend)
      showSuccessMsg('העובד עודכן בהצלחה')
      navigate('/user')
    } catch (err) {
      showErrorMsg('שגיאה בעדכון העובד')
    }
  }

  return (
    <section className='user-edit'>
      <h2>עריכת עובד</h2>
      <form onSubmit={handleSubmit(onSave)} className='user-form'>
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
            selected={watch('startDate')}
            onChange={(date) => setValue('startDate', date)}
            dateFormat='dd/MM/yyyy'
            placeholderText='בחר תאריך'
            className='datepicker-input'
            locale='he'
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
              const selectedRole = roles.find((role) => role._id === selectedId || role.RoleID === selectedId)
              if (selectedRole) {
                setValue('roleId', selectedRole.RoleID || selectedRole._id)
                setValue('roleName', selectedRole.roleName)
                setValue('isAdmin', !!selectedRole.isAdmin)
              }
            }}
          >
            {watch('roleId') && !roles.find((r) => r.RoleID === watch('roleId') || r._id === watch('roleId')) && (
              <option value={watch('roleId')}>{watch('roleName')}</option>
            )}
            {roles.map((role) => (
              <option key={role._id} value={role.RoleID || role._id}>
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
          <span>{isAdmin ? 'כן' : 'לא'}</span>
        </label>

        <label className='password-toggle'>
          <span>
            שינוי סיסמה:
            <input type='checkbox' {...register('Changepassword')} onChange={(e) => setIspasswordEditable(e.target.checked)} />
          </span>
          <input type='password' {...register('password')} placeholder='סיסמה חדשה' disabled={!ispasswordEditable} />
          {errors.password && <span>{errors.password.message}</span>}
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
