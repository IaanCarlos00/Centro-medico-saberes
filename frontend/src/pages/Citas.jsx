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
import ModalPago from '../components/ModalPago'
import FormularioCita from '../components/FormularioCita'
import { validarFechaHora } from '../utils/validarFechaHora'
import ModalAgendarRapido from '../components/ModalAgendarRapido'
import ModalBloquearHorario from '../components/ModalBloquearHorario'
import { estadoColorCita as estadoColor } from '../utils/estadoColor'

const API = 'https://centro-medico-saberes-production.up.railway.app/citas'
const API_PAC = 'https://centro-medico-saberes-production.up.railway.app/pacientes'
const API_PRO = 'https://centro-medico-saberes-production.up.railway.app/profesionales'
const API_BLOQUEOS = 'https://centro-medico-saberes-production.up.railway.app/bloqueos'
const API_HORARIOS = 'https://centro-medico-saberes-production.up.railway.app/horarios'

// Orden de "importancia" para el filtro de historial: primero lo que necesita atención
// (pendiente de confirmar), luego lo confirmado por venir, y al final lo ya resuelto.
const PRIORIDAD_ESTADO = { pendiente: 0, confirmada: 1, en_atencion: 2, realizada: 3, cancelada: 4 }

// Los bloques de 45 min y la disponibilidad por matrona entran en vigencia el 1 de agosto de 2026.
// Antes de esa fecha se puede activar una vista previa con el botón "Vista previa" sin afectar a los demás usuarios.
const FECHA_ACTIVACION_NUEVO_HORARIO = new Date('2026-08-01T00:00:00')

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

