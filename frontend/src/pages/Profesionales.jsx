import { useEffect, useState } from 'react'
import axios from 'axios'

const API = 'https://centro-medico-saberes.onrender.com/profesionales'

export default function Profesionales() {
  const [profesionales, setProfesionales] = useState([])
  const [form, setForm] = useState({ rut: '', nombre: '', apellido: '', especialidad: '' })
  const [editando, setEditando] = useState(null)
  const [errores, setErrores] = useState({})

  const cargar = async () => {
    const res = await axios.get(API)
    setProfesionales(res.data)
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
    if (!form.especialidad.trim()) e.especialidad = 'La especialidad es obligatoria'
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
    setForm({ rut: '', nombre: '', apellido: '', especialidad: '' })
    setErrores({})
    cargar()
  }

  const editar = p => {
    setForm({ rut: p.rut, nombre: p.nombre, apellido: p.apellido, especialidad: p.especialidad })
    setEditando(p.id)
    setErrores({})
  }

  const eliminar = async id => {
    if (confirm('¿Eliminar profesional?')) {
      await axios.delete(`${API}/${id}`)
      cargar()
    }
  }

  const cancelar = () => {
    setEditando(null)
    setForm({ rut: '', nombre: '', apellido: '', especialidad: '' })
    setErrores({})
  }

  const campo = (name, placeholder) => (
    <div className="flex flex-col">
      <input
        className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores[name] ? 'border-red-400' : 'border-gray-300'}`}
        name={name} placeholder={placeholder}
        value={form[name]} onChange={handleChange}
      />
      {errores[name] && <span className="text-red-500 text-xs mt-1">{errores[name]}</span>}
    </div>
  )

  return (
    <div>
      <h2 className="text-2xl font-bold text-green-800 mb-6">Profesionales</h2>

      <div className="bg-white rounded-xl shadow p-4 md:p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">{editando ? 'Editar profesional' : 'Agregar profesional'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {campo('rut', 'RUT')}
          {campo('nombre', 'Nombre')}
          {campo('apellido', 'Apellido')}
          {campo('especialidad', 'Especialidad')}
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

      {/* Tabla en escritorio */}
      <div className="hidden md:block bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-green-50 text-green-800 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">RUT</th>
              <th className="px-4 py-3 text-left">Nombre</th>
              <th className="px-4 py-3 text-left">Apellido</th>
              <th className="px-4 py-3 text-left">Especialidad</th>
              <th className="px-4 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {profesionales.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-600">{p.rut}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{p.nombre}</td>
                <td className="px-4 py-3 text-gray-800">{p.apellido}</td>
                <td className="px-4 py-3 text-gray-600">{p.especialidad}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => editar(p)} className="text-green-700 hover:underline text-sm font-medium">Editar</button>
                  <button onClick={() => eliminar(p.id)} className="text-red-500 hover:underline text-sm font-medium">Eliminar</button>
                </td>
              </tr>
            ))}
            {profesionales.length === 0 && (
              <tr><td colSpan="5" className="px-4 py-6 text-center text-gray-400">No hay profesionales registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Tarjetas en móvil */}
      <div className="md:hidden flex flex-col gap-3">
        {profesionales.map(p => (
          <div key={p.id} className="bg-white rounded-xl shadow p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-gray-800">{p.nombre} {p.apellido}</p>
                <p className="text-sm text-gray-500">{p.rut}</p>
                <p className="text-sm text-green-700 mt-1">{p.especialidad}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => editar(p)} className="text-green-700 text-sm font-medium">Editar</button>
                <button onClick={() => eliminar(p.id)} className="text-red-500 text-sm font-medium">Eliminar</button>
              </div>
            </div>
          </div>
        ))}
        {profesionales.length === 0 && (
          <div className="bg-white rounded-xl shadow p-6 text-center text-gray-400">No hay profesionales registrados</div>
        )}
      </div>
    </div>
  )
}