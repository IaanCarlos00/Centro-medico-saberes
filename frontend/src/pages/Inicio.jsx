import { useEffect, useState } from 'react'
import { frases } from '../data/frases'
import { Link } from 'react-router-dom'
import axios from 'axios'
import ListaConVerMas from '../components/ListaConVerMas'

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
  const [fechaDia, setFechaDia] = useState(new Date().toISOString().slice(0, 10))
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
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  useEffect(() => {
    axios.get(API)
      .then(res => setDatos(res.data))
      .finally(() => setCargando(false))
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-green-800">Bienvenido, {nombre} 👋</h2>
          <p className="text-gray-400 capitalize mt-1">{hoy}</p>
          <p className="text-green-700 text-sm italic mt-2">✨ {getFrase()}</p>
        </div>
        <img src="/logo.png" alt="Saberes" className="h-14 w-14 rounded-full object-cover shadow hidden md:block" />
      </div>

      {cargando ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="text-4xl mb-3">⏳</div>
            <p className="text-gray-400">Cargando estadísticas...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-green-600">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">👤</span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Total</span>
              </div>
              <p className="text-4xl font-bold text-gray-800">{datos.totalPacientes}</p>
              <p className="text-gray-500 text-sm mt-1">Pacientes</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">📅</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">Hoy</span>
              </div>
              <p className="text-4xl font-bold text-gray-800">{datos.citasHoy}</p>
              <p className="text-gray-500 text-sm mt-1">Citas programadas</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-teal-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">🏥</span>
                <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full font-medium">Este mes</span>
              </div>
              <p className="text-4xl font-bold text-gray-800">{datos.atencionesMes}</p>
              <p className="text-gray-500 text-sm mt-1">Atenciones del mes</p>
              <p className="text-xs text-gray-400 mt-1">Total histórico: {datos.atencionesTotal}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-red-400">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">💰</span>
                <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">Deuda</span>
              </div>
              <p className="text-4xl font-bold text-gray-800">{datos.pacientesDeuda.length}</p>
              <p className="text-gray-500 text-sm mt-1">Con pago pendiente</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h3 className="text-lg font-bold text-gray-800 mb-4">💵 Ingresos</h3>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
                  <div>
                    <p className="text-sm text-gray-500">Este mes</p>
                    <p className="text-2xl font-bold text-green-800">{formatCLP(datos.ingresosMes)}</p>
                  </div>
                  <span className="text-3xl">📈</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm text-gray-500">Total histórico</p>
                    <p className="text-2xl font-bold text-gray-800">{formatCLP(datos.ingresosTotal)}</p>
                  </div>
                  <span className="text-3xl">🏦</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h3 className="text-lg font-bold text-gray-800 mb-3">🩺 Atenciones por profesional</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                <button onClick={() => setFiltroFecha('mes')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filtroFecha === 'mes' ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Este mes</button>
                <button onClick={() => setFiltroFecha('dia')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filtroFecha === 'dia' ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Por día</button>
                <button onClick={() => setFiltroFecha('rango')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filtroFecha === 'rango' ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Rango</button>
              </div>
              {filtroFecha === 'dia' && (
                <input type="date" className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 mb-3 w-full" value={fechaDia} onChange={e => setFechaDia(e.target.value)} />
              )}
              {filtroFecha === 'rango' && (
                <div className="flex gap-2 mb-3">
                  <input type="date" className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 flex-1" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
                  <span className="text-gray-400 self-center">→</span>
                  <input type="date" className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 flex-1" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
                </div>
              )}
              <div className="flex flex-col gap-2">
                {cargandoProf ? (
                  <p className="text-sm text-gray-400 text-center py-4">Cargando...</p>
                ) : atencionesProf.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Sin atenciones en el período</p>
                ) : atencionesProf.map((p, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <p className="font-medium text-gray-800">{p.nombre} {p.apellido}</p>
                    <div className="flex gap-4 text-sm">
                      <div className="text-center">
                        <p className="font-bold text-teal-700">{p.atenciones}</p>
                        <p className="text-xs text-gray-400">atenciones</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-green-700">{formatCLP(p.ingresos || 0)}</p>
                        <p className="text-xs text-gray-400">ingresos</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="md:col-span-2 bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">Citas de hoy</h3>
                <Link to="/citas" className="text-green-700 text-sm hover:underline font-medium">Ver todas →</Link>
              </div>
              {datos.proximasCitas.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-4xl mb-2">📭</p>
                  <p className="text-gray-400 text-sm">No hay citas programadas para hoy</p>
                </div>
              ) : (
                <ListaConVerMas
                  items={datos.proximasCitas}
                  limite={5}
                  renderItem={(c, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="bg-green-700 text-white rounded-xl px-3 py-2 text-center min-w-[56px]">
                        <p className="text-lg font-bold leading-none">{c.fecha_hora?.slice(11,16)}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 truncate">{c.paciente_nombre} {c.paciente_apellido}</p>
                        <p className="text-sm text-gray-500 truncate">con {c.profesional_nombre} {c.profesional_apellido}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${estadoBadge[c.estado]}`}>
                        {estadoIcono[c.estado]} {c.estado}
                      </span>
                    </div>
                  )}
                />
              )}
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Estado general</h3>
              <div className="flex flex-col gap-3">
                {Object.entries(datos.estados).map(([estado, count]) => (
                  <div key={estado} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{estadoIcono[estado]}</span>
                      <span className="text-gray-600 capitalize text-sm">{estado}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${estado === 'pendiente' ? 'bg-yellow-400' : estado === 'confirmada' ? 'bg-blue-400' : estado === 'realizada' ? 'bg-green-500' : 'bg-red-400'}`}
                          style={{ width: `${Math.min(100, (count / Math.max(1, Object.values(datos.estados).reduce((a,b) => a+b, 0))) * 100)}%` }}
                        />
                      </div>
                      <span className="font-bold text-gray-800 w-6 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {datos.pacientesDeuda.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-5 mb-6 border-l-4 border-red-400">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">⚠️ Pacientes con pago pendiente</h3>
                <Link to="/pagos" className="text-red-500 text-sm hover:underline font-medium">Ver pagos →</Link>
              </div>
              <ListaConVerMas
                items={datos.pacientesDeuda}
                limite={5}
                renderItem={(p, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-red-50 hover:bg-red-100 transition-colors">
                    <div>
                      <p className="font-semibold text-gray-800">{p.nombre} {p.apellido}</p>
                      <p className="text-xs text-gray-500">{p.rut || 'Sin RUT'} {p.telefono ? `· ${p.telefono}` : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">{formatCLP(p.monto_pendiente)}</p>
                      <p className="text-xs text-gray-400">{p.cantidad_pendiente} pago{p.cantidad_pendiente > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                )}
              />
            </div>
          )}

          {datos.proximosControles && datos.proximosControles.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-5 mb-6 border-l-4 border-teal-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">📅 Próximos controles</h3>
                <Link to="/controles" className="text-teal-600 text-sm hover:underline font-medium">Ver todos →</Link>
              </div>
              <div className="flex flex-col gap-2">
                {datos.proximosControles.slice(0, 5).map((c, i) => {
                  const dias = Math.round((new Date(String(c.proximo_control).slice(0,10) + 'T12:00:00') - new Date().setHours(0,0,0,0)) / 86400000)
                  const color = dias < 0 ? 'border-red-400 bg-red-50' : dias <= 7 ? 'border-orange-300 bg-orange-50' : dias <= 30 ? 'border-yellow-300 bg-yellow-50' : 'border-green-300 bg-teal-50'
                  const icono = dias < 0 ? '🔴' : dias <= 7 ? '🟠' : dias <= 30 ? '🟡' : '🟢'
                  return (
                    <div key={i} className={`flex items-center justify-between p-3 rounded-lg border-l-4 ${color}`}>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{c.paciente_nombre} {c.paciente_apellido}</p>
                        <p className="text-xs text-gray-500">{c.telefono} · {c.profesional_nombre}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-700">{new Date(String(c.proximo_control).slice(0,10) + 'T12:00:00').toLocaleDateString('es-CL')}</p>
                        <p className="text-xs">{icono} {dias < 0 ? 'Vencido' : dias === 0 ? 'Hoy' : `En ${dias} días`}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {datos.atencionesPorMes && datos.atencionesPorMes.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Atenciones realizadas (últimos 6 meses)</h3>
              <div className="flex flex-col gap-3">
                {datos.atencionesPorMes.map((m, i) => {
                  const max = Math.max(...datos.atencionesPorMes.map(x => parseInt(x.total)))
                  const pct = max > 0 ? (parseInt(m.total) / max) * 100 : 0
                  const colores = ['bg-green-600', 'bg-teal-500', 'bg-blue-500', 'bg-green-500', 'bg-emerald-600', 'bg-cyan-500']
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-8 text-right">{m.mes_nombre}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-7 relative">
                        <div
                          className={`h-7 rounded-full ${colores[i % colores.length]} transition-all flex items-center justify-end pr-3`}
                          style={{ width: `${Math.max(pct, 5)}%` }}
                        >
                          <span className="text-white text-xs font-bold">{m.total}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {datos.logsRecientes && datos.logsRecientes.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">📋 Actividad reciente</h3>
              <ListaConVerMas
                items={datos.logsRecientes}
                limite={5}
                renderItem={(l, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm p-2 bg-gray-50 rounded-lg">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${l.accion === 'crear' ? 'bg-green-100 text-green-700' : l.accion === 'editar' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-600'}`}>{l.accion}</span>
                    <span className="text-gray-600 capitalize">{l.entidad}</span>
                    <span className="text-gray-500">{l.detalle}</span>
                    <span className="text-gray-400 text-xs ml-auto">{l.usuario_nombre} · {new Date(l.created_at).toLocaleString('es-CL')}</span>
                  </div>
                )}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}