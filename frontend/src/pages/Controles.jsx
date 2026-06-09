import { useEffect, useState } from 'react'
import axios from 'axios'

const API_DASH = 'https://centro-medico-saberes-production.up.railway.app/dashboard'
const API_CITAS = 'https://centro-medico-saberes-production.up.railway.app/citas'
const API_PAC = 'https://centro-medico-saberes-production.up.railway.app/pacientes'
const API_PRO = 'https://centro-medico-saberes-production.up.railway.app/profesionales'

function diasHasta(fecha) {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const f = new Date(String(fecha).slice(0, 10) + 'T12:00:00')
  return Math.round((f - hoy) / (1000 * 60 * 60 * 24))
}

function badgeUrgencia(dias) {
  if (dias < 0) return { label: 'Vencido', clase: 'bg-red-100 text-red-700', icono: '🔴' }
  if (dias === 0) return { label: 'Hoy', clase: 'bg-red-100 text-red-700', icono: '🔴' }
  if (dias <= 7) return { label: `En ${dias} días`, clase: 'bg-orange-100 text-orange-700', icono: '🟠' }
  if (dias <= 30) return { label: `En ${dias} días`, clase: 'bg-yellow-100 text-yellow-700', icono: '🟡' }
  return { label: `En ${dias} días`, clase: 'bg-green-100 text-green-700', icono: '🟢' }
}

