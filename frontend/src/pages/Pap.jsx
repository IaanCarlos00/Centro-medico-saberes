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

export default function Pap() {
  const [paps, setPaps] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [profesionales, setProfesionales] = useState([])
  const [form, setForm] = useState({ paciente_id: '', profesional_id: '', nombre: '', fecha_toma: hoyStr, resultado: '', estado_envio: 'pendiente', notas: '' })
  const [errores, setErrores] = useState({})
  const [mostrarForm, setMostrarForm] = useState(false)
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
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrores({ ...errores, [e.target.name]: '' })
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
    setForm({ paciente_id: '', profesional_id: '', nombre: '', fecha_toma: hoyStr, resultado: '', estado_envio: 'pendiente', notas: '' })
    setErrores({})
    setMostrarForm(false)
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
      estado_envio: p.estado_envio,
      notas: p.notas || ''
    })
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-green-800">PAP</h2>
        <button onClick={() => { setMostrarForm(!mostrarForm); if (mostrarForm) setForm({ paciente_id: '', profesional_id: '', nombre: '', fecha_toma: hoyStr, resultado: '', estado_envio: 'pendiente', notas: '' }) }} className="bg-green-700 text-white px-5 py-2 rounded-lg hover:bg-green-800 font-medium">
          {mostrarForm ? 'Cancelar' : '+ Nuevo PAP'}
        </button>
      </div>

      {mostrarForm && (
        <div className="bg-white rounded-xl shadow p-5 mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Nuevo PAP</h3>
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
              <label className="text-sm text-gray-600 mb-1">Nombre</label>
              <input className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" name="nombre" placeholder="Ej: PAP anual" value={form.nombre} onChange={handleChange} />
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Fecha de toma *</label>
              <input className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.fecha_toma ? 'border-red-400' : 'border-gray-300'}`} name="fecha_toma" type="date" value={form.fecha_toma} onChange={handleChange} />
              {errores.fecha_toma && <span className="text-red-500 text-xs mt-1">{errores.fecha_toma}</span>}
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Resultado</label>
              <input className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" name="resultado" placeholder="Ej: Normal, Anormal..." value={form.resultado} onChange={handleChange} />
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Estado envío</label>
              <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" name="estado_envio" value={form.estado_envio} onChange={handleChange}>
                <option value="pendiente">Pendiente</option>
                <option value="enviado">Enviado</option>
              </select>
            </div>
            <div className="flex flex-col sm:col-span-2 md:col-span-3">
              <label className="text-sm text-gray-600 mb-1">Notas</label>
              <input className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" name="notas" value={form.notas} onChange={handleChange} />
            </div>
          </div>
          <button onClick={guardar} className="bg-green-700 text-white px-5 py-2 rounded-lg hover:bg-green-800 font-medium mt-4">Guardar</button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <input className="w-full border border-gray-300 rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="Buscar por paciente, nombre o resultado..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          {busqueda && <button onClick={() => setBusqueda('')} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">✕</button>}
        </div>
        <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
          <option value="">Todos</option>
          <option value="pendiente">Pendiente</option>
          <option value="enviado">Enviado</option>
        </select>
      </div>

      <div className="flex flex-col gap-3">
        {filtrados.map(p => (
          <div key={p.id} className="bg-white rounded-xl shadow p-4">
            {editandoId === p.id ? (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-500 mb-1">Paciente</label>
                    <select className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" value={formEdit.paciente_id} onChange={e => setFormEdit({ ...formEdit, paciente_id: e.target.value })}>
                      {pacientes.map(pac => <option key={pac.id} value={pac.id}>{pac.nombre} {pac.apellido}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-500 mb-1">Profesional</label>
                    <select className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" value={formEdit.profesional_id} onChange={e => setFormEdit({ ...formEdit, profesional_id: e.target.value })}>
                      <option value="">Sin profesional</option>
                      {profesionales.map(pr => <option key={pr.id} value={pr.id}>{pr.nombre} {pr.apellido}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-500 mb-1">Nombre</label>
                    <input className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" value={formEdit.nombre} onChange={e => setFormEdit({ ...formEdit, nombre: e.target.value })} />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-500 mb-1">Fecha toma</label>
                    <input type="date" className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" value={formEdit.fecha_toma} onChange={e => setFormEdit({ ...formEdit, fecha_toma: e.target.value })} />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-500 mb-1">Resultado</label>
                    <input className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" value={formEdit.resultado} onChange={e => setFormEdit({ ...formEdit, resultado: e.target.value })} />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-500 mb-1">Estado envío</label>
                    <select className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" value={formEdit.estado_envio} onChange={e => setFormEdit({ ...formEdit, estado_envio: e.target.value })}>
                      <option value="pendiente">Pendiente</option>
                      <option value="enviado">Enviado</option>
                    </select>
                  </div>
                  <div className="flex flex-col md:col-span-3">
                    <label className="text-xs text-gray-500 mb-1">Notas</label>
                    <input className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" value={formEdit.notas} onChange={e => setFormEdit({ ...formEdit, notas: e.target.value })} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => guardarEdit(p.id)} className="flex-1 bg-green-700 text-white py-1.5 rounded-lg text-sm font-medium hover:bg-green-800">Guardar</button>
                  <button onClick={() => setEditandoId(null)} className="flex-1 bg-gray-100 text-gray-700 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-200">Cancelar</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{p.paciente_nombre} {p.paciente_apellido}</p>
                  <p className="text-sm text-gray-500">{p.nombre || 'PAP'} · {formatFecha(p.fecha_toma)}</p>
                  {p.profesional_nombre && <p className="text-xs text-gray-400">{p.profesional_nombre} {p.profesional_apellido}</p>}
                  {p.resultado && <p className="text-xs text-green-700 font-medium mt-0.5">Resultado: {p.resultado}</p>}
                  {p.notas && <p className="text-xs text-gray-400 mt-0.5">{p.notas}</p>}
                </div>
                <div className="flex flex-col items-end gap-2 ml-4">
                  <button onClick={() => cambiarEstado(p.id, p.estado_envio === 'pendiente' ? 'enviado' : 'pendiente')} className={`px-2 py-1 rounded-full text-xs font-semibold cursor-pointer ${p.estado_envio === 'enviado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {p.estado_envio === 'enviado' ? '✓ Enviado' : '⏳ Pendiente'}
                  </button>
                  <div className="flex gap-2">
                    <button onClick={() => iniciarEdit(p)} className="text-blue-600 hover:underline text-xs font-medium">Editar</button>
                    <button onClick={() => eliminar(p.id)} className="text-red-500 hover:underline text-xs">Eliminar</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {filtrados.length === 0 && <div className="bg-white rounded-xl shadow p-6 text-center text-gray-400">No hay PAP registrados</div>}
      </div>
    </div>
  )
}