import { useState } from 'react'
import { userService } from '../services/user.service.js'

export function LoginForm({ onLogin, isSignup }) {
  const [credentials, setCredentials] = useState(userService.getEmptyCredentials())

  function handleChange({ target }) {
    const { name, value } = target
    setCredentials((prev) => ({ ...prev, [name]: value }))
  }

  function handleSubmit(ev) {
    ev.preventDefault()
    onLogin(credentials)
  }

  const { fullName, username, password } = credentials

  return (
    <form className='login-form' onSubmit={handleSubmit} dir='rtl'>
      <h2>{isSignup ? 'הרשמה למערכת' : 'התחברות למערכת'}</h2>

      <label>
        שם משתמש
        <input type='text' name='username' value={username} onChange={handleChange} required autoComplete='username' />
      </label>

      <label>
        סיסמה
        <input type='password' name='password' value={password} onChange={handleChange} required autoComplete='current-password' />
      </label>

      {isSignup && (
        <label>
          שם מלא
          <input type='text' name='fullName' value={fullName} onChange={handleChange} required autoComplete='name' />
        </label>
      )}

      <button className='btn-submit' type='submit'>
        {isSignup ? 'הרשמה' : 'כניסה'}
      </button>
    </form>
  )
}
