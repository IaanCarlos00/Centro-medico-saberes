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
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
          <circle cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="3"
            strokeDasharray={`${pct} 100`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-base font-black text-gray-800">{valor ? valor.toFixed(1) : '—'}</span>
        </div>
      </div>
      <p className="text-xs font-semibold text-gray-500 text-center">{label}</p>
    </div>
  )
}

export default function Encuestas() {
  const [encuestas, setEncuestas] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [enviando, setEnviando] = useState(null)
  const [generando, setGenerando] = useState(null)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [expandida, setExpandida] = useState(null)
  const [visibles, setVisibles] = useState(10)

  const cargar = async () => {
    const [e, p] = await Promise.all([axios.get(API), axios.get(API_PAC)])
    setEncuestas(e.data)
    setPacientes(p.data.filter(p => p.email || p.telefono))
  }

  useEffect(() => { cargar() }, [])
  useEffect(() => { setVisibles(10) }, [busqueda, filtroEstado])

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
  const promedio = respondidas.length > 0 ? respondidas.reduce((s, e) => s + (e.estrellas || 0), 0) / respondidas.length : 0
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
    <div className="min-h-screen bg-white">

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl mb-8 p-6" style={{ background: 'linear-gradient(135deg, #052e16 0%, #166534 60%, #15803d 100%)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #86efac, transparent)', transform: 'translate(30%, -30%)' }} />
        <div className="relative z-10">
          <p className="text-green-300 text-xs font-semibold uppercase tracking-widest mb-1">Satisfacción</p>
          <h2 className="text-3xl font-black text-white">Encuestas</h2>
          <p className="text-green-200 text-sm mt-1">{encuestas.length} encuesta{encuestas.length !== 1 ? 's' : ''} enviada{encuestas.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Enviadas', value: encuestas.length, sub: 'Total', gradient: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '#16a34a', text: '#166534', icon: '📨' },
          { label: 'Respondidas', value: respondidas.length, sub: `${tasaRespuesta}% tasa`, gradient: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '#3b82f6', text: '#1d4ed8', icon: '✅' },
          { label: 'Promedio', value: promedio ? `${promedio.toFixed(1)} ⭐` : '—', sub: 'General', gradient: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '#f59e0b', text: '#b45309', icon: '⭐' },
          { label: 'Recomiendan', value: recomendarian, sub: `de ${respondidas.length} respondidas`, gradient: 'linear-gradient(135deg, #f0fdfa, #ccfbf1)', border: '#14b8a6', text: '#0f766e', icon: '👍' },
        ].map((card, i) => (
          <div key={i} className="rounded-2xl p-5 hover:shadow-md transition-shadow" style={{ background: card.gradient, border: `1px solid ${card.border}22` }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: `${card.border}22` }}>{card.icon}</div>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: card.text }}>{card.label}</span>
            </div>
            <p className="text-3xl font-black mb-1" style={{ color: card.text }}>{card.value}</p>
            <p className="text-xs" style={{ color: card.text }}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Promedios por categoría */}
      {respondidas.length > 0 && (
        <div className="rounded-2xl p-6 mb-8 border border-gray-100 shadow-sm card-surface">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center text-base">📊</span>
            Promedios por categoría
          </h3>
          <div className="flex justify-around flex-wrap gap-6">
            <PromedioCircular valor={promedioCalidad} label="Calidad atención" />
            <PromedioCircular valor={promedioPuntualidad} label="Puntualidad" />
            <PromedioCircular valor={promedioInstalaciones} label="Instalaciones" />
            <PromedioCircular valor={promedioTrato} label="Trato y empatía" />
          </div>
        </div>
      )}

      {/* Enviar encuesta */}
      <div className="rounded-2xl p-6 mb-8 border border-gray-100 shadow-sm card-surface">
        <h3 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
          <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-base">📨</span>
          Enviar encuesta a paciente
        </h3>
        <p className="text-sm text-gray-400 mb-4 ml-10">Solo pacientes con email o teléfono registrado.</p>
        <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
          {pacientes.length === 0 && <p className="text-gray-300 text-sm text-center py-4">No hay pacientes registrados.</p>}
          {pacientes.map(p => (
            <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-green-200 transition-colors gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0" style={{ background: 'linear-gradient(135deg, #166534, #15803d)' }}>
                  {p.nombre?.charAt(0)}{p.apellido?.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 text-sm">{p.nombre} {p.apellido}</p>
                  <div className="flex gap-2 flex-wrap">
                    {p.email && <p className="text-xs text-gray-400">✉️ {p.email}</p>}
                    {p.telefono && <p className="text-xs text-gray-400">📱 {p.telefono}</p>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                {p.email && (
                  <button onClick={() => enviarEncuesta(p.id)} disabled={enviando === p.id} className="text-white px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50 hover:opacity-90" style={{ background: 'linear-gradient(135deg, #166534, #15803d)' }}>
                    {enviando === p.id ? '...' : '📨 Email'}
                  </button>
                )}
                {p.telefono && (
                  <button onClick={async () => {
                    if (generando === p.id) return
                    setGenerando(p.id)
                    try {
                      const res = await axios.post(`${API}/generar-link/${p.id}`)
                      const { link } = res.data
                      const telefono = p.telefono?.replace(/\D/g, '')
                      const numero = telefono?.startsWith('56') ? telefono : `56${telefono}`
                      const mensaje = encodeURIComponent(`Hola ${p.nombre} 👋, gracias por tu visita a Saberes. Te invitamos a compartir tu experiencia respondiendo esta breve encuesta: ${link} 💚`)
                      window.location.href = `https://wa.me/${numero}?text=${mensaje}`
                      cargar()
                    } catch (err) {
                      alert(err.response?.data?.error || 'Error al generar link')
                    } finally {
                      setGenerando(null)
                    }
                  }} disabled={generando === p.id} className="bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-600 disabled:opacity-50">
                    {generando === p.id ? '...' : '💬 WhatsApp'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <span className="absolute left-4 top-3 text-gray-400">🔍</span>
          <input className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 pl-11 focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm" placeholder="Buscar por paciente, matrona o comentario..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          {busqueda && <button onClick={() => setBusqueda('')} className="absolute right-4 top-3 text-gray-400 hover:text-gray-600">✕</button>}
        </div>
        <select className="border border-gray-200 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="enviada">Enviada</option>
          <option value="respondida">Respondida</option>
        </select>
      </div>

      {/* Lista encuestas */}
      <div className="flex flex-col gap-3">
        {filtradas.slice(0, visibles).map(e => (
          <div key={e.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-1 w-full" style={{ background: e.estado === 'respondida' ? 'linear-gradient(90deg, #166534, #15803d)' : e.estado === 'enviada' ? 'linear-gradient(90deg, #1d4ed8, #3b82f6)' : 'linear-gradient(90deg, #f59e0b, #fbbf24)' }} />
            <div className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0" style={{ background: 'linear-gradient(135deg, #166534, #15803d)' }}>
                    {e.paciente_nombre?.charAt(0)}{e.paciente_apellido?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{e.paciente_nombre} {e.paciente_apellido}</p>
                    <p className="text-xs text-gray-400">{e.email}</p>
                    {e.profesional_nombre && <p className="text-xs text-green-600 mt-0.5 font-semibold">👩‍⚕️ {e.profesional_nombre} {e.profesional_apellido}</p>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${e.estado === 'respondida' ? 'bg-green-100 text-green-700' : e.estado === 'enviada' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{e.estado}</span>
                  {e.enviada_en && <p className="text-xs text-gray-400">{new Date(e.enviada_en).toLocaleDateString('es-CL')}</p>}
                </div>
              </div>

              {e.estrellas && (
                <div className="flex items-center gap-2 mb-2">
                  <Estrellas valor={e.estrellas} />
                  <span className="text-sm font-bold text-gray-600">{e.estrellas}/5</span>
                </div>
              )}

              {e.estado === 'respondida' && (
                <button onClick={() => setExpandida(expandida === e.id ? null : e.id)} className="text-xs font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors mt-1">
                  {expandida === e.id ? '▲ Ocultar detalle' : '▼ Ver detalle completo'}
                </button>
              )}

              {expandida === e.id && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-3">
                  {(e.calidad_atencion || e.puntualidad || e.instalaciones || e.trato) && (
                    <div className="grid grid-cols-2 gap-2">
                      {[['calidad_atencion','Calidad'],['puntualidad','Puntualidad'],['instalaciones','Instalaciones'],['trato','Trato']].map(([key, label]) => e[key] ? (
                        <div key={key} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                          <p className="text-xs text-gray-400 font-semibold mb-1">{label}</p>
                          <Estrellas valor={e[key]} size="text-sm" />
                        </div>
                      ) : null)}
                    </div>
                  )}
                  {e.recomendaria !== null && e.recomendaria !== undefined && (
                    <div className={`px-3 py-2 rounded-xl text-sm font-semibold ${e.recomendaria ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                      {e.recomendaria ? '👍 Recomendaría Saberes' : '👎 No recomendaría por ahora'}
                    </div>
                  )}
                  {e.aspectos_positivos && <div className="rounded-xl p-3 border border-green-100" style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}><p className="text-xs font-bold text-green-700 mb-1">✨ Lo que más le gustó</p><p className="text-sm text-gray-600">{e.aspectos_positivos}</p></div>}
                  {e.aspectos_mejorar && <div className="rounded-xl p-3 border border-orange-100" style={{ background: 'linear-gradient(135deg, #fff7ed, #ffedd5)' }}><p className="text-xs font-bold text-orange-700 mb-1">🔧 Qué mejoraría</p><p className="text-sm text-gray-600">{e.aspectos_mejorar}</p></div>}
                  {e.comentario && <div className="rounded-xl p-3 border border-blue-100" style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)' }}><p className="text-xs font-bold text-blue-700 mb-1">💬 Comentario</p><p className="text-sm text-gray-600 italic">"{e.comentario}"</p></div>}
                  {e.respondida_en && <p className="text-xs text-gray-400">Respondida el {new Date(e.respondida_en).toLocaleDateString('es-CL')}</p>}
                </div>
              )}
            </div>
            <div className="px-5 pb-4 border-t border-gray-50 pt-3">
              <button onClick={async () => { if (confirm('¿Eliminar esta encuesta?')) { await axios.delete(`${API}/${e.id}`); cargar() } }} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">Eliminar</button>
            </div>
          </div>
        ))}
        {filtradas.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-5xl mb-3">⭐</p>
            <p className="text-gray-400">No hay encuestas registradas</p>
          </div>
        )}
        {filtradas.length > visibles && (
          <button onClick={() => setVisibles(v => v + 10)} className="w-full text-sm font-semibold text-green-700 bg-green-50 hover:bg-green-100 transition-colors rounded-xl py-3 mt-1">
            Ver más ({filtradas.length - visibles} restantes) ▼
          </button>
        )}
        {visibles > 10 && filtradas.length <= visibles && filtradas.length > 10 && (
          <button onClick={() => setVisibles(10)} className="w-full text-sm font-semibold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors rounded-xl py-3 mt-1">
            Ver menos ▲
          </button>
        )}
      </div>
    </div>
  )
}