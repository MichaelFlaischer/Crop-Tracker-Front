import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { useNavigate, useParams } from 'react-router-dom'
import { userService } from '../services/user.service'
import { roleService } from '../services/role.service'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service'
import * as yup from 'yup'

const schema = yup.object().shape({
  FullName: yup.string().required('יש להזין שם מלא'),
  Username: yup.string().required('יש להזין שם עובד'),
  Email: yup.string().email('אימייל לא תקין').optional(),
  PhoneNumber: yup
    .string()
    .matches(/^05\d{8}$/, 'מספר טלפון לא תקין')
    .optional(),
  StartDate: yup.date().typeError('יש להזין תאריך תקין').optional(),
  Salary: yup.number().typeError('יש להזין מספר').min(0, 'שכר לא יכול להיות שלילי').optional(),
  Address: yup.string().optional(),
  RoleID: yup.number().required('יש לבחור תפקיד'),
  RoleName: yup.string().required('שם תפקיד נדרש'),
  isAdmin: yup.string().oneOf(['true', 'false']),
  Status: yup.string().oneOf(['Active', 'Inactive']),
  ChangePassword: yup.boolean().default(false),
  Password: yup.string().when('ChangePassword', {
    is: true,
    then: (schema) => schema.required('יש להזין סיסמה חדשה').min(6, 'לפחות 6 תווים'),
    otherwise: (schema) => schema.optional().strip(),
  }),
})

export function UserEdit() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [roles, setRoles] = useState([])
  const [isPasswordEditable, setIsPasswordEditable] = useState(false)

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
      ChangePassword: false,
    },
  })

  useEffect(() => {
    loadUser()
    loadRoles()
  }, [])

  async function loadUser() {
    try {
      const userFromServer = await userService.getById(userId)

      const formUser = {
        FullName: userFromServer.FullName || '',
        Username: userFromServer.Username || '',
        Email: userFromServer.Email || '',
        PhoneNumber: userFromServer.PhoneNumber || '',
        StartDate: userFromServer.StartDate ? new Date(userFromServer.StartDate).toISOString().split('T')[0] : '',
        Salary: userFromServer.Salary || '',
        Address: userFromServer.Address || '',
        RoleID: userFromServer.RoleID || 2,
        RoleName: userFromServer.RoleName || '',
        isAdmin: userFromServer.IsAdmin === true || userFromServer.IsAdmin === 'true' ? 'true' : 'false',
        Status: userFromServer.Status || 'Active',
        Password: '',
        ChangePassword: false,
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
        Salary: +formValues.Salary,
        RoleID: +formValues.RoleID,
        IsAdmin: formValues.isAdmin === 'true',
      }

      delete userToSend.ChangePassword
      delete userToSend.isAdmin
      if (!formValues.ChangePassword) delete userToSend.Password

      await userService.update(userToSend)
      showSuccessMsg('העובד עודכן בהצלחה')
      navigate('/user')
    } catch (err) {
      showErrorMsg('שגיאה בעדכון העובד')
    }
  }

  return (
    <section className='user-edit main-layout'>
      <h2>עריכת עובד</h2>
      <form onSubmit={handleSubmit(onSave)} className='user-form'>
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
            {/* אפשרות פתיחה על התפקיד הנוכחי */}
            {watch('RoleID') && !roles.find((r) => r.RoleID === +watch('RoleID')) && <option value={watch('RoleID')}>{watch('RoleName')}</option>}
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
          <input type='text' value={watch('isAdmin') === 'true' ? 'כן' : 'לא'} readOnly disabled />
        </label>

        <label className='password-toggle'>
          <span>
            שינוי סיסמה:
            <input type='checkbox' {...register('ChangePassword')} onChange={(e) => setIsPasswordEditable(e.target.checked)} />
          </span>
          <input type='password' {...register('Password')} placeholder='סיסמה חדשה' disabled={!isPasswordEditable} />
          {errors.Password && <span>{errors.Password.message}</span>}
        </label>

        {/* מוסתרים אך דרושים לשמירה */}
        <input type='hidden' {...register('RoleName')} />
        <input type='hidden' {...register('IsAdmin')} />

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
