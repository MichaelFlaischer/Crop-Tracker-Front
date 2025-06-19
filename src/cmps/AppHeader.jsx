import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service'
import { logout } from '../store/actions/user.actions'
import { LoginSignup } from './LoginSignup'

export function AppHeader() {
  const user = useSelector((storeState) => storeState.userModule.loggedInUser)
  const isAdmin = user?.isAdmin
  const location = useLocation()

  const [openMenus, setOpenMenus] = useState([])
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const isGuest = !user

  useEffect(() => {
    const handleResize = () => {
      setIsMobileMenuOpen(window.innerWidth > 768)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    setIsMobileMenuOpen(false)
    setOpenMenus([])
  }, [location])

  async function onLogout() {
    try {
      await logout()
      showSuccessMsg('להתראות!')
    } catch (error) {
      showErrorMsg('שגיאה ביציאה מהמערכת', error)
    }
  }

  function toggleMenu(key) {
    setOpenMenus((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
  }

  function isOpen(key) {
    return openMenus.includes(key)
  }

  function renderMenu(items, level = 1, parentKey = '') {
    return (
      <ul className={`accordion-level accordion-level-${level}`}>
        {items.map((item, idx) => {
          const key = `${parentKey}-${idx}`
          const hasSub = item.subMenu?.length > 0
          if (item.adminOnly && !isAdmin) return null

          return (
            <li key={key} className={isOpen(key) ? 'open' : ''}>
              <div className='dropdownlink' onClick={() => hasSub && toggleMenu(key)}>
                {hasSub ? (
                  <>
                    {item.label}
                    <span className='arrow'>{isOpen(key) ? '▲' : '▼'}</span>
                  </>
                ) : (
                  <NavLink to={item.path} className={({ isActive }) => (isActive ? 'active' : '')}>
                    {item.label}
                  </NavLink>
                )}
              </div>
              {hasSub && isOpen(key) && renderMenu(item.subMenu, level + 1, key)}
            </li>
          )
        })}
      </ul>
    )
  }

  const fullMenu = [
    {
      label: 'דשבורד ראשי',
      path: '/',
    },
    {
      label: '👷 ניהול עובדים',
      adminOnly: true,
      subMenu: [
        {
          label: 'עובדים',
          subMenu: [
            { label: 'רשימת עובדים', path: '/user' },
            { label: '➕ הוספת עובד', path: '/user/add' },
          ],
        },
        {
          label: 'ניהול תפקידים',
          subMenu: [
            { label: 'רשימת תפקידים', path: '/roles' },
            { label: '➕ הוספת תפקיד', path: '/roles/add' },
          ],
        },
      ],
    },
    {
      label: '🌾 ניהול חקלאי',
      subMenu: [
        {
          label: 'חלקות לגידול יבולים',
          subMenu: [
            { label: 'רשימת חלקות', path: '/field' },
            { label: '➕ הוספת חלקה', path: '/field/add', adminOnly: true },
          ],
        },
        {
          label: 'סוגי יבולים',
          subMenu: [
            { label: 'רשימת סוגי יבולים', path: '/crop' },
            { label: '➕ הוספת סוג יבול', path: '/crop/add', adminOnly: true },
          ],
        },
        {
          label: 'ניהול מלאי ומחסנים',
          subMenu: [
            { label: 'רשימת מחסנים', path: '/warehouse' },
            { label: '➕ הוספת מחסן', path: '/warehouse/add', adminOnly: true },
          ],
        },
        {
          label: 'עונות חקלאיות',
          subMenu: [{ label: 'רשימת עונות', path: '/seasons' }],
        },
      ],
    },
    {
      label: '📋 משימות',
      subMenu: [
        { label: 'המשימות שלי (שיבוץ אישי)', path: '/tasks/assign' },
        {
          label: 'ניהול משימות',
          adminOnly: true,
          subMenu: [
            { label: 'רשימת משימות', path: '/tasks/' },
            { label: '➕ הוספת משימה', path: '/tasks/add' },
          ],
        },
        {
          label: 'ניהול פעולות',
          adminOnly: true,
          subMenu: [
            { label: 'רשימת פעולות חקלאיות', path: '/operations' },
            { label: '➕ הוספת פעולה', path: '/operations/add' },
          ],
        },
      ],
    },
    {
      label: '🚛 משלוחים ושיווק',
      adminOnly: true,
      subMenu: [
        {
          label: 'לקוחות',
          subMenu: [
            { label: 'לקוחות', path: '/client' },
            { label: '➕ הוספת לקוח', path: '/client/add' },
          ],
        },
        {
          label: 'הזמנות',
          subMenu: [
            { label: 'הזמנות', path: '/orders/view' },
            { label: '📝 הוספת הזמנה', path: '/order/add' },
          ],
        },
      ],
    },
    {
      label: '📊 דוחות וניתוחים',
      adminOnly: true,
      subMenu: [
        { label: 'דשבורד סקירה כללית', path: '/reports' },
        {
          label: 'דוחות מערכת',
          subMenu: [
            { label: 'היסטוריית קצירת יבול', path: '/reports/inventory-history' },
            { label: 'היסטוריית הזמנות לקוחות', path: '/reports/customer-order-history' },
            { label: 'היסטוריית מחירי יבול', path: '/reports/crop-price-history' },
            { label: 'היסטוריית משימות ומשלוחים', path: '/reports/employee-task-history' },
            { label: 'לוח פעילות חקלאית', path: '/reports/SowingAndHarvestTimeline' },
            { label: 'דוח קציר בפילוח עונתי', path: '/reports/CropSeasonSummary' },
          ],
        },
        {
          label: 'תובנות תומכות החלטה (DSS)',
          subMenu: [
            { label: 'מזג אוויר והמלצות', path: '/reports/weather' },
            { label: 'סימולציית תנאי מזג אוויר וגידול', path: '/weather-simulation' },
            { label: 'מלאי יבול והמלצות DSS', path: '/inventory' },
            { label: 'לוח תובנות חקלאיות', path: '/dashboarddss' },
          ],
        },
      ],
    },
    {
      label: 'אודות',
      path: '/about',
    },
  ]

  const guestMenu = [
    { label: 'דף הבית', path: '/' },
    { label: 'אודות', path: '/about' },
  ]

  return (
    <header className='app-header'>
      <h2 className='header-title'>Crop-Tracker</h2>

      <button className='mobile-menu-toggle' onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
        ☰ תפריט
      </button>

      {(isMobileMenuOpen || window.innerWidth > 768) && <section className='nav-wrapper'>{renderMenu(isGuest ? guestMenu : fullMenu)}</section>}

      <section className='user-section'>
        {user ? (
          <section className='user-info'>
            <span>שלום, {user.fullName}</span>
            <button className='btn btn-logout' onClick={onLogout}>
              יציאה
            </button>
          </section>
        ) : (
          <LoginSignup />
        )}
      </section>
    </header>
  )
}
