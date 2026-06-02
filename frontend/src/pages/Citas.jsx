import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { es } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import dayjs from 'dayjs'
import ModalProcedimientos from './ModalProcedimientos'
import { registrarLog } from '../utils/log'
import ModalConfirmar from '../components/ModalConfirmar'
import Toast from '../components/Toast'

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
  pendiente: { bg: '#d1d5db', badge: 'bg-gray-100 text-gray-600' },
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

  if (diaSemana === 0) return 'No se pueden agendar citas los domingos'
  if (hora < '08:30') return 'advertencia:Fuera de horario: la hora ingresada es antes de las 08:30. ¿Deseas continuar de todos modos?'
  if (hora > '19:30') return 'advertencia:Fuera de horario: la hora ingresada es después de las 19:30. ¿Deseas continuar de todos modos?'
  if (fecha < ahora) return 'advertencia:Esta fecha y hora ya pasaron. ¿Deseas agendar de todos modos?'

  const bloqueado = bloqueos.find(b => {
    const inicio = new Date(b.fecha_inicio)
    const fin = new Date(b.fecha_fin)
    return fecha >= inicio && fecha <= fin
  })
  if (bloqueado) return `Horario bloqueado${bloqueado.motivo ? ': ' + bloqueado.motivo : ''}`

  return null
}

