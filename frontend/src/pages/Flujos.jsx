import { useEffect, useState } from 'react'
import axios from 'axios'

const API = 'https://centro-medico-saberes-production.up.railway.app/flujos'
const API_PAC = 'https://centro-medico-saberes-production.up.railway.app/pacientes'
const API_PRO = 'https://centro-medico-saberes-production.up.railway.app/profesionales'

const hoyStr = new Date().toISOString().slice(0, 10)

const formatFecha = fecha => {
  if (!fecha) return ''
  return new Date(fecha.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-CL')
}

const formInicial = { paciente_id: '', profesional_id: '', tipo_examen: '', nombre: '', fecha_toma: hoyStr, entregado: false, codigo: '' }

function FormEdit({ f, formEdit, setFormEdit, guardarEdit, setEditandoId, pacientes, profesionales }) {
  return (
    <div className="rounded-2xl p-5 mt-3 border border-green-200" style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-600">Paciente</label>
          <select className="border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white" value={formEdit.paciente_id} onChange={e => setFormEdit(fe => ({ ...fe, paciente_id: e.target.value }))}>
            {pacientes.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-600">Profesional</label>
          <select className="border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white" value={formEdit.profesional_id} onChange={e => setFormEdit(fe => ({ ...fe, profesional_id: e.target.value }))}>
            <option value="">Sin profesional</option>
            {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-600">Tipo examen</label>
          <input className="border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white" value={formEdit.tipo_examen} onChange={e => setFormEdit(fe => ({ ...fe, tipo_examen: e.target.value }))} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-600">Nombre</label>
          <input className="border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white" value={formEdit.nombre} onChange={e => setFormEdit(fe => ({ ...fe, nombre: e.target.value }))} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-600">Fecha toma</label>
          <input type="date" className="border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white" value={formEdit.fecha_toma} onChange={e => setFormEdit(fe => ({ ...fe, fecha_toma: e.target.value }))} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-600">Código</label>
          <input className="border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white" value={formEdit.codigo} onChange={e => setFormEdit(fe => ({ ...fe, codigo: e.target.value }))} />
        </div>
        <div className="flex items-center gap-2 mt-4">
          <input type="checkbox" checked={formEdit.entregado} onChange={e => setFormEdit(fe => ({ ...fe, entregado: e.target.checked }))} className="w-4 h-4 accent-green-700" />
          <label className="text-sm font-semibold text-gray-600">Entregado</label>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => guardarEdit(f.id)} className="text-white px-5 py-2 rounded-xl text-sm font-bold hover:opacity-90" style={{ background: 'linear-gradient(135deg, #166534, #15803d)' }}>✓ Guardar</button>
        <button onClick={() => setEditandoId(null)} className="bg-white text-gray-600 px-5 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 border border-gray-200">Cancelar</button>
      </div>
    </div>
  )
}

export default function Flujos() {
  const [flujos, setFlujos] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [profesionales, setProfesionales] = useState([])
  const [form, setForm] = useState(formInicial)
  const [errores, setErrores] = useState({})
  const [modalForm, setModalForm] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEntregado, setFiltroEntregado] = useState('')
  const [editandoId, setEditandoId] = useState(null)
  const [formEdit, setFormEdit] = useState({})

  const cargar = async () => {
    const [f, pac, pro] = await Promise.all([axios.get(API), axios.get(API_PAC), axios.get(API_PRO)])
    setFlujos(f.data)
    setPacientes(pac.data)
    setProfesionales(pro.data)
  }

  useEffect(() => { cargar() }, [])

  const handleChange = e => {
    const { name, value, type, checked } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
    setErrores({ ...errores, [name]: '' })
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

  const iniciarEdit = f => {
    setEditandoId(f.id)
    setFormEdit({
      paciente_id: f.paciente_id,
      profesional_id: f.profesional_id || '',
      tipo_examen: f.tipo_examen || '',
      nombre: f.nombre || '',
      fecha_toma: f.fecha_toma?.slice(0, 10) || hoyStr,
      entregado: f.entregado || false,
      codigo: f.codigo || ''
    })
  }

  const guardarEdit = async id => {
    await axios.put(`${API}/${id}`, formEdit)
    setEditandoId(null)
    cargar()
  }

  const eliminar = async id => {
    if (confirm('¿Eliminar flujo?')) {
      await axios.delete(`${API}/${id}`)
      cargar()
    }
  }

  const cambiarEntregado = async (id, entregado) => {
    const flujo = flujos.find(f => f.id === id)
    await axios.put(`${API}/${id}`, { ...flujo, entregado })
    cargar()
  }

  const filtrados = flujos.filter(f => {
    const esFlujoOPanel = !(f.nombre || '').toLowerCase().includes('toma') && !(f.tipo_examen || '').toLowerCase().includes('toma')
    const q = busqueda.toLowerCase()
    const coincideBusqueda = !busqueda ||
      `${f.paciente_nombre || ''} ${f.paciente_apellido || ''}`.toLowerCase().includes(q) ||
      (f.tipo_examen || '').toLowerCase().includes(q) ||
      (f.nombre || '').toLowerCase().includes(q) ||
      (f.codigo || '').toLowerCase().includes(q)
    const coincideEntregado = filtroEntregado === '' || (filtroEntregado === 'entregado' ? f.entregado : !f.entregado)
    return coincideBusqueda && coincideEntregado && esFlujoOPanel
  })

  const stats = {
    total: filtrados.length,
    entregados: flujos.filter(f => f.entregado).length,
    pendientes: flujos.filter(f => !f.entregado).length,
  }

  return (
    <div className="min-h-screen bg-white">

      {/* Modal */}
      {modalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4" onClick={() => { setModalForm(false); setForm(formInicial) }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #052e16, #166534)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: 'rgba(255,255,255,0.15)' }}>🔬</div>
                <div>
                  <h3 className="text-lg font-bold text-white">Nuevo flujo</h3>
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
                  <label className="text-sm font-semibold text-gray-700">Tipo de examen</label>
                  <input className="border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" name="tipo_examen" placeholder="Ej: Flujo particular..." value={form.tipo_examen} onChange={handleChange} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">Nombre</label>
                  <input className="border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" name="nombre" placeholder="Nombre del examen" value={form.nombre} onChange={handleChange} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">Fecha de toma *</label>
                  <input type="date" className={`border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.fecha_toma ? 'border-red-400 bg-red-50' : 'border-gray-200'}`} name="fecha_toma" value={form.fecha_toma} onChange={handleChange} />
                  {errores.fecha_toma && <span className="text-red-500 text-xs">{errores.fecha_toma}</span>}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">Código</label>
                  <input className="border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" name="codigo" placeholder="Código del examen" value={form.codigo} onChange={handleChange} />
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <input type="checkbox" name="entregado" id="entregado" checked={form.entregado} onChange={handleChange} className="w-4 h-4 accent-green-700" />
                  <label htmlFor="entregado" className="text-sm font-semibold text-gray-700">Entregado</label>
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
          <p className="text-green-300 text-xs font-semibold uppercase tracking-widest mb-1">Laboratorio</p>
          <h2 className="text-3xl font-black text-white">Flujos</h2>
          <p className="text-green-200 text-sm mt-1">{flujos.length} examen{flujos.length !== 1 ? 'es' : ''} registrado{flujos.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setModalForm(true)} className="relative z-10 flex items-center gap-2 text-sm font-bold px-5 py-3 rounded-2xl transition-all hover:scale-105 shrink-0" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.25)' }}>
          <span className="text-lg">+</span> Nuevo flujo
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { icon: '🔬', label: 'Total', value: stats.total, gradient: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '#16a34a', text: '#166534' },
          { icon: '✅', label: 'Entregados', value: stats.entregados, gradient: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '#3b82f6', text: '#1d4ed8' },
          { icon: '⏳', label: 'Pendientes', value: stats.pendientes, gradient: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '#f59e0b', text: '#b45309' },
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
          <input className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 pl-11 focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm" placeholder="Buscar por paciente, tipo, nombre o código..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          {busqueda && <button onClick={() => setBusqueda('')} className="absolute right-4 top-3 text-gray-400 hover:text-gray-600">✕</button>}
        </div>
        <select className="border border-gray-200 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm" value={filtroEntregado} onChange={e => setFiltroEntregado(e.target.value)}>
          <option value="">Todos</option>
          <option value="entregado">Entregados</option>
          <option value="pendiente">Pendientes</option>
        </select>
      </div>

      {/* Tabla desktop */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}>
              {['Paciente', 'Tipo', 'Nombre', 'Profesional', 'Fecha toma', 'Código', 'Estado', 'Acciones'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-green-800 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtrados.map(f => (
              <>
                <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-800">{f.paciente_nombre} {f.paciente_apellido}</p>
                    {(() => { const pac = pacientes.find(pac => pac.id === f.paciente_id); return pac?.email ? <a href={`mailto:${pac.email}`} className="text-xs text-blue-500 hover:underline">✉️ {pac.email}</a> : null })()}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{f.tipo_examen || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{f.nombre || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{f.profesional_nombre ? `${f.profesional_nombre} ${f.profesional_apellido}` : '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatFecha(f.fecha_toma)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs font-mono">{f.codigo || '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => cambiarEntregado(f.id, !f.entregado)} className={`px-2.5 py-1 rounded-full text-xs font-bold cursor-pointer transition-colors ${f.entregado ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`}>
                      {f.entregado ? '✓ Entregado' : '⏳ Pendiente'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => iniciarEdit(f)} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">Editar</button>
                      <button onClick={() => eliminar(f.id)} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">Eliminar</button>
                    </div>
                  </td>
                </tr>
                {editandoId === f.id && (
                  <tr key={`edit-${f.id}`}>
                    <td colSpan="8" className="px-4 pb-4">
                      <FormEdit f={f} formEdit={formEdit} setFormEdit={setFormEdit} guardarEdit={guardarEdit} setEditandoId={setEditandoId} pacientes={pacientes} profesionales={profesionales} />
                    </td>
                  </tr>
                )}
              </>
            ))}
            {filtrados.length === 0 && (
              <tr><td colSpan="8" className="px-4 py-12 text-center">
                <p className="text-4xl mb-2">🔬</p>
                <p className="text-gray-400 text-sm">No hay flujos registrados</p>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Tarjetas móvil */}
      <div className="md:hidden flex flex-col gap-3">
        {filtrados.map(f => (
          <div key={f.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-bold text-gray-800">{f.paciente_nombre} {f.paciente_apellido}</p>
                {(() => { const pac = pacientes.find(pac => pac.id === f.paciente_id); return pac?.email ? <a href={`mailto:${pac.email}`} className="text-xs text-blue-500 hover:underline">✉️ {pac.email}</a> : null })()}
                {f.tipo_examen && <p className="text-xs text-gray-400 mt-0.5">🔬 {f.tipo_examen}</p>}
              </div>
              <button onClick={() => cambiarEntregado(f.id, !f.entregado)} className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${f.entregado ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {f.entregado ? '✓ Entregado' : '⏳ Pendiente'}
              </button>
            </div>
            <div className="text-xs text-gray-400 flex flex-col gap-0.5 mb-3">
              {f.nombre && <span>📋 {f.nombre}</span>}
              {f.profesional_nombre && <span>👩‍⚕️ {f.profesional_nombre} {f.profesional_apellido}</span>}
              <span>📅 {formatFecha(f.fecha_toma)}</span>
              {f.codigo && <span>🔢 {f.codigo}</span>}
            </div>
            <div className="flex gap-2 pt-2 border-t border-gray-50">
              <button onClick={() => iniciarEdit(f)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700">Editar</button>
              <button onClick={() => eliminar(f.id)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-600">Eliminar</button>
            </div>
            {editandoId === f.id && (
              <FormEdit f={f} formEdit={formEdit} setFormEdit={setFormEdit} guardarEdit={guardarEdit} setEditandoId={setEditandoId} pacientes={pacientes} profesionales={profesionales} />
            )}
          </div>
        ))}
        {filtrados.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <p className="text-4xl mb-2">🔬</p>
            <p className="text-gray-400 text-sm">No hay flujos registrados</p>
          </div>
        )}
      </div>
    </div>
  )
}