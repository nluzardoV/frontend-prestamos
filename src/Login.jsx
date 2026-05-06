import { useState } from 'react';
import api from './api';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { username, password });
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('rol', res.data.rol);
      localStorage.setItem('username', res.data.username);
      onLogin(res.data.rol);
    } catch (e) {
      if (!e.response) {
        setError('Error de conexión con el servidor. ¿El backend está encendido?');
      } else {
        setError('Usuario o contraseña incorrectos');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-sm">
        <h1 className="text-xl font-medium text-gray-900 mb-1">Sistema de créditos</h1>
        <p className="text-sm text-gray-400 mb-6">Inicia sesión para continuar</p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Usuario</label>
            <input
              type="text"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Contraseña</label>
            <input
              type="password"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-gray-900 text-white rounded-lg py-2 text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            {loading ? 'Entrando...' : 'Iniciar sesión'}
          </button>

          <div className="text-center mt-4">
            <button
              onClick={() => alert('Por favor, comunícate con el administrador para recuperar tu contraseña.')}
              className="text-xs text-gray-500 hover:text-gray-900 underline"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}