function ModalPago({ cita, onConfirmar, onCerrar }) {
  const [form, setForm] = useState({ monto: '', metodo: 'fonasa', estado: 'pagado', notas: '' })
  const [errores, setErrores] = useState({})
  const API_PAGOS = 'https://centro-medico-saberes-production.up.railway.app/pagos'

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrores({ ...errores, [e.target.name]: '' })
  }

  const guardar = async () => {
    const e = {}
    if (!form.monto || isNaN(form.monto) || Number(form.monto) <= 0) e.monto = 'Ingresa un monto válido'
    if (Object.keys(e).length > 0) { setErrores(e); return }
    await axios.post(API_PAGOS, { ...form, paciente_id: cita.paciente_id, cita_id: cita.id })
    onConfirmar()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4" onClick={onCerrar}>
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-5">
          <span className="text-3xl">💰</span>
          <div>
            <h3 className="text-lg font-bold text-green-800">Registrar pago</h3>
            <p className="text-sm text-gray-500">{cita.paciente_nombre} {cita.paciente_apellido}</p>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Monto ($) *</label>
            <input className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.monto ? 'border-red-400' : 'border-gray-300'}`} name="monto" type="number" placeholder="25000" value={form.monto} onChange={handleChange} />
            {errores.monto && <span className="text-red-500 text-xs mt-1">{errores.monto}</span>}
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Método de pago</label>
            <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" name="metodo" value={form.metodo} onChange={handleChange}>
              <option value="debito">💳 Débito</option>
              <option value="efectivo">💵 Efectivo</option>
              <option value="transferencia">🏦 Transferencia</option>
              <option value="fonasa">🏥 Fonasa</option>
              <option value="credito">💳 Crédito</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Estado</label>
            <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" name="estado" value={form.estado} onChange={handleChange}>
              <option value="pagado">Pagado</option>
              <option value="pendiente">Pendiente</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Notas (opcional)</label>
            <input className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" name="notas" placeholder="Ej: Bono FONASA recibido..." value={form.notas} onChange={handleChange} />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={guardar} className="flex-1 bg-green-700 text-white py-2 rounded-lg hover:bg-green-800 font-medium">Registrar pago</button>
          <button onClick={onCerrar} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 font-medium">Cancelar</button>
        </div>
      </div>
    </div>
  )
}

export default function Agenda() {
  const [citas, setCitas] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [profesionales, setProfesionales] = useState([])
  const [vistaActiva, setVistaActiva] = useState('agenda') // 'agenda' | 'historial'
  const [vistaCalendario, setVistaCalendario] = useState(window.innerWidth < 768 ? Views.DAY : Views.WEEK)
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
  const [modalPago, setModalPago] = useState(null)
  const [citaRecienAgendada, setCitaRecienAgendada] = useState(null)
  const [modalProcedimientosCita, setModalProcedimientosCita] = useState(null)
  const [mostrarNuevoPaciente, setMostrarNuevoPaciente] = useState(false)
  const [formNuevoPaciente, setFormNuevoPaciente] = useState({ nombre: '', apellido: '' })
  const [modalAgendar, setModalAgendar] = useState(null)
  const [modalOpcion, setModalOpcion] = useState(null)
  const [modalBloquear, setModalBloquear] = useState(null)
  const [motivoBloqueo, setMotivoBloqueo] = useState('')
  const [profesionalBloqueo, setProfesionalBloqueo] = useState('')
  const usuarioRol = localStorage.getItem('rol')
  const usuarioProfesionalId = localStorage.getItem('profesional_id')
  const usuarioId = localStorage.getItem('id')
  const dropdownRef = useRef(null)
  const [catalogo, setCatalogo] = useState([])
  const [tipoAgendamiento, setTipoAgendamiento] = useState('confirmado')
  const [procedimientoSeleccionado, setProcedimientoSeleccionado] = useState(null)
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [citasPendientesAviso, setCitasPendientesAviso] = useState([])
  const [citaTentativaOrigen, setCitaTentativaOrigen] = useState(null)
  const [numeroBono, setNumeroBono] = useState('')
  const [modalEliminarCita, setModalEliminarCita] = useState(null)
  const [modalEliminarBloqueo, setModalEliminarBloqueo] = useState(null)
  const [toast, setToast] = useState(null)
  const API_PROC = 'https://centro-medico-saberes-production.up.railway.app/procedimientos'
  const API_PAGOS = 'https://centro-medico-saberes-production.up.railway.app/pagos'

  const cargar = async () => {
  const [c, p, pr, bl, cat] = await Promise.all([axios.get(API), axios.get(API_PAC), axios.get(API_PRO), axios.get(API_BLOQUEOS), axios.get(`${API_PROC}/catalogo`)])
  setCitas(c.data)
  setPacientes(p.data)
  setProfesionales(pr.data)
  setBloqueos(bl.data)
  setCatalogo(cat.data)
}

  useEffect(() => { cargar() }, [])

  useEffect(() => {
    const ahora = new Date()
    const citasPasadasSinFinalizar = citas.filter(c => {
      const horaCita = new Date(c.fecha_hora.replace(' ', 'T'))
      const esMatrona = usuarioRol === 'matrona'
      const esSuCita = !esMatrona || String(c.profesional_id) === String(usuarioProfesionalId)
      return (c.estado === 'pendiente' || c.estado === 'confirmada') && horaCita < ahora && esSuCita
    })
    if (citasPasadasSinFinalizar.length > 0) {
      setCitasPendientesAviso(citasPasadasSinFinalizar)
    }
  }, [citas])

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
  if (!editando) {
    const bloqueosProfesional = bloqueos.filter(b => !b.profesional_id || String(b.profesional_id) === String(form.profesional_id))
    const errorFecha = validarFechaHora(form.fecha_hora, bloqueosProfesional)
  if (errorFecha) {
    if (errorFecha.startsWith('advertencia:')) {
      const mensaje = errorFecha.replace('advertencia:', '')
      if (!confirm(mensaje)) e.fecha_hora = 'Agendamiento cancelado'
    } else {
      e.fecha_hora = errorFecha
    }
  }
  }
  return e
}

  const guardar = async () => {
  const e = validar()
  if (Object.keys(e).length > 0) { setErrores(e); return }

  if (editando) {
    await axios.put(`${API}/${editando}`, form)
    await registrarLog('editar', 'cita', editando, `Cita de ${busquedaPaciente}`)
    setEditando(null)
  } else {
    const res = await axios.post(API, form)
    const paciente = pacientes.find(p => p.id === parseInt(form.paciente_id))
    await registrarLog('crear', 'cita', res.data.id, `Cita de ${paciente?.nombre} ${paciente?.apellido}`)
    setCitaRecienAgendada({ ...res.data, paciente_id: form.paciente_id, paciente_nombre: paciente?.nombre, paciente_apellido: paciente?.apellido })
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
    setModalEliminarCita(id)
  }

  const confirmarEliminarCita = async () => {
    await axios.delete(`${API}/${modalEliminarCita}`)
    setModalEliminarCita(null)
    setCitaSeleccionada(null)
    setToast({ mensaje: 'Cita eliminada', tipo: 'exito' })
    cargar()
  }

  const cancelar = () => {
    setEditando(null)
    setForm({ paciente_id: '', profesional_id: '', fecha_hora: '', estado: 'pendiente', observaciones: '' })
    setBusquedaPaciente('')
    setHistorialPaciente([])
    setErrores({})
    setMostrarFormulario(false)
  }

  const eventos = [
  ...citas.map(c => ({
    id: c.id,
    title: c.paciente_nombre
  ? (c.procedimiento_nombre ? `${c.paciente_nombre} ${c.paciente_apellido} — ${c.procedimiento_nombre}` : `${c.paciente_nombre} ${c.paciente_apellido}`)
  : `⏳ ${c.referencia || 'Reserva tentativa'}`,
    start: new Date(c.fecha_hora.replace(' ', 'T')),
  end: new Date(new Date(c.fecha_hora.replace(' ', 'T')).getTime() + 30 * 60000),
    resource: c,
    tipo: 'cita'
  })),
  ...bloqueos.map(b => ({
    id: `bloqueo-${b.id}`,
    title: `🚫 ${b.profesional_nombre ? b.profesional_nombre + ' ' + b.profesional_apellido : 'Bloqueado'}${b.motivo ? ': ' + b.motivo : ''}`,
    start: new Date(b.fecha_inicio.replace(' ', 'T')),
    end: new Date(b.fecha_fin.replace(' ', 'T')),
    resource: b,
    tipo: 'bloqueo',
    profesional_id: b.profesional_id
  }))
]

  const filtradas = citas.filter(c => {
    const q = busqueda.toLowerCase()
    const coincideBusqueda = !busqueda ||
      `${c.paciente_nombre || ''} ${c.paciente_apellido || ''}`.toLowerCase().includes(q) ||
      `${c.profesional_nombre || ''} ${c.profesional_apellido || ''}`.toLowerCase().includes(q) ||
      (c.observaciones && c.observaciones.toLowerCase().includes(q))
    const coincideEstado = !filtroEstado || c.estado === filtroEstado
    return coincideBusqueda && coincideEstado
  })

  const crearPaciente = async () => {
  if (!formNuevoPaciente.nombre.trim() || !formNuevoPaciente.apellido.trim()) return alert('Ingresa nombre y apellido')
  const res = await axios.post(API_PAC, formNuevoPaciente)
  const nuevo = res.data
  await cargar()
  setBusquedaPaciente(`${nuevo.nombre} ${nuevo.apellido}`)
  setForm(f => ({ ...f, paciente_id: nuevo.id }))
  setMostrarNuevoPaciente(false)
  setFormNuevoPaciente({ nombre: '', apellido: '' })
}

  return (
  <div>
    {citasPendientesAviso.length > 0 && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
      <h3 className="text-lg font-bold text-green-800 mb-2">⏰ Citas sin finalizar</h3>
      <p className="text-sm text-gray-500 mb-4">Las siguientes citas ya pasaron su hora:</p>
      <div className="flex flex-col gap-2 mb-5 max-h-48 overflow-y-auto">
        {citasPendientesAviso.map(c => (
          <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
            <div>
              <p className="font-medium text-gray-800">{c.paciente_nombre} {c.paciente_apellido}</p>
              <p className="text-xs text-gray-400">{c.fecha_hora?.slice(0,16).replace('T',' ')}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={async () => {
                await axios.put(`${API}/${c.id}`, { ...c, estado: 'realizada' })
                setCitasPendientesAviso(prev => prev.filter(p => p.id !== c.id))
                cargar()
              }} className="text-green-700 text-xs font-medium hover:underline">Atendida</button>
              <button onClick={async () => {
                await axios.put(`${API}/${c.id}`, { ...c, estado: 'cancelada' })
                setCitasPendientesAviso(prev => prev.filter(p => p.id !== c.id))
                cargar()
              }} className="text-red-500 text-xs font-medium hover:underline">No asistió</button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => setCitasPendientesAviso([])} className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 font-medium">Resolver después</button>
    </div>
  </div>
)}

{toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onCerrar={() => setToast(null)} />}
{modalEliminarCita && (
  <ModalConfirmar
    titulo="¿Eliminar cita?"
    mensaje="Esta acción no se puede deshacer."
    textoConfirmar="Eliminar"
    onConfirmar={confirmarEliminarCita}
    onCancelar={() => setModalEliminarCita(null)}
  />
)}
{modalEliminarBloqueo && (
  <ModalConfirmar
    titulo="¿Eliminar bloqueo?"
    mensaje="El horario quedará disponible nuevamente."
    textoConfirmar="Eliminar"
    onConfirmar={() => {
      axios.delete(`${API_BLOQUEOS}/${modalEliminarBloqueo}`).then(() => {
        setModalEliminarBloqueo(null)
        setToast({ mensaje: 'Bloqueo eliminado', tipo: 'exito' })
        cargar()
      })
    }}
    onCancelar={() => setModalEliminarBloqueo(null)}
  />
)}

    {modalPago && (
      <ModalPago
        cita={modalPago}
        onConfirmar={() => { setModalPago(null); cargar() }}
        onCerrar={() => setModalPago(null)}
      />
    )}

    {citaRecienAgendada && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">📋</span>
            <div>
              <h3 className="text-lg font-bold text-green-800">Cita agendada</h3>
              <p className="text-sm text-gray-500">¿Deseas registrar el procedimiento?</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setModalProcedimientosCita(citaRecienAgendada); setCitaRecienAgendada(null) }}
              className="flex-1 bg-green-700 text-white py-2 rounded-lg hover:bg-green-800 font-medium"
            >Sí, agregar</button>
            <button
              onClick={() => setCitaRecienAgendada(null)}
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 font-medium"
            >No por ahora</button>
          </div>
        </div>
      </div>
    )}

    {modalProcedimientosCita && (
      <ModalProcedimientos
        paciente={{ id: modalProcedimientosCita.paciente_id, nombre: modalProcedimientosCita.paciente_nombre || '', apellido: modalProcedimientosCita.paciente_apellido || '' }}
        citaId={modalProcedimientosCita.id}
        onCerrar={() => { setModalProcedimientosCita(null); cargar() }}
      />
    )}

    {modalAgendar && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4" onClick={() => setModalAgendar(null)}>
    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
      <h3 className="text-lg font-bold text-green-800 mb-4">🗓️ Agendar cita</h3>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTipoAgendamiento('confirmado')} className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${tipoAgendamiento === 'confirmado' ? 'border-green-600 bg-green-50 text-green-800' : 'border-gray-200 text-gray-500'}`}>✅ Confirmada</button>
        <button onClick={() => setTipoAgendamiento('tentativo')} className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${tipoAgendamiento === 'tentativo' ? 'border-yellow-500 bg-yellow-50 text-yellow-800' : 'border-gray-200 text-gray-500'}`}>⏳ Tentativa</button>
      </div>
      {tipoAgendamiento === 'confirmado' ? (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col relative" ref={dropdownRef}>
          <label className="text-sm text-gray-600 mb-1">Paciente</label>
          <input
            className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.paciente_id ? 'border-red-400' : 'border-gray-300'}`}
            placeholder="Buscar por nombre, apellido o RUT..."
            value={busquedaPaciente}
            onChange={e => { setBusquedaPaciente(e.target.value); setMostrarDropdown(true); setForm(f => ({ ...f, paciente_id: '' })); setErrores(er => ({ ...er, paciente_id: '' })) }}
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

        <div className="flex flex-col gap-2">
          <button type="button" onClick={() => setMostrarNuevoPaciente(!mostrarNuevoPaciente)} className="text-green-700 text-sm hover:underline text-left font-medium">
            + Registrar paciente nuevo
          </button>
          {mostrarNuevoPaciente && (
            <div className="flex gap-2 items-end bg-green-50 p-3 rounded-lg">
              <div className="flex flex-col flex-1">
                <label className="text-xs text-gray-500 mb-1">Nombre</label>
                <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="Nombre" value={formNuevoPaciente.nombre} onChange={e => setFormNuevoPaciente(f => ({ ...f, nombre: e.target.value }))} />
              </div>
              <div className="flex flex-col flex-1">
                <label className="text-xs text-gray-500 mb-1">Apellido</label>
                <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="Apellido" value={formNuevoPaciente.apellido} onChange={e => setFormNuevoPaciente(f => ({ ...f, apellido: e.target.value }))} />
              </div>
              <button onClick={crearPaciente} className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 text-sm font-medium">Crear</button>
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Profesional</label>
          <select className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 w-full ${errores.profesional_id ? 'border-red-400' : 'border-gray-300'}`} name="profesional_id" value={form.profesional_id} onChange={handleChange}>
            <option value="">Seleccionar profesional</option>
            {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
          </select>
          {errores.profesional_id && <span className="text-red-500 text-xs mt-1">{errores.profesional_id}</span>}
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Hora de la cita</label>
          <input className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.fecha_hora ? 'border-red-400' : 'border-gray-300'}`} name="fecha_hora" type="datetime-local" value={form.fecha_hora} onChange={handleChange} />
          {errores.fecha_hora && <span className="text-red-500 text-xs mt-1">{errores.fecha_hora}</span>}
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Observaciones (opcional)</label>
          <input className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" name="observaciones" value={form.observaciones} onChange={handleChange} />
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Procedimiento (opcional)</label>
          <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" value={procedimientoSeleccionado?.id || ''} onChange={e => {
            const proc = catalogo.find(c => c.id === parseInt(e.target.value))
            setProcedimientoSeleccionado(proc || null)
          }}>
            <option value="">Sin procedimiento — quedará pendiente</option>
            {catalogo.map(c => <option key={c.id} value={c.id}>{c.nombre} — ${Number(c.monto).toLocaleString('es-CL')}</option>)}
          </select>
        </div>

        {procedimientoSeleccionado && (
          <>
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Método de pago</label>
              <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" value={metodoPago} onChange={e => setMetodoPago(e.target.value)}>
                <option value="debito">💳 Débito</option>
                <option value="efectivo">💵 Efectivo</option>
                <option value="transferencia">🏦 Transferencia</option>
                <option value="fonasa">🏥 Fonasa</option>
                <option value="credito">💳 Crédito</option>
              </select>
            </div>
            {metodoPago === 'fonasa' && (
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">Número de bono</label>
                <input
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="Ej: 123456789"
                  value={numeroBono}
                  onChange={e => setNumeroBono(e.target.value)}
                />
              </div>
            )}
          </>
        )}
      </div>
) : (
  <div className="flex flex-col gap-4">
    <div className="flex flex-col">
      <label className="text-sm text-gray-600 mb-1">Referencia (opcional)</label>
      <input
        className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        placeholder="Nombre, teléfono, últimos 4 dígitos..."
        value={form.referencia || ''}
        onChange={e => setForm(f => ({ ...f, referencia: e.target.value }))}
      />
      <p className="text-xs text-gray-400 mt-1">Puede dejarse en blanco si no hay datos</p>
    </div>
    <div className="flex flex-col">
      <label className="text-sm text-gray-600 mb-1">Profesional *</label>
      <select className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 w-full ${errores.profesional_id ? 'border-red-400' : 'border-gray-300'}`} name="profesional_id" value={form.profesional_id} onChange={handleChange}>
        <option value="">Seleccionar profesional</option>
        {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
      </select>
      {errores.profesional_id && <span className="text-red-500 text-xs mt-1">{errores.profesional_id}</span>}
    </div>
    <div className="flex flex-col">
      <label className="text-sm text-gray-600 mb-1">Hora de la cita</label>
      <input className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 ${errores.fecha_hora ? 'border-red-400' : 'border-gray-300'}`} name="fecha_hora" type="datetime-local" value={form.fecha_hora} onChange={handleChange} />
      {errores.fecha_hora && <span className="text-red-500 text-xs mt-1">{errores.fecha_hora}</span>}
    </div>
  </div>
)}

      <div className="flex gap-3 mt-6">
        <button onClick={async () => {
          if (tipoAgendamiento === 'tentativo') {
            const e = {}
            if (!form.profesional_id) e.profesional_id = 'Selecciona un profesional'
            const errorFecha = validarFechaHora(form.fecha_hora, bloqueos.filter(b => !b.profesional_id || String(b.profesional_id) === String(form.profesional_id)))
            if (errorFecha) e.fecha_hora = errorFecha
            if (Object.keys(e).length > 0) { setErrores(e); return }
            await axios.post(API, {
              paciente_id: null,
              profesional_id: form.profesional_id,
              fecha_hora: form.fecha_hora,
              estado: 'pendiente',
              referencia: form.referencia || null
            })
            setForm({ paciente_id: '', profesional_id: '', fecha_hora: '', estado: 'pendiente', observaciones: '' })
            setBusquedaPaciente('')
            setErrores({})
            setTipoAgendamiento('confirmado')
            setModalAgendar(null)
            cargar()
            return
          }
          const e = validar()
          if (Object.keys(e).length > 0) { setErrores(e); return }
          const estadoCita = procedimientoSeleccionado ? 'confirmada' : 'pendiente'
          if (citaTentativaOrigen?.id) {
            await axios.delete(`${API}/${citaTentativaOrigen.id}`)
            setCitaTentativaOrigen(null)
          }
          const res = await axios.post(API, { ...form, estado: estadoCita, procedimiento_nombre: procedimientoSeleccionado?.nombre || null })
          const paciente = pacientes.find(p => p.id === parseInt(form.paciente_id))
          if (procedimientoSeleccionado) {
            await axios.post(API_PROC, {
              paciente_id: form.paciente_id,
              catalogo_procedimiento_id: procedimientoSeleccionado.id,
              nombre: procedimientoSeleccionado.nombre,
              monto: procedimientoSeleccionado.monto,
              metodo: metodoPago,
              estado: 'pendiente',
              profesional_id: localStorage.getItem('profesional_id') || null,
              numero_bono: metodoPago === 'fonasa' ? numeroBono : null,
              cita_id: res.data.id,
              fecha_atencion: form.fecha_hora?.slice(0, 10)
            })
          }
          setCitaRecienAgendada({ ...res.data, paciente_id: form.paciente_id, paciente_nombre: paciente?.nombre, paciente_apellido: paciente?.apellido })
          setForm({ paciente_id: '', profesional_id: '', fecha_hora: '', estado: 'pendiente', observaciones: '' })
          setBusquedaPaciente('')
          setErrores({})
          setMostrarNuevoPaciente(false)
          setProcedimientoSeleccionado(null)
          setMetodoPago('debito')
          setNumeroBono('')
          setModalAgendar(null)
          cargar()
        }} className="flex-1 bg-green-700 text-white py-2 rounded-lg hover:bg-green-800 font-medium">{tipoAgendamiento === 'tentativo' ? '⏳ Reservar tentativa' : 'Agendar'}</button>
        <button onClick={() => { setModalAgendar(null); setBusquedaPaciente(''); setErrores({}) }} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 font-medium">Cancelar</button>
      </div>
    </div>
  </div>
)}

