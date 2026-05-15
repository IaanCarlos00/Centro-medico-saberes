import { useEffect, useState } from 'react'
import axios from 'axios'
import Fichas from './Fichas'

const API = 'https://centro-medico-saberes-production.up.railway.app/pacientes'
const API_CITAS = 'https://centro-medico-saberes-production.up.railway.app/citas'
const API_PRO = 'https://centro-medico-saberes-production.up.railway.app/profesionales'

const HORA_MIN = '08:30'
const HORA_MAX = '19:30'

function validarFechaHora(fechaHora) {
  if (!fechaHora) return 'La hora de la cita es obligatoria'
  const fecha = new Date(fechaHora)
  const diaSemana = fecha.getDay()
  const hora = fecha.toTimeString().slice(0, 5)
  if (diaSemana === 0) return 'No se pueden agendar citas los domingos'
  if (hora < HORA_MIN) return 'La primera hora disponible es 08:30'
  if (hora > HORA_MAX) return 'La última hora disponible es 19:30'
  return null
}

function ModalAgendarCita({ paciente, profesionales, onConfirmar, onCerrar }) {
  const [form, setForm] = useState({ profesional_id: '', fecha_hora: '', estado: 'confirmada', observaciones: '' })
  const [errores, setErrores] = useState({})

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrores({ ...errores, [e.target.name]: '' })
  }

  const guardar = async () => {
    const e = {}
    if (!form.profesional_id) e.profesional_id = 'Selecciona un profesional'
    const errorFecha = validarFechaHora(form.fecha_hora)
    if (errorFecha) e.fecha_hora = errorFecha
    if (Object.keys(e).length > 0) { setErrores(e); return }

    await axios.post(API_CITAS, { ...form, paciente_id: paciente.id })
    onConfirmar()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4" onClick={onCerrar}>
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-5">
          <span className="text-3xl">📅</span>
          <div>
            <h3 className="text-lg font-bold text-green-800">¿Agendar cita ahora?</h3>
            <p className="text-sm text-gray-500">{paciente.nombre} {paciente.apellido}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Profesional</label>
            <select
              className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.profesional_id ? 'border-red-400' : 'border-gray-300'}`}
              name="profesional_id" value={form.profesional_id} onChange={handleChange}
            >
              <option value="">Seleccionar profesional</option>
              {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
            </select>
            {errores.profesional_id && <span className="text-red-500 text-xs mt-1">{errores.profesional_id}</span>}
          </div>

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

          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Estado</label>
            <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" name="estado" value={form.estado} onChange={handleChange}>
              <option value="pendiente">Pendiente</option>
              <option value="confirmada">Confirmada</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Observaciones (opcional)</label>
            <input className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" name="observaciones" value={form.observaciones} onChange={handleChange} />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={guardar} className="flex-1 bg-green-700 text-white py-2 rounded-lg hover:bg-green-800 font-medium transition-colors">
            Agendar
          </button>
          <button onClick={onCerrar} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 font-medium transition-colors">
            Ahora no
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Pacientes() {
  const [pacientes, setPacientes] = useState([])
  const [profesionales, setProfesionales] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [form, setForm] = useState({ rut: '', nombre: '', apellido: '', fecha_nacimiento: '', telefono: '', email: '' })
  const [editando, setEditando] = useState(null)
  const [errores, setErrores] = useState({})
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null)
  const [modalAgendar, setModalAgendar] = useState(null)

  const cargar = async () => {
    const [p, pr] = await Promise.all([axios.get(API), axios.get(API_PRO)])
    setPacientes(p.data)
    setProfesionales(pr.data)
  }

  useEffect(() => { cargar() }, [])

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrores({ ...errores, [e.target.name]: '' })
  }

  const validar = () => {
    const e = {}
    if (!form.rut.trim()) e.rut = 'El RUT es obligatorio'
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio'
    if (!form.apellido.trim()) e.apellido = 'El apellido es obligatorio'
    if (!form.fecha_nacimiento) e.fecha_nacimiento = 'La fecha es obligatoria'
    return e
  }

  const guardar = async () => {
    const e = validar()
    if (Object.keys(e).length > 0) { setErrores(e); return }
    if (editando) {
      await axios.put(`${API}/${editando}`, form)
      setEditando(null)
      setForm({ rut: '', nombre: '', apellido: '', fecha_nacimiento: '', telefono: '', email: '' })
      setErrores({})
      cargar()
    } else {
      const res = await axios.post(API, form)
      setForm({ rut: '', nombre: '', apellido: '', fecha_nacimiento: '', telefono: '', email: '' })
      setErrores({})
      cargar()
      setModalAgendar(res.data)
    }
  }

  const editar = p => {
    setForm({ rut: p.rut, nombre: p.nombre, apellido: p.apellido, fecha_nacimiento: p.fecha_nacimiento?.slice(0,10), telefono: p.telefono || '', email: p.email || '' })
    setEditando(p.id)
    setErrores({})
  }

  const eliminar = async id => {
    if (confirm('¿Eliminar paciente?')) {
      await axios.delete(`${API}/${id}`)
      cargar()
    }
  }

  const cancelar = () => {
    setEditando(null)
    setForm({ rut: '', nombre: '', apellido: '', fecha_nacimiento: '', telefono: '', email: '' })
    setErrores({})
  }

  const campo = (name, placeholder, type = 'text') => (
    <div className="flex flex-col">
      <input
        className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores[name] ? 'border-red-400' : 'border-gray-300'}`}
        name={name} placeholder={placeholder} type={type}
        value={form[name]} onChange={handleChange}
      />
      {errores[name] && <span className="text-red-500 text-xs mt-1">{errores[name]}</span>}
    </div>
  )

  const filtrados = pacientes.filter(p => {
    const q = busqueda.toLowerCase()
    return (
      p.nombre.toLowerCase().includes(q) ||
      p.apellido.toLowerCase().includes(q) ||
      p.rut.toLowerCase().includes(q) ||
      (p.telefono && p.telefono.includes(q)) ||
      (p.email && p.email.toLowerCase().includes(q))
    )
  })

  if (pacienteSeleccionado) {
    return <Fichas paciente={pacienteSeleccionado} onVolver={() => setPacienteSeleccionado(null)} />
  }

  return (
    <div>
      {modalAgendar && (
        <ModalAgendarCita
          paciente={modalAgendar}
          profesionales={profesionales}
          onConfirmar={() => { setModalAgendar(null) }}
          onCerrar={() => setModalAgendar(null)}
        />
      )}

      <h2 className="text-2xl font-bold text-green-800 mb-6">Pacientes</h2>

      <div className="bg-white rounded-xl shadow p-4 md:p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">{editando ? 'Editar paciente' : 'Agregar paciente'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {campo('rut', 'RUT')}
          {campo('nombre', 'Nombre')}
          {campo('apellido', 'Apellido')}
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Fecha de nacimiento</label>
            <input
              className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.fecha_nacimiento ? 'border-red-400' : 'border-gray-300'}`}
              name="fecha_nacimiento" type="date"
              value={form.fecha_nacimiento} onChange={handleChange}
            />
            {errores.fecha_nacimiento && <span className="text-red-500 text-xs mt-1">{errores.fecha_nacimiento}</span>}
          </div>
          {campo('telefono', 'Teléfono')}
          {campo('email', 'Email', 'email')}
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={guardar} className="bg-green-700 text-white px-5 py-2 rounded-lg hover:bg-green-800 transition-colors font-medium">
            {editando ? 'Actualizar' : 'Agregar'}
          </button>
          {editando && (
            <button onClick={cancelar} className="bg-gray-200 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium">
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="mb-4 relative">
        <input
          className="w-full border border-gray-300 rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-green-400"
          placeholder="Buscar por nombre, apellido, RUT, teléfono o email..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
        <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
        {busqueda && <button onClick={() => setBusqueda('')} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">✕</button>}
      </div>
      {busqueda && <p className="text-sm text-gray-500 mb-3">{filtrados.length} resultado{filtrados.length !== 1 ? 's' : ''} encontrado{filtrados.length !== 1 ? 's' : ''}</p>}

      {/* Tabla escritorio */}
      <div className="hidden md:block bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-green-50 text-green-800 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">RUT</th>
              <th className="px-4 py-3 text-left">Nombre</th>
              <th className="px-4 py-3 text-left">Apellido</th>
              <th className="px-4 py-3 text-left">Fecha Nac.</th>
              <th className="px-4 py-3 text-left">Teléfono</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtrados.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-600">{p.rut}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{p.nombre}</td>
                <td className="px-4 py-3 text-gray-800">{p.apellido}</td>
                <td className="px-4 py-3 text-gray-600">{p.fecha_nacimiento?.slice(0,10)}</td>
                <td className="px-4 py-3 text-gray-600">{p.telefono}</td>
                <td className="px-4 py-3 text-gray-600">{p.email}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => setPacienteSeleccionado(p)} className="text-blue-600 hover:underline text-sm font-medium">Fichas</button>
                  <button onClick={() => setModalAgendar(p)} className="text-green-700 hover:underline text-sm font-medium">Agendar</button>
                  <button onClick={() => editar(p)} className="text-gray-500 hover:underline text-sm font-medium">Editar</button>
                  <button onClick={() => eliminar(p.id)} className="text-red-500 hover:underline text-sm font-medium">Eliminar</button>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr><td colSpan="7" className="px-4 py-6 text-center text-gray-400">{busqueda ? 'No se encontraron resultados' : 'No hay pacientes registrados'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Tarjetas móvil */}
      <div className="md:hidden flex flex-col gap-3">
        {filtrados.map(p => (
          <div key={p.id} className="bg-white rounded-xl shadow p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold text-gray-800">{p.nombre} {p.apellido}</p>
                <p className="text-sm text-gray-500">{p.rut}</p>
              </div>
              <div className="flex gap-2 flex-wrap justify-end">
                <button onClick={() => setPacienteSeleccionado(p)} className="text-blue-600 text-sm font-medium">Fichas</button>
                <button onClick={() => setModalAgendar(p)} className="text-green-700 text-sm font-medium">Agendar</button>
                <button onClick={() => editar(p)} className="text-gray-500 text-sm font-medium">Editar</button>
                <button onClick={() => eliminar(p.id)} className="text-red-500 text-sm font-medium">Eliminar</button>
              </div>
            </div>
            <div className="text-sm text-gray-500 flex flex-col gap-1">
              {p.fecha_nacimiento && <span>📅 Nac: {p.fecha_nacimiento?.slice(0,10)}</span>}
              {p.telefono && <span>📞 {p.telefono}</span>}
              {p.email && <span>✉️ {p.email}</span>}
            </div>
          </div>
        ))}
        {filtrados.length === 0 && (
          <div className="bg-white rounded-xl shadow p-6 text-center text-gray-400">{busqueda ? 'No se encontraron resultados' : 'No hay pacientes registrados'}</div>
        )}
      </div>
    </div>
  )
}