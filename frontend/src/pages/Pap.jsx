import { useEffect, useState } from 'react'
import axios from 'axios'

const API = 'https://centro-medico-saberes-production.up.railway.app/pap'
const API_PAC = 'https://centro-medico-saberes-production.up.railway.app/pacientes'
const API_PRO = 'https://centro-medico-saberes-production.up.railway.app/profesionales'

const hoyStr = new Date().toISOString().slice(0, 10)

const formatFecha = fecha => {
  if (!fecha) return ''
  return new Date(fecha.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-CL')
}

function calcularProximoControl(resultado) {
  const hoy = new Date()
  let meses = null
  if (resultado === 'Normal') meses = 12
  else if (resultado === 'Alterado') meses = 6
  else if (resultado === 'Inadecuado') meses = 3
  else return ''
  hoy.setMonth(hoy.getMonth() + meses)
  return hoy.toISOString().split('T')[0]
}

const colorResultado = resultado => {
  if (!resultado) return 'bg-gray-100 text-gray-500'
  const r = resultado.toUpperCase()
  if (r.includes('NORMAL') || r.includes('NEGATIVO')) return 'bg-green-100 text-green-700'
  if (r.includes('INADECUADO') || r.includes('INSATISFACTORIO')) return 'bg-gray-100 text-gray-600'
  if (r.includes('ASC-H') || r.includes('NIE') || r.includes('NIC') || r.includes('CRÍTICO') || r.includes('CRITICO') || r.includes('MALIGNO')) return 'bg-red-100 text-red-700'
  if (r.includes('ASC-US') || r.includes('ALTERADO') || r.includes('ATIPICO') || r.includes('ATÍPICO')) return 'bg-orange-100 text-orange-700'
  return 'bg-yellow-100 text-yellow-700'
}

const esCritico = resultado => {
  if (!resultado) return false
  const r = resultado.toUpperCase()
  return r.includes('ASC-H') || r.includes('NIE') || r.includes('NIC') || r.includes('CRÍTICO') || r.includes('CRITICO') || r.includes('MALIGNO')
}

const alertaProximoControl = fecha => {
  if (!fecha) return null
  const dias = Math.ceil((new Date(fecha) - new Date()) / (1000 * 60 * 60 * 24))
  if (dias < 0) return 'vencido'
  if (dias <= 30) return 'proximo'
  return 'ok'
}

const formInicial = { paciente_id: '', profesional_id: '', nombre: '', fecha_toma: hoyStr, resultado: '', proximo_control: '', estado_envio: 'pendiente', notas: '' }

export default function Pap() {
  const [paps, setPaps] = useState([])
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
    const [p, pac, pro] = await Promise.all([axios.get(API), axios.get(API_PAC), axios.get(API_PRO)])
    setPaps(p.data)
    setPacientes(pac.data)
    setProfesionales(pro.data)
  }

  useEffect(() => { cargar() }, [])

  const handleChange = e => {
    const { name, value } = e.target
    if (name === 'resultado') {
      setForm(f => ({ ...f, resultado: value, proximo_control: calcularProximoControl(value) }))
    } else {
      setForm(f => ({ ...f, [name]: value }))
    }
    setErrores(er => ({ ...er, [name]: '' }))
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

  const iniciarEdit = p => {
    setEditandoId(p.id)
    setFormEdit({
      paciente_id: p.paciente_id,
      profesional_id: p.profesional_id || '',
      nombre: p.nombre || '',
      fecha_toma: p.fecha_toma?.slice(0, 10) || hoyStr,
      resultado: p.resultado || '',
      proximo_control: p.proximo_control?.slice(0, 10) || '',
      estado_envio: p.estado_envio,
      notas: p.notas || ''
    })
  }

  const handleEditResultado = valor => {
    setFormEdit(f => ({ ...f, resultado: valor, proximo_control: calcularProximoControl(valor) }))
  }

  const guardarEdit = async id => {
    await axios.put(`${API}/${id}`, formEdit)
    setEditandoId(null)
    cargar()
  }

  const eliminar = async id => {
    if (confirm('¿Eliminar PAP?')) {
      await axios.delete(`${API}/${id}`)
      cargar()
    }
  }

  const cambiarEstado = async (id, estado_envio) => {
    await axios.put(`${API}/${id}`, { ...paps.find(p => p.id === id), estado_envio })
    cargar()
  }

  const filtrados = paps.filter(p => {
    const q = busqueda.toLowerCase()
    const coincideBusqueda = !busqueda ||
      `${p.paciente_nombre || ''} ${p.paciente_apellido || ''}`.toLowerCase().includes(q) ||
      (p.nombre || '').toLowerCase().includes(q) ||
      (p.resultado || '').toLowerCase().includes(q)
    const coincideEstado = !filtroEstado || p.estado_envio === filtroEstado
    return coincideBusqueda && coincideEstado
  })

  const stats = {
    total: paps.length,
    criticos: paps.filter(p => esCritico(p.resultado)).length,
    pendientes: paps.filter(p => p.estado_envio === 'pendiente').length,
    vencidos: paps.filter(p => alertaProximoControl(p.proximo_control) === 'vencido').length,
  }

  const FormEdicion = ({ inForm, setInForm, onGuardar, onCancelar }) => (
    <div className="rounded-2xl p-5 mt-3 border border-green-200" style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Paciente', type: 'select', key: 'paciente_id', options: pacientes.map(p => ({ value: p.id, label: `${p.nombre} ${p.apellido}` })) },
          { label: 'Profesional', type: 'select', key: 'profesional_id', options: [{ value: '', label: 'Sin profesional' }, ...profesionales.map(p => ({ value: p.id, label: `${p.nombre} ${p.apellido}` }))] },
          { label: 'Nombre', type: 'text', key: 'nombre' },
          { label: 'Fecha toma', type: 'date', key: 'fecha_toma' },
          { label: 'Resultado', type: 'select', key: 'resultado', options: [{ value: '', label: 'Sin resultado' }, { value: 'Normal', label: 'Normal' }, { value: 'Alterado', label: 'Alterado' }, { value: 'Inadecuado', label: 'Inadecuado' }, { value: 'Crítico', label: 'Crítico' }], onChange: e => { const val = e.target.value; setInForm(f => ({ ...f, resultado: val, proximo_control: calcularProximoControl(val) })) } },
          { label: 'Próximo control', type: 'date', key: 'proximo_control' },
          { label: 'Estado envío', type: 'select', key: 'estado_envio', options: [{ value: 'pendiente', label: 'Pendiente' }, { value: 'enviado', label: 'Enviado' }] },
          { label: 'Notas', type: 'text', key: 'notas' },
        ].map(f => (
          <div key={f.key} className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">{f.label}</label>
            {f.type === 'select' ? (
              <select className="border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white" value={inForm[f.key]} onChange={f.onChange || (e => setInForm(ff => ({ ...ff, [f.key]: e.target.value })))}>
                {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : (
              <input type={f.type} className="border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white" value={inForm[f.key]} onChange={e => setInForm(ff => ({ ...ff, [f.key]: e.target.value }))} />
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={onGuardar} className="text-white px-5 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition-all" style={{ background: 'linear-gradient(135deg, #166534, #15803d)' }}>✓ Guardar</button>
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
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: 'rgba(255,255,255,0.15)' }}>🧪</div>
                <div>
                  <h3 className="text-lg font-bold text-white">Nuevo PAP</h3>
                  <p className="text-green-300 text-xs">Registra un nuevo examen PAP</p>
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
                  <label className="text-sm font-semibold text-gray-700">Nombre</label>
                  <input className="border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" name="nombre" placeholder="Ej: PAP anual" value={form.nombre} onChange={handleChange} />
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
                    <option value="Normal">Normal</option>
                    <option value="Alterado">Alterado</option>
                    <option value="Inadecuado">Inadecuado</option>
                    <option value="Crítico">Crítico</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">
                    Próximo control
                    {form.resultado && form.resultado !== 'Crítico' && <span className="ml-1 text-xs text-teal-600">✨ sugerido</span>}
                  </label>
                  <input type="date" className="border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" name="proximo_control" value={form.proximo_control} onChange={handleChange} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">Estado envío</label>
                  <select className="border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" name="estado_envio" value={form.estado_envio} onChange={handleChange}>
                    <option value="pendiente">Pendiente</option>
                    <option value="enviado">Enviado</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">Notas</label>
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
          <h2 className="text-3xl font-black text-white">PAP</h2>
          <p className="text-green-200 text-sm mt-1">{paps.length} examen{paps.length !== 1 ? 'es' : ''} registrado{paps.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setModalForm(true)} className="relative z-10 flex items-center gap-2 text-sm font-bold px-5 py-3 rounded-2xl transition-all hover:scale-105 shrink-0" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.25)' }}>
          <span className="text-lg">+</span> Nuevo PAP
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: '🧪', label: 'Total', value: stats.total, gradient: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '#16a34a', text: '#166534' },
          { icon: '⚠️', label: 'Críticos', value: stats.criticos, gradient: 'linear-gradient(135deg, #fef2f2, #fee2e2)', border: '#ef4444', text: '#b91c1c' },
          { icon: '⏳', label: 'Pendientes envío', value: stats.pendientes, gradient: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '#f59e0b', text: '#b45309' },
          { icon: '📅', label: 'Control vencido', value: stats.vencidos, gradient: 'linear-gradient(135deg, #fff7ed, #ffedd5)', border: '#f97316', text: '#c2410c' },
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
          <input className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 pl-11 focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm" placeholder="Buscar por paciente, nombre o resultado..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
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
              {['Paciente', 'Nombre', 'Profesional', 'Fecha toma', 'Resultado', 'Próximo control', 'Notas', 'Envío', 'Acciones'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-green-800 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtrados.map(p => {
              const alerta = alertaProximoControl(p.proximo_control)
              const alertaColor = alerta === 'vencido' ? 'bg-red-100 text-red-700' : alerta === 'proximo' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
              const critico = esCritico(p.resultado)
              return (
                <>
                  <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${critico ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800">{p.paciente_nombre} {p.paciente_apellido}</p>
                      {(() => { const pac = pacientes.find(pac => pac.id === p.paciente_id); return pac?.email ? <a href={`mailto:${pac.email}`} className="text-xs text-blue-500 hover:underline">✉️ {pac.email}</a> : null })()}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{p.nombre || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{p.profesional_nombre ? `${p.profesional_nombre} ${p.profesional_apellido}` : '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatFecha(p.fecha_toma)}</td>
                    <td className="px-4 py-3">
                      {p.resultado
                        ? <span className={`px-2 py-1 rounded-full text-xs font-bold ${colorResultado(p.resultado)}`}>{p.resultado}</span>
                        : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {critico
                        ? <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">⚠️ Colposcopía</span>
                        : p.proximo_control
                          ? <span className={`px-2 py-1 rounded-full text-xs font-bold ${alertaColor}`}>
                              {alerta === 'vencido' ? '⚠️ ' : alerta === 'proximo' ? '🔔 ' : ''}{formatFecha(p.proximo_control)}
                            </span>
                          : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{p.notas || '—'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => cambiarEstado(p.id, p.estado_envio === 'pendiente' ? 'enviado' : 'pendiente')} className={`px-2.5 py-1 rounded-full text-xs font-bold cursor-pointer transition-colors ${p.estado_envio === 'enviado' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`}>
                        {p.estado_envio === 'enviado' ? '✓ Enviado' : '⏳ Pendiente'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => iniciarEdit(p)} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">Editar</button>
                        <button onClick={() => eliminar(p.id)} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                  {editandoId === p.id && (
                    <tr key={`edit-${p.id}`}>
                      <td colSpan="9" className="px-4 pb-4">
                        <FormEdicion inForm={formEdit} setInForm={setFormEdit} onGuardar={() => guardarEdit(p.id)} onCancelar={() => setEditandoId(null)} />
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
            {filtrados.length === 0 && (
              <tr><td colSpan="9" className="px-4 py-12 text-center">
                <p className="text-4xl mb-2">🧪</p>
                <p className="text-gray-400 text-sm">No hay PAP registrados</p>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Tarjetas móvil */}
      <div className="md:hidden flex flex-col gap-3">
        {filtrados.map(p => {
          const alerta = alertaProximoControl(p.proximo_control)
          const alertaColor = alerta === 'vencido' ? 'bg-red-100 text-red-700' : alerta === 'proximo' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
          const critico = esCritico(p.resultado)
          return (
            <div key={p.id} className={`bg-white rounded-2xl shadow-sm border p-4 ${critico ? 'border-red-200' : 'border-gray-100'}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-gray-800">{p.paciente_nombre} {p.paciente_apellido}</p>
                  {(() => { const pac = pacientes.find(pac => pac.id === p.paciente_id); return pac?.email ? <a href={`mailto:${pac.email}`} className="text-xs text-blue-500 hover:underline">✉️ {pac.email}</a> : null })()}
                  {p.nombre && <p className="text-xs text-gray-400 mt-0.5">📋 {p.nombre}</p>}
                </div>
                <button onClick={() => cambiarEstado(p.id, p.estado_envio === 'pendiente' ? 'enviado' : 'pendiente')} className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${p.estado_envio === 'enviado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {p.estado_envio === 'enviado' ? '✓ Enviado' : '⏳ Pendiente'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {p.resultado && <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${colorResultado(p.resultado)}`}>{p.resultado}</span>}
                {critico && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">⚠️ Colposcopía</span>}
                {!critico && p.proximo_control && <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${alertaColor}`}>{alerta === 'vencido' ? '⚠️ ' : alerta === 'proximo' ? '🔔 ' : ''}Control: {formatFecha(p.proximo_control)}</span>}
              </div>
              <div className="text-xs text-gray-400 flex flex-col gap-0.5 mb-3">
                {p.profesional_nombre && <span>👩‍⚕️ {p.profesional_nombre} {p.profesional_apellido}</span>}
                <span>📅 {formatFecha(p.fecha_toma)}</span>
                {p.notas && <span>💬 {p.notas}</span>}
              </div>
              <div className="flex gap-2 pt-2 border-t border-gray-50">
                <button onClick={() => iniciarEdit(p)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700">Editar</button>
                <button onClick={() => eliminar(p.id)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-600">Eliminar</button>
              </div>
              {editandoId === p.id && (
                <FormEdicion inForm={formEdit} setInForm={setFormEdit} onGuardar={() => guardarEdit(p.id)} onCancelar={() => setEditandoId(null)} />
              )}
            </div>
          )
        })}
        {filtrados.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <p className="text-4xl mb-2">🧪</p>
            <p className="text-gray-400 text-sm">No hay PAP registrados</p>
          </div>
        )}
      </div>
    </div>
  )
}