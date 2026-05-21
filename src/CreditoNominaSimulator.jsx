import { useState, useMemo, useEffect } from "react";
import api from './api';

function calcular({ costo, pagoInicial, gananciaInteres, bcv, paralelo, quincenas }) {
  const _costo = parseFloat(costo) || 0;
  const _pagoInicial = parseFloat(pagoInicial) || 0;
  const _gananciaInteres = parseFloat(gananciaInteres) || 0;
  const _bcv = parseFloat(bcv) || 1;
  const _paralelo = parseFloat(paralelo) || 1;
  const _quincenas = parseInt(quincenas) || 24;

  const saldoRestante = Math.max(_costo - _pagoInicial, 0);
  const totalFinal = saldoRestante + _gananciaInteres;
  const cuotaUSD = totalFinal / _quincenas;
  const diferencialCambiario = Math.abs(((_bcv - _paralelo) / _paralelo) * 100);

  return {
    saldoRestante,
    totalFinal,
    gananciaInteres: _gananciaInteres,
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
  const [mensajePrestamo, setMensajePrestamo] = useState(null);

  const [form, setForm] = useState({
    costo: 135,
    pagoInicial: 0,
    gananciaInteres: 0,
    bcv: 48.25,
    paralelo: 62,
    binance: 0,
    quincenas: 24,
  });
  const [view, setView] = useState("usd");

  useEffect(() => {
    async function fetchTasas() {
      try {
        const res = await api.get('/tasas');
        const tasas = Array.isArray(res.data) ? res.data : [];
        const bcv = tasas.find((t) => t.tipo === 'BCV');
        const paralelo = tasas.find((t) => t.tipo === 'PARALELO');
        const binance = tasas.find((t) => t.tipo === 'BINANCE');

        setForm((prev) => ({
          ...prev,
          ...(bcv ? { bcv: Number(bcv.valor) } : {}),
          ...(paralelo ? { paralelo: Number(paralelo.valor) } : {}),
          ...(binance ? { binance: Number(binance.valor) } : {}),
        }));
      } catch (e) {
        console.error(e);
      }
    }

    fetchTasas();
  }, []);

  const set = (k) => (e) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const s = useMemo(() => calcular(form), [form]);

  const quincenasLista = useMemo(() => {
    const _q = parseInt(form.quincenas) || 24;
    const capitalPorQ = s.saldoRestante / _q;
    const margenPorQ = s.gananciaInteres / _q;
    let acumCapital = 0;
    return Array.from({ length: _q }, (_, i) => {
      const q = i + 1;
      const mes = Math.ceil(q / 2);
      const label = q % 2 === 1 ? `Mes ${mes} — 1ª` : `Mes ${mes} — 2ª`;
      acumCapital += capitalPorQ;
      const esRetorno = acumCapital <= s.saldoRestante + 0.001;
      return { q, label, cuota: s.cuotaUSD, capital: capitalPorQ, margen: margenPorQ, esRetorno };
    });
  }, [s, form.quincenas]);

  function displayAmount(usd) {
    if (view === "usd") return fmtCur(usd);
    if (view === "bcv") return `Bs. ${fmt(usd * form.bcv)}`;
    return `Bs. ${fmt(usd * form.paralelo)}`;
  }

  const cards = [
    { label: "Costo unitario", value: fmtCur(parseFloat(form.costo) || 0), sub: "Costo del equipo", color: "text-gray-900" },
    { label: "Pago inicial", value: fmtCur(parseFloat(form.pagoInicial) || 0), sub: "Enganche aplicado", color: "text-gray-900" },
    { label: "Saldo restante", value: fmtCur(s.saldoRestante), sub: "Costo menos pago inicial", color: "text-gray-900" },
    { label: "Ganancia / interés", value: fmtCur(s.gananciaInteres), sub: "Opcional", color: "text-emerald-600" },
    { label: "Total final", value: fmtCur(s.totalFinal), sub: "Saldo + ganancia/interés", color: "text-gray-900" },
    { label: "Cuota quincenal", value: fmtCur(s.cuotaUSD), sub: `${form.quincenas} quincenas`, color: "text-gray-900" },
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
              <label className={labelClass}>Pago inicial ($)</label>
              <input type="number" className={inputClass} value={form.pagoInicial} step="0.01" min="0" onChange={set("pagoInicial")} />
            </div>
            <div>
              <label className={labelClass}>Ganancia fija o interés ($)</label>
              <input type="number" className={inputClass} value={form.gananciaInteres} step="0.01" min="0" onChange={set("gananciaInteres")} />
            </div>
            <div>
              <label className={labelClass}>Número de quincenas</label>
              <input type="number" className={inputClass} value={form.quincenas} step="1" min="1" onChange={set("quincenas")} />
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
            <div className="col-span-2 bg-gray-950 text-white rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">USDT Binance</p>
                <p className="text-sm text-gray-300">Actualización automática</p>
              </div>
              <p className="text-lg font-medium">Bs. {fmt(Number(form.binance) || 0, 2)}</p>
            </div>
          </div>

          <div className="border-t border-gray-100 my-4" />

          <div className="space-y-2">
            {[
              ["Costo unitario", fmtCur(parseFloat(form.costo) || 0), false],
              ["Pago inicial", `− ${fmtCur(parseFloat(form.pagoInicial) || 0)}`, false],
              ["Saldo restante", fmtCur(s.saldoRestante), false],
              ["Ganancia fija o interés", fmtCur(s.gananciaInteres), false],
              ["Total final a pagar", fmtCur(s.totalFinal), true],
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
          <p className="text-xs uppercase tracking-widest text-gray-400 font-medium mb-3">Tabla de pagos — {form.quincenas} quincenas</p>
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
                  {quincenasLista.map(({ q, label, cuota, capital, margen, esRetorno }) => (
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
                  onChange={e => {
                    setSelectedCliente(e.target.value);
                    setMensajePrestamo(null);
                  }}
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
                  setMensajePrestamo(null);
                  try {
                    const res = await api.post('/prestamos', {
                      empleadoId: parseInt(selectedCliente),
                      costoEquipo: form.costo,
                      pagoInicial: form.pagoInicial,
                      gananciaInteres: form.gananciaInteres,
                      quincenas: parseInt(form.quincenas)
                    });
                    if (res.data.alerta) {
                      setMensajePrestamo({ tipo: 'error', texto: res.data.mensaje });
                    } else {
                      setMensajePrestamo({ tipo: 'success', texto: 'Préstamo registrado exitosamente' });
                      if (onSuccess) onSuccess();
                    }
                  } catch(e) {
                    setMensajePrestamo({ tipo: 'error', texto: e.response?.data?.message || e.message });
                  } finally {
                    setLoading(false);
                  }
                }}
                className="bg-gray-900 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Confirmar Préstamo'}
              </button>
            </div>
            {mensajePrestamo && (
              <div
                className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
                  mensajePrestamo.tipo === 'success'
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                {mensajePrestamo.tipo === 'error' ? `Error: ${mensajePrestamo.texto}` : mensajePrestamo.texto}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}