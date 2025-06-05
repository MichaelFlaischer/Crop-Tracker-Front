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
                    <span className='non-clickable'>👷 ניהול עובדים</span>
                    <ul className='dropdown'>
                      <li>
                        <span className='non-clickable'>עובדים</span>
                        <ul className='dropdown'>
                          <li>
                            <NavLink to='/user'>רשימת עובדים</NavLink>
                          </li>
                          <li>
                            <NavLink to='/users/add'>➕ הוספת עובד חדש</NavLink>
                          </li>
                        </ul>
                      </li>
                      <li>
                        <span className='non-clickable'>תפקידים</span>
                        <ul className='dropdown'>
                          <li>
                            <NavLink to='/roles'>רשימת תפקידים</NavLink>
                          </li>
                          <li>
                            <NavLink to='/roles/add'>➕ הוספת תפקיד</NavLink>
                          </li>
                        </ul>
                      </li>
                    </ul>
                  </li>
                )}

                <li>
                  <span className='non-clickable'>🌾 ניהול חקלאי</span>
                  <ul className='dropdown'>
                    <li>
                      <span className='non-clickable'>חלקות גידול</span>
                      <ul className='dropdown'>
                        <li>
                          <NavLink to='/field'>רשימת חלקות גידול</NavLink>
                        </li>
                        {isAdmin && (
                          <li>
                            <NavLink to='/field/add'>➕ הוספת חלקה חדשה</NavLink>
                          </li>
                        )}
                      </ul>
                    </li>
                    <li>
                      <span className='non-clickable'>סוגי יבול</span>
                      <ul className='dropdown'>
                        <li>
                          <NavLink to='/crop'>רשימת סוגי יבול</NavLink>
                        </li>
                        {isAdmin && (
                          <li>
                            <NavLink to='/crop/add'>➕ הוספת סוג יבול</NavLink>
                          </li>
                        )}
                      </ul>
                    </li>
                    <li>
                      <span className='non-clickable'>מחסני מלאי</span>
                      <ul className='dropdown'>
                        <li>
                          <NavLink to='/Warehouse'>רשימת מחסני מלאי</NavLink>
                        </li>
                        {isAdmin && (
                          <li>
                            <NavLink to='/warehouse/add'>➕ הוספת מחסן</NavLink>
                          </li>
                        )}
                      </ul>
                    </li>
                    <li>
                      <span className='non-clickable'>עונות חקלאיות</span>
                      <ul className='dropdown'>
                        <li>
                          <NavLink to='/seasons'>תצוגת עונות</NavLink>
                        </li>
                      </ul>
                    </li>
                  </ul>
                </li>

                <li>
                  <span className='non-clickable'>📋 משימות</span>
                  <ul className='dropdown'>
                    <li>
                      <NavLink to='/tasks/assign'>המשימות שלי</NavLink>
                    </li>

                    {isAdmin && (
                      <>
                        <li>
                          <span className='non-clickable'>ניהול משימות</span>
                          <ul className='dropdown'>
                            <li>
                              <NavLink to='/tasks/'>צפייה בכל המשימות</NavLink>
                            </li>
                            <li>
                              <NavLink to='/tasks/add'>➕ הוספת משימה חדשה</NavLink>
                            </li>
                          </ul>
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
                    <span className='non-clickable'>🚛 משלוחים ושיווק</span>
                    <ul className='dropdown'>
                      <li>
                        <span className='non-clickable'>לקוחות</span>
                        <ul className='dropdown'>
                          <li>
                            <NavLink to='/client'>רשימת לקוחות</NavLink>
                          </li>
                          <li>
                            <NavLink to='/client/add'>➕ הוספת לקוח</NavLink>
                          </li>
                        </ul>
                      </li>

                      <li>
                        <span className='non-clickable'>הזמנות</span>
                        <ul className='dropdown'>
                          <li>
                            <NavLink to='/orders/view'>צפייה בהזמנות</NavLink>
                          </li>
                          <li>
                            <NavLink to='/order/add'>📝 הזמנה חדשה</NavLink>
                          </li>
                        </ul>
                      </li>
                    </ul>
                  </li>
                )}

                <li>
                  <span className='non-clickable'>📊 דוחות וניתוחים</span>
                  <ul className='dropdown'>
                    {isAdmin && (
                      <>
                        <li>
                          <NavLink to='/reports'>סקירה כללית</NavLink>
                        </li>

                        <li>
                          <span className='non-clickable'>דוחות מערכת</span>
                          <ul className='dropdown'>
                            <li>
                              <NavLink to='/reports/inventory-history'>היסטוריית מלאי</NavLink>
                            </li>
                            <li>
                              <NavLink to='/reports/customer-order-history'>היסטוריית הזמנות לקוח</NavLink>
                            </li>
                            <li>
                              <NavLink to='/reports/crop-price-history'>היסטוריית מחירי יבול</NavLink>
                            </li>
                            <li>
                              <NavLink to='/reports/employee-task-history'>היסטוריית משימות עובדים</NavLink>
                            </li>
                          </ul>
                        </li>

                        <li>
                          <span className='non-clickable'>תובנות תומכות החלטה (DSS)</span>
                          <ul className='dropdown'>
                            <li>
                              <NavLink to='/reports/weather'>מזג אוויר והמלצות גידול</NavLink>
                            </li>
                            <li>
                              <NavLink to='/inventory'>צפייה במלאי והמלצות</NavLink>
                            </li>
                            <li>
                              <NavLink to='/dashboarddss'>לוח תובנות חקלאיות</NavLink>
                            </li>
                          </ul>
                        </li>
                      </>
                    )}
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
