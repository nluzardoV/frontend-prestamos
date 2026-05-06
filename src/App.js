import { useState } from 'react';
import './index.css';
import Login from './Login';
import AdminPanel from './AdminPanel';
import ClientDashboard from './ClientDashboard';

function App() {
  const [rol, setRol] = useState(localStorage.getItem('rol'));

  const handleLogin = (rolRecibido) => {
    setRol(rolRecibido);
  };

  const handleLogout = () => {
    localStorage.clear();
    setRol(null);
  };

  if (!rol) return <Login onLogin={handleLogin} />;

  if (rol === 'ADMIN') {
    return <AdminPanel onLogout={handleLogout} />;
  }

  return <ClientDashboard onLogout={handleLogout} />;
}

export default App;