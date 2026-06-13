import { useEffect, useState } from 'react'
import axios from 'axios'

const API = 'https://centro-medico-saberes-production.up.railway.app/auth'

const rolConfig = {
  admin: { badge: 'bg-purple-100 text-purple-700', gradient: 'linear-gradient(135deg, #7c3aed, #8b5cf6)', icon: '👑', label: 'Administrador' },
  secretaria: { badge: 'bg-blue-100 text-blue-700', gradient: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', icon: '📋', label: 'Secretaria' },
  matrona: { badge: 'bg-green-100 text-green-700', gradient: 'linear-gradient(135deg, #166534, #15803d)', icon: '🩺', label: 'Matrona' },
}

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [modalForm, setModalForm] = useState(false)
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'secretaria' })
  const [errores, setErrores] = useState({})
  const [mensaje, setMensaje] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [filtroRol, setFiltroRol] = useState('')

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
      setModalForm(false)
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

  const cerrarModal = () => {
    setModalForm(false)
    setForm({ nombre: '', email: '', password: '', rol: 'secretaria' })
    setErrores({})
  }

  const filtrados = usuarios.filter(u => {
    const q = busqueda.toLowerCase()
    const coincide = !busqueda || u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    const coincideRol = !filtroRol || u.rol === filtroRol
    return coincide && coincideRol
  })

  const stats = {
    total: usuarios.length,
    activos: usuarios.filter(u => u.activo).length,
    matronas: usuarios.filter(u => u.rol === 'matrona').length,
    secretarias: usuarios.filter(u => u.rol === 'secretaria').length,
  }

  return (
    <div className="min-h-screen bg-white">

      {/* Modal */}
      {modalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4" onClick={cerrarModal}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #052e16, #166534)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: 'rgba(255,255,255,0.15)' }}>👤</div>
                <div>
                  <h3 className="text-lg font-bold text-white">Nuevo usuario</h3>
                  <p className="text-green-300 text-xs">Completa todos los campos</p>
                </div>
              </div>
              <button onClick={cerrarModal} className="text-white hover:text-green-200 text-2xl leading-none">✕</button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              {[
                { label: 'Nombre completo *', name: 'nombre', placeholder: 'Ej: Valentina González', error: errores.nombre },
                { label: 'Email *', name: 'email', type: 'email', placeholder: 'correo@saberes.cl', error: errores.email },
              ].map(f => (
                <div key={f.name} className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">{f.label}</label>
                  <input type={f.type || 'text'} className={`border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 transition-colors ${f.error ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`} name={f.name} placeholder={f.placeholder} value={form[f.name]} onChange={handleChange} />
                  {f.error && <span className="text-red-500 text-xs">{f.error}</span>}
                </div>
              ))}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-700">Contraseña *</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} className={`w-full border rounded-xl px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-green-400 transition-colors ${errores.password ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`} name="password" placeholder="Mínimo 6 caracteres" value={form.password} onChange={handleChange} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">{showPassword ? '🙈' : '👁️'}</button>
                </div>
                {errores.password && <span className="text-red-500 text-xs">{errores.password}</span>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-700">Rol *</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(rolConfig).map(([rol, config]) => (
                    <button key={rol} type="button" onClick={() => setForm(f => ({ ...f, rol }))}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${form.rol === rol ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <span className="text-xl">{config.icon}</span>
                      <span className="text-xs font-semibold text-gray-700">{config.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={cerrarModal} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 font-medium transition-colors">Cancelar</button>
              <button onClick={guardar} className="flex-1 text-white py-3 rounded-xl font-bold transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg, #166534, #15803d)' }}>
                + Crear usuario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl mb-8 p-6 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #052e16 0%, #166534 60%, #15803d 100%)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #86efac, transparent)', transform: 'translate(30%, -30%)' }} />
        <div className="relative z-10">
          <p className="text-green-300 text-xs font-semibold uppercase tracking-widest mb-1">Administración</p>
          <h2 className="text-3xl font-black text-white">Usuarios</h2>
          <p className="text-green-200 text-sm mt-1">{stats.activos} activos de {stats.total}</p>
        </div>
        <button onClick={() => setModalForm(true)} className="relative z-10 flex items-center gap-2 text-sm font-bold px-5 py-3 rounded-2xl transition-all hover:scale-105 shrink-0" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.25)' }}>
          <span className="text-lg">+</span> Nuevo usuario
        </button>
      </div>

      {/* Mensaje éxito */}
      {mensaje && (
        <div className="flex items-center gap-3 rounded-2xl px-5 py-4 mb-6 border border-green-200" style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}>
          <span className="text-xl">✅</span>
          <p className="text-green-800 font-semibold text-sm">{mensaje}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total usuarios', value: stats.total, icon: '👥', gradient: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '#16a34a', text: '#166534' },
          { label: 'Activos', value: stats.activos, icon: '✅', gradient: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '#3b82f6', text: '#1d4ed8' },
          { label: 'Matronas', value: stats.matronas, icon: '🩺', gradient: 'linear-gradient(135deg, #f0fdfa, #ccfbf1)', border: '#14b8a6', text: '#0f766e' },
          { label: 'Secretarias', value: stats.secretarias, icon: '📋', gradient: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', border: '#8b5cf6', text: '#6d28d9' },
        ].map((card, i) => (
          <div key={i} className="rounded-2xl p-5 hover:shadow-md transition-shadow" style={{ background: card.gradient, border: `1px solid ${card.border}22` }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: `${card.border}22` }}>{card.icon}</div>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: card.text }}>{card.label}</span>
            </div>
            <p className="text-4xl font-black" style={{ color: card.text }}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <span className="absolute left-3 top-3 text-gray-400">🔍</span>
          <input className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 pl-10 focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm" placeholder="Buscar por nombre o email..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          {busqueda && <button onClick={() => setBusqueda('')} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">✕</button>}
        </div>
        <select className="border border-gray-200 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm" value={filtroRol} onChange={e => setFiltroRol(e.target.value)}>
          <option value="">Todos los roles</option>
          <option value="admin">👑 Admin</option>
          <option value="matrona">🩺 Matrona</option>
          <option value="secretaria">📋 Secretaria</option>
        </select>
      </div>

      {/* Tabla desktop */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}>
              {['Usuario', 'Email', 'Rol', 'Estado', 'Acciones'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-green-800 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtrados.map(u => (
              <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${!u.activo ? 'opacity-60' : ''}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0" style={{ background: rolConfig[u.rol]?.gradient || 'linear-gradient(135deg, #6b7280, #9ca3af)' }}>
                      {u.nombre?.charAt(0).toUpperCase()}
                    </div>
                    <p className="font-semibold text-gray-800">{u.nombre}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${rolConfig[u.rol]?.badge || 'bg-gray-100 text-gray-600'}`}>
                    {rolConfig[u.rol]?.icon} {rolConfig[u.rol]?.label || u.rol}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${u.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {u.activo ? '● Activo' : '● Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActivo(u.id, u.activo)} className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${u.activo ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                    {u.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr><td colSpan="5" className="px-4 py-12 text-center">
                <p className="text-4xl mb-2">👥</p>
                <p className="text-gray-400 text-sm">No se encontraron usuarios</p>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Tarjetas móvil */}
      <div className="md:hidden flex flex-col gap-3">
        {filtrados.map(u => (
          <div key={u.id} className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-4 ${!u.activo ? 'opacity-60' : ''}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black text-white shrink-0" style={{ background: rolConfig[u.rol]?.gradient || 'linear-gradient(135deg, #6b7280, #9ca3af)' }}>
                {u.nombre?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800">{u.nombre}</p>
                <p className="text-xs text-gray-400 truncate">{u.email}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-bold shrink-0 ${u.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                {u.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-50">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${rolConfig[u.rol]?.badge || 'bg-gray-100 text-gray-600'}`}>
                {rolConfig[u.rol]?.icon} {rolConfig[u.rol]?.label || u.rol}
              </span>
              <button onClick={() => toggleActivo(u.id, u.activo)} className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${u.activo ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                {u.activo ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </div>
        ))}
        {filtrados.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <p className="text-4xl mb-2">👥</p>
            <p className="text-gray-400 text-sm">No se encontraron usuarios</p>
          </div>
        )}
      </div>
    </div>
  )
}