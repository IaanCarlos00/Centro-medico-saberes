import { useEffect, useState } from 'react'
import axios from 'axios'

const API = 'https://centro-medico-saberes.onrender.com/encuestas'
const API_PAC = 'https://centro-medico-saberes.onrender.com/pacientes'

export default function Encuestas() {
  const [encuestas, setEncuestas] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [enviando, setEnviando] = useState(null)

  const cargar = async () => {
    const [e, p] = await Promise.all([axios.get(API), axios.get(API_PAC)])
    setEncuestas(e.data)
    setPacientes(p.data.filter(p => p.email))
  }

  useEffect(() => { cargar() }, [])

  const enviarEncuesta = async (paciente_id) => {
    setEnviando(paciente_id)
    try {
      await axios.post(`${API}/enviar/${paciente_id}`)
      alert('Encuesta enviada correctamente')
      cargar()
    } catch (err) {
      alert(err.response?.data?.error || 'Error al enviar encuesta')
    } finally {
      setEnviando(null)
    }
  }

  const promedio = encuestas.filter(e => e.estrellas).reduce((sum, e, _, arr) => sum + e.estrellas / arr.length, 0)

  const filtradas = encuestas.filter(e => {
    const q = busqueda.toLowerCase()
    return !busqueda ||
      `${e.paciente_nombre} ${e.paciente_apellido}`.toLowerCase().includes(q) ||
      (e.comentario || '').toLowerCase().includes(q)
  })

  return (
    <div>
      <h2 className="text-2xl font-bold text-green-800 mb-6">Encuestas de satisfacción</h2>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-3xl font-bold text-green-800">{encuestas.length}</p>
          <p className="text-sm text-gray-500">Encuestas enviadas</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-3xl font-bold text-green-800">{encuestas.filter(e => e.estado === 'respondida').length}</p>
          <p className="text-sm text-gray-500">Respondidas</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-3xl font-bold text-green-800">{promedio ? promedio.toFixed(1) + ' ⭐' : '—'}</p>
          <p className="text-sm text-gray-500">Promedio</p>
        </div>
      </div>

      {/* Enviar encuesta */}
      <div className="bg-white rounded-xl shadow p-5 mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Enviar encuesta a paciente</h3>
        <p className="text-sm text-gray-500 mb-3">Solo aparecen pacientes con email registrado.</p>
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
          {pacientes.length === 0 && <p className="text-gray-400 text-sm">No hay pacientes con email registrado.</p>}
          {pacientes.map(p => (
            <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-800 text-sm">{p.nombre} {p.apellido}</p>
                <p className="text-xs text-gray-400">{p.email}</p>
              </div>
              <button
                onClick={() => enviarEncuesta(p.id)}
                disabled={enviando === p.id}
                className="bg-green-700 text-white px-3 py-1 rounded-lg hover:bg-green-800 text-sm font-medium disabled:opacity-50"
              >
                {enviando === p.id ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Resultados */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <input className="w-full border border-gray-300 rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="Buscar por paciente o comentario..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          {busqueda && <button onClick={() => setBusqueda('')} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">✕</button>}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {filtradas.map(e => (
          <div key={e.id} className="bg-white rounded-xl shadow p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold text-gray-800">{e.paciente_nombre} {e.paciente_apellido}</p>
                <p className="text-xs text-gray-400">{e.email}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                e.estado === 'respondida' ? 'bg-green-100 text-green-700' :
                e.estado === 'enviada' ? 'bg-blue-100 text-blue-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>{e.estado}</span>
            </div>
            {e.estrellas && (
              <div className="flex gap-1 mb-1">
                {[1,2,3,4,5].map(n => (
                  <span key={n} className="text-lg">{n <= e.estrellas ? '⭐' : '☆'}</span>
                ))}
              </div>
            )}
            {e.comentario && <p className="text-sm text-gray-600 italic">"{e.comentario}"</p>}
            {e.respondida_en && <p className="text-xs text-gray-400 mt-1">Respondida el {new Date(e.respondida_en).toLocaleDateString('es-CL')}</p>}
          </div>
        ))}
        {filtradas.length === 0 && <div className="bg-white rounded-xl shadow p-6 text-center text-gray-400">No hay encuestas registradas</div>}
      </div>
    </div>
  )
}