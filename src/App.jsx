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

//  Crops
import { CropIndex } from './pages/CropIndex'
import { CropDetails } from './pages/CropDetails'
import { CropAdd } from './pages/CropAdd'
import { CropEdit } from './pages/CropEdit'

// Fields
import { FieldIndex } from './pages/FieldIndex'
import { FieldAdd } from './pages/FieldAdd'
import { FieldEdit } from './pages/FieldEdit'

// Sowing & Harvest
import { SowingAdd } from './pages/SowingAdd'
import { HarvestAdd } from './pages/HarvestAdd'

// Inventory
import { InventoryList } from './pages/InventoryList'
import { WarehouseIndex } from './pages/WarehouseIndex'
import { WarehouseAdd } from './pages/WarehouseAdd'
import { WarehouseEdit } from './pages/WarehouseEdit'

// Operations
import { OperationIndex } from './pages/OperationIndex'
import { OperationAdd } from './pages/OperationAdd'
import { OperationEdit } from './pages/OperationEdit'

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
              {/* Crops */}

              <Route path='/crop' element={<CropIndex />} />
              <Route path='/crop/:cropId' element={<CropDetails />} />
              <Route path='/crop/add' element={<CropAdd />} />
              <Route path='/crop/edit/:cropId' element={<CropEdit />} />

              {/* Fields */}
              <Route path='/field' element={<FieldIndex />} />
              <Route path='/field/add' element={<FieldAdd />} />
              <Route path='/Field/edit/:fieldId' element={<FieldEdit />} />

              {/* Sowing & Harvest */}
              <Route path='/sowing/add' element={<SowingAdd />} />
              <Route path='/harvest/:sowingId' element={<HarvestAdd />} />

              {/* Inventory */}
              <Route path='/inventory' element={<InventoryList />} />
              <Route path='/Warehouse' element={<WarehouseIndex />} />
              <Route path='/Warehouse/add' element={<WarehouseAdd />} />
              <Route path='/Warehouse/edit/:WarehouseId' element={<WarehouseEdit />} />

              {/* Operations */}
              <Route path='/operations' element={<OperationIndex />} />
              <Route path='/operations/add' element={<OperationAdd />} />
              <Route path='/operations/edit/:operationId' element={<OperationEdit />} />

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
              <Route path='/inventory/alerts' element={<InventoryAlerts />} />
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
