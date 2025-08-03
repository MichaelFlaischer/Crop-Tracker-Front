import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { clientService } from '../services/client.service.js'
import { Loader } from '../cmps/Loader.jsx'

export function ClientEdit() {
  const [client, setClient] = useState(null)
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const { clientId } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    loadClient()
  }, [])

  async function loadClient() {
    setIsLoading(true)
    try {
      const data = await clientService.getById(clientId)
      if (!data) {
        console.error('לקוח לא נמצא')
        navigate('/client')
      } else {
        setClient(data)
      }
    } catch (err) {
      console.error('שגיאה בטעינת לקוח:', err)
    } finally {
      setIsLoading(false)
    }
  }

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
      await clientService.update(client._id, client)
      navigate('/client')
    } catch (err) {
      console.error('שגיאה בעדכון לקוח:', err)
    }
  }

  if (isLoading) return <Loader />
  if (!client) return <div>טוען נתונים...</div>

  return (
    <section className='client-form'>
      <h1>✏️ עריכת לקוח</h1>
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
          טלפון ליצירת קשר:
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
