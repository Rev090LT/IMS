// IMS/src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
import CustomersPage from './components/CustomersPage.jsx';
import CustomerDetail from './components/CustomerDetail';
import SetupPage from './components/SetupPage.jsx';
import InDevelopment from './components/InDevelopment.jsx';
import StockByLocationPage from './components/StockByLocationPage.jsx';
import Settings from './components/Settings.jsx';
import RootRedirect from './components/RootRedirect.jsx'; // <-- Умный редирект уже импортирован

// ============================================================================
// ROUTE GUARDS
// ============================================================================

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const [isConfigured, setIsConfigured] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const response = await fetch(`/api/settings/check?t=${Date.now()}`);
        const data = await response.json();
        setIsConfigured(data.isConfigured === true);
      } catch (error) {
        console.error('Ошибка проверки настройки:', error);
        setIsConfigured(false);
      } finally {
        setLoading(false);
      }
    };
    checkSetup();
  }, []);

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f5f7fa',
        fontSize: '18px',
        color: '#666'
      }}>
        ⏳ Проверка системы...
      </div>
    );
  }

  // Если система сброшена — редирект на /setup, даже если токен есть
  if (isConfigured === false) {
    return <Navigate to="/setup" replace />;
  }

  // Если система настроена, но токена нет — редирект на /login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return !token ? children : <Navigate to="/dashboard" replace />;
};

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

function App() {
  const openSQLConsole = () => alert('Открытие SQL консоли');
  const openNodeLogConsole = () => alert('Открытие Node.js Log Console');
  const openAddUserModal = () => alert('Открытие модального окна создания пользователя');

  const token = localStorage.getItem('token');

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* 🔥 ИЗМЕНЕНИЕ ЗДЕСЬ: Умный редирект вместо жесткого Navigate to="/dashboard" */}
          <Route path="/" element={<RootRedirect />} />
          
          {/* Страница настройки (без защиты) */}
          <Route path="/setup" element={<SetupPage />} />

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

          <Route path="/stock/by-locations" element={
            <PrivateRoute>
              <StockByLocationPage token={token} />
            </PrivateRoute>
          } />

          <Route path="/platforms" element={
            <PrivateRoute>
              <InDevelopment token={token} />
            </PrivateRoute>
          } />

          {/* === CRM РОУТЫ === */}
          <Route path="/crm" element={
            <PrivateRoute>
              <InDevelopment token={token} />
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
              <CustomersPage token={token} />
            </PrivateRoute>
          } />   
          <Route path="/crm/customers/:id" element={
            <PrivateRoute>
              <CustomerDetail token={token} />
            </PrivateRoute>
          } />
          <Route path="/crm/work-orders/:id/edit" element={
            <PrivateRoute>
              <WorkOrderForm token={token} />
            </PrivateRoute>
          } />    
          <Route path="/settings" element={
            <PrivateRoute>
              <Settings token={token} />
            </PrivateRoute>
          } />

          {/* === REDIRECTS === */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;