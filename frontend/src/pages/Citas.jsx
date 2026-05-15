import { useEffect, useState, useRef } from 'react'
import axios from 'axios'

const API = 'https://centro-medico-saberes-production.up.railway.app/citas'
const API_PAC = 'https://centro-medico-saberes-production.up.railway.app/pacientes'
const API_PRO = 'https://centro-medico-saberes-production.up.railway.app/profesionales'

const estadoColor = {
  pendiente: 'bg-yellow-100 text-yellow-700',
  confirmada: 'bg-blue-100 text-blue-700',
  realizada: 'bg-green-100 text-green-700',
  cancelada: 'bg-red-100 text-red-700',
}

const HORA_MIN = '08:30'
const HORA_MAX = '19:30'

function validarFechaHora(fechaHora) {
  if (!fechaHora) return 'La hora de la cita es obligatoria'
  const fecha = new Date(fechaHora)
  const diaSemana = fecha.getDay() // 0=domingo, 6=sábado
  const hora = fecha.toTimeString().slice(0, 5)

  if (diaSemana === 0) return 'No se pueden agendar citas los domingos'
  if (hora < HORA_MIN) return 'La primera hora disponible es 08:30'
  if (hora > HORA_MAX) return 'La última hora disponible es 19:30'
  return null
}

