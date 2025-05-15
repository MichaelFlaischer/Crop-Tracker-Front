import { useState } from 'react'
import { userService } from '../services/user.service.js'

export function LoginForm({ onLogin, isSignup }) {
  const [credentials, setCredentials] = useState(userService.getEmptyCredentials())

  function handleChange({ target }) {
    const { name: field, value } = target
    setCredentials((prevState) => ({ ...prevState, [field]: value }))
  }

  function handleSubmit(ev) {
    ev.preventDefault()
    onLogin(credentials)
  }

  const { fullname, username, password } = credentials

  return (
    <form className='form flex' onSubmit={handleSubmit} autoComplete='on' dir='rtl'>
      <input type='text' name='username' value={username} placeholder='שם עובד' onChange={handleChange} required autoFocus autoComplete='username' />

      <input type='password' name='password' value={password} placeholder='סיסמה' onChange={handleChange} required autoComplete='current-password' />

      {isSignup && <input type='text' name='fullname' value={fullname} placeholder='שם מלא' onChange={handleChange} required autoComplete='name' />}

      <button className='btn' type='submit'>
        {isSignup ? 'הרשמה' : 'כניסה'}
      </button>
    </form>
  )
}
