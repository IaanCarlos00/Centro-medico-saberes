import { useEffect, useState } from 'react'
import axios from 'axios'

const API = 'https://centro-medico-saberes-production.up.railway.app/bloqueos'

export default function Bloqueos() {
  const [bloqueos, setBloqueos] = useState([])
  const [form, setForm] = useState({ fecha_inicio: '', fecha_fin: '', motivo: '' })
  const [errores, setErrores] = useState({})
  const [mostrarForm, setMostrarForm] = useState(false)

  const usuarioId = localStorage.getItem('id')

  const cargar = async () => {
    const res = await axios.get(API)
    setBloqueos(res.data)
  }

  useEffect(() => { cargar() }, [])

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrores({ ...errores, [e.target.name]: '' })
  }

  const validar = () => {
    const e = {}
    if (!form.fecha_inicio) e.fecha_inicio = 'La fecha de inicio es obligatoria'
    if (!form.fecha_fin) e.fecha_fin = 'La fecha de fin es obligatoria'
    if (form.fecha_fin <= form.fecha_inicio) e.fecha_fin = 'La fecha de fin debe ser posterior al inicio'
    return e
  }

  const guardar = async () => {
    const e = validar()
    if (Object.keys(e).length > 0) { setErrores(e); return }
    await axios.post(API, { ...form, creado_por: usuarioId || null })
    setForm({ fecha_inicio: '', fecha_fin: '', motivo: '' })
    setErrores({})
    setMostrarForm(false)
    cargar()
  }

  const eliminar = async id => {
    if (confirm('¿Eliminar bloqueo?')) {
      await axios.delete(`${API}/${id}`)
      cargar()
    }
  }

  const formatFecha = f => new Date(f).toLocaleString('es-CL', {
    weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  const esPasado = f => new Date(f) < new Date()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-green-800">Bloqueo de horarios</h2>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-green-700 text-white px-5 py-2 rounded-lg hover:bg-green-800 font-medium transition-colors"
        >
          {mostrarForm ? 'Cancelar' : '+ Bloquear horario'}
        </button>
      </div>

      {mostrarForm && (
        <div className="bg-white rounded-xl shadow p-5 mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Nuevo bloqueo</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Desde *</label>
              <input
                className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.fecha_inicio ? 'border-red-400' : 'border-gray-300'}`}
                name="fecha_inicio" type="datetime-local" value={form.fecha_inicio} onChange={handleChange}
              />
              {errores.fecha_inicio && <span className="text-red-500 text-xs mt-1">{errores.fecha_inicio}</span>}
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Hasta *</label>
              <input
                className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.fecha_fin ? 'border-red-400' : 'border-gray-300'}`}
                name="fecha_fin" type="datetime-local" value={form.fecha_fin} onChange={handleChange}
              />
              {errores.fecha_fin && <span className="text-red-500 text-xs mt-1">{errores.fecha_fin}</span>}
            </div>
            <div className="flex flex-col sm:col-span-2">
              <label className="text-sm text-gray-600 mb-1">Motivo (opcional)</label>
              <input
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                name="motivo" placeholder="Ej: Capacitación, día libre, reunión..."
                value={form.motivo} onChange={handleChange}
              />
            </div>
          </div>
          <button onClick={guardar} className="bg-green-700 text-white px-5 py-2 rounded-lg hover:bg-green-800 font-medium mt-4">
            Guardar bloqueo
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {bloqueos.length === 0 && (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-400">
            No hay horarios bloqueados
          </div>
        )}
        {bloqueos.map(b => (
          <div key={b.id} className={`bg-white rounded-xl shadow p-4 border-l-4 ${esPasado(b.fecha_fin) ? 'border-gray-300 opacity-60' : 'border-red-400'}`}>
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🚫</span>
                  <p className="font-semibold text-gray-800">
                    {formatFecha(b.fecha_inicio)} → {formatFecha(b.fecha_fin)}
                  </p>
                </div>
                {b.motivo && <p className="text-sm text-gray-500 ml-7">{b.motivo}</p>}
                {b.creado_por_nombre && <p className="text-xs text-gray-400 ml-7 mt-1">Por: {b.creado_por_nombre}</p>}
                {esPasado(b.fecha_fin) && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full ml-7 mt-1 inline-block">Pasado</span>}
              </div>
              <button onClick={() => eliminar(b.id)} className="text-red-500 hover:underline text-sm font-medium">Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}