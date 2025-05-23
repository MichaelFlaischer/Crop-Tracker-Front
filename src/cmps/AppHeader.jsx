import { NavLink } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service'
import { logout } from '../store/actions/user.actions'
import { LoginSignup } from './LoginSignup'

export function AppHeader() {
  const user = useSelector((storeState) => storeState.userModule.loggedInUser)
  const isAdmin = user?.IsAdmin

  async function onLogout() {
    try {
      await logout()
      showSuccessMsg('להתראות!')
    } catch (error) {
      showErrorMsg('שגיאה ביציאה מהמערכת', error)
    }
  }

  return (
    <section className='app-header full'>
      <section className='nav-wrapper flex justify-between align-center'>
        <nav role='navigation'>
          <ul>
            <li>
              <NavLink to='/'>בית</NavLink>
            </li>

            {user && (
              <>
                {isAdmin && (
                  <li>
                    <span className='non-clickable'>ניהול עובדים</span>
                    <ul className='dropdown'>
                      <li>
                        <NavLink to='/user'>רשימת עובדים</NavLink>
                      </li>
                      <li>
                        <NavLink to='/users/add'>הוספת עובד</NavLink>
                      </li>
                      <li>
                        <NavLink to='/roles'>רשימת תפקידים</NavLink>
                      </li>
                      <li>
                        <NavLink to='/roles/add'>הוספת תפקיד</NavLink>
                      </li>
                    </ul>
                  </li>
                )}

                <li>
                  <span className='non-clickable'>🌾 ניהול חקלאי</span>
                  <ul className='dropdown'>
                    <li>
                      <span className='non-clickable'>שדות</span>
                      <ul className='dropdown'>
                        <li>
                          <NavLink to='/field'>תצוגת שדות</NavLink>
                        </li>
                        {isAdmin && (
                          <li>
                            <NavLink to='/field/add'>➕ הוספת שדה</NavLink>
                          </li>
                        )}
                      </ul>
                    </li>
                    <li>
                      <span className='non-clickable'>יבולים</span>
                      <ul className='dropdown'>
                        <li>
                          <NavLink to='/crop'>תצוגת יבולים</NavLink>
                        </li>
                        {isAdmin && (
                          <li>
                            <NavLink to='/crop/add'>➕ הוספת יבול</NavLink>
                          </li>
                        )}
                      </ul>
                    </li>
                    <li>
                      <span className='non-clickable'>מחסנים</span>
                      <ul className='dropdown'>
                        <li>
                          <NavLink to='/Warehouse'>תצוגת מחסנים</NavLink>
                        </li>
                        {isAdmin && (
                          <li>
                            <NavLink to='/warehouse/add'>➕ הוספת מחסן</NavLink>
                          </li>
                        )}
                      </ul>
                    </li>
                    <li>
                      <span className='non-clickable'>מלאי</span>
                      <ul className='dropdown'>
                        <li>
                          <NavLink to='/inventory'>צפייה במלאי</NavLink>
                        </li>
                      </ul>
                    </li>
                  </ul>
                </li>

                <li>
                  <span className='non-clickable'>משימות</span>
                  <ul className='dropdown'>
                    <li>
                      <NavLink to='/task/assign'>המשימות שלי</NavLink>
                    </li>
                    {isAdmin && (
                      <>
                        <li>
                          <NavLink to='/field/actions'>תיעוד פעולות</NavLink>
                        </li>
                        <li>
                          <NavLink to='/task/assign'>שיבוץ משימות</NavLink>
                        </li>
                        <li>
                          <span className='non-clickable'>ניהול פעולות</span>
                          <ul className='dropdown'>
                            <li>
                              <NavLink to='/operations'>רשימת פעולות</NavLink>
                            </li>
                            <li>
                              <NavLink to='/operations/add'>➕ הוספת פעולה חדשה</NavLink>
                            </li>
                          </ul>
                        </li>
                      </>
                    )}
                  </ul>
                </li>

                {isAdmin && (
                  <li>
                    <span className='non-clickable'>משלוחים ושיווק</span>
                    <ul className='dropdown'>
                      <li>
                        <NavLink to='/client'>רשימת לקוחות</NavLink>
                      </li>
                      <li>
                        <NavLink to='/client/add'>הוספת לקוח</NavLink>
                      </li>
                      <li>
                        <NavLink to='/orders/view'>צפייה בהזמנות</NavLink>
                      </li>
                      <li>
                        <NavLink to='/order/add'>הזמנה חדשה</NavLink>
                      </li>
                      <li>
                        <NavLink to='/truck/add'>הוספת משאית</NavLink>
                      </li>
                      <li>
                        <NavLink to='/delivery/assign'>שיבוץ משלוחים</NavLink>
                      </li>
                    </ul>
                  </li>
                )}

                <li>
                  <span className='non-clickable'>דוחות וניתוחים</span>
                  <ul className='dropdown'>
                    {isAdmin && (
                      <>
                        <li>
                          <NavLink to='/reports'>סקירה כללית</NavLink>
                        </li>
                        <li>
                          <NavLink to='/reports/inventory'>דוחות מלאי</NavLink>
                        </li>
                        <li>
                          <NavLink to='/reports/deliveries'>דוחות משלוחים</NavLink>
                        </li>
                        <li>
                          <NavLink to='/reports/crop-forecast'>תחזית גידול</NavLink>
                        </li>
                        <li>
                          <NavLink to='/reports/irrigation'>המלצות השקיה ודישון</NavLink>
                        </li>
                        <li>
                          <NavLink to='/reports/insights'>גרפים ותובנות</NavLink>
                        </li>
                        <li>
                          <NavLink to='/inventory/alerts'>התראות מלאי</NavLink>
                        </li>
                      </>
                    )}
                    <li>
                      <NavLink to='/reports/weather'>תחזית מזג אוויר</NavLink>
                    </li>
                  </ul>
                </li>
              </>
            )}

            <li>
              <NavLink to='/about'>אודות</NavLink>
            </li>
          </ul>
        </nav>
      </section>

      <section className='bottom flex justify-between'>
        <div className='logo'>Farm-ERP</div>
        <div className='user-section'>
          {user ? (
            <section>
              <span>שלום {user.FullName}</span>
              <button className='btn btn-logout' onClick={onLogout}>
                יציאה
              </button>
            </section>
          ) : (
            <LoginSignup />
          )}
        </div>
      </section>
    </section>
  )
}
