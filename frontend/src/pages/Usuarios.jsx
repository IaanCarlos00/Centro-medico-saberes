import { useEffect, useState } from 'react'
import axios from 'axios'

const API = 'https://centro-medico-saberes.onrender.com/auth'

const rolBadge = {
  admin: 'bg-purple-100 text-purple-700',
  secretaria: 'bg-blue-100 text-blue-700',
  matrona: 'bg-green-100 text-green-700',
}

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'secretaria' })
  const [errores, setErrores] = useState({})
  const [mensaje, setMensaje] = useState('')

  const cargar = async () => {
    const res = await axios.get(`${API}/usuarios`)
    setUsuarios(res.data)
  }

  useEffect(() => { cargar() }, [])

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrores({ ...errores, [e.target.name]: '' })
  }

  const validar = () => {
    const e = {}
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio'
    if (!form.email.trim()) e.email = 'El email es obligatorio'
    if (!form.password.trim()) e.password = 'La contraseña es obligatoria'
    if (form.password.length < 6) e.password = 'Mínimo 6 caracteres'
    return e
  }

  const guardar = async () => {
    const e = validar()
    if (Object.keys(e).length > 0) { setErrores(e); return }
    try {
      await axios.post(`${API}/registro`, form)
      setForm({ nombre: '', email: '', password: '', rol: 'secretaria' })
      setErrores({})
      setMostrarForm(false)
      setMensaje('Usuario creado exitosamente')
      setTimeout(() => setMensaje(''), 3000)
      cargar()
    } catch (err) {
      setErrores({ email: 'El email ya está registrado' })
    }
  }

  const toggleActivo = async (id, activo) => {
    await axios.put(`${API}/usuarios/${id}`, { activo: !activo })
    cargar()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-green-800">Usuarios</h2>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-green-700 text-white px-5 py-2 rounded-lg hover:bg-green-800 font-medium transition-colors"
        >
          {mostrarForm ? 'Cancelar' : '+ Nuevo usuario'}
        </button>
      </div>

      {mensaje && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
          ✅ {mensaje}
        </div>
      )}

      {mostrarForm && (
        <div className="bg-white rounded-xl shadow p-5 mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Crear nuevo usuario</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Nombre *</label>
              <input className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.nombre ? 'border-red-400' : 'border-gray-300'}`} name="nombre" placeholder="Ej: Valentina González" value={form.nombre} onChange={handleChange} />
              {errores.nombre && <span className="text-red-500 text-xs mt-1">{errores.nombre}</span>}
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Email *</label>
              <input className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.email ? 'border-red-400' : 'border-gray-300'}`} name="email" type="email" placeholder="correo@saberes.cl" value={form.email} onChange={handleChange} />
              {errores.email && <span className="text-red-500 text-xs mt-1">{errores.email}</span>}
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Contraseña *</label>
              <input className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.password ? 'border-red-400' : 'border-gray-300'}`} name="password" type="password" placeholder="Mínimo 6 caracteres" value={form.password} onChange={handleChange} />
              {errores.password && <span className="text-red-500 text-xs mt-1">{errores.password}</span>}
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Rol *</label>
              <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" name="rol" value={form.rol} onChange={handleChange}>
                <option value="secretaria">Secretaria</option>
                <option value="matrona">Matrona</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <button onClick={guardar} className="bg-green-700 text-white px-5 py-2 rounded-lg hover:bg-green-800 font-medium mt-4">
            Crear usuario
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-green-50 text-green-800 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Nombre</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Rol</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {usuarios.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-800">{u.nombre}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${rolBadge[u.rol]}`}>{u.rol}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActivo(u.id, u.activo)}
                    className={`text-xs font-medium hover:underline ${u.activo ? 'text-red-500' : 'text-green-700'}`}
                  >
                    {u.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
            {usuarios.length === 0 && (
              <tr><td colSpan="5" className="px-4 py-6 text-center text-gray-400">No hay usuarios registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}