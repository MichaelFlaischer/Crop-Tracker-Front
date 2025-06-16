import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service'
import { logout } from '../store/actions/user.actions'
import { LoginSignup } from './LoginSignup'

export function AppHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
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
        <button className='mobile-menu-toggle' onClick={() => setIsMobileMenuOpen((prev) => !prev)}>
          ☰ תפריט
        </button>

        <nav role='navigation'>
          <ul className={isMobileMenuOpen ? 'open' : ''}>
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
                            <NavLink to='/user/add'>➕ הוספת עובד</NavLink>
                          </li>
                        </ul>
                      </li>
                      <li>
                        <span className='non-clickable'>ניהול תפקידים</span>
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
                      <span className='non-clickable'>חלקות לגידול יבולים</span>
                      <ul className='dropdown'>
                        <li>
                          <NavLink to='/field'>רשימת חלקות</NavLink>
                        </li>
                        {isAdmin && (
                          <li>
                            <NavLink to='/field/add'>➕ הוספת חלקה</NavLink>
                          </li>
                        )}
                      </ul>
                    </li>
                    <li>
                      <span className='non-clickable'>סוגי יבולים</span>
                      <ul className='dropdown'>
                        <li>
                          <NavLink to='/crop'>רשימת סוגי יבולים</NavLink>
                        </li>
                        {isAdmin && (
                          <li>
                            <NavLink to='/crop/add'>➕ הוספת סוג יבול</NavLink>
                          </li>
                        )}
                      </ul>
                    </li>
                    <li>
                      <span className='non-clickable'>ניהול מלאי ומחסנים</span>
                      <ul className='dropdown'>
                        <li>
                          <NavLink to='/Warehouse'>רשימת מחסנים</NavLink>
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
                          <NavLink to='/seasons'>רשימת עונות</NavLink>
                        </li>
                      </ul>
                    </li>
                  </ul>
                </li>

                <li>
                  <span className='non-clickable'>📋 משימות</span>
                  <ul className='dropdown'>
                    <li>
                      <NavLink to='/tasks/assign'>המשימות שלי (שיבוץ אישי)</NavLink>
                    </li>

                    {isAdmin && (
                      <>
                        <li>
                          <span className='non-clickable'>ניהול משימות</span>
                          <ul className='dropdown'>
                            <li>
                              <NavLink to='/tasks/'>רשימת משימות</NavLink>
                            </li>
                            <li>
                              <NavLink to='/tasks/add'>➕ הוספת משימה</NavLink>
                            </li>
                          </ul>
                        </li>
                        <li>
                          <span className='non-clickable'>ניהול פעולות</span>
                          <ul className='dropdown'>
                            <li>
                              <NavLink to='/operations'>רשימת פעולות חקלאיות</NavLink>
                            </li>
                            <li>
                              <NavLink to='/operations/add'>➕ הוספת פעולה</NavLink>
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
                            <NavLink to='/client'>לקוחות</NavLink>
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
                            <NavLink to='/orders/view'>הזמנות</NavLink>
                          </li>
                          <li>
                            <NavLink to='/order/add'>📝 הוספת הזמנה</NavLink>
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
                          <NavLink to='/reports'>דשבורד סקירה כללית</NavLink>
                        </li>

                        <li>
                          <span className='non-clickable'>דוחות מערכת</span>
                          <ul className='dropdown'>
                            <li>
                              <NavLink to='/reports/inventory-history'>היסטוריית מלאי במחסנים</NavLink>
                            </li>
                            <li>
                              <NavLink to='/reports/customer-order-history'>היסטוריית הזמנות לפי לקוח</NavLink>
                            </li>
                            <li>
                              <NavLink to='/reports/crop-price-history'>היסטוריית מחירי יבולים</NavLink>
                            </li>
                            <li>
                              <NavLink to='/reports/employee-task-history'>היסטוריית שיבוץ משימות</NavLink>
                            </li>
                            <li>
                              <NavLink to='/reports/SowingAndHarvestTimeline'>לוח זמנים לפעילות חקלאית</NavLink>
                            </li>
                            <li>
                              <NavLink to='/reports/CropSeasonSummary'>דוח קציר לפי עונה</NavLink>
                            </li>
                          </ul>
                        </li>

                        <li>
                          <span className='non-clickable'>תובנות תומכות החלטה (DSS)</span>
                          <ul className='dropdown'>
                            <li>
                              <NavLink to='/reports/weather'>מזג אוויר והמלצות לשתילה וקציר</NavLink>
                            </li>
                            <li>
                              <NavLink to='/weather-simulation'>סימולציית תנאי גידול ומזג אוויר</NavLink>
                            </li>
                            <li>
                              <NavLink to='/inventory'>מלאי והמלצות ניהול</NavLink>
                            </li>
                            <li>
                              <NavLink to='/dashboarddss'>דשבורד תובנות חקלאיות</NavLink>
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
        <div className='user-section'>
          {user ? (
            <section>
              <span>שלום, {user.FullName}</span>
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