export default function Citas() {
  const [citas, setCitas] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [profesionales, setProfesionales] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [form, setForm] = useState({ paciente_id: '', profesional_id: '', fecha_hora: '', estado: 'pendiente', observaciones: '' })
  const [editando, setEditando] = useState(null)
  const [errores, setErrores] = useState({})

  // Buscador de pacientes en el formulario
  const [busquedaPaciente, setBusquedaPaciente] = useState('')
  const [mostrarDropdown, setMostrarDropdown] = useState(false)
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null)
  const dropdownRef = useRef(null)

  const cargar = async () => {
    const [c, p, pr] = await Promise.all([axios.get(API), axios.get(API_PAC), axios.get(API_PRO)])
    setCitas(c.data)
    setPacientes(p.data)
    setProfesionales(pr.data)
  }

  useEffect(() => { cargar() }, [])

  // Cerrar dropdown al hacer clic afuera
  useEffect(() => {
    const handleClick = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMostrarDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const pacientesFiltrados = pacientes.filter(p => {
    const q = busquedaPaciente.toLowerCase()
    return (
      p.nombre.toLowerCase().includes(q) ||
      p.apellido.toLowerCase().includes(q) ||
      p.rut.toLowerCase().includes(q)
    )
  }).slice(0, 8)

  const seleccionarPaciente = p => {
    setPacienteSeleccionado(p)
    setForm({ ...form, paciente_id: p.id })
    setBusquedaPaciente(`${p.nombre} ${p.apellido} — ${p.rut}`)
    setMostrarDropdown(false)
    setErrores({ ...errores, paciente_id: '' })
  }

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrores({ ...errores, [e.target.name]: '' })
  }

  const validar = () => {
    const e = {}
    if (!form.paciente_id) e.paciente_id = 'Selecciona un paciente'
    if (!form.profesional_id) e.profesional_id = 'Selecciona un profesional'
    const errorFecha = validarFechaHora(form.fecha_hora)
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
    setPacienteSeleccionado(null)
    setErrores({})
    cargar()
  }

  const editar = c => {
    setForm({ paciente_id: c.paciente_id, profesional_id: c.profesional_id, fecha_hora: c.fecha_hora?.slice(0,16), estado: c.estado, observaciones: c.observaciones || '' })
    setBusquedaPaciente(`${c.paciente_nombre} ${c.paciente_apellido}`)
    setEditando(c.id)
    setErrores({})
  }

  const eliminar = async id => {
    if (confirm('¿Eliminar cita?')) {
      await axios.delete(`${API}/${id}`)
      cargar()
    }
  }

  const cancelar = () => {
    setEditando(null)
    setForm({ paciente_id: '', profesional_id: '', fecha_hora: '', estado: 'pendiente', observaciones: '' })
    setBusquedaPaciente('')
    setPacienteSeleccionado(null)
    setErrores({})
  }

  const selectClass = name =>
    `border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 w-full ${errores[name] ? 'border-red-400' : 'border-gray-300'}`

  const filtradas = citas.filter(c => {
    const q = busqueda.toLowerCase()
    const coincideBusqueda = !busqueda ||
      `${c.paciente_nombre} ${c.paciente_apellido}`.toLowerCase().includes(q) ||
      `${c.profesional_nombre} ${c.profesional_apellido}`.toLowerCase().includes(q) ||
      (c.observaciones && c.observaciones.toLowerCase().includes(q))
    const coincideEstado = !filtroEstado || c.estado === filtroEstado
    return coincideBusqueda && coincideEstado
  })

  return (
    <div>
      <h2 className="text-2xl font-bold text-green-800 mb-6">Citas</h2>

      <div className="bg-white rounded-xl shadow p-4 md:p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">{editando ? 'Editar cita' : 'Agendar cita'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">

          {/* Buscador de paciente */}
          <div className="flex flex-col relative" ref={dropdownRef}>
            <label className="text-sm text-gray-600 mb-1">Paciente</label>
            <input
              className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.paciente_id ? 'border-red-400' : 'border-gray-300'}`}
              placeholder="Buscar por nombre, apellido o RUT..."
              value={busquedaPaciente}
              onChange={e => {
                setBusquedaPaciente(e.target.value)
                setMostrarDropdown(true)
                setForm({ ...form, paciente_id: '' })
                setPacienteSeleccionado(null)
                setErrores({ ...errores, paciente_id: '' })
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
                    <button
                      key={p.id}
                      className="w-full text-left px-3 py-2 hover:bg-green-50 text-sm border-b border-gray-100 last:border-0"
                      onClick={() => seleccionarPaciente(p)}
                    >
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
            <select className={selectClass('profesional_id')} name="profesional_id" value={form.profesional_id} onChange={handleChange}>
              <option value="">Seleccionar profesional</option>
              {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
            </select>
            {errores.profesional_id && <span className="text-red-500 text-xs mt-1">{errores.profesional_id}</span>}
          </div>

          {/* Fecha y hora */}
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Hora de la cita <span className="text-gray-400 text-xs">(Lun-Vie 08:30-19:30 / Sáb AM o PM)</span></label>
            <input
              className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.fecha_hora ? 'border-red-400' : 'border-gray-300'}`}
              name="fecha_hora" type="datetime-local"
              min={`${new Date().toISOString().slice(0,10)}T08:30`}
              value={form.fecha_hora} onChange={handleChange}
            />
            {errores.fecha_hora && <span className="text-red-500 text-xs mt-1">{errores.fecha_hora}</span>}
          </div>

          {/* Estado */}
          <select className={selectClass('estado')} name="estado" value={form.estado} onChange={handleChange}>
            <option value="pendiente">Pendiente</option>
            <option value="confirmada">Confirmada</option>
            <option value="realizada">Realizada</option>
            <option value="cancelada">Cancelada</option>
          </select>

          {/* Observaciones */}
          <input
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 sm:col-span-2"
            name="observaciones" placeholder="Observaciones (opcional)"
            value={form.observaciones} onChange={handleChange}
          />
        </div>

        <div className="flex gap-3 mt-4">
          <button onClick={guardar} className="bg-green-700 text-white px-5 py-2 rounded-lg hover:bg-green-800 transition-colors font-medium">
            {editando ? 'Actualizar' : 'Agendar'}
          </button>
          {editando && (
            <button onClick={cancelar} className="bg-gray-200 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium">
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Búsqueda y filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <input
            className="w-full border border-gray-300 rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-green-400"
            placeholder="Buscar por paciente, profesional u observaciones..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          {busqueda && <button onClick={() => setBusqueda('')} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">✕</button>}
        </div>
        <select
          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
          value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="confirmada">Confirmada</option>
          <option value="realizada">Realizada</option>
          <option value="cancelada">Cancelada</option>
        </select>
      </div>
      {(busqueda || filtroEstado) && (
        <p className="text-sm text-gray-500 mb-3">{filtradas.length} cita{filtradas.length !== 1 ? 's' : ''} encontrada{filtradas.length !== 1 ? 's' : ''}</p>
      )}

      {/* Tabla escritorio */}
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
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${estadoColor[c.estado]}`}>{c.estado}</span>
                </td>
                <td className="px-4 py-3 text-gray-500">{c.observaciones}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => editar(c)} className="text-green-700 hover:underline text-sm font-medium">Editar</button>
                  <button onClick={() => eliminar(c.id)} className="text-red-500 hover:underline text-sm font-medium">Eliminar</button>
                </td>
              </tr>
            ))}
            {filtradas.length === 0 && (
              <tr><td colSpan="6" className="px-4 py-6 text-center text-gray-400">{busqueda || filtroEstado ? 'No se encontraron resultados' : 'No hay citas registradas'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Tarjetas móvil */}
      <div className="md:hidden flex flex-col gap-3">
        {filtradas.map(c => (
          <div key={c.id} className="bg-white rounded-xl shadow p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold text-gray-800">{c.paciente_nombre} {c.paciente_apellido}</p>
                <p className="text-sm text-gray-500">{c.profesional_nombre} {c.profesional_apellido}</p>
                <p className="text-sm text-gray-500 mt-1">🕐 {c.fecha_hora?.slice(0,16).replace('T',' ')}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${estadoColor[c.estado]}`}>{c.estado}</span>
            </div>
            {c.observaciones && <p className="text-sm text-gray-400 mb-2">{c.observaciones}</p>}
            <div className="flex gap-3">
              <button onClick={() => editar(c)} className="text-green-700 text-sm font-medium">Editar</button>
              <button onClick={() => eliminar(c.id)} className="text-red-500 text-sm font-medium">Eliminar</button>
            </div>
          </div>
        ))}
        {filtradas.length === 0 && (
          <div className="bg-white rounded-xl shadow p-6 text-center text-gray-400">{busqueda || filtroEstado ? 'No se encontraron resultados' : 'No hay citas registradas'}</div>
        )}
      </div>
    </div>
  )
}