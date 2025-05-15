import { Provider, useSelector } from 'react-redux'
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import { useEffect, useState } from 'react'

import './assets/style/main.scss'

import { AppFooter } from './cmps/AppFooter'
import { AppHeader } from './cmps/AppHeader'
import { UserMsg } from './cmps/UserMsg'
import { store } from './store/store'

// Dashboards
import { MainDashboard } from './pages/MainDashboard'
import { WorkerDashboard } from './pages/WorkerDashboard'
import { AdminDashboard } from './pages/AdminDashboard'

// Users & Roles
import { UserIndex } from './pages/UserIndex'
import { UserEdit } from './pages/UserEdit'
import { UserAdd } from './pages/UserAdd'
import { RoleIndex } from './pages/RoleIndex'
import { RoleAdd } from './pages/RoleAdd'
import { RoleEdit } from './pages/RoleEdit'

// Inventory
// import { InventoryList } from './pages/InventoryList'
// import { InventoryEdit } from './pages/InventoryEdit'
// import { InventoryHistory } from './pages/InventoryHistory'
// import { InventoryAlerts } from './pages/InventoryAlerts'
// import { InventoryCategories } from './pages/InventoryCategories'
// import { StorageLocations } from './pages/StorageLocations'
// import { StorageAdd } from './pages/StorageAdd'
// import { StorageEdit } from './pages/StorageEdit'
// import { ProductAdd } from './pages/ProductAdd'

// Fields & Crops
// import { FieldIndex } from './pages/FieldIndex'
// import { FieldAdd } from './pages/FieldAdd'
// import { FieldActions } from './pages/FieldActions'
// import { TaskAssign } from './pages/TaskAssign'

// Workers
// import { WorkerIndex } from './pages/WorkerIndex'

// Clients & Deliveries
// import { ClientIndex } from './pages/ClientIndex'
// import { ClientAdd } from './pages/ClientAdd'
// import { ClientEdit } from './pages/ClientEdit'
// import { ClientOrders } from './pages/ClientOrders'
// import { OrderAdd } from './pages/OrderAdd'
// import { OrderUpdateQty } from './pages/OrderUpdateQty'
// import { OrderIndex } from './pages/OrderIndex'
// import { TruckAdd } from './pages/TruckAdd'
// import { DeliveryAssign } from './pages/DeliveryAssign'

// Reports
// import { ReportIndex } from './pages/ReportIndex'
// import { ReportInventory } from './pages/ReportInventory'
// import { ReportDeliveries } from './pages/ReportDeliveries'
// import { CropForecast } from './pages/CropForecast'
// import { IrrigationFertilization } from './pages/IrrigationFertilization'
// import { WeatherForecast } from './pages/WeatherForecast'
// import { ProfitAnalysis } from './pages/ProfitAnalysis'
// import { GraphInsights } from './pages/GraphInsights'

// Static
import { About } from './pages/About'

// קומפוננטה פנימית להצגת דשבורד מתאים
function DynamicDashboardRoute() {
  const user = useSelector((storeState) => storeState.userModule.loggedInUser)
  const [dashboard, setDashboard] = useState(<MainDashboard />)

  useEffect(() => {
    if (user?.IsAdmin) setDashboard(<AdminDashboard />)
    else if (user) setDashboard(<WorkerDashboard />)
    else setDashboard(<MainDashboard />)
  }, [user])

  return dashboard
}

export function App() {
  return (
    <Provider store={store}>
      <Router>
        <section className='main-layout app'>
          <AppHeader />
          <main>
            <Routes>
              {/* Dynamic Dashboard */}
              <Route path='/' element={<DynamicDashboardRoute />} />

              {/* Users & Roles */}
              <Route path='/user' element={<UserIndex />} />
              <Route path='/user/edit/:userId?' element={<UserEdit />} />
              <Route path='/users/add' element={<UserAdd />} />
              <Route path='/roles' element={<RoleIndex />} />
              <Route path='/roles/add' element={<RoleAdd />} />
              <Route path='/roles/edit/:roleId' element={<RoleEdit />} />

              {/* Inventory */}
              {/*
              <Route path='/inventory' element={<InventoryList />} />
              <Route path='/inventory/edit/:itemId?' element={<InventoryEdit />} />
              <Route path='/inventory/history' element={<InventoryHistory />} />
              <Route path='/inventory/alerts' element={<InventoryAlerts />} />
              <Route path='/inventory/categories' element={<InventoryCategories />} />
              <Route path='/storage' element={<StorageLocations />} />
              <Route path='/storage/add' element={<StorageAdd />} />
              <Route path='/storage/edit/:storageId' element={<StorageEdit />} />
              <Route path='/product/add' element={<ProductAdd />} />
              /}

              {/* Fields */}
              {/*
              <Route path='/field' element={<FieldIndex />} />
              <Route path='/field/add' element={<FieldAdd />} />
              <Route path='/field/actions' element={<FieldActions />} />
              <Route path='/task/assign' element={<TaskAssign />} />
               /}

              {/* Workers */}
              {/*
              <Route path='/worker' element={<WorkerIndex />} />
               /}

              {/* Clients & Orders & Delivery */}
              {/*
              <Route path='/client' element={<ClientIndex />} />
              <Route path='/client/add' element={<ClientAdd />} />
              <Route path='/client/edit/:clientId' element={<ClientEdit />} />
              <Route path='/client/:clientId/orders' element={<ClientOrders />} />
              <Route path='/order/add' element={<OrderAdd />} />
              <Route path='/order/update-qty/:orderId' element={<OrderUpdateQty />} />
              <Route path='/orders/view' element={<OrderIndex />} />
              <Route path='/truck/add' element={<TruckAdd />} />
              <Route path='/delivery/assign' element={<DeliveryAssign />} />
              /}

              {/* Reports */}
              {/*
              <Route path='/reports' element={<ReportIndex />} />
              <Route path='/reports/inventory' element={<ReportInventory />} />
              <Route path='/reports/deliveries' element={<ReportDeliveries />} />
              <Route path='/reports/crop-forecast' element={<CropForecast />} />
              <Route path='/reports/irrigation' element={<IrrigationFertilization />} />
              <Route path='/reports/weather' element={<WeatherForecast />} />
              <Route path='/reports/profit' element={<ProfitAnalysis />} />
              <Route path='/reports/insights' element={<GraphInsights />} />
              /}

              {/* Static */}
              <Route path='/about' element={<About />} />
            </Routes>
          </main>
          <AppFooter />
        </section>
      </Router>
      <UserMsg />
    </Provider>
  )
}
