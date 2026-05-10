import { useState, useEffect } from 'react';
import api from './api';
import CreditoNominaSimulator from './CreditoNominaSimulator';

export default function AdminPanel({ onLogout }) {
  const [tab, setTab] = useState('clientes');
  const [clientes, setClientes] = useState([]);
  const [prestamos, setPrestamos] = useState([]);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [prestamoDetalle, setPrestamoDetalle] = useState(null);
  const [equipos, setEquipos] = useState([]);
  const [nuevoEquipo, setNuevoEquipo] = useState({ nombre: '', precio: '' });
  const [showEquipoModal, setShowEquipoModal] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '', cedula: '', cargo: '', fecha_ingreso: '',
    salario_neto: '', monto_liquidacion_actual: ''
  });

  useEffect(() => { fetchData(); }, [tab]);

  async function fetchData() {
    try {
      if (tab === 'clientes') {
        const res = await api.get('/empleados');
        setClientes(res.data);
      } else if (tab === 'prestamos') {
        const res = await api.get('/prestamos');
        setPrestamos(res.data);
      } else if (tab === 'equipos' || tab === 'simulador') {
        const res = await api.get('/equipos');
        setEquipos(res.data);
      }
    } catch (e) { console.error(e); }
  }

  async function handleCrearCliente(e) {
    e.preventDefault();
    try {
      const res = await api.post('/empleados', nuevoCliente);
      await api.post('/auth/registro', {
        username: nuevoCliente.nombre,
        password: nuevoCliente.cedula,
        rol: 'CLIENT',
        empleadoId: res.data.id
      });
      setShowClienteModal(false);
      setNuevoCliente({ nombre: '', cedula: '', cargo: '', fecha_ingreso: '', salario_neto: '', monto_liquidacion_actual: '' });
      fetchData();
      alert('Cliente registrado. Usuario: ' + nuevoCliente.nombre + ' / Contraseña: ' + nuevoCliente.cedula);
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  }

  async function handleEliminarCliente(id) {
    if (!window.confirm('¿Seguro que deseas eliminar este cliente?')) return;
    try {
      await api.delete(`/empleados/${id}`);
      fetchData();
    } catch (err) {
      alert('Error al eliminar: ' + (err.response?.data?.message || err.message));
    }
  }

  async function handleEliminarPrestamo(id) {
    if (!window.confirm('¿Seguro que deseas eliminar este préstamo?')) return;
    try {
      await api.delete(`/prestamos/${id}`);
      fetchData();
    } catch (err) {
      alert('Error al eliminar: ' + (err.response?.data?.message || err.message));
    }
  }

  async function handleCrearEquipo(e) {
    e.preventDefault();
    try {
      await api.post('/equipos', { nombre: nuevoEquipo.nombre, precio: Number(nuevoEquipo.precio) });
      setShowEquipoModal(false);
      setNuevoEquipo({ nombre: '', precio: '' });
      fetchData();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  }

  async function handleEliminarEquipo(id) {
    if (!window.confirm('¿Seguro que deseas eliminar este equipo?')) return;
    try {
      await api.delete(`/equipos/${id}`);
      fetchData();
    } catch (err) {
      alert('Error al eliminar: ' + (err.response?.data?.message || err.message));
    }
  }

  async function handleVerCuotas(prestamo) {
    const res = await api.get(`/prestamos/${prestamo.id}`);
    setPrestamoDetalle(res.data);
  }

  async function handleMarcarPagado(pagoId) {
    try {
      await api.post(`/prestamos/pago/${pagoId}`, { montoPagado: prestamoDetalle.cuota_quincenal });
      const res = await api.get(`/prestamos/${prestamoDetalle.id}`);
      setPrestamoDetalle(res.data);
      fetchData();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  }

  async function handleMarcarMora(pagoId) {
    try {
      await api.post(`/prestamos/mora/${pagoId}`, { recargoFijo: 0 });
      const res = await api.get(`/prestamos/${prestamoDetalle.id}`);
      setPrestamoDetalle(res.data);
      fetchData();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex justify-between items-center px-6 py-3 bg-white border-b border-gray-200">
        <p className="text-sm text-gray-600">
          Bienvenido, <span className="font-medium">{localStorage.getItem('username')}</span>
          <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">ADMINISTRADOR</span>
        </p>
        <button onClick={onLogout} className="text-xs text-gray-400 hover:text-gray-700">Cerrar sesión</button>
      </div>

      <div className="flex bg-white border-b border-gray-200 px-6">
        {['clientes', 'prestamos', 'equipos', 'simulador'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-6">

        {tab === 'clientes' && (
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-xl font-medium text-gray-900">Lista de Clientes</h1>
              <button onClick={() => setShowClienteModal(true)} className="bg-gray-900 text-white px-4 py-2 text-sm rounded-lg hover:bg-gray-800">
                + Nuevo Cliente
              </button>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 font-medium">Cédula</th>
                    <th className="px-4 py-3 font-medium">Nombre</th>
                    <th className="px-4 py-3 font-medium">Cargo</th>
                    <th className="px-4 py-3 font-medium">Salario Neto</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.map(c => (
                    <tr key={c.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">{c.cedula}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{c.nombre}</td>
                      <td className="px-4 py-3 text-gray-600">{c.cargo}</td>
                      <td className="px-4 py-3 text-gray-600">${Number(c.salario_neto).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${c.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                          {c.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleEliminarCliente(c.id)}
                          className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-2 py-1 rounded-lg">
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {clientes.length === 0 && (
                    <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-500">No hay clientes registrados.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'prestamos' && (
          <div className="max-w-5xl mx-auto">
            <h1 className="text-xl font-medium text-gray-900 mb-4">Préstamos Activos</h1>
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 font-medium">ID</th>
                    <th className="px-4 py-3 font-medium">Cliente</th>
                    <th className="px-4 py-3 font-medium">Costo</th>
                    <th className="px-4 py-3 font-medium">Cuota Q.</th>
                    <th className="px-4 py-3 font-medium">Progreso</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {prestamos.map(p => (
                    <tr key={p.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500">#{p.id}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{p.empleado?.nombre}</td>
                      <td className="px-4 py-3 text-gray-600">${Number(p.costo_equipo).toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-600">${Number(p.cuota_quincenal).toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-600">{p.quincenas_pagadas} / {p.pagos.length}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          p.estado === 'APROBADO' ? 'bg-green-100 text-green-800' :
                          p.estado === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>{p.estado}</span>
                      </td>
                      <td className="px-4 py-3 flex gap-2">
                        <button onClick={() => handleVerCuotas(p)}
                          className="text-xs text-blue-500 hover:text-blue-700 border border-blue-200 px-2 py-1 rounded-lg">
                          Ver Cuotas
                        </button>
                        <button onClick={() => handleEliminarPrestamo(p.id)}
                          className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-2 py-1 rounded-lg">
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {prestamos.length === 0 && (
                    <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500">No hay préstamos registrados.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'equipos' && (
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-xl font-medium text-gray-900">Catálogo de Equipos</h1>
              <button onClick={() => setShowEquipoModal(true)} className="bg-gray-900 text-white px-4 py-2 text-sm rounded-lg hover:bg-gray-800">
                + Nuevo Equipo
              </button>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 font-medium">Nombre del Equipo</th>
                    <th className="px-4 py-3 font-medium">Precio de Costo ($)</th>
                    <th className="px-4 py-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {equipos.map(eq => (
                    <tr key={eq.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{eq.nombre}</td>
                      <td className="px-4 py-3 text-gray-600">${Number(eq.precio).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleEliminarEquipo(eq.id)}
                          className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-2 py-1 rounded-lg">
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {equipos.length === 0 && (
                    <tr><td colSpan="3" className="px-4 py-8 text-center text-gray-500">No hay equipos en el catálogo.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'simulador' && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden p-0 relative h-full min-h-[800px]">
            <CreditoNominaSimulator clientes={clientes} equipos={equipos} onSuccess={() => { setTab('prestamos'); fetchData(); }} />
          </div>
        )}

        {showClienteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-xl font-medium mb-4">Registrar Nuevo Cliente</h2>
              <form onSubmit={handleCrearCliente} className="space-y-4">
                <input required placeholder="Nombre completo" className="w-full border rounded p-2 text-sm" value={nuevoCliente.nombre} onChange={e => setNuevoCliente({...nuevoCliente, nombre: e.target.value})} />
                <input required placeholder="Cédula" className="w-full border rounded p-2 text-sm" value={nuevoCliente.cedula} onChange={e => setNuevoCliente({...nuevoCliente, cedula: e.target.value})} />
                <input required placeholder="Cargo / Ocupación" className="w-full border rounded p-2 text-sm" value={nuevoCliente.cargo} onChange={e => setNuevoCliente({...nuevoCliente, cargo: e.target.value})} />
                <input required type="date" className="w-full border rounded p-2 text-sm" value={nuevoCliente.fecha_ingreso} onChange={e => setNuevoCliente({...nuevoCliente, fecha_ingreso: e.target.value})} />
                <input required type="number" placeholder="Salario Neto ($)" className="w-full border rounded p-2 text-sm" value={nuevoCliente.salario_neto} onChange={e => setNuevoCliente({...nuevoCliente, salario_neto: e.target.value})} />
                <input required type="number" placeholder="Monto Liquidación Estimado ($)" className="w-full border rounded p-2 text-sm" value={nuevoCliente.monto_liquidacion_actual} onChange={e => setNuevoCliente({...nuevoCliente, monto_liquidacion_actual: e.target.value})} />
                <div className="flex gap-2 justify-end mt-6">
                  <button type="button" onClick={() => setShowClienteModal(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900">Cancelar</button>
                  <button type="submit" className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg">Guardar Cliente</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showEquipoModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-xl font-medium mb-4">Registrar Nuevo Equipo</h2>
              <form onSubmit={handleCrearEquipo} className="space-y-4">
                <input required placeholder="Nombre del equipo (Ej: iPhone 13)" className="w-full border rounded p-2 text-sm" value={nuevoEquipo.nombre} onChange={e => setNuevoEquipo({...nuevoEquipo, nombre: e.target.value})} />
                <input required type="number" placeholder="Precio de costo ($)" step="0.01" className="w-full border rounded p-2 text-sm" value={nuevoEquipo.precio} onChange={e => setNuevoEquipo({...nuevoEquipo, precio: e.target.value})} />
                <div className="flex gap-2 justify-end mt-6">
                  <button type="button" onClick={() => setShowEquipoModal(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900">Cancelar</button>
                  <button type="submit" className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg">Guardar Equipo</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {prestamoDetalle && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-medium">Préstamo #{prestamoDetalle.id}</h2>
                  <p className="text-sm text-gray-500">{prestamoDetalle.empleado?.nombre} — Cuotas: {prestamoDetalle.quincenas_pagadas}/{prestamoDetalle.pagos.length}</p>
                </div>
                <button onClick={() => setPrestamoDetalle(null)} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Progreso</span>
                  <span className="font-medium">{prestamoDetalle.quincenas_pagadas} de {prestamoDetalle.pagos.length} cuotas</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${(prestamoDetalle.quincenas_pagadas / prestamoDetalle.pagos.length) * 100}%` }}></div>
                </div>
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400">
                    <th className="pb-2 text-left font-medium">Quincena</th>
                    <th className="pb-2 text-left font-medium">Fecha</th>
                    <th className="pb-2 text-left font-medium">Monto</th>
                    <th className="pb-2 text-left font-medium">Estado</th>
                    <th className="pb-2 text-left font-medium">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {prestamoDetalle.pagos.map(pago => (
                    <tr key={pago.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-2 text-gray-600">#{pago.numero_quincena}</td>
                      <td className="py-2 text-gray-600">{pago.fecha_esperada || '---'}</td>
                      <td className="py-2 font-medium">${Number(pago.monto_esperado).toFixed(2)}</td>
                      <td className="py-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          pago.estado === 'PAGADO' ? 'bg-green-100 text-green-800' :
                          pago.estado === 'MORA' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-600'
                        }`}>{pago.estado}</span>
                      </td>
                      <td className="py-2">
                        {pago.estado === 'PENDIENTE' && (
                          <div className="flex gap-2">
                            <button onClick={() => handleMarcarPagado(pago.id)}
                              className="text-xs text-green-600 border border-green-200 px-2 py-1 rounded-lg hover:bg-green-50">
                              ✓ Pagado
                            </button>
                            <button onClick={() => handleMarcarMora(pago.id)}
                              className="text-xs text-red-500 border border-red-200 px-2 py-1 rounded-lg hover:bg-red-50">
                              Mora
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}