import { useEffect, useState } from 'react'
import axios from 'axios'

const API_DASH = 'https://centro-medico-saberes-production.up.railway.app/dashboard'
const API_CITAS = 'https://centro-medico-saberes-production.up.railway.app/citas'
const API_PRO = 'https://centro-medico-saberes-production.up.railway.app/profesionales'

function diasHasta(fecha) {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const f = new Date(String(fecha).slice(0, 10) + 'T12:00:00')
  return Math.round((f - hoy) / (1000 * 60 * 60 * 24))
}

function badgeUrgencia(dias) {
  if (dias < 0) return { label: 'Vencido', clase: 'bg-red-100 text-red-700', color: '#ef4444', icono: '🔴' }
  if (dias === 0) return { label: 'Hoy', clase: 'bg-red-100 text-red-700', color: '#ef4444', icono: '🔴' }
  if (dias <= 7) return { label: `En ${dias} días`, clase: 'bg-orange-100 text-orange-700', color: '#f97316', icono: '🟠' }
  if (dias <= 30) return { label: `En ${dias} días`, clase: 'bg-yellow-100 text-yellow-700', color: '#f59e0b', icono: '🟡' }
  return { label: `En ${dias} días`, clase: 'bg-green-100 text-green-700', color: '#22c55e', icono: '🟢' }
}

