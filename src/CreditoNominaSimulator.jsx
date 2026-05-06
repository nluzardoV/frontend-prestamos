import { useState, useMemo } from "react";
import api from './api';

const IVA = 0.16;
const TOTAL_QUINCENAS = 24;

function calcular({ costo, factor, comision, deduccionPct, bcv, paralelo }) {
  const _costo = parseFloat(costo) || 0;
  const _factor = parseFloat(factor) || 0;
  const _comision = parseFloat(comision) || 0;
  const _deduccionPct = parseFloat(deduccionPct) || 0;
  const _bcv = parseFloat(bcv) || 1;
  const _paralelo = parseFloat(paralelo) || 1;

  const precioVenta = _costo * _factor;
  const inversionInicial = _costo + _comision;
  const deduccionUSD = precioVenta * (_deduccionPct / 100) * (1 + IVA);
  const utilidadBruta = precioVenta - deduccionUSD;
  const comercializacion = utilidadBruta * 0.1;
  const utilidadNeta = utilidadBruta - comercializacion;
  const utilidadMensual = utilidadNeta / 12;
  const roi = utilidadNeta - inversionInicial;
  const roiPct = inversionInicial > 0 ? (roi / inversionInicial) * 100 : 0;
  const cuotaUSD = precioVenta / TOTAL_QUINCENAS;
  const diferencialCambiario = Math.abs(((_bcv - _paralelo) / _paralelo) * 100);

  return {
    precioVenta,
    inversionInicial,
    deduccionUSD,
    utilidadBruta,
    comercializacion,
    utilidadNeta,
    utilidadMensual,
    roi,
    roiPct,
    cuotaUSD,
    diferencialCambiario,
  };
}

