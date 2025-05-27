import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clientService } from '../services/client.service.js'

export function ClientAdd() {
  const [client, setClient] = useState({
    customerName: '',
    contactPerson: '',
    phoneNumber: '',
    email: '',
    address: '',
    notes: '',
  })

  const [errors, setErrors] = useState({})
  const navigate = useNavigate()

  function handleChange({ target }) {
    const { name, value } = target
    setClient((prev) => ({ ...prev, [name]: value }))
  }

  function validate() {
    const errs = {}
    if (!client.customerName) errs.customerName = 'יש להזין שם לקוח'
    if (!client.email) errs.email = 'יש להזין אימייל'
    if (!client.phoneNumber) errs.phoneNumber = 'יש להזין טלפון'
    return errs
  }

  async function onSave(ev) {
    ev.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }

    try {
      await clientService.add(client)
      navigate('/client')
    } catch (err) {
      console.error('שגיאה בשמירת לקוח:', err)
    }
  }

  return (
    <section className='client-form'>
      <h1>➕ הוספת לקוח חדש</h1>
      <form onSubmit={onSave}>
        <label>
          שם לקוח:
          <input type='text' name='customerName' value={client.customerName} onChange={handleChange} />
          {errors.customerName && <span className='error'>{errors.customerName}</span>}
        </label>

        <label>
          איש קשר:
          <input type='text' name='contactPerson' value={client.contactPerson} onChange={handleChange} />
        </label>

        <label>
          טלפון:
          <input type='text' name='phoneNumber' value={client.phoneNumber} onChange={handleChange} />
          {errors.phoneNumber && <span className='error'>{errors.phoneNumber}</span>}
        </label>

        <label>
          אימייל:
          <input type='email' name='email' value={client.email} onChange={handleChange} />
          {errors.email && <span className='error'>{errors.email}</span>}
        </label>

        <label>
          כתובת:
          <input type='text' name='address' value={client.address} onChange={handleChange} />
        </label>

        <label>
          הערות:
          <textarea name='notes' value={client.notes} onChange={handleChange} />
        </label>

        <div className='actions'>
          <button type='submit'>💾 שמור</button>
          <button type='button' onClick={() => navigate('/client')}>
            ❌ ביטול
          </button>
        </div>
      </form>
    </section>
  )
}