const HORA_MIN = '08:30'
const HORA_MAX = '21:00'



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
  const [form, setForm] = useState({ paciente_id: '', profesional_id: '', fecha_hora: '', estado: 'pendiente', observaciones: '', duracion_minutos: 30, permite_estudiantes: null, modalidad_online: null })
  const [errores, setErrores] = useState({})
  const [busquedaPaciente, setBusquedaPaciente] = useState('')
  const [mostrarDropdown, setMostrarDropdown] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [ordenHistorial, setOrdenHistorial] = useState('reciente')
  const [historialPaciente, setHistorialPaciente] = useState([])
  const [bloqueos, setBloqueos] = useState([])
  const [horarios, setHorarios] = useState([])
  const [previaNuevoHorario, setPreviaNuevoHorario] = useState(false)
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
  const [modoMover, setModoMover] = useState(false)
  const [modalConfirmarMover, setModalConfirmarMover] = useState(null)
  const [modalConfirmarEstado, setModalConfirmarEstado] = useState(false)
  const [citaParaMover, setCitaParaMover] = useState(null)

  const API_PROC = 'https://centro-medico-saberes-production.up.railway.app/procedimientos'
  const API_PAGOS = 'https://centro-medico-saberes-production.up.railway.app/pagos'

  const cargar = async () => {
  const [c, p, pr, bl, cat, ho] = await Promise.all([axios.get(API), axios.get(API_PAC), axios.get(API_PRO), axios.get(API_BLOQUEOS), axios.get(`${API_PROC}/catalogo`), axios.get(API_HORARIOS).catch(() => ({ data: [] }))])
  setCitas(c.data)
  setPacientes(p.data)
  setProfesionales(pr.data)
  setBloqueos(bl.data)
  setCatalogo(cat.data)
  setHorarios(ho.data)
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
    const nombreCompleto = `${p.nombre || ''} ${p.apellido || ''}`.toLowerCase()
    return (p.nombre || '').toLowerCase().includes(q) || (p.apellido || '').toLowerCase().includes(q) || (p.rut || '').toLowerCase().includes(q) || nombreCompleto.includes(q)
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

  const esProcedimientoOnline = procedimientoSeleccionado?.nombre?.toLowerCase().includes('online')

  const validar = () => {
  const e = {}
  if (!form.paciente_id) e.paciente_id = 'Selecciona un paciente'
  if (!form.profesional_id) e.profesional_id = 'Selecciona un profesional'
  if (esProcedimientoOnline && !form.modalidad_online) e.modalidad_online = 'Selecciona si la atención es por WhatsApp o Videollamada'
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
  setForm({ paciente_id: '', profesional_id: '', fecha_hora: '', estado: 'pendiente', observaciones: '', duracion_minutos: 30, permite_estudiantes: null, modalidad_online: null })
  setBusquedaPaciente('')
  setHistorialPaciente([])
  setErrores({})
  setMostrarFormulario(false)
  cargar()
}

  const cerrarModalAgendar = () => { setModalAgendar(null); setBusquedaPaciente(''); setErrores({}); setEditando(null) }

  const guardarAgendamiento = async () => {
    // CASO EDITAR
    if (editando) {
      const e = validar()
      if (Object.keys(e).length > 0) { setErrores(e); return }
      await axios.put(`${API}/${editando}`, form)
      await registrarLog('editar', 'cita', editando, `Cita de ${busquedaPaciente}`)
      setEditando(null)
      setForm({ paciente_id: '', profesional_id: '', fecha_hora: '', estado: 'pendiente', observaciones: '', duracion_minutos: 30, permite_estudiantes: null, modalidad_online: null })
      setBusquedaPaciente('')
      setErrores({})
      setModalAgendar(null)
      cargar()
      return
    }
    // CASO TENTATIVO
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
      setForm({ paciente_id: '', profesional_id: '', fecha_hora: '', estado: 'pendiente', observaciones: '', duracion_minutos: 30, permite_estudiantes: null, modalidad_online: null })
      setBusquedaPaciente('')
      setErrores({})
      setTipoAgendamiento('confirmado')
      setModalAgendar(null)
      cargar()
      return
    }
    // CASO NUEVO
    const e = validar()
    if (Object.keys(e).length > 0) { setErrores(e); return }
    if (!procedimientoSeleccionado) {
      setModalConfirmarEstado(true)
      return
    }
    await guardarNuevaCita('confirmada')
  }

  const guardarNuevaCita = async estadoCita => {
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
        profesional_id: form.profesional_id || localStorage.getItem('profesional_id') || null,
        numero_bono: metodoPago === 'fonasa' ? numeroBono : null,
        cita_id: res.data.id,
        fecha_atencion: form.fecha_hora?.slice(0, 10)
      })
    }
    setModalConfirmarEstado(false)
    setCitaRecienAgendada({ ...res.data, paciente_id: form.paciente_id, paciente_nombre: paciente?.nombre, paciente_apellido: paciente?.apellido })
    setForm({ paciente_id: '', profesional_id: '', fecha_hora: '', estado: 'pendiente', observaciones: '', duracion_minutos: 30, permite_estudiantes: null, modalidad_online: null })
    setBusquedaPaciente('')
    setErrores({})
    setMostrarNuevoPaciente(false)
    setProcedimientoSeleccionado(null)
    setMetodoPago('debito')
    setNumeroBono('')
    setModalAgendar(null)
    cargar()
  }

  const finalizarAtencion = async () => {
    await axios.put(`${API}/${editando}`, { ...form, estado: 'realizada' })
    await registrarLog('editar', 'cita', editando, `Cita marcada como realizada`)
    setEditando(null)
    setForm({ paciente_id: '', profesional_id: '', fecha_hora: '', estado: 'pendiente', observaciones: '', duracion_minutos: 30, permite_estudiantes: null, modalidad_online: null })
    setBusquedaPaciente('')
    setErrores({})
    setModalAgendar(null)
    cargar()
  }

  const editar = c => {
    setForm({ paciente_id: c.paciente_id, profesional_id: c.profesional_id, fecha_hora: c.fecha_hora?.slice(0,16), estado: c.estado, observaciones: c.observaciones || '', duracion_minutos: c.duracion_minutos || 30, permite_estudiantes: c.permite_estudiantes ?? null, modalidad_online: c.modalidad_online || null })
    setBusquedaPaciente(`${c.paciente_nombre} ${c.paciente_apellido}`)
    setHistorialPaciente(citas.filter(ci => ci.paciente_id === c.paciente_id && ci.id !== c.id).slice(0, 3))
    setEditando(c.id)
    setCitaSeleccionada(null)
    setModalAgendar(true)
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

  const moverCita = async ({ event, start }) => {
    if (event.tipo === 'bloqueo') return
    const offset = start.getTimezoneOffset() * 60000
    const nuevaFecha = new Date(start.getTime() - offset).toISOString().slice(0, 16)
    setModalConfirmarMover({ cita: event.resource, nuevaFecha })
  }

  const cancelar = () => {
    setEditando(null)
    setForm({ paciente_id: '', profesional_id: '', fecha_hora: '', estado: 'pendiente', observaciones: '', duracion_minutos: 30, permite_estudiantes: null, modalidad_online: null })
    setBusquedaPaciente('')
    setHistorialPaciente([])
    setErrores({})
    setMostrarFormulario(false)
  }

  const eventos = [
  ...citas.map(c => ({
    id: c.id,
    title: c.paciente_nombre
  ? `${c.modalidad_online ? (c.modalidad_online === 'whatsapp' ? '💬 ' : '🎥 ') : ''}${c.paciente_nombre} ${c.paciente_apellido}${c.procedimiento_nombre ? ` — ${c.procedimiento_nombre}` : ''}`
  : `⏳ ${c.referencia || 'Reserva tentativa'}`,
    start: new Date(c.fecha_hora.replace(' ', 'T')),
  end: new Date(new Date(c.fecha_hora.replace(' ', 'T')).getTime() + (c.duracion_minutos || 30) * 60000),
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
  }).sort((a, b) => {
    if (ordenHistorial === 'reciente') return new Date(b.fecha_hora) - new Date(a.fecha_hora)
    if (ordenHistorial === 'antigua') return new Date(a.fecha_hora) - new Date(b.fecha_hora)
    if (ordenHistorial === 'importancia') return (PRIORIDAD_ESTADO[a.estado] ?? 99) - (PRIORIDAD_ESTADO[b.estado] ?? 99)
    return 0
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

  const nuevoHorarioActivo = new Date() >= FECHA_ACTIVACION_NUEVO_HORARIO || previaNuevoHorario

  const colorProfesional = profId => {
    const pr = profesionales.find(p => String(p.id) === String(profId))
    if (pr?.color) return pr.color
    // Compatibilidad con la paleta anterior mientras se asignan colores en Profesionales
    if (String(profId) === '2') return '#f97316'
    if (String(profId) === '1') return '#06b6d4'
    return '#3b82f6'
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
{modalConfirmarEstado && (
  <ModalConfirmar
    titulo="¿Confirmar esta cita?"
    mensaje="No seleccionaste un procedimiento. Puedes dejarla confirmada o como pendiente."
    textoConfirmar="✅ Confirmada"
    textoCancelar="⏳ Dejar pendiente"
    textoColor="bg-green-700 hover:bg-green-800"
    onConfirmar={() => guardarNuevaCita('confirmada')}
    onCancelar={() => guardarNuevaCita('pendiente')}
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

    {modalConfirmarMover && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">📅</span>
            <div>
              <h3 className="text-lg font-bold text-green-800">¿Mover cita?</h3>
              <p className="text-sm text-gray-500">{modalConfirmarMover.cita.paciente_nombre} {modalConfirmarMover.cita.paciente_apellido}</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 mb-5">
            <p className="text-xs text-gray-500 mb-2">Nueva fecha y hora:</p>
            <input
              type="datetime-local"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              value={modalConfirmarMover.nuevaFecha}
              onChange={e => setModalConfirmarMover(m => ({ ...m, nuevaFecha: e.target.value }))}
            />
          </div>
          <div className="flex gap-3">
            <button onClick={async () => {
              const { cita, nuevaFecha } = modalConfirmarMover
              await axios.put(`${API}/${cita.id}`, { ...cita, fecha_hora: nuevaFecha })
              await registrarLog('editar', 'cita', cita.id, `Cita movida a ${nuevaFecha}`)
              setModalConfirmarMover(null)
              setModoMover(false)
              setToast({ mensaje: 'Cita movida correctamente', tipo: 'exito' })
              cargar()
            }} className="flex-1 bg-green-700 text-white py-2.5 rounded-xl hover:bg-green-800 font-semibold">
              ✓ Confirmar
            </button>
            <button onClick={() => { setModalConfirmarMover(null); cargar() }} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl hover:bg-gray-200 font-medium">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    )}

    {modalAgendar && (
      <ModalAgendarRapido
        editando={editando}
        cerrarModalAgendar={cerrarModalAgendar}
        tipoAgendamiento={tipoAgendamiento}
        setTipoAgendamiento={setTipoAgendamiento}
        dropdownRef={dropdownRef}
        errores={errores}
        busquedaPaciente={busquedaPaciente}
        setBusquedaPaciente={setBusquedaPaciente}
        setMostrarDropdown={setMostrarDropdown}
        setForm={setForm}
        setErrores={setErrores}
        mostrarDropdown={mostrarDropdown}
        pacientesFiltrados={pacientesFiltrados}
        seleccionarPaciente={seleccionarPaciente}
        mostrarNuevoPaciente={mostrarNuevoPaciente}
        setMostrarNuevoPaciente={setMostrarNuevoPaciente}
        formNuevoPaciente={formNuevoPaciente}
        setFormNuevoPaciente={setFormNuevoPaciente}
        crearPaciente={crearPaciente}
        profesionales={profesionales}
        form={form}
        handleChange={handleChange}
        procedimientoSeleccionado={procedimientoSeleccionado}
        setProcedimientoSeleccionado={setProcedimientoSeleccionado}
        catalogo={catalogo}
        metodoPago={metodoPago}
        setMetodoPago={setMetodoPago}
        numeroBono={numeroBono}
        setNumeroBono={setNumeroBono}
        guardarAgendamiento={guardarAgendamiento}
        finalizarAtencion={finalizarAtencion}
      />
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
  <ModalBloquearHorario
    modalBloquear={modalBloquear}
    setModalBloquear={setModalBloquear}
    usuarioRol={usuarioRol}
    profesionales={profesionales}
    profesionalBloqueo={profesionalBloqueo}
    setProfesionalBloqueo={setProfesionalBloqueo}
    usuarioProfesionalId={usuarioProfesionalId}
    motivoBloqueo={motivoBloqueo}
    setMotivoBloqueo={setMotivoBloqueo}
    usuarioId={usuarioId}
    cargar={cargar}
  />
)}

    <div className="relative overflow-hidden rounded-3xl mb-8 p-6 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #052e16 0%, #166534 60%, #15803d 100%)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #86efac, transparent)', transform: 'translate(30%, -30%)' }} />
        <div className="relative z-10">
          <p className="text-green-300 text-xs font-semibold uppercase tracking-widest mb-1">Gestión</p>
          <h2 className="text-3xl font-black text-white">Agenda</h2>
          <p className="text-green-200 text-sm mt-1">{citas.length} cita{citas.length !== 1 ? 's' : ''} registrada{citas.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="relative z-10 flex gap-2">
          <button onClick={() => setVistaActiva('agenda')} className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${vistaActiva === 'agenda' ? 'bg-white text-green-800' : 'text-white hover:bg-white hover:bg-opacity-10'}`} style={vistaActiva !== 'agenda' ? { border: '1px solid rgba(255,255,255,0.25)' } : {}}>📅 Agenda</button>
          <button onClick={() => setVistaActiva('historial')} className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${vistaActiva === 'historial' ? 'bg-white text-green-800' : 'text-white hover:bg-white hover:bg-opacity-10'}`} style={vistaActiva !== 'historial' ? { border: '1px solid rgba(255,255,255,0.25)' } : {}}>📋 Historial</button>
        </div>
      </div>

      {/* VISTA AGENDA */}
      {vistaActiva === 'agenda' && (
        <>
          {new Date() < FECHA_ACTIVACION_NUEVO_HORARIO && (
            <div className="flex items-center justify-between gap-3 mb-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
              <p className="text-sm text-amber-800">
                🗓️ El horario de 45 min y la disponibilidad por matrona se activan automáticamente el <strong>1 de agosto</strong>.
              </p>
              <button
                onClick={() => setPreviaNuevoHorario(v => !v)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${previaNuevoHorario ? 'bg-amber-500 text-white' : 'bg-white text-amber-700 border border-amber-300'}`}
              >
                {previaNuevoHorario ? '✓ Viendo vista previa' : 'Ver vista previa'}
              </button>
            </div>
          )}
          <div className="flex justify-end gap-3 mb-5">
            <button
              onClick={() => { setModoMover(!modoMover); setCitaParaMover(null) }}
              className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all border-2 ${
                modoMover
                  ? 'border-orange-400 bg-orange-50 text-orange-700 shadow-sm'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              {modoMover ? (citaParaMover ? `📌 ${citaParaMover.paciente_nombre} — click destino` : '🔓 Selecciona una cita') : '🔒 Mover cita'}
            </button>
            <button
              onClick={() => {
                setForm({ paciente_id: '', profesional_id: '', fecha_hora: '', estado: 'pendiente', observaciones: '', duracion_minutos: 30, permite_estudiantes: null, modalidad_online: null })
                setBusquedaPaciente('')
                setErrores({})
                setTipoAgendamiento('confirmado')
                setModalAgendar(true)
              }}
              className="text-white px-5 py-2.5 rounded-xl font-bold transition-all hover:opacity-90 hover:shadow-lg shadow-sm"
              style={{ background: 'linear-gradient(135deg, #166534, #15803d)' }}
            >
              + Nueva cita
            </button>
          </div>

          {mostrarFormulario && (
            <FormularioCita
              editando={editando}
              form={form}
              handleChange={handleChange}
              errores={errores}
              setErrores={setErrores}
              busquedaPaciente={busquedaPaciente}
              setBusquedaPaciente={setBusquedaPaciente}
              mostrarDropdown={mostrarDropdown}
              setMostrarDropdown={setMostrarDropdown}
              setForm={setForm}
              setHistorialPaciente={setHistorialPaciente}
              pacientesFiltrados={pacientesFiltrados}
              seleccionarPaciente={seleccionarPaciente}
              dropdownRef={dropdownRef}
              mostrarNuevoPaciente={mostrarNuevoPaciente}
              setMostrarNuevoPaciente={setMostrarNuevoPaciente}
              formNuevoPaciente={formNuevoPaciente}
              setFormNuevoPaciente={setFormNuevoPaciente}
              crearPaciente={crearPaciente}
              profesionales={profesionales}
              historialPaciente={historialPaciente}
              estadoColor={estadoColor}
              guardar={guardar}
              cancelar={cancelar}
            />
          )}

          {/* Calendario */}
          <div className="bg-white rounded-xl shadow p-4 overflow-x-auto" style={{ height: 'auto' }}>
            {/* Horas disponibles por matrona para el día seleccionado */}
            <div style={{ minWidth: '700px' }}>
              {nuevoHorarioActivo && (() => {
                const diaSemana = fecha.getDay()
                const offsetDia = fecha.getTimezoneOffset() * 60000
                const fechaStr = new Date(fecha.getTime() - offsetDia).toISOString().slice(0, 10)
                const ahora = new Date()
                const hoyStr = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
                const esHoy = fechaStr === hoyStr
                const horaActual = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`
                const citasDelDia = citas.filter(c => c.fecha_hora?.slice(0, 10) === fechaStr && c.estado !== 'cancelada')

                const porMatrona = profesionales
                  .map(p => ({
                    profesional: p,
                    horas: horarios
                      .filter(h => Number(h.profesional_id) === Number(p.id) && Number(h.dia_semana) === diaSemana)
                      .sort((a, b) => a.hora.localeCompare(b.hora))
                  }))
                  .filter(g => g.horas.length > 0)

                if (porMatrona.length === 0) {
                  return (
                    <div className="bg-white rounded-xl shadow p-4 mb-4">
                      <p className="text-sm text-gray-400">Ninguna matrona atiende este día.</p>
                    </div>
                  )
                }

                return (
                  <div className="bg-white rounded-xl shadow p-4 mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-3">
                      ⏰ Horas disponibles — {fecha.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <div className="flex flex-col gap-4">
                      {porMatrona.map(({ profesional, horas }) => (
                        <div key={profesional.id}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colorProfesional(profesional.id) }} />
                            <span className="text-xs font-bold text-gray-600">{profesional.nombre} {profesional.apellido}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {horas.map(h => {
                              const ocupada = citasDelDia.some(c => Number(c.profesional_id) === Number(profesional.id) && c.fecha_hora?.slice(11, 16) === h.hora)
                              const pasada = esHoy && h.hora <= horaActual
                              const deshabilitada = ocupada || pasada
                              const color = colorProfesional(profesional.id)
                              return (
                                <button
                                  key={h.id}
                                  disabled={deshabilitada}
                                  title={ocupada ? 'Ya reservada' : h.sobrecupo ? 'Sobrecupo: solo si hay espacio' : ''}
                                  onClick={() => {
                                    const fechaHora = `${fechaStr}T${h.hora}`
                                    const [hh, mm] = h.hora.split(':').map(Number)
                                    const finDate = new Date(fecha)
                                    finDate.setHours(hh, mm + 45, 0, 0)
                                    const fechaHoraFin = `${fechaStr}T${String(finDate.getHours()).padStart(2, '0')}:${String(finDate.getMinutes()).padStart(2, '0')}`
                                    setForm({ paciente_id: '', profesional_id: profesional.id, fecha_hora: fechaHora, estado: 'pendiente', observaciones: '', duracion_minutos: 30, permite_estudiantes: null, modalidad_online: null })
                                    setBusquedaPaciente('')
                                    setErrores({})
                                    setMostrarNuevoPaciente(false)
                                    setModalOpcion({ fechaHora, fechaHoraFin })
                                  }}
                                  className={`text-xs px-2.5 py-1.5 rounded-full font-semibold transition-all ${
                                    deshabilitada
                                      ? 'bg-gray-100 text-gray-300 cursor-not-allowed line-through'
                                      : 'hover:scale-105 cursor-pointer'
                                  } ${!deshabilitada && h.sobrecupo ? 'border border-dashed' : ''}`}
                                  style={!deshabilitada ? { backgroundColor: `${color}1a`, color, borderColor: h.sobrecupo ? color : undefined } : {}}
                                >
                                  {h.hora}{h.sobrecupo ? ' *' : ''}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-3">* Sobrecupo: solo si hay espacio (horario de colación)</p>
                  </div>
                )
              })()}
            {nuevoHorarioActivo && profesionales.length > 0 && (
              <div className="flex flex-wrap items-center gap-4 mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase">Colores:</span>
                {profesionales.map(p => (
                  <span key={p.id} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: colorProfesional(p.id) }} />
                    {p.nombre} {p.apellido}
                  </span>
                ))}
              </div>
            )}
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
              min={new Date(0, 0, 0, 8, 30, 0)}
              max={nuevoHorarioActivo ? new Date(0, 0, 0, 21, 0, 0) : new Date(0, 0, 0, 20, 0, 0)}
              step={30}
              timeslots={1}
              eventPropGetter={evento => {
  let bg = '#6b7280'
  let textColor = 'white'
  if (evento.tipo === 'bloqueo') {
    bg = '#ef4444'
  } else {
    const estado = evento.resource?.estado
    const profId = evento.resource?.profesional_id
    if (estado === 'pendiente') {
      bg = '#d1d5db'
      textColor = '#6b7280'
    } else if (estado === 'confirmada') {
      bg = colorProfesional(profId)
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
                if (modoMover) return
                setModalEliminarBloqueo(e.resource.id)
                return
              }
              if (modoMover) {
                setCitaParaMover(e.resource)
                setToast({ mensaje: `📌 ${e.resource.paciente_nombre} seleccionada — ahora haz click en el nuevo horario`, tipo: 'info' })
                return
              }
              setCitaSeleccionada(e.resource)
            }}
              selectable
              onSelectSlot={({ start, end }) => {
                if (start.getHours() === 0 && start.getMinutes() === 0) return
                const offset = start.getTimezoneOffset() * 60000
                const fechaHora = new Date(start.getTime() - offset).toISOString().slice(0, 16)
                const fechaHoraFin = new Date(end.getTime() - offset).toISOString().slice(0, 16)
                if (modoMover && citaParaMover) {
                  setModalConfirmarMover({ cita: citaParaMover, nuevaFecha: fechaHora })
                  setCitaParaMover(null)
                  return
                }
                setForm({ paciente_id: '', profesional_id: '', fecha_hora: fechaHora, estado: 'pendiente', observaciones: '', duracion_minutos: 30, permite_estudiantes: null, modalidad_online: null })
                setBusquedaPaciente('')
                setErrores({})
                setMostrarNuevoPaciente(false)
                setModalOpcion({ fechaHora, fechaHoraFin, start, end })
              }}
              style={{ height: '100%' }}
            />
          </div>
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
                      setForm({ paciente_id: '', profesional_id: citaSeleccionada.profesional_id, fecha_hora: citaSeleccionada.fecha_hora?.slice(0,16), estado: 'pendiente', observaciones: '', duracion_minutos: 30, permite_estudiantes: null, modalidad_online: null })
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
                  <div><span className="font-semibold text-gray-600">Duración:</span> <span className="text-gray-800">{citaSeleccionada.duracion_minutos || 30} min</span></div>
                  {citaSeleccionada.modalidad_online && (
                    <div>
                      <span className="font-semibold text-gray-600">Atención online:</span>{' '}
                      <span className="text-gray-800">{citaSeleccionada.modalidad_online === 'whatsapp' ? '💬 WhatsApp' : '🎥 Videollamada'}</span>
                    </div>
                  )}
                  {citaSeleccionada.paciente_id && (
                    <div>
                      <span className="font-semibold text-gray-600">Permite estudiantes:</span>{' '}
                      {citaSeleccionada.permite_estudiantes === true && <span className="text-green-700 font-medium">Sí</span>}
                      {citaSeleccionada.permite_estudiantes === false && <span className="text-red-600 font-medium">No</span>}
                      {(citaSeleccionada.permite_estudiantes === null || citaSeleccionada.permite_estudiantes === undefined) && <span className="text-gray-400">No preguntado</span>}
                    </div>
                  )}
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
            <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" value={ordenHistorial} onChange={e => setOrdenHistorial(e.target.value)}>
              <option value="reciente">Más recientes primero</option>
              <option value="antigua">Más antiguas primero</option>
              <option value="importancia">Por importancia (pendientes primero)</option>
            </select>
          </div>
          {(busqueda || filtroEstado) && <p className="text-sm text-gray-500 mb-3">{filtradas.length} cita{filtradas.length !== 1 ? 's' : ''} encontrada{filtradas.length !== 1 ? 's' : ''}</p>}

          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}>
                  {['Paciente', 'Profesional', 'Fecha y hora', 'Estado', 'Observaciones', 'Acciones'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-green-800 uppercase tracking-wider">{h}</th>
                  ))}
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
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => editar(c)} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors">Editar</button>
                        <button onClick={() => eliminar(c.id)} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">Eliminar</button>
                      </div>
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