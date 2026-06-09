import { useEffect, useState } from 'react'
import axios from 'axios'

const API = 'https://centro-medico-saberes-production.up.railway.app/encuestas'
const API_PAC = 'https://centro-medico-saberes-production.up.railway.app/pacientes'

function Estrellas({ valor, size = 'text-lg' }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(n => (
        <span key={n} className={size}>{n <= valor ? '⭐' : '☆'}</span>
      ))}
    </div>
  )
}

function PromedioCircular({ valor, label }) {
  const pct = (valor / 5) * 100
  const color = valor >= 4 ? '#16a34a' : valor >= 3 ? '#ca8a04' : '#dc2626'
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
          <circle cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="3"
            strokeDasharray={`${pct} 100`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-gray-800">{valor ? valor.toFixed(1) : '—'}</span>
        </div>
      </div>
      <p className="text-xs text-gray-500 text-center">{label}</p>
    </div>
  )
}

export default function Encuestas() {
  const [encuestas, setEncuestas] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [enviando, setEnviando] = useState(null)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [expandida, setExpandida] = useState(null)

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

  const respondidas = encuestas.filter(e => e.estado === 'respondida')
  const promedio = respondidas.length > 0
    ? respondidas.reduce((s, e) => s + (e.estrellas || 0), 0) / respondidas.length
    : 0
  const promedioCalidad = respondidas.filter(e => e.calidad_atencion).reduce((s, e, _, a) => s + e.calidad_atencion / a.length, 0)
  const promedioPuntualidad = respondidas.filter(e => e.puntualidad).reduce((s, e, _, a) => s + e.puntualidad / a.length, 0)
  const promedioInstalaciones = respondidas.filter(e => e.instalaciones).reduce((s, e, _, a) => s + e.instalaciones / a.length, 0)
  const promedioTrato = respondidas.filter(e => e.trato).reduce((s, e, _, a) => s + e.trato / a.length, 0)
  const recomendarian = respondidas.filter(e => e.recomendaria === true).length
  const tasaRespuesta = encuestas.length > 0 ? Math.round(respondidas.length / encuestas.length * 100) : 0

  const filtradas = encuestas.filter(e => {
    const q = busqueda.toLowerCase()
    const coincideBusqueda = !busqueda ||
      `${e.paciente_nombre} ${e.paciente_apellido}`.toLowerCase().includes(q) ||
      (e.comentario || '').toLowerCase().includes(q) ||
      (e.profesional_nombre || '').toLowerCase().includes(q)
    const coincideEstado = !filtroEstado || e.estado === filtroEstado
    return coincideBusqueda && coincideEstado
  })

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-green-800">Encuestas de satisfacción</h2>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-green-600">
          <p className="text-xs text-gray-500 mb-1">Enviadas</p>
          <p className="text-3xl font-bold text-gray-800">{encuestas.length}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-blue-500">
          <p className="text-xs text-gray-500 mb-1">Respondidas</p>
          <p className="text-3xl font-bold text-gray-800">{respondidas.length}</p>
          <p className="text-xs text-blue-600 mt-1">{tasaRespuesta}% tasa</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-yellow-500">
          <p className="text-xs text-gray-500 mb-1">Promedio general</p>
          <p className="text-3xl font-bold text-gray-800">{promedio ? promedio.toFixed(1) : '—'} ⭐</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-teal-500">
          <p className="text-xs text-gray-500 mb-1">Recomendarían</p>
          <p className="text-3xl font-bold text-gray-800">{recomendarian}</p>
          <p className="text-xs text-teal-600 mt-1">de {respondidas.length} respondidas</p>
        </div>
      </div>

      {/* Promedios por categoría */}
      {respondidas.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Promedios por categoría</h3>
          <div className="flex justify-around flex-wrap gap-4">
            <PromedioCircular valor={promedioCalidad} label="Calidad atención" />
            <PromedioCircular valor={promedioPuntualidad} label="Puntualidad" />
            <PromedioCircular valor={promedioInstalaciones} label="Instalaciones" />
            <PromedioCircular valor={promedioTrato} label="Trato y empatía" />
          </div>
        </div>
      )}

      {/* Enviar encuesta */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-2">📨 Enviar encuesta a paciente</h3>
        <p className="text-sm text-gray-500 mb-4">Solo aparecen pacientes con email registrado.</p>
        <div className="flex flex-col gap-2 max-h-52 overflow-y-auto">
          {pacientes.length === 0 && <p className="text-gray-400 text-sm">No hay pacientes con email registrado.</p>}
          {pacientes.map(p => (
            <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-800 text-sm">{p.nombre} {p.apellido}</p>
                <p className="text-xs text-gray-400">{p.email}</p>
              </div>
              <button
                onClick={() => enviarEncuesta(p.id)}
                disabled={enviando === p.id}
                className="bg-green-700 text-white px-4 py-1.5 rounded-lg hover:bg-green-800 text-sm font-medium disabled:opacity-50"
              >
                {enviando === p.id ? 'Enviando...' : '📨 Enviar'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input className="w-full border border-gray-300 rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-green-400"
            placeholder="Buscar por paciente, matrona o comentario..."
            value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          {busqueda && <button onClick={() => setBusqueda('')} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">✕</button>}
        </div>
        <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
          value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="enviada">Enviada</option>
          <option value="respondida">Respondida</option>
        </select>
      </div>

      {/* Lista encuestas */}
      <div className="flex flex-col gap-3">
        {filtradas.map(e => (
          <div key={e.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold text-gray-800">{e.paciente_nombre} {e.paciente_apellido}</p>
                  <p className="text-xs text-gray-400">{e.email}</p>
                  {e.profesional_nombre && (
                    <p className="text-xs text-green-600 mt-0.5">👩‍⚕️ {e.profesional_nombre} {e.profesional_apellido}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    e.estado === 'respondida' ? 'bg-green-100 text-green-700' :
                    e.estado === 'enviada' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{e.estado}</span>
                  {e.enviada_en && <p className="text-xs text-gray-400">{new Date(e.enviada_en).toLocaleDateString('es-CL')}</p>}
                </div>
              </div>

              {e.estrellas && <Estrellas valor={e.estrellas} />}

              {e.estado === 'respondida' && (
                <button onClick={() => setExpandida(expandida === e.id ? null : e.id)}
                  className="text-xs text-green-700 hover:underline font-medium mt-2">
                  {expandida === e.id ? '▲ Ocultar detalle' : '▼ Ver detalle completo'}
                </button>
              )}

              {expandida === e.id && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-3">
                  {(e.calidad_atencion || e.puntualidad || e.instalaciones || e.trato) && (
                    <div className="grid grid-cols-2 gap-2">
                      {e.calidad_atencion && <div className="bg-gray-50 rounded-xl p-2 text-center"><p className="text-xs text-gray-500">Calidad</p><Estrellas valor={e.calidad_atencion} size="text-sm" /></div>}
                      {e.puntualidad && <div className="bg-gray-50 rounded-xl p-2 text-center"><p className="text-xs text-gray-500">Puntualidad</p><Estrellas valor={e.puntualidad} size="text-sm" /></div>}
                      {e.instalaciones && <div className="bg-gray-50 rounded-xl p-2 text-center"><p className="text-xs text-gray-500">Instalaciones</p><Estrellas valor={e.instalaciones} size="text-sm" /></div>}
                      {e.trato && <div className="bg-gray-50 rounded-xl p-2 text-center"><p className="text-xs text-gray-500">Trato</p><Estrellas valor={e.trato} size="text-sm" /></div>}
                    </div>
                  )}
                  {e.recomendaria !== null && e.recomendaria !== undefined && (
                    <p className="text-sm">{e.recomendaria ? '👍 Recomendaría Saberes' : '👎 No recomendaría por ahora'}</p>
                  )}
                  {e.aspectos_positivos && <div className="bg-green-50 rounded-xl p-3"><p className="text-xs font-semibold text-green-700 mb-1">✨ Lo que más le gustó</p><p className="text-sm text-gray-600">{e.aspectos_positivos}</p></div>}
                  {e.aspectos_mejorar && <div className="bg-orange-50 rounded-xl p-3"><p className="text-xs font-semibold text-orange-700 mb-1">🔧 Qué mejoraría</p><p className="text-sm text-gray-600">{e.aspectos_mejorar}</p></div>}
                  {e.comentario && <div className="bg-blue-50 rounded-xl p-3"><p className="text-xs font-semibold text-blue-700 mb-1">💬 Comentario adicional</p><p className="text-sm text-gray-600 italic">"{e.comentario}"</p></div>}
                  {e.respondida_en && <p className="text-xs text-gray-400">Respondida el {new Date(e.respondida_en).toLocaleDateString('es-CL')}</p>}
                </div>
              )}
            </div>
            <div className="px-5 pb-4">
              <button onClick={async () => {
                if (confirm('¿Eliminar esta encuesta?')) { await axios.delete(`${API}/${e.id}`); cargar() }
              }} className="text-red-500 text-xs hover:underline font-medium">Eliminar</button>
            </div>
          </div>
        ))}
        {filtradas.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-400">No hay encuestas registradas</div>
        )}
      </div>
    </div>
  )
}