function ModalAgendar({ paciente, onCerrar, onAgendado }) {
  const [profesionales, setProfesionales] = useState([])
  const [form, setForm] = useState({ profesional_id: '', fecha_hora: '', observaciones: '' })
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)

  useEffect(() => { axios.get(API_PRO).then(r => setProfesionales(r.data)) }, [])

  const guardar = async () => {
    const e = {}
    if (!form.profesional_id) e.profesional_id = 'Selecciona un profesional'
    if (!form.fecha_hora) e.fecha_hora = 'Selecciona fecha y hora'
    if (Object.keys(e).length > 0) { setErrores(e); return }
    setGuardando(true)
    await axios.post(API_CITAS, { paciente_id: paciente.id, profesional_id: form.profesional_id, fecha_hora: form.fecha_hora, estado: 'confirmada', observaciones: form.observaciones || null })
    setGuardando(false)
    onAgendado()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4" onClick={onCerrar}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #052e16, #166534)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: 'rgba(255,255,255,0.15)' }}>📅</div>
            <div>
              <h3 className="text-lg font-bold text-white">Agendar control</h3>
              <p className="text-green-300 text-xs">{paciente.nombre} {paciente.apellido}</p>
            </div>
          </div>
          <button onClick={onCerrar} className="text-white hover:text-green-200 text-2xl">✕</button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          {[
            { label: 'Profesional *', key: 'profesional_id', type: 'select' },
            { label: 'Fecha y hora *', key: 'fecha_hora', type: 'datetime-local' },
            { label: 'Observaciones', key: 'observaciones', type: 'text', placeholder: 'Ej: Control anual...' },
          ].map(f => (
            <div key={f.key} className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">{f.label}</label>
              {f.type === 'select' ? (
                <select className={`border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores[f.key] ? 'border-red-400 bg-red-50' : 'border-gray-200'}`} value={form[f.key]} onChange={e => { setForm(ff => ({ ...ff, [f.key]: e.target.value })); setErrores(er => ({ ...er, [f.key]: '' })) }}>
                  <option value="">Seleccionar profesional</option>
                  {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
                </select>
              ) : (
                <input type={f.type} placeholder={f.placeholder} className={`border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores[f.key] ? 'border-red-400 bg-red-50' : 'border-gray-200'}`} value={form[f.key]} onChange={e => { setForm(ff => ({ ...ff, [f.key]: e.target.value })); setErrores(er => ({ ...er, [f.key]: '' })) }} />
              )}
              {errores[f.key] && <span className="text-red-500 text-xs">{errores[f.key]}</span>}
            </div>
          ))}
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onCerrar} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200">Cancelar</button>
          <button onClick={guardar} disabled={guardando} className={`flex-1 py-3 rounded-xl font-bold text-white transition-all hover:opacity-90 ${guardando ? 'opacity-50' : ''}`} style={{ background: 'linear-gradient(135deg, #166534, #15803d)' }}>
            {guardando ? 'Agendando...' : '✓ Agendar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Controles() {
  const [controles, setControles] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroUrgencia, setFiltroUrgencia] = useState('todos')
  const [modalAgendar, setModalAgendar] = useState(null)
  const [toast, setToast] = useState(null)

  const cargar = async () => {
    setCargando(true)
    const res = await axios.get(API_DASH)
    setControles(res.data.proximosControles || [])
    setCargando(false)
  }

  useEffect(() => { cargar() }, [])
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t) } }, [toast])

  const filtrados = controles.filter(c => {
    const q = busqueda.toLowerCase()
    const coincideBusqueda = !busqueda || `${c.paciente_nombre} ${c.paciente_apellido}`.toLowerCase().includes(q) || (c.telefono && c.telefono.includes(q))
    const dias = diasHasta(c.proximo_control)
    const coincideUrgencia = filtroUrgencia === 'todos' ? true : filtroUrgencia === 'vencido' ? dias < 0 : filtroUrgencia === 'semana' ? dias >= 0 && dias <= 7 : filtroUrgencia === 'mes' ? dias > 7 && dias <= 30 : dias > 30
    return coincideBusqueda && coincideUrgencia
  })

  const vencidos = controles.filter(c => diasHasta(c.proximo_control) < 0).length
  const estaSemana = controles.filter(c => { const d = diasHasta(c.proximo_control); return d >= 0 && d <= 7 }).length
  const esteMes = controles.filter(c => { const d = diasHasta(c.proximo_control); return d > 7 && d <= 30 }).length
  const futuros = controles.filter(c => diasHasta(c.proximo_control) > 30).length

  if (cargando) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-16 h-16 border-4 border-green-200 border-t-green-700 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-white">
      {toast && (
        <div className="fixed top-4 right-4 z-50 text-white px-5 py-3 rounded-2xl shadow-xl font-bold text-sm" style={{ background: 'linear-gradient(135deg, #166534, #15803d)' }}>
          {toast}
        </div>
      )}

      {modalAgendar && (
        <ModalAgendar paciente={modalAgendar} onCerrar={() => setModalAgendar(null)} onAgendado={() => { setModalAgendar(null); setToast('✅ Cita agendada correctamente'); cargar() }} />
      )}

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl mb-8 p-6" style={{ background: 'linear-gradient(135deg, #052e16 0%, #166534 60%, #15803d 100%)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #86efac, transparent)', transform: 'translate(30%, -30%)' }} />
        <div className="relative z-10">
          <p className="text-green-300 text-xs font-semibold uppercase tracking-widest mb-1">Seguimiento</p>
          <h2 className="text-3xl font-black text-white">Próximos controles</h2>
          <p className="text-green-200 text-sm mt-1">{controles.length} paciente{controles.length !== 1 ? 's' : ''} en seguimiento</p>
        </div>
      </div>

      {/* KPIs clickeables */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { key: 'vencido', label: 'Vencidos', value: vencidos, icon: '🔴', gradient: 'linear-gradient(135deg, #fef2f2, #fee2e2)', border: '#ef4444', text: '#b91c1c' },
          { key: 'semana', label: 'Esta semana', value: estaSemana, icon: '🟠', gradient: 'linear-gradient(135deg, #fff7ed, #ffedd5)', border: '#f97316', text: '#c2410c' },
          { key: 'mes', label: 'Este mes', value: esteMes, icon: '🟡', gradient: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '#f59e0b', text: '#b45309' },
          { key: 'futuro', label: 'Más adelante', value: futuros, icon: '🟢', gradient: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '#22c55e', text: '#166534' },
        ].map(card => (
          <button key={card.key} onClick={() => setFiltroUrgencia(filtroUrgencia === card.key ? 'todos' : card.key)} className={`rounded-2xl p-5 text-left transition-all hover:shadow-md ${filtroUrgencia === card.key ? 'ring-2 shadow-md' : ''}`} style={{ background: card.gradient, border: `1px solid ${card.border}33`, ringColor: card.border }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl">{card.icon}</span>
              {filtroUrgencia === card.key && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: card.border, color: 'white' }}>activo</span>}
            </div>
            <p className="text-4xl font-black mb-1" style={{ color: card.text }}>{card.value}</p>
            <p className="text-xs font-semibold" style={{ color: card.text }}>{card.label}</p>
          </button>
        ))}
      </div>

      {/* Buscador */}
      <div className="relative mb-4">
        <span className="absolute left-4 top-3 text-gray-400">🔍</span>
        <input className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 pl-11 focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm" placeholder="Buscar por nombre o teléfono..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        {busqueda && <button onClick={() => setBusqueda('')} className="absolute right-4 top-3 text-gray-400 hover:text-gray-600">✕</button>}
      </div>

      {filtroUrgencia !== 'todos' && (
        <div className="flex items-center gap-2 mb-5">
          <span className="text-sm text-gray-400">Filtrando:</span>
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-green-100 text-green-700">
            {{ vencido: '🔴 Vencidos', semana: '🟠 Esta semana', mes: '🟡 Este mes', futuro: '🟢 Más adelante' }[filtroUrgencia]}
          </span>
          <button onClick={() => setFiltroUrgencia('todos')} className="text-xs text-gray-400 hover:text-gray-600 font-medium">✕ quitar</button>
        </div>
      )}

      {/* Lista */}
      <div className="flex flex-col gap-3">
        {filtrados.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-5xl mb-3">📭</p>
            <p className="text-gray-400">No hay controles en esta categoría</p>
          </div>
        )}
        {filtrados.map((c, i) => {
          const dias = diasHasta(c.proximo_control)
          const urgencia = badgeUrgencia(dias)
          const fechaFormateada = new Date(String(c.proximo_control).slice(0, 10) + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
          return (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-1 w-full" style={{ background: urgencia.color }} />
              <div className="p-5 flex items-center justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0" style={{ background: `linear-gradient(135deg, ${urgencia.color}dd, ${urgencia.color})` }}>
                    {c.paciente_nombre?.charAt(0)}{c.paciente_apellido?.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-bold text-gray-800">{c.paciente_nombre} {c.paciente_apellido}</p>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${urgencia.clase}`}>{urgencia.icono} {urgencia.label}</span>
                    </div>
                    <p className="text-sm text-gray-400 capitalize mb-1">{fechaFormateada}</p>
                    <div className="flex gap-3 flex-wrap">
                      {c.telefono && <a href={`tel:${c.telefono}`} className="text-xs font-semibold text-green-700 hover:underline">📞 {c.telefono}</a>}
                      {c.telefono && <a href={`https://wa.me/56${c.telefono?.replace(/\D/g, '').slice(-9)}`} target="_blank" rel="noreferrer" className="text-xs font-semibold text-emerald-600 hover:underline">💬 WhatsApp</a>}
                      <span className="text-xs text-gray-400">👩‍⚕️ {c.profesional_nombre} · <span className="capitalize">{c.tipo}</span></span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setModalAgendar({ id: c.paciente_id, nombre: c.paciente_nombre, apellido: c.paciente_apellido })} className="shrink-0 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-all whitespace-nowrap" style={{ background: 'linear-gradient(135deg, #166534, #15803d)' }}>
                  + Agendar
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {filtrados.length > 0 && (
        <p className="text-xs text-gray-400 text-center mt-5">{filtrados.length} control{filtrados.length !== 1 ? 'es' : ''} encontrado{filtrados.length !== 1 ? 's' : ''}</p>
      )}
    </div>
  )
}