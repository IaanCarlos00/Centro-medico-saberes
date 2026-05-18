import { useEffect, useState } from 'react'
import axios from 'axios'
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { es } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const API = 'https://centro-medico-saberes-production.up.railway.app/bloqueos'
const API_PRO = 'https://centro-medico-saberes-production.up.railway.app/profesionales'

const localizer = dateFnsLocalizer({
  format: (date, formatStr, options) => format(date, formatStr, { locale: es, ...options }),
  parse: (str, formatStr) => parse(str, formatStr, new Date(), { locale: es }),
  startOfWeek: () => startOfWeek(new Date(), { locale: es }),
  getDay,
  locales: { es },
})

const messages = {
  allDay: 'Todo el día', previous: '← Anterior', next: 'Siguiente →',
  today: 'Hoy', month: 'Mes', week: 'Semana', day: 'Día',
  date: 'Fecha', time: 'Hora', event: 'Bloqueo', noEventsInRange: 'Sin bloqueos',
}

const coloresProfesional = ['#ef4444', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4']

function formatFecha(f) {
  const pad = n => String(n).padStart(2, '0')
  const d = f instanceof Date ? f : new Date(f)
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function localISO(date) {
  const pad = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function Bloqueos() {
  const [bloqueos, setBloqueos] = useState([])
  const [profesionales, setProfesionales] = useState([])
  const [fecha, setFecha] = useState(new Date())
  const [vistaCalendario, setVistaCalendario] = useState(Views.WEEK)
  const [modalConfirmar, setModalConfirmar] = useState(null)
  const [motivo, setMotivo] = useState('')
  const [profesionalSeleccionado, setProfesionalSeleccionado] = useState('')
  const [filtroProfesional, setFiltroProfesional] = useState('')

  const usuarioId = localStorage.getItem('id')
  const usuarioRol = localStorage.getItem('rol')
  const usuarioProfesionalId = localStorage.getItem('profesional_id')
  const esMatrona = usuarioRol === 'matrona'

  const cargar = async () => {
    const [b, pr] = await Promise.all([axios.get(API), axios.get(API_PRO)])
    setBloqueos(b.data)
    setProfesionales(pr.data)
  }

  useEffect(() => { cargar() }, [])

  const colorPorProfesional = (profesional_id) => {
    const idx = profesionales.findIndex(p => p.id === parseInt(profesional_id))
    return coloresProfesional[idx % coloresProfesional.length] || '#ef4444'
  }

  const bloqueosFiltrados = filtroProfesional
    ? bloqueos.filter(b => String(b.profesional_id) === filtroProfesional)
    : bloqueos

  const eventos = bloqueosFiltrados.map(b => ({
    id: b.id,
    title: `🚫 ${b.profesional_nombre ? b.profesional_nombre + ' ' + b.profesional_apellido : 'Bloqueado'}${b.motivo ? ': ' + b.motivo : ''}`,
    start: new Date(b.fecha_inicio.replace(' ', 'T')),
    end: new Date(b.fecha_fin.replace(' ', 'T')),
    resource: b,
    profesional_id: b.profesional_id
  }))

  const handleSelectSlot = ({ start, end }) => {
    setModalConfirmar({ inicio: start, fin: end })
    setMotivo('')
    setProfesionalSeleccionado(esMatrona ? usuarioProfesionalId : '')
  }

  const confirmarBloqueo = async () => {
    const profId = esMatrona ? usuarioProfesionalId : profesionalSeleccionado
    if (!profId) return alert('Selecciona un profesional')
    await axios.post(API, {
      fecha_inicio: localISO(modalConfirmar.inicio),
      fecha_fin: localISO(modalConfirmar.fin),
      motivo: motivo || null,
      creado_por: usuarioId || null,
      profesional_id: profId
    })
    setModalConfirmar(null)
    setMotivo('')
    cargar()
  }

  const eliminarBloqueo = async id => {
    if (confirm('¿Eliminar este bloqueo?')) {
      await axios.delete(`${API}/${id}`)
      cargar()
    }
  }

  const esPasado = f => new Date(f) < new Date()

  return (
    <div>
      <h2 className="text-2xl font-bold text-green-800 mb-2">Bloquear horarios</h2>
      <p className="text-gray-500 text-sm mb-4">Haz clic en un bloque del calendario para bloquearlo.</p>

      {/* Filtro y leyenda — solo para no matronas */}
      {!esMatrona && (
        <div className="flex flex-wrap gap-3 mb-4 items-center">
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            value={filtroProfesional}
            onChange={e => setFiltroProfesional(e.target.value)}
          >
            <option value="">Todos los profesionales</option>
            {profesionales.map(p => (
              <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
            ))}
          </select>
          <div className="flex gap-2 flex-wrap">
            {profesionales.map((p, i) => (
              <div key={p.id} className="flex items-center gap-1 text-xs text-gray-600">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: coloresProfesional[i % coloresProfesional.length] }}></div>
                {p.nombre} {p.apellido}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal confirmar bloqueo */}
      {modalConfirmar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4" onClick={() => setModalConfirmar(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🚫</span>
              <div>
                <h3 className="text-lg font-bold text-green-800">Bloquear horario</h3>
                <p className="text-sm text-gray-500">{formatFecha(modalConfirmar.inicio)} → {formatFecha(modalConfirmar.fin)}</p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {esMatrona ? (
                <p className="text-sm text-gray-600">Profesional: <span className="font-medium">
                  {profesionales.find(p => String(p.id) === String(usuarioProfesionalId))?.nombre}{' '}
                  {profesionales.find(p => String(p.id) === String(usuarioProfesionalId))?.apellido}
                </span></p>
              ) : (
                <div className="flex flex-col">
                  <label className="text-sm text-gray-600 mb-1">Profesional *</label>
                  <select
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                    value={profesionalSeleccionado}
                    onChange={e => setProfesionalSeleccionado(e.target.value)}
                  >
                    <option value="">Seleccionar profesional</option>
                    {profesionales.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">Motivo (opcional)</label>
                <input
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="Ej: Capacitación, día libre, reunión..."
                  value={motivo}
                  onChange={e => setMotivo(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={confirmarBloqueo} className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 font-medium">🚫 Bloquear</button>
              <button onClick={() => setModalConfirmar(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 font-medium">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Calendario */}
      <div className="bg-white rounded-xl shadow p-4 mb-6" style={{ height: 640 }}>
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
          views={[Views.WEEK, Views.DAY]}
          min={new Date(0, 0, 0, 8, 0, 0)}
          max={new Date(0, 0, 0, 20, 0, 0)}
          step={30}
          timeslots={1}
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={e => eliminarBloqueo(e.resource.id)}
          eventPropGetter={evento => ({
            style: {
              backgroundColor: colorPorProfesional(evento.profesional_id),
              borderRadius: '6px',
              border: 'none',
              color: 'white',
              fontSize: '12px',
              padding: '2px 6px',
              cursor: 'pointer',
              opacity: 0.85
            }
          })}
          style={{ height: '100%' }}
        />
      </div>

      <p className="text-xs text-gray-400 text-center">Haz clic en un bloqueo para eliminarlo</p>

      {bloqueos.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-bold text-gray-700 mb-3">Bloqueos activos</h3>
          <div className="flex flex-col gap-2">
            {bloqueos.filter(b => !esPasado(b.fecha_fin)).map(b => (
              <div key={b.id} className="bg-white rounded-xl shadow p-4 border-l-4 flex justify-between items-center" style={{ borderColor: colorPorProfesional(b.profesional_id) }}>
                <div>
                  <p className="font-medium text-gray-800">🚫 {formatFecha(b.fecha_inicio)} → {formatFecha(b.fecha_fin)}</p>
                  {b.profesional_nombre && <p className="text-sm text-gray-600">{b.profesional_nombre} {b.profesional_apellido}</p>}
                  {b.motivo && <p className="text-sm text-gray-500">{b.motivo}</p>}
                </div>
                <button onClick={() => eliminarBloqueo(b.id)} className="text-red-500 hover:underline text-sm font-medium ml-4">Eliminar</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}