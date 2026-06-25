// IMS/src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ScanPage from './components/ScanPage';
import MovePage from './components/MovePage';
import MovementHistoryPage from './components/MovementHistoryPage';
import DisposePage from './components/DisposePage';
import InventoryPage from './components/InventoryPage';
import DocumentFlowPage from './components/DocumentFlowPage';
import AdminPanelPage from './components/AdminPanelPage';
import SellPartPage from './components/SellPartPage';
import GarageAppointmentsPage from './components/GarageAppointmentsPage';
import AddItemPage from './components/AddItemPage';
import CarsPage from './components/CarsPage';
import CarDetailPage from './components/CarDetailPage';
import PlatformsPage from './components/PlatformsPage';
// CRM компоненты:
import CrmDashboard from './components/CrmDashboard';
import WorkOrdersList from './components/WorkOrdersList';
import WorkOrderDetail from './components/WorkOrderDetail';
import WorkOrderForm from './components/WorkOrderForm';
import CustomerList from './components/CustomerList';
import CustomerDetail from './components/CustomerDetail';
import Settings from './components/Settings.jsx';


// ============================================================================
// ROUTE GUARDS (должны быть ДО функции App)
// ============================================================================

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return !token ? children : <Navigate to="/dashboard" replace />;
};

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

function App() {
  // Функции-заглушки для модальных окон AdminPanelPage
  const openSQLConsole = () => alert('Открытие SQL консоли');
  const openNodeLogConsole = () => alert('Открытие Node.js Log Console');
  const openAddUserModal = () => alert('Открытие модального окна создания пользователя');

  // Получаем токен один раз для использования в роутах
  const token = localStorage.getItem('token');

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* === ПУБЛИЧНЫЕ РОУТЫ === */}
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />

          {/* === ЗАЩИЩЁННЫЕ РОУТЫ === */}
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />

          <Route path="/scan" element={
            <PrivateRoute>
              <ScanPage />
            </PrivateRoute>
          } />
          <Route path="/move" element={
            <PrivateRoute>
              <MovePage />
            </PrivateRoute>
          } />
          <Route path="/dispose" element={
            <PrivateRoute>
              <DisposePage />
            </PrivateRoute>
          } />

          <Route path="/inventory" element={
            <PrivateRoute>
              <InventoryPage token={token} />
            </PrivateRoute>
          } />

          <Route path="/document-flow" element={
            <PrivateRoute>
              <DocumentFlowPage token={token} />
            </PrivateRoute>
          } />

          <Route path="/admin-panel" element={
            <PrivateRoute>
              <AdminPanelPage
                token={token}
                onOpenSQLConsole={openSQLConsole}
                onOpenNodeLogConsole={openNodeLogConsole}
                onOpenAddUserModal={openAddUserModal}
              />
            </PrivateRoute>
          } />

          <Route path="/movement-history" element={
            <PrivateRoute>
              <MovementHistoryPage token={token} />
            </PrivateRoute>
          } />

          <Route path="/sell-part" element={
            <PrivateRoute>
              <SellPartPage token={token} />
            </PrivateRoute>
          } />

          <Route path="/garage-appointments" element={
            <PrivateRoute>
              <GarageAppointmentsPage token={token} />
            </PrivateRoute>
          } />

          <Route path="/add-item" element={
            <PrivateRoute>
              <AddItemPage token={token} />
            </PrivateRoute>
          } />

          <Route path="/cars" element={
            <PrivateRoute>
              <CarsPage token={token} />
            </PrivateRoute>
          } />

          <Route path="/cars/:id" element={
            <PrivateRoute>
              <CarDetailPage token={token} />
            </PrivateRoute>
          } />

          <Route path="/platforms" element={
            <PrivateRoute>
              <PlatformsPage token={token} />
            </PrivateRoute>
          } />

          {/* === CRM РОУТЫ (только один раз!) === */}
          <Route path="/crm" element={
            <PrivateRoute>
              <CrmDashboard token={token} />
            </PrivateRoute>
          } />
          <Route path="/crm/work-orders" element={
            <PrivateRoute>
              <WorkOrdersList token={token} />
            </PrivateRoute>
          } />
          <Route path="/crm/work-orders/new" element={
            <PrivateRoute>
              <WorkOrderForm token={token} />
            </PrivateRoute>
          } />
          <Route path="/crm/work-orders/:id" element={
            <PrivateRoute>
              <WorkOrderDetail token={token} />
            </PrivateRoute>
          } />
          <Route path="/crm/customers" element={
            <PrivateRoute>
              <CustomerList token={token} />
            </PrivateRoute>
          } />
          <Route path="/crm/customers/:id" element={
            <PrivateRoute>
              <CustomerDetail token={token} />
            </PrivateRoute>
          } />
          <Route path="/crm/work-orders/:id/edit" element={<WorkOrderForm token={token} />} />    
          <Route path="/settings" element={<Settings token={token} />} />
          {/* === REDIRECTS === */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;