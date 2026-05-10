import { useState, useEffect } from 'react';
import api from './api';

export default function ClientDashboard({ onLogout }) {
  const [prestamos, setPrestamos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get('/prestamos/cliente');
        setPrestamos(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const hasMora = prestamos.some(p => p.pagos.some(pago => pago.estado === 'MORA'));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex justify-between items-center px-6 py-3 bg-white border-b border-gray-200">
        <p className="text-sm text-gray-600">
          Bienvenido, <span className="font-medium">{localStorage.getItem('username')}</span>
          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">CLIENTE</span>
        </p>
        <button onClick={onLogout} className="text-xs text-gray-400 hover:text-gray-700">
          Cerrar sesión
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-medium text-gray-900">Mi Panel de Créditos</h1>
        
        {hasMora && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg flex items-center">
            <span className="font-bold mr-2">¡Atención!</span> Tienes cuotas atrasadas. Por favor, regulariza tu pago lo antes posible.
          </div>
        )}

        {loading ? (
          <p className="text-gray-500 text-sm">Cargando tu información...</p>
        ) : prestamos.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center">
            <p className="text-gray-500">No tienes préstamos activos en este momento.</p>
          </div>
        ) : (
          prestamos.map(prestamo => (
            <div key={prestamo.id} className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-medium">Préstamo #{prestamo.id}</h2>
                  <p className="text-sm text-gray-500">Estado: <span className="font-medium text-gray-900">{prestamo.estado}</span></p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Cuota Quincenal</p>
                  <p className="text-xl font-medium">${Number(prestamo.cuota_quincenal).toFixed(2)}</p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Progreso de pago</span>
                  <span className="font-medium">{prestamo.quincenas_pagadas} de {prestamo.pagos.length} cuotas</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${(prestamo.quincenas_pagadas / prestamo.pagos.length) * 100}%` }}></div>
                </div>
              </div>

              <h3 className="text-sm font-medium text-gray-900 mb-3">Tus Próximas Cuotas</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400">
                      <th className="pb-2 font-medium">Quincena</th>
                      <th className="pb-2 font-medium">Fecha</th>
                      <th className="pb-2 font-medium">Monto</th>
                      <th className="pb-2 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prestamo.pagos.map(pago => (
                      <tr key={pago.id} className="border-b border-gray-50 last:border-0">
                        <td className="py-2 text-gray-600">#{pago.numero_quincena}</td>
                        <td className="py-2 text-gray-600">{pago.fecha_esperada || '---'}</td>
                        <td className="py-2 text-gray-900 font-medium">${Number(pago.monto_esperado).toFixed(2)}</td>
                        <td className="py-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            pago.estado === 'PAGADO' ? 'bg-green-100 text-green-800' :
                            pago.estado === 'MORA' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {pago.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