function fmt(n, dec = 2) {
  return Number(n.toFixed(dec)).toLocaleString("es-VE", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
}

function fmtCur(n, sym = "$") {
  return `${sym} ${fmt(n, 2)}`;
}

const inputClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-gray-400 bg-white";
const labelClass = "block text-xs text-gray-500 mb-1";

export default function CreditoNominaSimulator({ clientes = [], equipos = [], onSuccess }) {
  const [selectedCliente, setSelectedCliente] = useState('');
  const [selectedEquipoId, setSelectedEquipoId] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    costo: 135,
    factor: 3.8,
    comision: 33.33,
    deduccionPct: 10,
    bcv: 48.25,
    paralelo: 62,
  });
  const [view, setView] = useState("usd");

  const set = (k) => (e) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const s = useMemo(() => calcular(form), [form]);

  // Build 24 quincenas
  const quincenas = useMemo(() => {
    const capitalPorQ = s.inversionInicial / TOTAL_QUINCENAS;
    const margenPorQ = s.utilidadNeta / TOTAL_QUINCENAS;
    let acumCapital = 0;
    return Array.from({ length: TOTAL_QUINCENAS }, (_, i) => {
      const q = i + 1;
      const mes = Math.ceil(q / 2);
      const label = q % 2 === 1 ? `Mes ${mes} — 1ª` : `Mes ${mes} — 2ª`;
      acumCapital += capitalPorQ;
      const esRetorno = acumCapital <= s.inversionInicial + 0.001;
      return { q, label, cuota: s.cuotaUSD, capital: capitalPorQ, margen: margenPorQ, esRetorno };
    });
  }, [s]);

  function displayAmount(usd) {
    if (view === "usd") return fmtCur(usd);
    if (view === "bcv") return `Bs. ${fmt(usd * form.bcv)}`;
    return `Bs. ${fmt(usd * form.paralelo)}`;
  }

  const cards = [
    { label: "Precio de venta", value: fmtCur(s.precioVenta), sub: `Costo × ${form.factor}`, color: "text-gray-900" },
    { label: "Utilidad neta", value: fmtCur(s.utilidadNeta), sub: "Tras deducción y comercialización", color: "text-emerald-600" },
    { label: "Inversión inicial", value: fmtCur(s.inversionInicial), sub: "Costo + comisión vendedor", color: "text-gray-900" },
    { label: "ROI neto", value: `${fmt(s.roiPct, 1)}%`, sub: `${fmtCur(s.roi)} sobre la inversión`, color: "text-amber-600" },
    { label: "Cuota quincenal", value: fmtCur(s.cuotaUSD), sub: "24 quincenas (12 meses)", color: "text-gray-900" },
    { label: "Diferencial cambiario", value: `${fmt(s.diferencialCambiario, 1)}%`, sub: "BCV vs Paralelo", color: "text-gray-900" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-xl font-medium text-gray-900">Sistema de créditos por nómina</h1>
          <p className="text-sm text-gray-400 mt-1">Simulador financiero — Modelo de prueba · Fase 1</p>
        </div>

        {/* KPI Cards */}
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-400 font-medium mb-3">Resumen ejecutivo</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {cards.map((c) => (
              <div key={c.label} className="bg-gray-100 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">{c.label}</p>
                <p className={`text-lg font-medium ${c.color}`}>{c.value}</p>
                <p className="text-xs text-gray-400 mt-1 leading-tight">{c.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Simulator */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <p className="text-xs uppercase tracking-widest text-gray-400 font-medium mb-4">Configuración del préstamo</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className={labelClass}>Seleccionar Equipo del Catálogo</label>
              <select 
                className={inputClass}
                value={selectedEquipoId}
                onChange={(e) => {
                  setSelectedEquipoId(e.target.value);
                  const eq = equipos.find(x => x.id === parseInt(e.target.value));
                  if (eq) {
                    setForm(prev => ({ ...prev, costo: parseFloat(eq.precio) }));
                  }
                }}
              >
                <option value="">-- Seleccionar equipo --</option>
                {equipos.map(eq => (
                  <option key={eq.id} value={eq.id}>{eq.nombre} (${Number(eq.precio).toFixed(2)})</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className={labelClass}>Costo unitario del equipo ($)</label>
              <input type="number" className={inputClass} value={form.costo} step="1" min="1" onChange={(e) => {
                setForm(prev => ({ ...prev, costo: e.target.value }));
                setSelectedEquipoId(''); // Reset selector if manual input
              }} />
            </div>
            <div>
              <label className={labelClass}>Factor de precio de venta</label>
              <input type="number" className={inputClass} value={form.factor} step="0.1" min="1" onChange={set("factor")} />
            </div>
            <div>
              <label className={labelClass}>Comisión vendedor ($) — se suma al costo</label>
              <input type="number" className={inputClass} value={form.comision} step="0.01" min="0" onChange={set("comision")} />
            </div>
            <div>
              <label className={labelClass}>Deducción empresa de cobranza (%)</label>
              <input type="number" className={inputClass} value={form.deduccionPct} step="0.1" min="0" max="100" onChange={set("deduccionPct")} />
            </div>
          </div>

          <div className="border-t border-gray-100 my-4" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Tasa BCV (Bs/$)</label>
              <input type="number" className={inputClass} value={form.bcv} step="0.01" min="1" onChange={set("bcv")} />
            </div>
            <div>
              <label className={labelClass}>Tasa paralelo (Bs/$)</label>
              <input type="number" className={inputClass} value={form.paralelo} step="0.01" min="1" onChange={set("paralelo")} />
            </div>
          </div>

          <div className="border-t border-gray-100 my-4" />

          <div className="space-y-2">
            {[
              ["Precio de venta total", fmtCur(s.precioVenta), false],
              [`Deducción cobranza (${form.deduccionPct}% + IVA 16%)`, `− ${fmtCur(s.deduccionUSD)}`, false],
              ["Comercialización ventas (10%)", `− ${fmtCur(s.comercializacion)}`, false],
              ["Utilidad neta total", fmtCur(s.utilidadNeta), true],
              ["Utilidad mensual estimada", `${fmtCur(s.utilidadMensual)} / mes`, false],
              ["Cuota quincenal en BCV", `Bs. ${fmt(s.cuotaUSD * form.bcv)}`, false],
              ["Cuota quincenal en Paralelo", `Bs. ${fmt(s.cuotaUSD * form.paralelo)}`, false],
            ].map(([label, value, highlight]) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{label}</span>
                <span className={`text-sm font-medium ${highlight ? "text-emerald-600" : "text-gray-800"}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payments Table */}
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-400 font-medium mb-3">Tabla de pagos — 24 quincenas</p>
          <div className="flex gap-2 mb-4">
            {[["usd", "USD"], ["bcv", "Bolívares BCV"], ["paralelo", "Bolívares paralelo"]].map(([v, label]) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`text-xs px-4 py-1.5 rounded-full border transition-colors ${
                  view === v
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["#", "Quincena", "Cuota", "Capital", "Interés / margen", "Tipo"].map((h) => (
                      <th key={h} className="text-left text-xs font-medium text-gray-400 px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {quincenas.map(({ q, label, cuota, capital, margen, esRetorno }) => (
                    <tr key={q} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5 text-gray-400">{q}</td>
                      <td className="px-4 py-2.5 text-gray-700">{label}</td>
                      <td className="px-4 py-2.5 font-medium text-gray-900">{displayAmount(cuota)}</td>
                      <td className="px-4 py-2.5 text-gray-600">{displayAmount(capital)}</td>
                      <td className="px-4 py-2.5 text-gray-600">{displayAmount(margen)}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            esRetorno
                              ? "bg-green-50 text-green-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {esRetorno ? "Retorno capital" : "Utilidad"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {clientes.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mt-6">
            <h2 className="text-sm font-medium text-gray-900 mb-4">Registrar Préstamo en el Sistema</h2>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Seleccionar Cliente</label>
                <select 
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-gray-400 bg-white"
                  value={selectedCliente}
                  onChange={e => setSelectedCliente(e.target.value)}
                >
                  <option value="">-- Selecciona un cliente --</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre} (C.I: {c.cedula}) - Liq: ${c.monto_liquidacion_actual}</option>
                  ))}
                </select>
              </div>
              <button 
                disabled={!selectedCliente || loading}
                onClick={async () => {
                  setLoading(true);
                  try {
                    const res = await api.post('/prestamos', {
                      empleadoId: parseInt(selectedCliente),
                      costoEquipo: form.costo
                    });
                    if (res.data.alerta) {
                      alert(res.data.mensaje); // Requires admin bypass if over 70%, but backend blocks it unless we pass autorizadoPor. For now just alert.
                    } else {
                      alert('Préstamo registrado exitosamente');
                      if (onSuccess) onSuccess();
                    }
                  } catch(e) {
                    alert('Error: ' + (e.response?.data?.message || e.message));
                  } finally {
                    setLoading(false);
                  }
                }}
                className="bg-gray-900 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Confirmar Préstamo'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}