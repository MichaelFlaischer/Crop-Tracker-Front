import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service.js'
import { login } from '../store/actions/user.actions.js'
import { LoginForm } from './LoginForm.jsx'

export function LoginSignup() {
  async function onLogin(credentials) {
    try {
      await login(credentials)
      showSuccessMsg('Logged in successfully')
    } catch (error) {
      showErrorMsg('Oops try again', error)
    }
  }

  return (
    <section className='login'>
      <LoginForm onLogin={onLogin} isSignup={false} />
    </section>
  )
}
