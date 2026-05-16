import { useState } from 'react'
import axios from 'axios'

const API = 'https://centro-medico-saberes-production.up.railway.app/auth/cambiar-password'

export default function CambiarPassword() {
  const [form, setForm] = useState({ password_actual: '', password_nuevo: '', password_confirmar: '' })
  const [errores, setErrores] = useState({})
  const [exito, setExito] = useState('')
  const email = localStorage.getItem('email')

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrores({ ...errores, [e.target.name]: '' })
  }

  const guardar = async () => {
    const e = {}
    if (!form.password_actual) e.password_actual = 'Ingresa tu contraseña actual'
    if (!form.password_nuevo || form.password_nuevo.length < 6) e.password_nuevo = 'Mínimo 6 caracteres'
    if (form.password_nuevo !== form.password_confirmar) e.password_confirmar = 'Las contraseñas no coinciden'
    if (Object.keys(e).length > 0) { setErrores(e); return }

    try {
      await axios.put(API, { email, password_actual: form.password_actual, password_nuevo: form.password_nuevo })
      setExito('Contraseña actualizada correctamente')
      setForm({ password_actual: '', password_nuevo: '', password_confirmar: '' })
      setTimeout(() => setExito(''), 3000)
    } catch (err) {
      setErrores({ password_actual: err.response?.data?.error || 'Error al cambiar contraseña' })
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-green-800 mb-6">Cambiar contraseña</h2>

      {exito && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
          ✅ {exito}
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Contraseña actual *</label>
            <input
              className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.password_actual ? 'border-red-400' : 'border-gray-300'}`}
              name="password_actual" type="password" value={form.password_actual} onChange={handleChange}
            />
            {errores.password_actual && <span className="text-red-500 text-xs mt-1">{errores.password_actual}</span>}
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Nueva contraseña *</label>
            <input
              className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.password_nuevo ? 'border-red-400' : 'border-gray-300'}`}
              name="password_nuevo" type="password" value={form.password_nuevo} onChange={handleChange}
            />
            {errores.password_nuevo && <span className="text-red-500 text-xs mt-1">{errores.password_nuevo}</span>}
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Confirmar nueva contraseña *</label>
            <input
              className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.password_confirmar ? 'border-red-400' : 'border-gray-300'}`}
              name="password_confirmar" type="password" value={form.password_confirmar} onChange={handleChange}
            />
            {errores.password_confirmar && <span className="text-red-500 text-xs mt-1">{errores.password_confirmar}</span>}
          </div>
        </div>
        <button onClick={guardar} className="w-full bg-green-700 text-white py-2 rounded-lg hover:bg-green-800 font-medium mt-6">
          Cambiar contraseña
        </button>
      </div>
    </div>
  )
}