{/* Modal elegir acción */}
{modalOpcion && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4" onClick={() => setModalOpcion(null)}>
    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
      <h3 className="text-lg font-bold text-green-800 mb-2">¿Qué deseas hacer?</h3>
      <p className="text-sm text-gray-500 mb-5">{modalOpcion.fechaHora?.replace('T', ' ')}</p>
      <div className="flex flex-col gap-3">
        <button
          onClick={() => { setModalAgendar(true); setModalOpcion(null) }}
          className="flex items-center gap-3 p-4 rounded-xl border-2 border-green-600 hover:bg-green-50 transition-colors text-left"
        >
          <span className="text-2xl">🗓️</span>
          <div>
            <p className="font-bold text-green-800">Agendar cita</p>
            <p className="text-xs text-gray-500">Registrar una cita para un paciente</p>
          </div>
        </button>
        <button
          onClick={() => { setModalBloquear(modalOpcion); setMotivoBloqueo(''); setProfesionalBloqueo(usuarioRol === 'matrona' ? usuarioProfesionalId : ''); setModalOpcion(null) }}
          className="flex items-center gap-3 p-4 rounded-xl border-2 border-red-400 hover:bg-red-50 transition-colors text-left"
        >
          <span className="text-2xl">🚫</span>
          <div>
            <p className="font-bold text-red-600">Bloquear horario</p>
            <p className="text-xs text-gray-500">Marcar este horario como no disponible</p>
          </div>
        </button>
      </div>
      <button onClick={() => setModalOpcion(null)} className="w-full mt-4 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 font-medium">Cancelar</button>
    </div>
  </div>
)}

