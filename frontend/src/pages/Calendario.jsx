import { useEffect, useState } from 'react'
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { es } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import axios from 'axios'
import dayjs from 'dayjs'

const API = 'https://centro-medico-saberes-production.up.railway.app/citas'

const locales = { es }

const localizer = dateFnsLocalizer({
  format: (date, formatStr, options) => format(date, formatStr, { locale: es, ...options }),
  parse: (str, formatStr, locale) => parse(str, formatStr, new Date(), { locale: es }),
  startOfWeek: () => startOfWeek(new Date(), { locale: es }),
  getDay,
  locales,
})

const messages = {
  allDay: 'Todo el día',
  previous: '← Anterior',
  next: 'Siguiente →',
  today: 'Hoy',
  month: 'Mes',
  week: 'Semana',
  day: 'Día',
  agenda: 'Agenda',
  date: 'Fecha',
  time: 'Hora',
  event: 'Cita',
  noEventsInRange: 'No hay citas en este período',
}

const estadoColor = {
  pendiente: '#f59e0b',
  confirmada: '#3b82f6',
  realizada: '#22c55e',
  cancelada: '#ef4444',
}

export default function Calendario() {
  const [eventos, setEventos] = useState([])
  const [citaSeleccionada, setCitaSeleccionada] = useState(null)
  const [vista, setVista] = useState(Views.WEEK)
  const [fecha, setFecha] = useState(new Date())

  const cargar = async () => {
    const res = await axios.get(API)
    const evs = res.data.map(c => ({
      id: c.id,
      title: `${c.paciente_nombre} ${c.paciente_apellido}`,
      start: new Date(c.fecha_hora),
      end: new Date(new Date(c.fecha_hora).getTime() + 30 * 60000),
      estado: c.estado,
      observaciones: c.observaciones,
      paciente: `${c.paciente_nombre} ${c.paciente_apellido}`,
      profesional: `${c.profesional_nombre} ${c.profesional_apellido}`,
      fecha_hora: c.fecha_hora,
    }))
    setEventos(evs)
  }

  useEffect(() => { cargar() }, [])

  const eventStyleGetter = evento => ({
    style: {
      backgroundColor: estadoColor[evento.estado] || '#6b7280',
      borderRadius: '6px',
      border: 'none',
      color: 'white',
      fontSize: '12px',
      padding: '2px 6px',
      cursor: 'pointer',
    }
  })

  return (
    <div>
      <h2 className="text-2xl font-bold text-green-800 mb-2">Calendario de citas</h2>
      <div className="flex gap-4 mb-4 text-xs">
        {Object.entries(estadoColor).map(([estado, color]) => (
          <span key={estado} className="flex items-center gap-1">
            <span style={{ background: color }} className="inline-block w-3 h-3 rounded-full" />
            <span className="capitalize text-gray-600">{estado}</span>
          </span>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow p-4" style={{ height: 680 }}>
        <Calendar
          localizer={localizer}
          events={eventos}
          startAccessor="start"
          endAccessor="end"
          messages={messages}
          culture="es"
          view={vista}
          onView={v => setVista(v)}
          date={fecha}
          onNavigate={d => setFecha(d)}
          defaultView={Views.WEEK}
          views={[Views.WEEK, Views.DAY, Views.AGENDA]}
          min={new Date(0, 0, 0, 8, 0, 0)}
          max={new Date(0, 0, 0, 20, 0, 0)}
          step={30}
          timeslots={1}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={e => setCitaSeleccionada(e)}
          style={{ height: '100%' }}
        />
      </div>

      {citaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" onClick={() => setCitaSeleccionada(null)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-green-800 mb-4">Detalle de cita</h3>
            <div className="flex flex-col gap-2 text-sm">
              <div><span className="font-semibold text-gray-600">Paciente:</span> <span className="text-gray-800">{citaSeleccionada.paciente}</span></div>
              <div><span className="font-semibold text-gray-600">Profesional:</span> <span className="text-gray-800">{citaSeleccionada.profesional}</span></div>
              <div><span className="font-semibold text-gray-600">Fecha y hora:</span> <span className="text-gray-800">{dayjs(citaSeleccionada.fecha_hora).format('DD/MM/YYYY HH:mm')}</span></div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-600">Estado:</span>
                <span style={{ background: estadoColor[citaSeleccionada.estado] }} className="text-white text-xs px-2 py-1 rounded-full capitalize">{citaSeleccionada.estado}</span>
              </div>
              {citaSeleccionada.observaciones && (
                <div><span className="font-semibold text-gray-600">Observaciones:</span> <span className="text-gray-800">{citaSeleccionada.observaciones}</span></div>
              )}
            </div>
            <button onClick={() => setCitaSeleccionada(null)} className="mt-5 w-full bg-green-700 text-white py-2 rounded-lg hover:bg-green-800 transition-colors font-medium">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}