import { useEffect, useState } from 'react'
import axios from 'axios'

const API = 'https://centro-medico-saberes-production.up.railway.app/pcr-vph'
const API_PAC = 'https://centro-medico-saberes-production.up.railway.app/pacientes'
const API_PRO = 'https://centro-medico-saberes-production.up.railway.app/profesionales'

const hoyStr = new Date().toISOString().slice(0, 10)

const formatFecha = fecha => {
  if (!fecha) return ''
  return new Date(fecha.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-CL')
}

const colorResultado = resultado => {
  if (!resultado) return 'bg-gray-100 text-gray-500'
  const r = resultado.toUpperCase()
  if (r.includes('NEGATIVO')) return 'bg-green-100 text-green-700'
  if (r.includes('POSITIVO')) return 'bg-red-100 text-red-700'
  return 'bg-yellow-100 text-yellow-700'
}

const esPositivo = resultado => {
  if (!resultado) return false
  return resultado.toUpperCase().includes('POSITIVO')
}

const formInicial = {
  paciente_id: '', profesional_id: '', fecha_toma: hoyStr,
  resultado: '', genotipo: '', estado_envio: 'pendiente', notas: ''
}

export default function PcrVph() {
  const [registros, setRegistros] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [profesionales, setProfesionales] = useState([])
  const [form, setForm] = useState(formInicial)
  const [errores, setErrores] = useState({})
  const [modalForm, setModalForm] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [editandoId, setEditandoId] = useState(null)
  const [formEdit, setFormEdit] = useState({})

  const cargar = async () => {
    const [v, pac, pro] = await Promise.all([axios.get(API), axios.get(API_PAC), axios.get(API_PRO)])
    setRegistros(v.data)
    setPacientes(pac.data)
    setProfesionales(pro.data)
  }

  useEffect(() => { cargar() }, [])

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setErrores(er => ({ ...er, [e.target.name]: '' }))
  }

  const validar = () => {
    const e = {}
    if (!form.paciente_id) e.paciente_id = 'Selecciona un paciente'
    if (!form.fecha_toma) e.fecha_toma = 'La fecha es obligatoria'
    return e
  }

  const guardar = async () => {
    const e = validar()
    if (Object.keys(e).length > 0) { setErrores(e); return }
    await axios.post(API, form)
    setForm(formInicial)
    setErrores({})
    setModalForm(false)
    cargar()
  }

  const iniciarEdit = r => {
    setEditandoId(r.id)
    setFormEdit({
      paciente_id: r.paciente_id,
      profesional_id: r.profesional_id || '',
      fecha_toma: r.fecha_toma?.slice(0, 10) || hoyStr,
      resultado: r.resultado || '',
      genotipo: r.genotipo || '',
      estado_envio: r.estado_envio || 'pendiente',
      notas: r.notas || ''
    })
  }

  const guardarEdit = async id => {
    await axios.put(`${API}/${id}`, formEdit)
    setEditandoId(null)
    cargar()
  }

  const eliminar = async id => {
    if (confirm('¿Eliminar PCR VPH?')) {
      await axios.delete(`${API}/${id}`)
      cargar()
    }
  }

  const cambiarEstado = async (id, estado_envio) => {
    await axios.put(`${API}/${id}`, { ...registros.find(r => r.id === id), estado_envio })
    cargar()
  }

  const filtrados = registros.filter(r => {
    const q = busqueda.toLowerCase()
    const coincideBusqueda = !busqueda ||
      `${r.paciente_nombre || ''} ${r.paciente_apellido || ''}`.toLowerCase().includes(q) ||
      (r.resultado || '').toLowerCase().includes(q) ||
      (r.genotipo || '').toLowerCase().includes(q)
    const coincideEstado = !filtroEstado || r.estado_envio === filtroEstado
    return coincideBusqueda && coincideEstado
  })

  const stats = {
    total: registros.length,
    positivos: registros.filter(r => esPositivo(r.resultado)).length,
    pendientes: registros.filter(r => r.estado_envio === 'pendiente').length,
    sinResultado: registros.filter(r => !r.resultado).length,
  }

  const FormEdicion = ({ inForm, setInForm, onGuardar, onCancelar }) => (
    <div className="rounded-2xl p-5 mt-3 border border-green-200" style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Paciente', type: 'select', key: 'paciente_id', options: pacientes.map(p => ({ value: p.id, label: `${p.nombre} ${p.apellido}` })) },
          { label: 'Profesional', type: 'select', key: 'profesional_id', options: [{ value: '', label: 'Sin profesional' }, ...profesionales.map(p => ({ value: p.id, label: `${p.nombre} ${p.apellido}` }))] },
          { label: 'Fecha toma', type: 'date', key: 'fecha_toma' },
          { label: 'Resultado', type: 'select', key: 'resultado', options: [{ value: '', label: 'Sin resultado' }, { value: 'Negativo', label: 'Negativo' }, { value: 'Positivo', label: 'Positivo' }, { value: 'Positivo alto riesgo', label: 'Positivo alto riesgo' }, { value: 'Positivo bajo riesgo', label: 'Positivo bajo riesgo' }] },
          { label: 'Genotipo', type: 'text', key: 'genotipo' },
          { label: 'Estado envío', type: 'select', key: 'estado_envio', options: [{ value: 'pendiente', label: 'Pendiente' }, { value: 'enviado', label: 'Enviado' }] },
          { label: 'Notas', type: 'text', key: 'notas' },
        ].map(f => (
          <div key={f.key} className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">{f.label}</label>
            {f.type === 'select' ? (
              <select className="border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white" value={inForm[f.key]} onChange={e => setInForm(ff => ({ ...ff, [f.key]: e.target.value }))}>
                {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : (
              <input type={f.type} className="border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white" value={inForm[f.key]} onChange={e => setInForm(ff => ({ ...ff, [f.key]: e.target.value }))} />
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={onGuardar} className="text-white px-5 py-2 rounded-xl text-sm font-bold hover:opacity-90" style={{ background: 'linear-gradient(135deg, #166534, #15803d)' }}>✓ Guardar</button>
        <button onClick={onCancelar} className="bg-white text-gray-600 px-5 py-2 rounded-xl text-sm font-medium hover:bg-gray-100 border border-gray-200">Cancelar</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white">

      {/* Modal nuevo */}
      {modalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4" onClick={() => { setModalForm(false); setForm(formInicial) }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #052e16, #166534)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: 'rgba(255,255,255,0.15)' }}>🔬</div>
                <div>
                  <h3 className="text-lg font-bold text-white">Nuevo PCR VPH</h3>
                  <p className="text-green-300 text-xs">Registra un nuevo examen</p>
                </div>
              </div>
              <button onClick={() => { setModalForm(false); setForm(formInicial) }} className="text-white hover:text-green-200 text-2xl">✕</button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">Paciente *</label>
                  <select className={`border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.paciente_id ? 'border-red-400 bg-red-50' : 'border-gray-200'}`} name="paciente_id" value={form.paciente_id} onChange={handleChange}>
                    <option value="">Seleccionar paciente</option>
                    {pacientes.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
                  </select>
                  {errores.paciente_id && <span className="text-red-500 text-xs">{errores.paciente_id}</span>}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">Profesional</label>
                  <select className="border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" name="profesional_id" value={form.profesional_id} onChange={handleChange}>
                    <option value="">Seleccionar profesional</option>
                    {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">Fecha de toma *</label>
                  <input type="date" className={`border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.fecha_toma ? 'border-red-400 bg-red-50' : 'border-gray-200'}`} name="fecha_toma" value={form.fecha_toma} onChange={handleChange} />
                  {errores.fecha_toma && <span className="text-red-500 text-xs">{errores.fecha_toma}</span>}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">Resultado</label>
                  <select className="border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" name="resultado" value={form.resultado} onChange={handleChange}>
                    <option value="">Sin resultado aún</option>
                    <option value="Negativo">Negativo</option>
                    <option value="Positivo">Positivo</option>
                    <option value="Positivo alto riesgo">Positivo alto riesgo</option>
                    <option value="Positivo bajo riesgo">Positivo bajo riesgo</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">Genotipo <span className="text-gray-400 font-normal text-xs">(opcional)</span></label>
                  <input className="border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" name="genotipo" placeholder="Ej: VPH 16, VPH 18..." value={form.genotipo} onChange={handleChange} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">Estado envío</label>
                  <select className="border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" name="estado_envio" value={form.estado_envio} onChange={handleChange}>
                    <option value="pendiente">Pendiente</option>
                    <option value="enviado">Enviado</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">Notas <span className="text-gray-400 font-normal text-xs">(opcional)</span></label>
                  <input className="border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" name="notas" value={form.notas} onChange={handleChange} />
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => { setModalForm(false); setForm(formInicial) }} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200">Cancelar</button>
              <button onClick={guardar} className="flex-1 text-white py-3 rounded-xl font-bold hover:opacity-90" style={{ background: 'linear-gradient(135deg, #166534, #15803d)' }}>+ Registrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl mb-8 p-6 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #052e16 0%, #166534 60%, #15803d 100%)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #86efac, transparent)', transform: 'translate(30%, -30%)' }} />
        <div className="relative z-10">
          <p className="text-green-300 text-xs font-semibold uppercase tracking-widest mb-1">Ginecología</p>
          <h2 className="text-3xl font-black text-white">PCR VPH</h2>
          <p className="text-green-200 text-sm mt-1">{registros.length} examen{registros.length !== 1 ? 'es' : ''} registrado{registros.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setModalForm(true)} className="relative z-10 flex items-center gap-2 text-sm font-bold px-5 py-3 rounded-2xl transition-all hover:scale-105 shrink-0" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.25)' }}>
          <span className="text-lg">+</span> Nuevo PCR VPH
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: '🔬', label: 'Total', value: stats.total, gradient: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '#16a34a', text: '#166534' },
          { icon: '⚠️', label: 'Positivos', value: stats.positivos, gradient: 'linear-gradient(135deg, #fef2f2, #fee2e2)', border: '#ef4444', text: '#b91c1c' },
          { icon: '⏳', label: 'Pendientes envío', value: stats.pendientes, gradient: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '#f59e0b', text: '#b45309' },
          { icon: '📋', label: 'Sin resultado', value: stats.sinResultado, gradient: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', border: '#8b5cf6', text: '#7c3aed' },
        ].map((card, i) => (
          <div key={i} className="rounded-2xl p-5 hover:shadow-md transition-shadow" style={{ background: card.gradient, border: `1px solid ${card.border}22` }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: `${card.border}22` }}>{card.icon}</div>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: card.text }}>{card.label}</span>
            </div>
            <p className="text-4xl font-black" style={{ color: card.text }}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <span className="absolute left-4 top-3 text-gray-400">🔍</span>
          <input className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 pl-11 focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm" placeholder="Buscar por paciente, resultado o genotipo..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          {busqueda && <button onClick={() => setBusqueda('')} className="absolute right-4 top-3 text-gray-400 hover:text-gray-600">✕</button>}
        </div>
        <select className="border border-gray-200 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="enviado">Enviado</option>
        </select>
      </div>

      {/* Tabla desktop */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}>
              {['Paciente', 'Profesional', 'Fecha toma', 'Resultado', 'Genotipo', 'Notas', 'Envío', 'Acciones'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-green-800 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtrados.map(r => {
              const positivo = esPositivo(r.resultado)
              return (
                <>
                  <tr key={r.id} className={`hover:bg-gray-50 transition-colors ${positivo ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800">{r.paciente_nombre} {r.paciente_apellido}</p>
                      {(() => { const pac = pacientes.find(pac => pac.id === r.paciente_id); return pac?.email ? <a href={`mailto:${pac.email}`} className="text-xs text-blue-500 hover:underline">✉️ {pac.email}</a> : null })()}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{r.profesional_nombre ? `${r.profesional_nombre} ${r.profesional_apellido}` : '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatFecha(r.fecha_toma)}</td>
                    <td className="px-4 py-3">
                      {r.resultado
                        ? <span className={`px-2 py-1 rounded-full text-xs font-bold ${colorResultado(r.resultado)}`}>{r.resultado}</span>
                        : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{r.genotipo || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{r.notas || '—'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => cambiarEstado(r.id, r.estado_envio === 'pendiente' ? 'enviado' : 'pendiente')} className={`px-2.5 py-1 rounded-full text-xs font-bold cursor-pointer transition-colors ${r.estado_envio === 'enviado' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`}>
                        {r.estado_envio === 'enviado' ? '✓ Enviado' : '⏳ Pendiente'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => iniciarEdit(r)} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100">Editar</button>
                        <button onClick={() => eliminar(r.id)} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                  {editandoId === r.id && (
                    <tr key={`edit-${r.id}`}>
                      <td colSpan="8" className="px-4 pb-4">
                        <FormEdicion inForm={formEdit} setInForm={setFormEdit} onGuardar={() => guardarEdit(r.id)} onCancelar={() => setEditandoId(null)} />
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
            {filtrados.length === 0 && (
              <tr><td colSpan="8" className="px-4 py-12 text-center">
                <p className="text-4xl mb-2">🔬</p>
                <p className="text-gray-400 text-sm">No hay exámenes PCR VPH registrados</p>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Tarjetas móvil */}
      <div className="md:hidden flex flex-col gap-3">
        {filtrados.map(r => {
          const positivo = esPositivo(r.resultado)
          return (
            <div key={r.id} className={`bg-white rounded-2xl shadow-sm border p-4 ${positivo ? 'border-red-200' : 'border-gray-100'}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-gray-800">{r.paciente_nombre} {r.paciente_apellido}</p>
                  {(() => { const pac = pacientes.find(pac => pac.id === r.paciente_id); return pac?.email ? <a href={`mailto:${pac.email}`} className="text-xs text-blue-500 hover:underline">✉️ {pac.email}</a> : null })()}
                </div>
                <button onClick={() => cambiarEstado(r.id, r.estado_envio === 'pendiente' ? 'enviado' : 'pendiente')} className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${r.estado_envio === 'enviado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {r.estado_envio === 'enviado' ? '✓ Enviado' : '⏳ Pendiente'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {r.resultado && <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${colorResultado(r.resultado)}`}>{r.resultado}</span>}
                {r.genotipo && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">🧬 {r.genotipo}</span>}
              </div>
              <div className="text-xs text-gray-400 flex flex-col gap-0.5 mb-3">
                {r.profesional_nombre && <span>👩‍⚕️ {r.profesional_nombre} {r.profesional_apellido}</span>}
                <span>📅 {formatFecha(r.fecha_toma)}</span>
                {r.notas && <span>💬 {r.notas}</span>}
              </div>
              <div className="flex gap-2 pt-2 border-t border-gray-50">
                <button onClick={() => iniciarEdit(r)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700">Editar</button>
                <button onClick={() => eliminar(r.id)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-600">Eliminar</button>
              </div>
              {editandoId === r.id && (
                <FormEdicion inForm={formEdit} setInForm={setFormEdit} onGuardar={() => guardarEdit(r.id)} onCancelar={() => setEditandoId(null)} />
              )}
            </div>
          )
        })}
        {filtrados.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <p className="text-4xl mb-2">🔬</p>
            <p className="text-gray-400 text-sm">No hay exámenes PCR VPH registrados</p>
          </div>
        )}
      </div>
    </div>
  )
}