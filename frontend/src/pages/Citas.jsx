import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { es } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import dayjs from 'dayjs'

const API = 'https://centro-medico-saberes-production.up.railway.app/citas'
const API_PAC = 'https://centro-medico-saberes-production.up.railway.app/pacientes'
const API_PRO = 'https://centro-medico-saberes-production.up.railway.app/profesionales'
const API_BLOQUEOS = 'https://centro-medico-saberes-production.up.railway.app/bloqueos'

const localizer = dateFnsLocalizer({
  format: (date, formatStr, options) => format(date, formatStr, { locale: es, ...options }),
  parse: (str, formatStr) => parse(str, formatStr, new Date(), { locale: es }),
  startOfWeek: () => startOfWeek(new Date(), { locale: es }),
  getDay,
  locales: { es },
})

const messages = {
  allDay: 'Todo el día', previous: '← Anterior', next: 'Siguiente →',
  today: 'Hoy', month: 'Mes', week: 'Semana', day: 'Día', agenda: 'Agenda',
  date: 'Fecha', time: 'Hora', event: 'Cita', noEventsInRange: 'No hay citas en este período',
}

const estadoColor = {
  pendiente: { bg: '#f59e0b', badge: 'bg-yellow-100 text-yellow-700' },
  confirmada: { bg: '#3b82f6', badge: 'bg-blue-100 text-blue-700' },
  realizada: { bg: '#22c55e', badge: 'bg-green-100 text-green-700' },
  cancelada: { bg: '#ef4444', badge: 'bg-red-100 text-red-700' },
}

const HORA_MIN = '08:30'
const HORA_MAX = '19:30'

function validarFechaHora(fechaHora, bloqueos = []) {
  if (!fechaHora) return 'La hora de la cita es obligatoria'
  const fecha = new Date(fechaHora)
  const ahora = new Date()
  const diaSemana = fecha.getDay()
  const hora = fechaHora.slice(11, 16)

  if (fecha < ahora) return 'No puedes agendar en una fecha u hora que ya pasó'
  if (diaSemana === 0) return 'No se pueden agendar citas los domingos'
  if (hora < '08:30') return 'La primera hora disponible es 08:30'
  if (hora > '19:30') return 'La última hora disponible es 19:30'

  const bloqueado = bloqueos.find(b => {
    const inicio = new Date(b.fecha_inicio)
    const fin = new Date(b.fecha_fin)
    return fecha >= inicio && fecha <= fin
  })
  if (bloqueado) return `Horario bloqueado${bloqueado.motivo ? ': ' + bloqueado.motivo : ''}`

  return null
}

