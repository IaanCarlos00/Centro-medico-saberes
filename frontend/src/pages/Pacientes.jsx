import { useEffect, useState } from 'react'
import axios from 'axios'
import Fichas from './Fichas'

const API = 'https://centro-medico-saberes-production.up.railway.app/pacientes'

export default function Pacientes() {
  const [pacientes, setPacientes] = useState([])
  const [form, setForm] = useState({ rut: '', nombre: '', apellido: '', fecha_nacimiento: '', telefono: '', email: '' })
  const [editando, setEditando] = useState(null)
  const [errores, setErrores] = useState({})
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null)

  const cargar = async () => {
    const res = await axios.get(API)
    setPacientes(res.data)
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
    } else {
      await axios.post(API, form)
    }
    setForm({ rut: '', nombre: '', apellido: '', fecha_nacimiento: '', telefono: '', email: '' })
    setErrores({})
    cargar()
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

  if (pacienteSeleccionado) {
    return <Fichas paciente={pacienteSeleccionado} onVolver={() => setPacienteSeleccionado(null)} />
  }

  return (
    <div>
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
            {pacientes.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-600">{p.rut}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{p.nombre}</td>
                <td className="px-4 py-3 text-gray-800">{p.apellido}</td>
                <td className="px-4 py-3 text-gray-600">{p.fecha_nacimiento?.slice(0,10)}</td>
                <td className="px-4 py-3 text-gray-600">{p.telefono}</td>
                <td className="px-4 py-3 text-gray-600">{p.email}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => setPacienteSeleccionado(p)} className="text-blue-600 hover:underline text-sm font-medium">Fichas</button>
                  <button onClick={() => editar(p)} className="text-green-700 hover:underline text-sm font-medium">Editar</button>
                  <button onClick={() => eliminar(p.id)} className="text-red-500 hover:underline text-sm font-medium">Eliminar</button>
                </td>
              </tr>
            ))}
            {pacientes.length === 0 && (
              <tr><td colSpan="7" className="px-4 py-6 text-center text-gray-400">No hay pacientes registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Tarjetas móvil */}
      <div className="md:hidden flex flex-col gap-3">
        {pacientes.map(p => (
          <div key={p.id} className="bg-white rounded-xl shadow p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold text-gray-800">{p.nombre} {p.apellido}</p>
                <p className="text-sm text-gray-500">{p.rut}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setPacienteSeleccionado(p)} className="text-blue-600 text-sm font-medium">Fichas</button>
                <button onClick={() => editar(p)} className="text-green-700 text-sm font-medium">Editar</button>
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
        {pacientes.length === 0 && (
          <div className="bg-white rounded-xl shadow p-6 text-center text-gray-400">No hay pacientes registrados</div>
        )}
      </div>
    </div>
  )
}