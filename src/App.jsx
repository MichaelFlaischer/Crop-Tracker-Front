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

import { SeasonIndex } from './pages/SeasonIndex'
import { SeasonEdit } from './pages/SeasonEdit'

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
import { SowingDetails } from './pages/SowingDetails'

// Inventory
import { InventoryList } from './pages/InventoryList'
import { WarehouseIndex } from './pages/WarehouseIndex'
import { WarehouseAdd } from './pages/WarehouseAdd'
import { WarehouseEdit } from './pages/WarehouseEdit'

// Operations
import { OperationIndex } from './pages/OperationIndex'
import { OperationAdd } from './pages/OperationAdd'
import { OperationEdit } from './pages/OperationEdit'

// Task Management
import { TaskIndex } from './pages/TaskIndex'
import { TaskAdd } from './pages/TaskAdd'
import { TaskEdit } from './pages/TaskEdit'
import { TaskDetails } from './pages/TaskDetails'
import { TaskAssign } from './pages/TaskAssign'

// Clients & Deliveries
import { ClientIndex } from './pages/ClientIndex'
import { ClientAdd } from './pages/ClientAdd'
import { ClientEdit } from './pages/ClientEdit'
import { OrderIndex } from './pages/OrderIndex'
import { ClientOrders } from './pages/ClientOrders'
import { OrderAdd } from './pages/OrderAdd'
import { OrderDetails } from './pages/OrderDetails'
import { OrderEdit } from './pages/OrderEdit'
import { OrderUpdateQty } from './pages/OrderUpdateQty'

// Reports
import { ReportIndex } from './pages/ReportIndex'
import { WeatherForecast } from './pages/WeatherForecast'
import { DashboardDSS } from './pages/DashboardDSS'
import { InventoryHistoryReport } from './pages/InventoryHistoryReport'
import { CustomerOrderHistoryReport } from './pages/CustomerOrderHistoryReport'
import { CropPriceHistoryReport } from './pages/CropPriceHistoryReport'
import { EmployeeTaskHistoryReport } from './pages/EmployeeTaskHistoryReport'
import { SowingAndHarvestTimeline } from './pages/SowingAndHarvestTimeline'
import { CropSeasonSummary } from './pages/CropSeasonSummary'
import { WeatherSimulation } from './pages/WeatherSimulation'
import { WeatherSimulationResult } from './pages/WeatherSimulationResult'

// Static
import { About } from './pages/About'

function DynamicDashboardRoute() {
  const user = useSelector((storeState) => storeState.userModule.loggedInUser)
  const [dashboard, setDashboard] = useState(<MainDashboard />)

  useEffect(() => {
    if (user?.isAdmin) setDashboard(<AdminDashboard />)
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
              <Route path='/user/add' element={<UserAdd />} />
              <Route path='/roles' element={<RoleIndex />} />
              <Route path='/roles/add' element={<RoleAdd />} />
              <Route path='/roles/edit/:roleId' element={<RoleEdit />} />

              {/* Seasons */}
              <Route path='/seasons' element={<SeasonIndex />} />
              <Route path='/seasons/edit/:seasonId' element={<SeasonEdit />} />

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
              <Route path='/sowing/:sowingId' element={<SowingDetails />} />

              {/* Inventory */}
              <Route path='/inventory' element={<InventoryList />} />
              <Route path='/Warehouse' element={<WarehouseIndex />} />
              <Route path='/Warehouse/add' element={<WarehouseAdd />} />
              <Route path='/Warehouse/edit/:WarehouseId' element={<WarehouseEdit />} />
              {/* Operations */}
              <Route path='/operations' element={<OperationIndex />} />
              <Route path='/operations/add' element={<OperationAdd />} />
              <Route path='/operations/edit/:operationId' element={<OperationEdit />} />
              {/* Tasks */}
              <Route path='/tasks' element={<TaskIndex />} />
              <Route path='/tasks/add' element={<TaskAdd />} />
              <Route path='/tasks/edit/:taskId' element={<TaskEdit />} />
              <Route path='/tasks/assign' element={<TaskAssign />} />
              <Route path='/tasks/:taskId' element={<TaskDetails />} />

              {/* Clients & Orders & Delivery */}
              <Route path='/client' element={<ClientIndex />} />
              <Route path='/client/add' element={<ClientAdd />} />
              <Route path='/client/edit/:clientId' element={<ClientEdit />} />
              <Route path='/client/:clientId/orders' element={<ClientOrders />} />
              <Route path='/order/add' element={<OrderAdd />} />
              <Route path='/order/update-qty/:orderId' element={<OrderUpdateQty />} />
              <Route path='/orders/view' element={<OrderIndex />} />
              <Route path='/order/:orderId' element={<OrderDetails />} />
              <Route path='/order/edit/:orderId' element={<OrderEdit />} />

              {/* Reports */}
              <Route path='/reports' element={<ReportIndex />} />
              <Route path='/reports/inventory-history' element={<InventoryHistoryReport />} />
              <Route path='/reports/customer-order-history' element={<CustomerOrderHistoryReport />} />
              <Route path='/reports/crop-price-history' element={<CropPriceHistoryReport />} />
              <Route path='/reports/employee-task-history' element={<EmployeeTaskHistoryReport />} />
              <Route path='/reports/weather' element={<WeatherForecast />} />
              <Route path='/reports/SowingAndHarvestTimeline' element={<SowingAndHarvestTimeline />} />
              <Route path='/reports/CropSeasonSummary' element={<CropSeasonSummary />} />
              <Route path='/dashboarddss' element={<DashboardDSS />} />

              {/* Weather Simulation */}
              <Route path='/weather-simulation' element={<WeatherSimulation />} />
              <Route path='/weather-simulation/result' element={<WeatherSimulationResult />} />

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
