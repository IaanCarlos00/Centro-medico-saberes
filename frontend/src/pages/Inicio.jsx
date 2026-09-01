import { useEffect, useState } from 'react'
import { frases } from '../data/frases'
import { Link } from 'react-router-dom'
import axios from 'axios'
import ListaConVerMas from '../components/ListaConVerMas'
import { infoPermiteEstudiantes } from '../utils/permiteEstudiantes'
import { esAtencionOnline } from '../utils/esOnline'
import { hoyChile } from '../utils/fechaChile'

const API = 'https://centro-medico-saberes-production.up.railway.app/dashboard'

const estadoBadge = {
  pendiente: 'bg-yellow-100 text-yellow-700',
  confirmada: 'bg-blue-100 text-blue-700',
  realizada: 'bg-green-100 text-green-700',
  cancelada: 'bg-red-100 text-red-700',
}

const estadoIcono = {
  pendiente: '🕐',
  confirmada: '✅',
  realizada: '🏥',
  cancelada: '❌',
}

function formatCLP(n) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n)
}

export default function Inicio() {
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [filtroFecha, setFiltroFecha] = useState('mes')
  const [fechaDia, setFechaDia] = useState(hoyChile())
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [atencionesProf, setAtencionesProf] = useState([])
  const [cargandoProf, setCargandoProf] = useState(false)
  const nombre = localStorage.getItem('nombre')

  const cargarAtencionesProf = async () => {
    setCargandoProf(true)
    try {
      let url = `${API}/atenciones-profesional`
      if (filtroFecha === 'dia') url += `?fecha=${fechaDia}`
      else if (filtroFecha === 'rango' && fechaDesde && fechaHasta) url += `?desde=${fechaDesde}&hasta=${fechaHasta}`
      const res = await axios.get(url)
      setAtencionesProf(res.data)
    } finally {
      setCargandoProf(false)
    }
  }

  useEffect(() => { cargarAtencionesProf() }, [filtroFecha, fechaDia, fechaDesde, fechaHasta])

  const getFrase = () => {
    const usuarioId = parseInt(localStorage.getItem('id') || '1')
    const diaNro = Math.floor(Date.now() / 86400000)
    return frases[(diaNro + usuarioId) % frases.length]
  }

  const hoy = new Date().toLocaleDateString('es-CL', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Santiago'
  })

  useEffect(() => {
    axios.get(API)
      .then(res => setDatos(res.data))
      .finally(() => setCargando(false))
  }, [])

  return (
    <div className="min-h-screen bg-white">

      {/* Hero header */}
      <div className="relative overflow-hidden rounded-3xl mb-8 p-8" style={{ background: 'linear-gradient(135deg, #052e16 0%, #166534 50%, #15803d 100%)' }}>
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #86efac, transparent)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #4ade80, transparent)', transform: 'translate(-30%, 30%)' }} />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-green-300 text-sm font-medium capitalize mb-2">{hoy}</p>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Bienvenido, {nombre} 👋</h1>
            <p className="text-green-200 text-sm italic">✨ {getFrase()}</p>
          </div>
          <img src="/logo.png" alt="Saberes" className="h-20 w-20 rounded-full object-cover hidden md:block" style={{ boxShadow: '0 0 0 4px rgba(255,255,255,0.15), 0 8px 32px rgba(0,0,0,0.3)' }} />
        </div>
      </div>

      {cargando ? (
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-green-200 border-t-green-700 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400 font-medium">Cargando estadísticas...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: '👤', label: 'Pacientes', value: datos.totalPacientes, sub: 'Total registradas', gradient: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '#16a34a', text: '#166534' },
              { icon: '📅', label: 'Citas hoy', value: datos.citasHoy, sub: 'Programadas', gradient: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '#3b82f6', text: '#1d4ed8' },
              { icon: '🏥', label: 'Atenciones', value: datos.atencionesMes, sub: `${datos.atencionesTotal} históricas`, gradient: 'linear-gradient(135deg, #f0fdfa, #ccfbf1)', border: '#14b8a6', text: '#0f766e' },
              { icon: '💰', label: 'Con deuda', value: datos.pacientesDeuda.length, sub: 'Pago pendiente', gradient: 'linear-gradient(135deg, #fef2f2, #fee2e2)', border: '#ef4444', text: '#b91c1c' },
            ].map((card, i) => (
              <div key={i} className="rounded-2xl p-5 transition-all hover:scale-105 hover:shadow-lg cursor-default" style={{ background: card.gradient, border: `1px solid ${card.border}22` }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: `${card.border}22` }}>
                    {card.icon}
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: card.text }}>{card.label}</span>
                </div>
                <p className="text-4xl font-black mb-1" style={{ color: card.text }}>{card.value}</p>
                <p className="text-xs text-gray-500">{card.sub}</p>
              </div>
            ))}
          </div>

          {/* Ingresos + Atenciones por profesional */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow card-surface">
              <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
                <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-base">💵</span>
                Ingresos
              </h3>
              <div className="flex flex-col gap-3">
                <div className="rounded-xl p-4 flex justify-between items-center" style={{ background: 'linear-gradient(135deg, #052e16, #166534)' }}>
                  <div>
                    <p className="text-green-300 text-xs font-medium mb-1">Este mes</p>
                    <p className="text-2xl font-black text-white">{formatCLP(datos.ingresosMes)}</p>
                  </div>
                  <span className="text-3xl opacity-80">📈</span>
                </div>
                <div className="rounded-xl p-4 flex justify-between items-center bg-gray-50 border border-gray-100">
                  <div>
                    <p className="text-gray-400 text-xs font-medium mb-1">Total histórico</p>
                    <p className="text-2xl font-black text-gray-800">{formatCLP(datos.ingresosTotal)}</p>
                  </div>
                  <span className="text-3xl opacity-60">🏦</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow card-surface">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-base">🩺</span>
                Atenciones por profesional
              </h3>
              <div className="flex gap-2 mb-4">
                {['mes', 'dia', 'rango'].map(f => (
                  <button key={f} onClick={() => setFiltroFecha(f)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filtroFecha === f ? 'bg-green-700 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                    {f === 'mes' ? 'Este mes' : f === 'dia' ? 'Por día' : 'Rango'}
                  </button>
                ))}
              </div>
              {filtroFecha === 'dia' && <input type="date" className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 mb-3 w-full" value={fechaDia} onChange={e => setFechaDia(e.target.value)} />}
              {filtroFecha === 'rango' && (
                <div className="flex gap-2 mb-3">
                  <input type="date" className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 flex-1" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
                  <span className="text-gray-300 self-center">→</span>
                  <input type="date" className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 flex-1" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
                </div>
              )}
              <div className="flex flex-col gap-2">
                {cargandoProf ? (
                  <p className="text-sm text-gray-400 text-center py-4">Cargando...</p>
                ) : atencionesProf.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Sin atenciones en el período</p>
                ) : atencionesProf.map((p, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-green-200 transition-colors">
                    <p className="font-semibold text-gray-800 text-sm">{p.nombre} {p.apellido}</p>
                    <div className="flex gap-4 text-sm">
                      <div className="text-center">
                        <p className="font-black text-teal-600">{p.atenciones}</p>
                        <p className="text-xs text-gray-400">atenciones</p>
                      </div>
                      <div className="text-center">
                        <p className="font-black text-green-700">{formatCLP(p.ingresos || 0)}</p>
                        <p className="text-xs text-gray-400">ingresos</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Citas de hoy + Estado */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="md:col-span-2 rounded-2xl p-6 border border-gray-100 shadow-sm card-surface">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-base">📋</span>
                  Citas de hoy
                </h3>
                <Link to="/citas" className="text-xs font-semibold text-green-700 hover:text-green-800 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors">Ver todas →</Link>
              </div>
              {datos.proximasCitas.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-5xl mb-3">📭</p>
                  <p className="text-gray-400 text-sm">No hay citas programadas para hoy</p>
                </div>
              ) : (
                <ListaConVerMas items={datos.proximasCitas} limite={5} renderItem={(c, i) => {
                  const online = esAtencionOnline(c.procedimiento_nombre)
                  return (
                  <div key={i} className={`flex items-center gap-4 p-3 rounded-xl transition-colors border ${online ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50 border-transparent hover:border-gray-100'}`}>
                    <div className="text-white rounded-xl px-3 py-2 text-center min-w-[56px] shrink-0" style={{ background: 'linear-gradient(135deg, #166534, #15803d)' }}>
                      <p className="text-base font-black leading-none">{c.fecha_hora?.slice(11,16)}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate flex items-center gap-2 flex-wrap">
                        {c.paciente_nombre} {c.paciente_apellido}
                        {online && (
                          <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
                            🖥️ ONLINE
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 truncate">con {c.profesional_nombre} {c.profesional_apellido}</p>
                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                          ⏱️ {c.duracion_minutos || 30} min
                        </span>
                        {(() => {
                          const info = infoPermiteEstudiantes(c.permite_estudiantes)
                          return (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${info.clase}`}>
                              {info.icono} {info.texto}
                            </span>
                          )
                        })()}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold whitespace-nowrap shrink-0 ${estadoBadge[c.estado]}`}>
                      {estadoIcono[c.estado]} {c.estado}
                    </span>
                  </div>
                  )
                }} />
              )}
            </div>

            <div className="rounded-2xl p-6 border border-gray-100 shadow-sm card-surface">
              <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
                <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-base">📊</span>
                Estado general
              </h3>
              <div className="flex flex-col gap-4">
                {Object.entries(datos.estados).map(([estado, count]) => {
                  const total = Object.values(datos.estados).reduce((a, b) => a + b, 0)
                  const pct = Math.min(100, (count / Math.max(1, total)) * 100)
                  const colors = { pendiente: '#f59e0b', confirmada: '#3b82f6', realizada: '#22c55e', cancelada: '#ef4444' }
                  return (
                    <div key={estado}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm text-gray-600 capitalize flex items-center gap-1">{estadoIcono[estado]} {estado}</span>
                        <span className="text-sm font-black text-gray-800">{count}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: colors[estado] }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Deuda */}
          {datos.pacientesDeuda.length > 0 && (
            <div className="rounded-2xl p-6 mb-8 border border-red-100 shadow-sm" style={{ background: 'linear-gradient(145deg, #fff, #fef2f2)' }}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-base">⚠️</span>
                  Pacientes con pago pendiente
                </h3>
                <Link to="/pagos" className="text-xs font-semibold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors">Ver pagos →</Link>
              </div>
              <ListaConVerMas items={datos.pacientesDeuda} limite={5} renderItem={(p, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white hover:bg-red-50 transition-colors border border-red-100">
                  <div>
                    <p className="font-semibold text-gray-800">{p.nombre} {p.apellido}</p>
                    <p className="text-xs text-gray-400">{p.rut || 'Sin RUT'} {p.telefono ? `· ${p.telefono}` : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-red-600">{formatCLP(p.monto_pendiente)}</p>
                    <p className="text-xs text-gray-400">{p.cantidad_pendiente} pago{p.cantidad_pendiente > 1 ? 's' : ''}</p>
                  </div>
                </div>
              )} />
            </div>
          )}

          {/* Próximos controles */}
          {datos.proximosControles && datos.proximosControles.length > 0 && (
            <div className="rounded-2xl p-6 mb-8 border border-teal-100 shadow-sm" style={{ background: 'linear-gradient(145deg, #fff, #f0fdfa)' }}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-base">📅</span>
                  Próximos controles
                </h3>
                <Link to="/controles" className="text-xs font-semibold text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg hover:bg-teal-100 transition-colors">Ver todos →</Link>
              </div>
              <div className="flex flex-col gap-2">
                {datos.proximosControles.slice(0, 5).map((c, i) => {
                  const dias = Math.round((new Date(String(c.proximo_control).slice(0,10) + 'T12:00:00') - new Date().setHours(0,0,0,0)) / 86400000)
                  const color = dias < 0 ? '#ef4444' : dias <= 7 ? '#f97316' : dias <= 30 ? '#f59e0b' : '#22c55e'
                  return (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white border border-gray-100 hover:border-teal-200 transition-colors">
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{c.paciente_nombre} {c.paciente_apellido}</p>
                        <p className="text-xs text-gray-400">{c.telefono} · {c.profesional_nombre}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-700">{new Date(String(c.proximo_control).slice(0,10) + 'T12:00:00').toLocaleDateString('es-CL')}</p>
                        <p className="text-xs font-semibold" style={{ color }}>{dias < 0 ? '🔴 Vencido' : dias === 0 ? '🟢 Hoy' : `En ${dias} días`}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Gráfico atenciones */}
          {datos.atencionesPorMes && datos.atencionesPorMes.length > 0 && (
            <div className="rounded-2xl p-6 mb-8 border border-gray-100 shadow-sm card-surface">
              <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
                <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-base">📊</span>
                Atenciones realizadas (últimos 6 meses)
              </h3>
              <div className="flex flex-col gap-3">
                {datos.atencionesPorMes.map((m, i) => {
                  const max = Math.max(...datos.atencionesPorMes.map(x => parseInt(x.total)))
                  const pct = max > 0 ? (parseInt(m.total) / max) * 100 : 0
                  const gradients = [
                    'linear-gradient(90deg, #166534, #22c55e)',
                    'linear-gradient(90deg, #0f766e, #2dd4bf)',
                    'linear-gradient(90deg, #1d4ed8, #60a5fa)',
                    'linear-gradient(90deg, #7c3aed, #a78bfa)',
                    'linear-gradient(90deg, #166534, #4ade80)',
                    'linear-gradient(90deg, #0e7490, #22d3ee)',
                  ]
                  return (
                    <div key={i} className="flex items-center gap-4">
                      <span className="text-xs font-semibold text-gray-400 w-8 text-right shrink-0">{m.mes_nombre}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                        <div className="h-8 rounded-full flex items-center justify-end pr-4 transition-all" style={{ width: `${Math.max(pct, 5)}%`, background: gradients[i % gradients.length] }}>
                          <span className="text-white text-xs font-black">{m.total}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Actividad reciente */}
          {datos.logsRecientes && datos.logsRecientes.length > 0 && (
            <div className="rounded-2xl p-6 mb-8 border border-gray-100 shadow-sm card-surface">
              <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
                <span className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-base">📋</span>
                Actividad reciente
              </h3>
              <ListaConVerMas items={datos.logsRecientes} limite={5} renderItem={(l, i) => (
                <div key={i} className="flex items-center gap-3 text-sm p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${l.accion === 'crear' ? 'bg-green-100 text-green-700' : l.accion === 'editar' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-600'}`}>{l.accion}</span>
                  <span className="text-gray-600 capitalize font-medium">{l.entidad}</span>
                  <span className="text-gray-400 truncate">{l.detalle}</span>
                  <span className="text-gray-300 text-xs ml-auto shrink-0 hidden md:block">{l.usuario_nombre} · {new Date(l.created_at).toLocaleString('es-CL')}</span>
                </div>
              )} />
            </div>
          )}
        </>
      )}
    </div>
  )
}