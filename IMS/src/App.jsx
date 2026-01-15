// IMS/src/App.jsx

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ScanPage from './components/ScanPage';
import MovePage from './components/MovePage';
import DisposePage from './components/DisposePage';
import InventoryPage from './components/InventoryPage';
import DocumentFlowPage from './components/DocumentFlowPage';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return !token ? children : <Navigate to="/dashboard" />;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                    
          <Route path="/scan" element={<PrivateRoute><ScanPage /></PrivateRoute>} />
          <Route path="/move" element={<PrivateRoute><MovePage /></PrivateRoute>} />
          <Route path="/dispose" element={<PrivateRoute><DisposePage /></PrivateRoute>} />
          <Route path="/inventory" element={<PrivateRoute><InventoryPage /></PrivateRoute>} />
          <Route path="/document-flow" element={<PrivateRoute><DocumentFlowPage token={localStorage.getItem('token')} /></PrivateRoute>} />

          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;