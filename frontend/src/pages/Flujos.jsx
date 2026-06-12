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
    <div className="bg-green-50 rounded-xl p-4 mt-1">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">Paciente</label>
          <select className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" value={formEdit.paciente_id} onChange={e => setFormEdit(fe => ({ ...fe, paciente_id: e.target.value }))}>
            {pacientes.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">Profesional</label>
          <select className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" value={formEdit.profesional_id} onChange={e => setFormEdit(fe => ({ ...fe, profesional_id: e.target.value }))}>
            <option value="">Sin profesional</option>
            {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">Tipo examen</label>
          <input className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" value={formEdit.tipo_examen} onChange={e => setFormEdit(fe => ({ ...fe, tipo_examen: e.target.value }))} />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">Nombre</label>
          <input className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" value={formEdit.nombre} onChange={e => setFormEdit(fe => ({ ...fe, nombre: e.target.value }))} />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">Fecha toma</label>
          <input type="date" className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" value={formEdit.fecha_toma} onChange={e => setFormEdit(fe => ({ ...fe, fecha_toma: e.target.value }))} />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">Código</label>
          <input className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" value={formEdit.codigo} onChange={e => setFormEdit(fe => ({ ...fe, codigo: e.target.value }))} />
        </div>
        <div className="flex items-center gap-2 mt-3">
          <input type="checkbox" checked={formEdit.entregado} onChange={e => setFormEdit(fe => ({ ...fe, entregado: e.target.checked }))} className="w-4 h-4 accent-green-700" />
          <label className="text-sm text-gray-600">Entregado</label>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => guardarEdit(f.id)} className="bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-green-800">Guardar</button>
        <button onClick={() => setEditandoId(null)} className="bg-gray-200 text-gray-700 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-300">Cancelar</button>
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
  const [mostrarForm, setMostrarForm] = useState(false)
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
    setMostrarForm(false)
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-green-800">Flujos</h2>
        <button onClick={() => { setMostrarForm(!mostrarForm); if (mostrarForm) setForm(formInicial) }} className="bg-green-700 text-white px-5 py-2 rounded-lg hover:bg-green-800 font-medium">
          {mostrarForm ? 'Cancelar' : '+ Nuevo flujo'}
        </button>
      </div>

      {mostrarForm && (
        <div className="bg-white rounded-xl shadow p-5 mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Nuevo flujo</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Paciente *</label>
              <select className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.paciente_id ? 'border-red-400' : 'border-gray-300'}`} name="paciente_id" value={form.paciente_id} onChange={handleChange}>
                <option value="">Seleccionar paciente</option>
                {pacientes.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
              </select>
              {errores.paciente_id && <span className="text-red-500 text-xs mt-1">{errores.paciente_id}</span>}
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Profesional</label>
              <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" name="profesional_id" value={form.profesional_id} onChange={handleChange}>
                <option value="">Seleccionar profesional</option>
                {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Tipo de examen</label>
              <input className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" name="tipo_examen" placeholder="Ej: Flujo particular..." value={form.tipo_examen} onChange={handleChange} />
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Nombre</label>
              <input className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" name="nombre" placeholder="Nombre del examen" value={form.nombre} onChange={handleChange} />
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Fecha de toma *</label>
              <input className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.fecha_toma ? 'border-red-400' : 'border-gray-300'}`} name="fecha_toma" type="date" value={form.fecha_toma} onChange={handleChange} />
              {errores.fecha_toma && <span className="text-red-500 text-xs mt-1">{errores.fecha_toma}</span>}
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Código</label>
              <input className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" name="codigo" placeholder="Código del examen" value={form.codigo} onChange={handleChange} />
            </div>
            <div className="flex items-center gap-3 mt-2">
              <input type="checkbox" name="entregado" id="entregado" checked={form.entregado} onChange={handleChange} className="w-4 h-4 accent-green-700" />
              <label htmlFor="entregado" className="text-sm text-gray-600">Entregado</label>
            </div>
          </div>
          <button onClick={guardar} className="bg-green-700 text-white px-5 py-2 rounded-lg hover:bg-green-800 font-medium mt-4">Guardar</button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <input className="w-full border border-gray-300 rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="Buscar por paciente, tipo, nombre o código..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          {busqueda && <button onClick={() => setBusqueda('')} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">✕</button>}
        </div>
        <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" value={filtroEntregado} onChange={e => setFiltroEntregado(e.target.value)}>
          <option value="">Todos</option>
          <option value="entregado">Entregado</option>
          <option value="pendiente">No entregado</option>
        </select>
      </div>

      {/* Tabla desktop */}
      <div className="hidden md:block bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-green-50 text-green-800 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Paciente</th>
              <th className="px-4 py-3 text-left">Tipo</th>
              <th className="px-4 py-3 text-left">Nombre</th>
              <th className="px-4 py-3 text-left">Profesional</th>
              <th className="px-4 py-3 text-left">Fecha toma</th>
              <th className="px-4 py-3 text-left">Código</th>
              <th className="px-4 py-3 text-left">Entregado</th>
              <th className="px-4 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtrados.map(f => (
              <>
                <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{f.paciente_nombre} {f.paciente_apellido}</p>
                    {pacientes.find(pac => pac.id === f.paciente_id)?.email && (
                      <a href={`mailto:${pacientes.find(pac => pac.id === f.paciente_id).email}`} className="text-xs text-blue-500 hover:underline">
                        ✉️ {pacientes.find(pac => pac.id === f.paciente_id).email}
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{f.tipo_examen || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{f.nombre || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{f.profesional_nombre ? `${f.profesional_nombre} ${f.profesional_apellido}` : '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{formatFecha(f.fecha_toma)}</td>
                  <td className="px-4 py-3 text-gray-600">{f.codigo || '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => cambiarEntregado(f.id, !f.entregado)} className={`px-2 py-1 rounded-full text-xs font-semibold cursor-pointer ${f.entregado ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {f.entregado ? '✓ Entregado' : '⏳ Pendiente'}
                    </button>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => iniciarEdit(f)} className="text-blue-600 hover:underline text-sm font-medium">Editar</button>
                    <button onClick={() => eliminar(f.id)} className="text-red-500 hover:underline text-sm font-medium">Eliminar</button>
                  </td>
                </tr>
                {editandoId === f.id && (
                  <tr key={`edit-${f.id}`} className="bg-green-50">
                    <td colSpan="8" className="px-4 py-4">
                      <FormEdit f={f} formEdit={formEdit} setFormEdit={setFormEdit} guardarEdit={guardarEdit} setEditandoId={setEditandoId} pacientes={pacientes} profesionales={profesionales} />
                    </td>
                  </tr>
                )}
              </>
            ))}
            {filtrados.length === 0 && <tr><td colSpan="8" className="px-4 py-6 text-center text-gray-400">No hay flujos registrados</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Tarjetas móvil */}
      <div className="md:hidden flex flex-col gap-3">
        {filtrados.map(f => (
          <div key={f.id} className="bg-white rounded-xl shadow p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold text-gray-800">{f.paciente_nombre} {f.paciente_apellido}</p>
                {pacientes.find(pac => pac.id === f.paciente_id)?.email && (
                  <a href={`mailto:${pacientes.find(pac => pac.id === f.paciente_id).email}`} className="text-xs text-blue-500 hover:underline">
                    ✉️ {pacientes.find(pac => pac.id === f.paciente_id).email}
                  </a>
                )}
              </div>
              <button onClick={() => cambiarEntregado(f.id, !f.entregado)} className={`px-2 py-1 rounded-full text-xs font-semibold cursor-pointer ${f.entregado ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {f.entregado ? '✓ Entregado' : '⏳ Pendiente'}
              </button>
            </div>
            <div className="text-sm text-gray-600 space-y-0.5">
              {f.tipo_examen && <p>🔬 {f.tipo_examen}</p>}
              {f.nombre && <p>📋 {f.nombre}</p>}
              {f.profesional_nombre && <p>👩‍⚕️ {f.profesional_nombre} {f.profesional_apellido}</p>}
              <p>📅 {formatFecha(f.fecha_toma)}</p>
              {f.codigo && <p>🔢 {f.codigo}</p>}
            </div>
            <div className="flex gap-3 mt-3">
              <button onClick={() => iniciarEdit(f)} className="text-blue-600 text-sm font-medium">Editar</button>
              <button onClick={() => eliminar(f.id)} className="text-red-500 text-sm font-medium">Eliminar</button>
            </div>
            {editandoId === f.id && <FormEdit f={f} formEdit={formEdit} setFormEdit={setFormEdit} guardarEdit={guardarEdit} setEditandoId={setEditandoId} pacientes={pacientes} profesionales={profesionales} />}
          </div>
        ))}
        {filtrados.length === 0 && <div className="bg-white rounded-xl shadow p-6 text-center text-gray-400">No hay flujos registrados</div>}
      </div>
    </div>
  )
}