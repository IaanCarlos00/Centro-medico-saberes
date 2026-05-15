import { useState } from 'react'
import axios from 'axios'

const API = 'https://centro-medico-saberes-production.up.railway.app/auth'

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

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
      onLogin(res.data)
    } catch (err) {
      setError('Email o contraseña incorrectos')
    } finally {
      setCargando(false)
    }
  }

  const handleKeyDown = e => {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="Saberes" className="h-24 w-24 rounded-full object-cover shadow mb-4" />
          <h1 className="text-2xl font-bold text-green-800">Saberes</h1>
          <p className="text-gray-500 text-sm">Espacio de Salud Integral</p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Email</label>
            <input
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              name="email" type="email" placeholder="correo@ejemplo.cl"
              value={form.email} onChange={handleChange} onKeyDown={handleKeyDown}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Contraseña</label>
            <input
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              name="password" type="password" placeholder="••••••••"
              value={form.password} onChange={handleChange} onKeyDown={handleKeyDown}
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={cargando}
            className="bg-green-700 text-white py-2 rounded-lg hover:bg-green-800 transition-colors font-medium mt-2 disabled:opacity-50"
          >
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </div>
      </div>
    </div>
  )
}