import { useEffect, useState } from 'react'
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

export default function Citas() {
  const [citas, setCitas] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [profesionales, setProfesionales] = useState([])
  const [form, setForm] = useState({ paciente_id: '', profesional_id: '', fecha_hora: '', estado: 'pendiente', observaciones: '' })
  const [editando, setEditando] = useState(null)
  const [errores, setErrores] = useState({})

  const cargar = async () => {
    const [c, p, pr] = await Promise.all([axios.get(API), axios.get(API_PAC), axios.get(API_PRO)])
    setCitas(c.data)
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
    if (!form.paciente_id) e.paciente_id = 'Selecciona un paciente'
    if (!form.profesional_id) e.profesional_id = 'Selecciona un profesional'
    if (!form.fecha_hora) e.fecha_hora = 'La hora de la cita es obligatoria'
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
    setErrores({})
    cargar()
  }

  const editar = c => {
    setForm({ paciente_id: c.paciente_id, profesional_id: c.profesional_id, fecha_hora: c.fecha_hora?.slice(0,16), estado: c.estado, observaciones: c.observaciones || '' })
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
    setErrores({})
  }

  const selectClass = name =>
    `border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 w-full ${errores[name] ? 'border-red-400' : 'border-gray-300'}`

  return (
    <div>
      <h2 className="text-2xl font-bold text-green-800 mb-6">Citas</h2>

      <div className="bg-white rounded-xl shadow p-4 md:p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">{editando ? 'Editar cita' : 'Agendar cita'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">

          <div className="flex flex-col">
            <select className={selectClass('paciente_id')} name="paciente_id" value={form.paciente_id} onChange={handleChange}>
              <option value="">Seleccionar paciente</option>
              {pacientes.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
            </select>
            {errores.paciente_id && <span className="text-red-500 text-xs mt-1">{errores.paciente_id}</span>}
          </div>

          <div className="flex flex-col">
            <select className={selectClass('profesional_id')} name="profesional_id" value={form.profesional_id} onChange={handleChange}>
              <option value="">Seleccionar profesional</option>
              {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
            </select>
            {errores.profesional_id && <span className="text-red-500 text-xs mt-1">{errores.profesional_id}</span>}
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Hora de la cita</label>
            <input
              className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.fecha_hora ? 'border-red-400' : 'border-gray-300'}`}
              name="fecha_hora" type="datetime-local" value={form.fecha_hora} onChange={handleChange}
            />
            {errores.fecha_hora && <span className="text-red-500 text-xs mt-1">{errores.fecha_hora}</span>}
          </div>

          <select className={selectClass('estado')} name="estado" value={form.estado} onChange={handleChange}>
            <option value="pendiente">Pendiente</option>
            <option value="confirmada">Confirmada</option>
            <option value="realizada">Realizada</option>
            <option value="cancelada">Cancelada</option>
          </select>

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
            {citas.map(c => (
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
            {citas.length === 0 && (
              <tr><td colSpan="6" className="px-4 py-6 text-center text-gray-400">No hay citas registradas</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Tarjetas móvil */}
      <div className="md:hidden flex flex-col gap-3">
        {citas.map(c => (
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
        {citas.length === 0 && (
          <div className="bg-white rounded-xl shadow p-6 text-center text-gray-400">No hay citas registradas</div>
        )}
      </div>
    </div>
  )
}