{/* Modal bloquear horario */}
{modalBloquear && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4" onClick={() => setModalBloquear(null)}>
    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">🚫</span>
        <div>
          <h3 className="text-lg font-bold text-green-800">Bloquear horario</h3>
          <p className="text-sm text-gray-500">{modalBloquear.fechaHora?.replace('T', ' ')}</p>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {usuarioRol !== 'matrona' && (
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Profesional *</label>
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              value={profesionalBloqueo}
              onChange={e => setProfesionalBloqueo(e.target.value)}
            >
              <option value="">Seleccionar profesional</option>
              {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
            </select>
          </div>
        )}
        {usuarioRol === 'matrona' && (
          <p className="text-sm text-gray-600">Profesional: <span className="font-medium">
            {profesionales.find(p => String(p.id) === String(usuarioProfesionalId))?.nombre}{' '}
            {profesionales.find(p => String(p.id) === String(usuarioProfesionalId))?.apellido}
          </span></p>
        )}
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Motivo (opcional)</label>
          <input
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
            placeholder="Ej: Capacitación, día libre, reunión..."
            value={motivoBloqueo}
            onChange={e => setMotivoBloqueo(e.target.value)}
            autoFocus
          />
        </div>
      </div>
      <div className="flex gap-3 mt-5">
        <button onClick={async () => {
          const profId = usuarioRol === 'matrona' ? usuarioProfesionalId : profesionalBloqueo
          if (!profId) return alert('Selecciona un profesional')
          await axios.post(API_BLOQUEOS, {
            fecha_inicio: modalBloquear.fechaHora,
            fecha_fin: modalBloquear.fechaHoraFin || modalBloquear.fechaHora.slice(0, 14) + '30',
            motivo: motivoBloqueo || null,
            creado_por: usuarioId || null,
            profesional_id: profId
          })
          setModalBloquear(null)
          setMotivoBloqueo('')
          cargar()
        }} className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 font-medium">🚫 Bloquear</button>
        <button onClick={() => setModalBloquear(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 font-medium">Cancelar</button>
      </div>
    </div>
  </div>
)}

    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-green-800">Agenda</h2>
      <div className="flex gap-2">
        <button onClick={() => setVistaActiva('agenda')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${vistaActiva === 'agenda' ? 'bg-green-700 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>📅 Agenda</button>
        <button onClick={() => setVistaActiva('historial')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${vistaActiva === 'historial' ? 'bg-green-700 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>📋 Historial</button>
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

                <div className="flex flex-col gap-2 sm:col-span-full">
                  <button
                    type="button"
                    onClick={() => setMostrarNuevoPaciente(!mostrarNuevoPaciente)}
                    className="text-green-700 text-sm hover:underline text-left font-medium"
                  >
                    + Registrar paciente nuevo
                  </button>
                  {mostrarNuevoPaciente && (
                    <div className="flex gap-2 items-end bg-green-50 p-3 rounded-lg">
                      <div className="flex flex-col flex-1">
                        <label className="text-xs text-gray-500 mb-1">Nombre</label>
                        <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="Nombre" value={formNuevoPaciente.nombre} onChange={e => setFormNuevoPaciente(f => ({ ...f, nombre: e.target.value }))} />
                      </div>
                      <div className="flex flex-col flex-1">
                        <label className="text-xs text-gray-500 mb-1">Apellido</label>
                        <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="Apellido" value={formNuevoPaciente.apellido} onChange={e => setFormNuevoPaciente(f => ({ ...f, apellido: e.target.value }))} />
                      </div>
                      <button onClick={crearPaciente} className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 text-sm font-medium">Crear</button>
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
          <div className="bg-white rounded-xl shadow p-4" style={{ height: window.innerWidth < 768 ? 500 : 640 }}>
            {/* Resumen disponibilidad del día */}
              {(() => {
                const hoyStr = new Date().toISOString().slice(0,10)
                const citasHoy = citas.filter(c => c.fecha_hora?.slice(0,10) === hoyStr)
                const horasDisponibles = []
                const inicio = 8.5 // 8:30
                const fin = 19.5 // 19:30
                for (let h = inicio; h < fin; h += 0.5) {
                  const hh = Math.floor(h)
                  const mm = h % 1 === 0 ? '00' : '30'
                  const horaStr = `${String(hh).padStart(2,'0')}:${mm}`
                  const ahora = new Date()
                  const horaActual = `${String(ahora.getHours()).padStart(2,'0')}:${String(ahora.getMinutes()).padStart(2,'0')}`
                  const ocupada = citasHoy.some(c => c.fecha_hora?.slice(11,16) === horaStr)
                  if (!ocupada && horaStr > horaActual) horasDisponibles.push(horaStr)
                }
                return (
                  <div className="bg-white rounded-xl shadow p-4 mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">⏰ Horas disponibles hoy ({horasDisponibles.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {horasDisponibles.slice(0, 12).map(h => (
                        <span key={h} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{h}</span>
                      ))}
                      {horasDisponibles.length > 12 && <span className="text-xs text-gray-400 px-2 py-1">+{horasDisponibles.length - 12} más</span>}
                    </div>
                  </div>
                )
              })()}
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
              views={window.innerWidth < 768 ? [Views.DAY, Views.AGENDA] : [Views.WEEK, Views.DAY, Views.AGENDA]}
              min={new Date(0, 0, 0, 8, 30, 0)}
              max={new Date(0, 0, 0, 20, 0, 0)}
              step={30}
              timeslots={1}
              eventPropGetter={evento => {
  let bg = '#6b7280'
  let textColor = 'white'
  if (evento.tipo === 'bloqueo') {
    bg = '#ef4444'
  } else {
    const estado = evento.resource?.estado
    const profId = String(evento.resource?.profesional_id)
    if (estado === 'pendiente') {
      bg = '#d1d5db'
      textColor = '#6b7280'
    } else if (estado === 'confirmada') {
      if (profId === '2') bg = '#f97316'
      else if (profId === '1') bg = '#06b6d4'
      else bg = '#3b82f6'
    } else if (estado === 'realizada') {
      bg = '#22c55e'
    } else if (estado === 'cancelada') {
      bg = '#ef4444'
    }
  }
  return {
    style: {
      backgroundColor: bg,
      borderRadius: '6px',
      border: 'none',
      color: textColor,
      fontSize: '12px',
      padding: '2px 6px',
      cursor: 'pointer',
      opacity: evento.tipo === 'bloqueo' ? 0.85 : 1
    }
  }
}}
            onSelectEvent={e => {
                  if (e.tipo === 'bloqueo') {
                    setModalEliminarBloqueo(e.resource.id)
                    return
                  }
                  setCitaSeleccionada(e.resource)
                }}
              selectable
              onSelectSlot={({ start, end }) => {
                  const offset = start.getTimezoneOffset() * 60000
                  const fechaHora = new Date(start.getTime() - offset).toISOString().slice(0, 16)
                  const fechaHoraFin = new Date(end.getTime() - offset).toISOString().slice(0, 16)
                  setForm({ paciente_id: '', profesional_id: '', fecha_hora: fechaHora, estado: 'pendiente', observaciones: '' })
                  setBusquedaPaciente('')
                  setErrores({})
                  setMostrarNuevoPaciente(false)
                  setModalOpcion({ fechaHora, fechaHoraFin, start, end })
                }}
              style={{ height: '100%' }}
            />
          </div>

          {/* Modal detalle cita */}
          {citaSeleccionada && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4" onClick={() => setCitaSeleccionada(null)}>
              <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-green-800 mb-4">Detalle de cita</h3>
                {!citaSeleccionada.paciente_id && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                    <p className="text-sm font-medium text-yellow-800 mb-1">⏳ Reserva tentativa</p>
                    {citaSeleccionada.referencia && <p className="text-xs text-yellow-700">Referencia: {citaSeleccionada.referencia}</p>}
                    <button onClick={() => {
                      setForm({ paciente_id: '', profesional_id: citaSeleccionada.profesional_id, fecha_hora: citaSeleccionada.fecha_hora?.slice(0,16), estado: 'pendiente', observaciones: '' })
                      setBusquedaPaciente('')
                      setErrores({})
                      setTipoAgendamiento('confirmado')
                      setCitaTentativaOrigen(citaSeleccionada)
                      setCitaSeleccionada(null)
                      setModalAgendar(true)
                    }} className="mt-2 text-xs bg-yellow-500 text-white px-3 py-1.5 rounded-lg hover:bg-yellow-600 font-medium">
                      Convertir en cita confirmada
                    </button>
                  </div>
                )}
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
                <div className="flex flex-col gap-2 mt-5">
                  <div className="flex gap-2">
                    <button onClick={() => editar(citaSeleccionada)} className="flex-1 bg-green-700 text-white py-2 rounded-lg hover:bg-green-800 font-medium text-sm">Editar</button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={async () => {
                      setModalProcedimientosCita(citaSeleccionada)
                      setCitaSeleccionada(null)
                    }} className="flex-1 bg-purple-50 text-purple-600 py-2 rounded-lg hover:bg-purple-100 font-medium text-sm">📋 Procedimiento</button>
                    <button onClick={() => eliminar(citaSeleccionada.id)} className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg hover:bg-red-100 font-medium text-sm">Eliminar</button>
                    <button onClick={() => setCitaSeleccionada(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 font-medium text-sm">Cerrar</button>
                  </div>
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