export default function Agenda() {
  const [citas, setCitas] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [profesionales, setProfesionales] = useState([])
  const [vistaActiva, setVistaActiva] = useState('agenda') // 'agenda' | 'historial'
  const [vistaCalendario, setVistaCalendario] = useState(Views.WEEK)
  const [fecha, setFecha] = useState(new Date())
  const [citaSeleccionada, setCitaSeleccionada] = useState(null)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({ paciente_id: '', profesional_id: '', fecha_hora: '', estado: 'pendiente', observaciones: '' })
  const [errores, setErrores] = useState({})
  const [busquedaPaciente, setBusquedaPaciente] = useState('')
  const [mostrarDropdown, setMostrarDropdown] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [historialPaciente, setHistorialPaciente] = useState([])
  const [bloqueos, setBloqueos] = useState([])
  const dropdownRef = useRef(null)

  const cargar = async () => {
  const [c, p, pr, bl] = await Promise.all([axios.get(API), axios.get(API_PAC), axios.get(API_PRO), axios.get(API_BLOQUEOS)])
  setCitas(c.data)
  setPacientes(p.data)
  setProfesionales(pr.data)
  setBloqueos(bl.data)
}

  useEffect(() => { cargar() }, [])

  useEffect(() => {
    const handleClick = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setMostrarDropdown(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const pacientesFiltrados = pacientes.filter(p => {
    const q = busquedaPaciente.toLowerCase()
    return (p.nombre || '').toLowerCase().includes(q) || (p.apellido || '').toLowerCase().includes(q) || (p.rut || '').toLowerCase().includes(q)
  }).slice(0, 8)

  const seleccionarPaciente = async p => {
    setBusquedaPaciente(`${p.nombre} ${p.apellido} — ${p.rut}`)
    setForm(f => ({ ...f, paciente_id: p.id }))
    setMostrarDropdown(false)
    setErrores(e => ({ ...e, paciente_id: '' }))
    const historial = citas.filter(c => c.paciente_id === p.id).slice(0, 3)
    setHistorialPaciente(historial)
  }

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrores({ ...errores, [e.target.name]: '' })
  }

  const validar = () => {
    const e = {}
    if (!form.paciente_id) e.paciente_id = 'Selecciona un paciente'
    if (!form.profesional_id) e.profesional_id = 'Selecciona un profesional'
    const errorFecha = validarFechaHora(form.fecha_hora, bloqueos)
    if (errorFecha) e.fecha_hora = errorFecha
    return e
  }

  const guardar = async () => {
    const e = validar()
    if (Object.keys(e).length > 0) { setErrores(e); return }
    if (editando) {
      await axios.put(`${API}/${editando}`, form)
      setEditando(null)
    } else {
      await axios.post(API, form)
    }
    setForm({ paciente_id: '', profesional_id: '', fecha_hora: '', estado: 'pendiente', observaciones: '' })
    setBusquedaPaciente('')
    setHistorialPaciente([])
    setErrores({})
    setMostrarFormulario(false)
    cargar()
  }

  const editar = c => {
    setForm({ paciente_id: c.paciente_id, profesional_id: c.profesional_id, fecha_hora: c.fecha_hora?.slice(0,16), estado: c.estado, observaciones: c.observaciones || '' })
    setBusquedaPaciente(`${c.paciente_nombre} ${c.paciente_apellido}`)
    setHistorialPaciente(citas.filter(ci => ci.paciente_id === c.paciente_id && ci.id !== c.id).slice(0, 3))
    setEditando(c.id)
    setMostrarFormulario(true)
    setCitaSeleccionada(null)
    setVistaActiva('agenda')
  }

  const eliminar = async id => {
    if (confirm('¿Eliminar cita?')) {
      await axios.delete(`${API}/${id}`)
      setCitaSeleccionada(null)
      cargar()
    }
  }

  const cancelar = () => {
    setEditando(null)
    setForm({ paciente_id: '', profesional_id: '', fecha_hora: '', estado: 'pendiente', observaciones: '' })
    setBusquedaPaciente('')
    setHistorialPaciente([])
    setErrores({})
    setMostrarFormulario(false)
  }

  const eventos = citas.map(c => ({
    id: c.id,
    title: `${c.paciente_nombre} ${c.paciente_apellido}`,
    start: new Date(c.fecha_hora),
    end: new Date(new Date(c.fecha_hora).getTime() + 30 * 60000),
    resource: c,
  }))

  const filtradas = citas.filter(c => {
    const q = busqueda.toLowerCase()
    const coincideBusqueda = !busqueda ||
      `${c.paciente_nombre || ''} ${c.paciente_apellido || ''}`.toLowerCase().includes(q) ||
      `${c.profesional_nombre || ''} ${c.profesional_apellido || ''}`.toLowerCase().includes(q) ||
      (c.observaciones && c.observaciones.toLowerCase().includes(q))
    const coincideEstado = !filtroEstado || c.estado === filtroEstado
    return coincideBusqueda && coincideEstado
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-green-800">Agenda</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setVistaActiva('agenda')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${vistaActiva === 'agenda' ? 'bg-green-700 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >📅 Agenda</button>
          <button
            onClick={() => setVistaActiva('historial')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${vistaActiva === 'historial' ? 'bg-green-700 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >📋 Historial</button>
        </div>
      </div>

      {/* VISTA AGENDA */}
      {vistaActiva === 'agenda' && (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => { setMostrarFormulario(!mostrarFormulario); if (mostrarFormulario) cancelar() }}
              className="bg-green-700 text-white px-5 py-2 rounded-lg hover:bg-green-800 font-medium transition-colors"
            >
              {mostrarFormulario ? 'Cancelar' : '+ Nueva cita'}
            </button>
          </div>

          {mostrarFormulario && (
            <div className="bg-white rounded-xl shadow p-5 mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">{editando ? 'Editar cita' : 'Agendar nueva cita'}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">

                {/* Buscador paciente */}
                <div className="flex flex-col relative" ref={dropdownRef}>
                  <label className="text-sm text-gray-600 mb-1">Paciente</label>
                  <input
                    className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.paciente_id ? 'border-red-400' : 'border-gray-300'}`}
                    placeholder="Buscar por nombre, apellido o RUT..."
                    value={busquedaPaciente}
                    onChange={e => {
                      setBusquedaPaciente(e.target.value)
                      setMostrarDropdown(true)
                      setForm(f => ({ ...f, paciente_id: '' }))
                      setHistorialPaciente([])
                      setErrores(er => ({ ...er, paciente_id: '' }))
                    }}
                    onFocus={() => setMostrarDropdown(true)}
                  />
                  {errores.paciente_id && <span className="text-red-500 text-xs mt-1">{errores.paciente_id}</span>}
                  {mostrarDropdown && busquedaPaciente.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto mt-1">
                      {pacientesFiltrados.length === 0 ? (
                        <p className="px-3 py-2 text-sm text-gray-400">No se encontraron pacientes</p>
                      ) : (
                        pacientesFiltrados.map(p => (
                          <button key={p.id} className="w-full text-left px-3 py-2 hover:bg-green-50 text-sm border-b border-gray-100 last:border-0" onClick={() => seleccionarPaciente(p)}>
                            <span className="font-medium text-gray-800">{p.nombre} {p.apellido}</span>
                            <span className="text-gray-400 ml-2 text-xs">{p.rut}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Profesional */}
                <div className="flex flex-col">
                  <label className="text-sm text-gray-600 mb-1">Profesional</label>
                  <select
                    className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 w-full ${errores.profesional_id ? 'border-red-400' : 'border-gray-300'}`}
                    name="profesional_id" value={form.profesional_id} onChange={handleChange}
                  >
                    <option value="">Seleccionar profesional</option>
                    {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
                  </select>
                  {errores.profesional_id && <span className="text-red-500 text-xs mt-1">{errores.profesional_id}</span>}
                </div>

                {/* Fecha */}
                <div className="flex flex-col">
                  <label className="text-sm text-gray-600 mb-1">Hora de la cita <span className="text-gray-400 text-xs">(Lun-Vie 08:30-19:30)</span></label>
                  <input
                    className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.fecha_hora ? 'border-red-400' : 'border-gray-300'}`}
                    name="fecha_hora" type="datetime-local"
                    min={`${new Date().toISOString().slice(0,10)}T08:30`}
                    value={form.fecha_hora} onChange={handleChange}
                  />
                  {errores.fecha_hora && <span className="text-red-500 text-xs mt-1">{errores.fecha_hora}</span>}
                </div>

                {/* Estado */}
                <div className="flex flex-col">
                  <label className="text-sm text-gray-600 mb-1">Estado</label>
                  <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 w-full" name="estado" value={form.estado} onChange={handleChange}>
                    <option value="pendiente">Pendiente</option>
                    <option value="confirmada">Confirmada</option>
                    <option value="realizada">Realizada</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>

                {/* Observaciones */}
                <div className="flex flex-col sm:col-span-2">
                  <label className="text-sm text-gray-600 mb-1">Observaciones (opcional)</label>
                  <input className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" name="observaciones" value={form.observaciones} onChange={handleChange} />
                </div>
              </div>

              {/* Historial rápido del paciente */}
              {historialPaciente.length > 0 && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Últimas citas del paciente</p>
                  <div className="flex flex-col gap-1">
                    {historialPaciente.map(c => (
                      <div key={c.id} className="flex items-center gap-3 text-sm">
                        <span className="text-gray-500">{c.fecha_hora?.slice(0,16).replace('T',' ')}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoColor[c.estado]?.badge}`}>{c.estado}</span>
                        <span className="text-gray-400">{c.profesional_nombre} {c.profesional_apellido}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button onClick={guardar} className="bg-green-700 text-white px-5 py-2 rounded-lg hover:bg-green-800 font-medium">
                  {editando ? 'Actualizar' : 'Agendar'}
                </button>
                <button onClick={cancelar} className="bg-gray-200 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-300 font-medium">Cancelar</button>
              </div>
            </div>
          )}

          {/* Calendario */}
          <div className="bg-white rounded-xl shadow p-4" style={{ height: 640 }}>
            <Calendar
              localizer={localizer}
              events={eventos}
              startAccessor="start"
              endAccessor="end"
              messages={messages}
              culture="es"
              view={vistaCalendario}
              onView={setVistaCalendario}
              date={fecha}
              onNavigate={setFecha}
              views={[Views.WEEK, Views.DAY, Views.AGENDA]}
              min={new Date(0, 0, 0, 8, 0, 0)}
              max={new Date(0, 0, 0, 20, 0, 0)}
              step={30}
              timeslots={1}
              eventPropGetter={evento => ({
                style: {
                  backgroundColor: estadoColor[evento.resource.estado]?.bg || '#6b7280',
                  borderRadius: '6px', border: 'none', color: 'white', fontSize: '12px', padding: '2px 6px', cursor: 'pointer'
                }
              })}
              onSelectEvent={e => setCitaSeleccionada(e.resource)}
              style={{ height: '100%' }}
            />
          </div>

          {/* Modal detalle cita */}
          {citaSeleccionada && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4" onClick={() => setCitaSeleccionada(null)}>
              <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-green-800 mb-4">Detalle de cita</h3>
                <div className="flex flex-col gap-2 text-sm">
                  <div><span className="font-semibold text-gray-600">Paciente:</span> <span className="text-gray-800">{citaSeleccionada.paciente_nombre} {citaSeleccionada.paciente_apellido}</span></div>
                  <div><span className="font-semibold text-gray-600">Profesional:</span> <span className="text-gray-800">{citaSeleccionada.profesional_nombre} {citaSeleccionada.profesional_apellido}</span></div>
                  <div><span className="font-semibold text-gray-600">Fecha y hora:</span> <span className="text-gray-800">{dayjs(citaSeleccionada.fecha_hora).format('DD/MM/YYYY HH:mm')}</span></div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-600">Estado:</span>
                    <span style={{ background: estadoColor[citaSeleccionada.estado]?.bg }} className="text-white text-xs px-2 py-1 rounded-full capitalize">{citaSeleccionada.estado}</span>
                  </div>
                  {citaSeleccionada.observaciones && <div><span className="font-semibold text-gray-600">Observaciones:</span> <span className="text-gray-800">{citaSeleccionada.observaciones}</span></div>}
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => editar(citaSeleccionada)} className="flex-1 bg-green-700 text-white py-2 rounded-lg hover:bg-green-800 font-medium">Editar</button>
                  <button onClick={() => eliminar(citaSeleccionada.id)} className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg hover:bg-red-100 font-medium">Eliminar</button>
                  <button onClick={() => setCitaSeleccionada(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 font-medium">Cerrar</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* VISTA HISTORIAL */}
      {vistaActiva === 'historial' && (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <input
                className="w-full border border-gray-300 rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="Buscar por paciente, profesional u observaciones..."
                value={busqueda} onChange={e => setBusqueda(e.target.value)}
              />
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
              {busqueda && <button onClick={() => setBusqueda('')} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">✕</button>}
            </div>
            <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="confirmada">Confirmada</option>
              <option value="realizada">Realizada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
          {(busqueda || filtroEstado) && <p className="text-sm text-gray-500 mb-3">{filtradas.length} cita{filtradas.length !== 1 ? 's' : ''} encontrada{filtradas.length !== 1 ? 's' : ''}</p>}

          <div className="hidden md:block bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-green-50 text-green-800 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Paciente</th>
                  <th className="px-4 py-3 text-left">Profesional</th>
                  <th className="px-4 py-3 text-left">Fecha y hora</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-left">Observaciones</th>
                  <th className="px-4 py-3 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtradas.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{c.paciente_nombre} {c.paciente_apellido}</td>
                    <td className="px-4 py-3 text-gray-600">{c.profesional_nombre} {c.profesional_apellido}</td>
                    <td className="px-4 py-3 text-gray-600">{c.fecha_hora?.slice(0,16).replace('T',' ')}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${estadoColor[c.estado]?.badge}`}>{c.estado}</span></td>
                    <td className="px-4 py-3 text-gray-500">{c.observaciones}</td>
                    <td className="px-4 py-3 flex gap-2">
                      <button onClick={() => editar(c)} className="text-green-700 hover:underline text-sm font-medium">Editar</button>
                      <button onClick={() => eliminar(c.id)} className="text-red-500 hover:underline text-sm font-medium">Eliminar</button>
                    </td>
                  </tr>
                ))}
                {filtradas.length === 0 && <tr><td colSpan="6" className="px-4 py-6 text-center text-gray-400">{busqueda || filtroEstado ? 'No se encontraron resultados' : 'No hay citas registradas'}</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="md:hidden flex flex-col gap-3">
            {filtradas.map(c => (
              <div key={c.id} className="bg-white rounded-xl shadow p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-gray-800">{c.paciente_nombre} {c.paciente_apellido}</p>
                    <p className="text-sm text-gray-500">{c.profesional_nombre} {c.profesional_apellido}</p>
                    <p className="text-sm text-gray-500 mt-1">🕐 {c.fecha_hora?.slice(0,16).replace('T',' ')}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${estadoColor[c.estado]?.badge}`}>{c.estado}</span>
                </div>
                {c.observaciones && <p className="text-sm text-gray-400 mb-2">{c.observaciones}</p>}
                <div className="flex gap-3">
                  <button onClick={() => editar(c)} className="text-green-700 text-sm font-medium">Editar</button>
                  <button onClick={() => eliminar(c.id)} className="text-red-500 text-sm font-medium">Eliminar</button>
                </div>
              </div>
            ))}
            {filtradas.length === 0 && <div className="bg-white rounded-xl shadow p-6 text-center text-gray-400">{busqueda || filtroEstado ? 'No se encontraron resultados' : 'No hay citas registradas'}</div>}
          </div>
        </>
      )}
    </div>
  )
}