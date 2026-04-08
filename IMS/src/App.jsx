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


const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return !token ? children : <Navigate to="/dashboard" />;
};

function App() {
  // Функции-заглушки для модальных окон AdminPanelPage
  const openSQLConsole = () => {
    alert('Открытие SQL консоли');
  };

  const openNodeLogConsole = () => {
    alert('Открытие Node.js Log Console');
  };

  const openAddUserModal = () => {
    alert('Открытие модального окна создания пользователя');
  };

  // Получаем токен один раз для использования в роутах
  const token = localStorage.getItem('token');

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                    
          <Route path="/scan" element={<PrivateRoute><ScanPage /></PrivateRoute>} />
          <Route path="/move" element={<PrivateRoute><MovePage /></PrivateRoute>} />
          <Route path="/dispose" element={<PrivateRoute><DisposePage /></PrivateRoute>} />
          
          {/* Журнал склада — отдельная страница с передачей токена */}
          <Route path="/inventory" element={
            <PrivateRoute>
              <InventoryPage token={token} />
            </PrivateRoute>
          } />

          {/* Документооборот */}
          <Route path="/document-flow" element={
            <PrivateRoute>
              <DocumentFlowPage token={token} />
            </PrivateRoute>
          } />

          {/* Панель администратора */}
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
          {/* Редирект с корня на дашборд */}
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;