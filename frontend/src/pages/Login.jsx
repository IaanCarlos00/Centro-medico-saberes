import { useState } from 'react'
import axios from 'axios'

const API = 'https://centro-medico-saberes-production.up.railway.app/auth'

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async () => {
    if (!form.email || !form.password) { setError('Completa todos los campos'); return }
    setCargando(true)
    setError('')
    try {
      const res = await axios.post(`${API}/login`, form)
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('nombre', res.data.nombre)
      localStorage.setItem('rol', res.data.rol)
      localStorage.setItem('email', res.data.email)
      localStorage.setItem('profesional_id', res.data.profesional_id !== null && res.data.profesional_id !== undefined ? String(res.data.profesional_id) : '')
      localStorage.setItem('id', res.data.id)
      onLogin(res.data)
    } catch (err) {
      setError('Email o contraseña incorrectos')
    } finally {
      setCargando(false)
    }
  }

  const handleKeyDown = e => { if (e.key === 'Enter') handleSubmit() }

  return (
    <div className="min-h-screen flex">

      {/* Panel izquierdo — decorativo */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-800 via-green-700 to-emerald-600 flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Círculos decorativos */}
        <div className="absolute top-[-80px] left-[-80px] w-80 h-80 bg-white opacity-5 rounded-full" />
        <div className="absolute bottom-[-60px] right-[-60px] w-64 h-64 bg-white opacity-5 rounded-full" />
        <div className="absolute top-1/2 left-[-40px] w-40 h-40 bg-emerald-400 opacity-10 rounded-full" />

        <div className="relative z-10 text-center">
          <img src="/logo.png" alt="Saberes" className="h-32 w-32 rounded-full object-cover shadow-2xl mx-auto mb-8 border-4 border-white border-opacity-30" />
          <h1 className="text-5xl font-bold text-white mb-3">Saberes</h1>
          <p className="text-green-200 text-xl mb-10">Espacio de Salud Integral</p>
          <div className="flex flex-col gap-4 text-left">
            {[
              { icon: '🌿', text: 'Gestión integral de pacientes' },
              { icon: '📅', text: 'Agenda y citas en tiempo real' },
              { icon: '📋', text: 'Fichas clínicas digitales' },
              { icon: '💚', text: 'Cuidado con propósito' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-white bg-opacity-10 rounded-2xl px-5 py-3">
                <span className="text-2xl">{item.icon}</span>
                <span className="text-white text-sm font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-md">

          {/* Logo móvil */}
          <div className="flex flex-col items-center mb-10 lg:hidden">
            <img src="/logo.png" alt="Saberes" className="h-20 w-20 rounded-full object-cover shadow-lg mb-3" />
            <h1 className="text-2xl font-bold text-green-800">Saberes</h1>
            <p className="text-gray-400 text-sm">Espacio de Salud Integral</p>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Bienvenida 👋</h2>
            <p className="text-gray-400 mt-1">Ingresa tus credenciales para continuar</p>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700">Correo electrónico</label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-gray-400 text-sm">✉️</span>
                <input
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent bg-white shadow-sm text-gray-800 placeholder-gray-300 transition-all"
                  name="email" type="email" placeholder="correo@ejemplo.cl"
                  value={form.email} onChange={handleChange} onKeyDown={handleKeyDown}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700">Contraseña</label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-gray-400 text-sm">🔒</span>
                <input
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pl-10 pr-12 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent bg-white shadow-sm text-gray-800 placeholder-gray-300 transition-all"
                  name="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                  value={form.password} onChange={handleChange} onKeyDown={handleKeyDown}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 text-sm"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <span>❌</span>
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={cargando}
              className="w-full bg-gradient-to-r from-green-700 to-emerald-600 text-white py-3.5 rounded-xl font-semibold text-base hover:from-green-800 hover:to-emerald-700 transition-all shadow-lg shadow-green-200 disabled:opacity-50 disabled:cursor-not-allowed mt-1"
            >
              {cargando ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span> Ingresando...
                </span>
              ) : 'Ingresar →'}
            </button>
          </div>

          <p className="text-center text-gray-400 text-xs mt-8">
            © {new Date().getFullYear()} Saberes · Espacio de Salud Integral
          </p>
        </div>
      </div>
    </div>
  )
}