function ModalAgendar({ paciente, onCerrar, onAgendado }) {
  const [profesionales, setProfesionales] = useState([])
  const [form, setForm] = useState({ profesional_id: '', fecha_hora: '', observaciones: '' })
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    axios.get(API_PRO).then(r => setProfesionales(r.data))
  }, [])

  const guardar = async () => {
    const e = {}
    if (!form.profesional_id) e.profesional_id = 'Selecciona un profesional'
    if (!form.fecha_hora) e.fecha_hora = 'Selecciona fecha y hora'
    if (Object.keys(e).length > 0) { setErrores(e); return }
    setGuardando(true)
    await axios.post(API_CITAS, {
      paciente_id: paciente.id,
      profesional_id: form.profesional_id,
      fecha_hora: form.fecha_hora,
      estado: 'confirmada',
      observaciones: form.observaciones || null
    })
    setGuardando(false)
    onAgendado()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4" onClick={onCerrar}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-green-700 to-green-600 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <span className="text-xl">📅</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Agendar control</h3>
              <p className="text-green-200 text-xs">{paciente.nombre} {paciente.apellido}</p>
            </div>
          </div>
          <button onClick={onCerrar} className="text-white hover:text-green-200 text-2xl leading-none">✕</button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Profesional *</label>
            <select
              className={`border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.profesional_id ? 'border-red-400' : 'border-gray-200'}`}
              value={form.profesional_id}
              onChange={e => { setForm(f => ({ ...f, profesional_id: e.target.value })); setErrores(er => ({ ...er, profesional_id: '' })) }}
            >
              <option value="">Seleccionar profesional</option>
              {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
            </select>
            {errores.profesional_id && <span className="text-red-500 text-xs mt-1">{errores.profesional_id}</span>}
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Fecha y hora *</label>
            <input
              type="datetime-local"
              className={`border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.fecha_hora ? 'border-red-400' : 'border-gray-200'}`}
              value={form.fecha_hora}
              onChange={e => { setForm(f => ({ ...f, fecha_hora: e.target.value })); setErrores(er => ({ ...er, fecha_hora: '' })) }}
            />
            {errores.fecha_hora && <span className="text-red-500 text-xs mt-1">{errores.fecha_hora}</span>}
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Observaciones <span className="text-gray-400 font-normal">(opcional)</span></label>
            <input
              className="border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="Ej: Control anual, seguimiento..."
              value={form.observaciones}
              onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
            />
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onCerrar} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 font-medium">Cancelar</button>
          <button onClick={guardar} disabled={guardando} className={`flex-1 py-3 rounded-xl font-semibold text-white transition-colors ${guardando ? 'bg-gray-400' : 'bg-green-700 hover:bg-green-800'}`}>
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

  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t) }
  }, [toast])

  const filtrados = controles.filter(c => {
    const q = busqueda.toLowerCase()
    const coincideBusqueda = !busqueda ||
      `${c.paciente_nombre} ${c.paciente_apellido}`.toLowerCase().includes(q) ||
      (c.telefono && c.telefono.includes(q))
    const dias = diasHasta(c.proximo_control)
    const coincideUrgencia =
      filtroUrgencia === 'todos' ? true :
      filtroUrgencia === 'vencido' ? dias < 0 :
      filtroUrgencia === 'semana' ? dias >= 0 && dias <= 7 :
      filtroUrgencia === 'mes' ? dias > 7 && dias <= 30 :
      dias > 30
    return coincideBusqueda && coincideUrgencia
  })

  const vencidos = controles.filter(c => diasHasta(c.proximo_control) < 0).length
  const estaSemana = controles.filter(c => { const d = diasHasta(c.proximo_control); return d >= 0 && d <= 7 }).length
  const esteMes = controles.filter(c => { const d = diasHasta(c.proximo_control); return d > 7 && d <= 30 }).length
  const futuros = controles.filter(c => diasHasta(c.proximo_control) > 30).length

  if (cargando) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="text-4xl mb-3 animate-pulse">📅</div>
        <p className="text-gray-400">Cargando controles...</p>
      </div>
    </div>
  )

  return (
    <div>
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-700 text-white px-5 py-3 rounded-xl shadow-lg font-medium">
          {toast}
        </div>
      )}

      {modalAgendar && (
        <ModalAgendar
          paciente={modalAgendar}
          onCerrar={() => setModalAgendar(null)}
          onAgendado={() => {
            setModalAgendar(null)
            setToast('✅ Cita agendada correctamente')
            cargar()
          }}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-green-800">Próximos controles</h2>
          <p className="text-sm text-gray-400 mt-1">{controles.length} pacientes en los próximos 60 días</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <button onClick={() => setFiltroUrgencia(filtroUrgencia === 'vencido' ? 'todos' : 'vencido')}
          className={`rounded-2xl p-4 text-left transition-all border-2 ${filtroUrgencia === 'vencido' ? 'border-red-400 bg-red-50' : 'bg-white border-transparent shadow-sm'}`}>
          <p className="text-2xl mb-1">🔴</p>
          <p className="text-3xl font-bold text-gray-800">{vencidos}</p>
          <p className="text-xs text-gray-500 mt-1">Vencidos</p>
        </button>
        <button onClick={() => setFiltroUrgencia(filtroUrgencia === 'semana' ? 'todos' : 'semana')}
          className={`rounded-2xl p-4 text-left transition-all border-2 ${filtroUrgencia === 'semana' ? 'border-orange-400 bg-orange-50' : 'bg-white border-transparent shadow-sm'}`}>
          <p className="text-2xl mb-1">🟠</p>
          <p className="text-3xl font-bold text-gray-800">{estaSemana}</p>
          <p className="text-xs text-gray-500 mt-1">Esta semana</p>
        </button>
        <button onClick={() => setFiltroUrgencia(filtroUrgencia === 'mes' ? 'todos' : 'mes')}
          className={`rounded-2xl p-4 text-left transition-all border-2 ${filtroUrgencia === 'mes' ? 'border-yellow-400 bg-yellow-50' : 'bg-white border-transparent shadow-sm'}`}>
          <p className="text-2xl mb-1">🟡</p>
          <p className="text-3xl font-bold text-gray-800">{esteMes}</p>
          <p className="text-xs text-gray-500 mt-1">Este mes</p>
        </button>
        <button onClick={() => setFiltroUrgencia(filtroUrgencia === 'futuro' ? 'todos' : 'futuro')}
          className={`rounded-2xl p-4 text-left transition-all border-2 ${filtroUrgencia === 'futuro' ? 'border-green-400 bg-green-50' : 'bg-white border-transparent shadow-sm'}`}>
          <p className="text-2xl mb-1">🟢</p>
          <p className="text-3xl font-bold text-gray-800">{futuros}</p>
          <p className="text-xs text-gray-500 mt-1">Más adelante</p>
        </button>
      </div>

      {/* Buscador */}
      <div className="relative mb-4">
        <input
          className="w-full border border-gray-200 rounded-xl px-4 py-3 pl-11 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white shadow-sm"
          placeholder="Buscar por nombre o teléfono..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)}
        />
        <span className="absolute left-4 top-3.5 text-gray-400">🔍</span>
        {busqueda && <button onClick={() => setBusqueda('')} className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600">✕</button>}
      </div>

      {filtroUrgencia !== 'todos' && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-gray-500">Filtrando:</span>
          <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
            {{ vencido: '🔴 Vencidos', semana: '🟠 Esta semana', mes: '🟡 Este mes', futuro: '🟢 Más adelante' }[filtroUrgencia]}
          </span>
          <button onClick={() => setFiltroUrgencia('todos')} className="text-xs text-gray-400 hover:text-gray-600">✕ quitar filtro</button>
        </div>
      )}

      {/* Lista */}
      <div className="flex flex-col gap-3">
        {filtrados.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center text-gray-400">
            <p className="text-4xl mb-3">📭</p>
            <p>No hay controles en esta categoría</p>
          </div>
        )}
        {filtrados.map((c, i) => {
          const dias = diasHasta(c.proximo_control)
          const urgencia = badgeUrgencia(dias)
          const fechaFormateada = new Date(String(c.proximo_control).slice(0, 10) + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
          return (
            <div key={i} className={`bg-white rounded-2xl shadow-sm p-5 flex items-center justify-between gap-4 border-l-4 ${
              dias < 0 ? 'border-red-400' :
              dias <= 7 ? 'border-orange-400' :
              dias <= 30 ? 'border-yellow-400' :
              'border-green-400'
            }`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="font-semibold text-gray-800">{c.paciente_nombre} {c.paciente_apellido}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${urgencia.clase}`}>
                    {urgencia.icono} {urgencia.label}
                  </span>
                </div>
                <p className="text-sm text-gray-500 capitalize">{fechaFormateada}</p>
                <div className="flex gap-3 mt-1 flex-wrap">
                  {c.telefono && (
                    <a href={`tel:${c.telefono}`} className="text-xs text-green-700 hover:underline font-medium">
                      📞 {c.telefono}
                    </a>
                  )}
                  {c.telefono && (
                    <a href={`https://wa.me/56${c.telefono?.replace(/\D/g, '').slice(-9)}`} target="_blank" rel="noreferrer"
                      className="text-xs text-green-600 hover:underline font-medium">
                      💬 WhatsApp
                    </a>
                  )}
                  <span className="text-xs text-gray-400">👩‍⚕️ {c.profesional_nombre} · <span className="capitalize">{c.tipo}</span></span>
                </div>
              </div>
              <button
                onClick={() => setModalAgendar({ id: c.paciente_id, nombre: c.paciente_nombre, apellido: c.paciente_apellido })}
                className="shrink-0 bg-green-700 text-white px-4 py-2 rounded-xl hover:bg-green-800 text-sm font-medium transition-colors whitespace-nowrap"
              >
                + Agendar
              </button>
            </div>
          )
        })}
      </div>

      {filtrados.length > 0 && (
        <p className="text-xs text-gray-400 text-center mt-4">{filtrados.length} control{filtrados.length !== 1 ? 'es' : ''} encontrado{filtrados.length !== 1 ? 's' : ''}</p>
      )}
    </div>
  )
}