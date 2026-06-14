import { useState } from 'react'
import axios from 'axios'

const API = 'https://centro-medico-saberes-production.up.railway.app/auth/cambiar-password'

export default function CambiarPassword() {
  const [form, setForm] = useState({ password_actual: '', password_nuevo: '', password_confirmar: '' })
  const [errores, setErrores] = useState({})
  const [exito, setExito] = useState('')
  const [show, setShow] = useState({ actual: false, nuevo: false, confirmar: false })
  const email = localStorage.getItem('email')
  const nombre = localStorage.getItem('nombre')

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
      setTimeout(() => setExito(''), 4000)
    } catch (err) {
      setErrores({ password_actual: err.response?.data?.error || 'Error al cambiar contraseña' })
    }
  }

  const campos = [
    { key: 'password_actual', label: 'Contraseña actual *', showKey: 'actual' },
    { key: 'password_nuevo', label: 'Nueva contraseña *', showKey: 'nuevo' },
    { key: 'password_confirmar', label: 'Confirmar nueva contraseña *', showKey: 'confirmar' },
  ]

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl mb-8 p-6" style={{ background: 'linear-gradient(135deg, #052e16 0%, #166534 60%, #15803d 100%)' }}>
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #86efac, transparent)', transform: 'translate(30%, -30%)' }} />
          <div className="relative z-10">
            <p className="text-green-300 text-xs font-semibold uppercase tracking-widest mb-1">Seguridad</p>
            <h2 className="text-3xl font-black text-white">Cambiar contraseña</h2>
            {nombre && <p className="text-green-200 text-sm mt-1">{nombre}</p>}
          </div>
        </div>

        {/* Éxito */}
        {exito && (
          <div className="flex items-center gap-3 rounded-2xl px-5 py-4 mb-6 border border-green-200" style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}>
            <span className="text-2xl">✅</span>
            <p className="text-green-800 font-bold text-sm">{exito}</p>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col gap-5">
            {campos.map(({ key, label, showKey }) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-700">{label}</label>
                <div className="relative">
                  <input
                    type={show[showKey] ? 'text' : 'password'}
                    className={`w-full border rounded-xl px-4 py-3 pr-11 focus:outline-none focus:ring-2 focus:ring-green-400 transition-colors ${errores[key] ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}
                    name={key} value={form[key]} onChange={handleChange}
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShow(s => ({ ...s, [showKey]: !s[showKey] }))} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 text-lg">
                    {show[showKey] ? '🙈' : '👁️'}
                  </button>
                </div>
                {errores[key] && <span className="text-red-500 text-xs font-medium">{errores[key]}</span>}
              </div>
            ))}

            {/* Indicador de fortaleza */}
            {form.password_nuevo && (
              <div className="flex flex-col gap-1">
                <p className="text-xs text-gray-500 font-semibold">Fortaleza de la contraseña</p>
                <div className="flex gap-1">
                  {[
                    form.password_nuevo.length >= 6,
                    /[A-Z]/.test(form.password_nuevo),
                    /[0-9]/.test(form.password_nuevo),
                    /[^a-zA-Z0-9]/.test(form.password_nuevo),
                  ].map((ok, i) => (
                    <div key={i} className="flex-1 h-1.5 rounded-full transition-colors" style={{ background: ok ? '#16a34a' : '#e5e7eb' }} />
                  ))}
                </div>
                <p className="text-xs text-gray-400">
                  {form.password_nuevo.length < 6 ? 'Mínimo 6 caracteres' : /[A-Z]/.test(form.password_nuevo) && /[0-9]/.test(form.password_nuevo) && /[^a-zA-Z0-9]/.test(form.password_nuevo) ? '🔒 Contraseña muy segura' : /[A-Z]/.test(form.password_nuevo) || /[0-9]/.test(form.password_nuevo) ? '⚠️ Puedes hacerla más segura' : 'Agrega mayúsculas y números'}
                </p>
              </div>
            )}
          </div>

          <button onClick={guardar} className="w-full text-white py-3.5 rounded-xl font-black mt-6 hover:opacity-90 transition-all" style={{ background: 'linear-gradient(135deg, #166534, #15803d)' }}>
            🔐 Cambiar contraseña
          </button>
        </div>

        {/* Info seguridad */}
        <div className="mt-4 rounded-2xl p-4 border border-gray-100" style={{ background: 'linear-gradient(135deg, #f9fafb, #f3f4f6)' }}>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tips de seguridad</p>
          <div className="flex flex-col gap-1 text-xs text-gray-400">
            <p>• Usa al menos 8 caracteres</p>
            <p>• Combina mayúsculas, números y símbolos</p>
            <p>• No uses la misma contraseña en otros sitios</p>
          </div>
        </div>
      </div>
    </div>
  )
}