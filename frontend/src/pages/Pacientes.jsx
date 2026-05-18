import { useEffect, useState } from 'react'
import axios from 'axios'
import Fichas from './Fichas'

const API = 'https://centro-medico-saberes-production.up.railway.app/pacientes'
const API_PAGOS = 'https://centro-medico-saberes-production.up.railway.app/pagos'

function ModalCompletarPaciente({ paciente, onConfirmar, onCerrar }) {
  const [form, setForm] = useState({ rut: paciente.rut || '', fecha_nacimiento: paciente.fecha_nacimiento?.slice(0,10) || '', telefono: paciente.telefono || '' })
  const [errores, setErrores] = useState({})

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrores({ ...errores, [e.target.name]: '' })
  }

  const guardar = async () => {
    const e = {}
    if (!form.rut.trim()) e.rut = 'El RUT es obligatorio'
    if (!form.fecha_nacimiento) e.fecha_nacimiento = 'La fecha de nacimiento es obligatoria'
    if (!form.telefono.trim()) e.telefono = 'El teléfono es obligatorio'
    if (Object.keys(e).length > 0) { setErrores(e); return }
    await axios.put(`${API}/${paciente.id}`, { ...paciente, ...form })
    onConfirmar()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4" onClick={onCerrar}>
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">📋</span>
          <div>
            <h3 className="text-lg font-bold text-green-800">Completar datos del paciente</h3>
            <p className="text-sm text-gray-500">{paciente.nombre} {paciente.apellido}</p>
          </div>
        </div>
        <p className="text-sm text-yellow-700 bg-yellow-50 rounded-lg px-3 py-2 mb-4">Completa los datos del paciente.</p>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">RUT *</label>
            <input className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.rut ? 'border-red-400' : 'border-gray-300'}`} name="rut" placeholder="12.345.678-9" value={form.rut} onChange={handleChange} />
            {errores.rut && <span className="text-red-500 text-xs mt-1">{errores.rut}</span>}
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Fecha de nacimiento *</label>
            <input className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.fecha_nacimiento ? 'border-red-400' : 'border-gray-300'}`} name="fecha_nacimiento" type="date" value={form.fecha_nacimiento} onChange={handleChange} />
            {errores.fecha_nacimiento && <span className="text-red-500 text-xs mt-1">{errores.fecha_nacimiento}</span>}
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Teléfono *</label>
            <input className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.telefono ? 'border-red-400' : 'border-gray-300'}`} name="telefono" placeholder="+56 9 1234 5678" value={form.telefono} onChange={handleChange} />
            {errores.telefono && <span className="text-red-500 text-xs mt-1">{errores.telefono}</span>}
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={guardar} className="flex-1 bg-green-700 text-white py-2 rounded-lg hover:bg-green-800 font-medium">Guardar</button>
          <button onClick={onCerrar} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 font-medium">Cancelar</button>
        </div>
      </div>
    </div>
  )
}

export default function Pacientes() {
  const [pacientes, setPacientes] = useState([])
  const [deudores, setDeudores] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [form, setForm] = useState({ nombre: '', apellido: '', rut: '', fecha_nacimiento: '', telefono: '', email: '' })
  const [editando, setEditando] = useState(null)
  const [errores, setErrores] = useState({})
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null)
  const [modalCompletar, setModalCompletar] = useState(null)

  const rol = localStorage.getItem('rol')

  const cargar = async () => {
    const [p, pg] = await Promise.all([axios.get(API), axios.get(API_PAGOS)])
    setPacientes(p.data)
    const ids = pg.data.filter(p => p.estado === 'pendiente').map(p => p.paciente_id)
    setDeudores([...new Set(ids)])
  }

  useEffect(() => { cargar() }, [])

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrores({ ...errores, [e.target.name]: '' })
  }

  const validar = () => {
    const e = {}
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio'
    if (!form.apellido.trim()) e.apellido = 'El apellido es obligatorio'
    return e
  }

  const guardar = async () => {
    const e = validar()
    if (Object.keys(e).length > 0) { setErrores(e); return }
    if (editando) {
      await axios.put(`${API}/${editando}`, form)
      setEditando(null)
    } else {
      await axios.post(API, form)
    }
    setForm({ nombre: '', apellido: '', rut: '', fecha_nacimiento: '', telefono: '', email: '' })
    setErrores({})
    cargar()
  }

  const editar = p => {
    setForm({ nombre: p.nombre, apellido: p.apellido, rut: p.rut || '', fecha_nacimiento: p.fecha_nacimiento?.slice(0,10) || '', telefono: p.telefono || '', email: p.email || '' })
    setEditando(p.id)
    setErrores({})
  }

  const eliminar = async id => {
    if (confirm('¿Eliminar paciente?')) {
      await axios.delete(`${API}/${id}`)
      cargar()
    }
  }

  const cancelar = () => {
    setEditando(null)
    setForm({ nombre: '', apellido: '', rut: '', fecha_nacimiento: '', telefono: '', email: '' })
    setErrores({})
  }

  const necesitaCompletar = p => !p.rut || !p.fecha_nacimiento || !p.telefono

  const filtrados = pacientes.filter(p => {
    const q = busqueda.toLowerCase()
    return (
      p.nombre.toLowerCase().includes(q) ||
      p.apellido.toLowerCase().includes(q) ||
      (p.rut && p.rut.toLowerCase().includes(q)) ||
      (p.telefono && p.telefono.includes(q)) ||
      (p.email && p.email.toLowerCase().includes(q))
    )
  })

  if (pacienteSeleccionado) {
    return <Fichas paciente={pacienteSeleccionado} onVolver={() => setPacienteSeleccionado(null)} />
  }

  return (
    <div>
      {modalCompletar && (
        <ModalCompletarPaciente
          paciente={modalCompletar}
          onConfirmar={() => { setModalCompletar(null); cargar() }}
          onCerrar={() => setModalCompletar(null)}
        />
      )}

      <h2 className="text-2xl font-bold text-green-800 mb-6">Pacientes</h2>

      <div className="bg-white rounded-xl shadow p-4 md:p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">{editando ? 'Editar paciente' : 'Registrar paciente'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="flex flex-col">
            <input className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.nombre ? 'border-red-400' : 'border-gray-300'}`} name="nombre" placeholder="Nombre *" value={form.nombre} onChange={handleChange} />
            {errores.nombre && <span className="text-red-500 text-xs mt-1">{errores.nombre}</span>}
          </div>
          <div className="flex flex-col">
            <input className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.apellido ? 'border-red-400' : 'border-gray-300'}`} name="apellido" placeholder="Apellido *" value={form.apellido} onChange={handleChange} />
            {errores.apellido && <span className="text-red-500 text-xs mt-1">{errores.apellido}</span>}
          </div>
          <input className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" name="rut" placeholder="RUT (opcional)" value={form.rut} onChange={handleChange} />
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Fecha de nacimiento (opcional)</label>
            <input className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" name="fecha_nacimiento" type="date" value={form.fecha_nacimiento} onChange={handleChange} />
          </div>
          <input className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" name="telefono" placeholder="Teléfono (opcional)" value={form.telefono} onChange={handleChange} />
          <input className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" name="email" placeholder="Email (opcional)" value={form.email} onChange={handleChange} type="email" />
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={guardar} className="bg-green-700 text-white px-5 py-2 rounded-lg hover:bg-green-800 transition-colors font-medium">
            {editando ? 'Actualizar' : 'Registrar'}
          </button>
          {editando && <button onClick={cancelar} className="bg-gray-200 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium">Cancelar</button>}
        </div>
        {!editando && <p className="text-xs text-gray-400 mt-2">Solo nombre y apellido son obligatorios para registrar.</p>}
      </div>

      <div className="mb-4 relative">
        <input className="w-full border border-gray-300 rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="Buscar por nombre, apellido, RUT, teléfono o email..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
        {busqueda && <button onClick={() => setBusqueda('')} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">✕</button>}
      </div>
      {busqueda && <p className="text-sm text-gray-500 mb-3">{filtrados.length} resultado{filtrados.length !== 1 ? 's' : ''} encontrado{filtrados.length !== 1 ? 's' : ''}</p>}

      <div className="hidden md:block bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-green-50 text-green-800 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Nombre</th>
              <th className="px-4 py-3 text-left">Apellido</th>
              <th className="px-4 py-3 text-left">RUT</th>
              <th className="px-4 py-3 text-left">Teléfono</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtrados.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-800">{p.nombre}</td>
                <td className="px-4 py-3 text-gray-800">{p.apellido}</td>
                <td className="px-4 py-3 text-gray-600">{p.rut || <span className="text-yellow-600 text-xs">Pendiente</span>}</td>
                <td className="px-4 py-3 text-gray-600">{p.telefono || <span className="text-yellow-600 text-xs">Pendiente</span>}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    {necesitaCompletar(p)
                      ? <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">Datos incompletos</span>
                      : <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Completo</span>
                    }
                    {deudores.includes(p.id) && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">💰 Pago pendiente</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 flex gap-2 flex-wrap">
                  {rol !== 'secretaria' && (
                    <button onClick={() => setPacienteSeleccionado(p)} className="text-blue-600 hover:underline text-sm font-medium">Fichas</button>
                  )}
                  {necesitaCompletar(p) && (
                    <button onClick={() => setModalCompletar(p)} className="text-yellow-600 hover:underline text-sm font-medium">Completar</button>
                  )}
                  <button onClick={() => editar(p)} className="text-gray-500 hover:underline text-sm font-medium">Editar</button>
                  <button onClick={() => eliminar(p.id)} className="text-red-500 hover:underline text-sm font-medium">Eliminar</button>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr><td colSpan="6" className="px-4 py-6 text-center text-gray-400">{busqueda ? 'No se encontraron resultados' : 'No hay pacientes registrados'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden flex flex-col gap-3">
        {filtrados.map(p => (
          <div key={p.id} className="bg-white rounded-xl shadow p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold text-gray-800">{p.nombre} {p.apellido}</p>
                <p className="text-sm text-gray-500">{p.rut || <span className="text-yellow-600">RUT pendiente</span>}</p>
                {necesitaCompletar(p) && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full mt-1 inline-block">Datos incompletos</span>}
                {deudores.includes(p.id) && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full mt-1 ml-1 inline-block">💰 Pago pendiente</span>}
              </div>
              <div className="flex gap-2 flex-wrap justify-end">
                {rol !== 'secretaria' && (
                  <button onClick={() => setPacienteSeleccionado(p)} className="text-blue-600 text-sm font-medium">Fichas</button>
                )}
                {necesitaCompletar(p) && (
                  <button onClick={() => setModalCompletar(p)} className="text-yellow-600 text-sm font-medium">Completar</button>
                )}
                <button onClick={() => editar(p)} className="text-gray-500 text-sm font-medium">Editar</button>
                <button onClick={() => eliminar(p.id)} className="text-red-500 text-sm font-medium">Eliminar</button>
              </div>
            </div>
            {p.telefono && <p className="text-sm text-gray-500">📞 {p.telefono}</p>}
          </div>
        ))}
        {filtrados.length === 0 && (
          <div className="bg-white rounded-xl shadow p-6 text-center text-gray-400">{busqueda ? 'No se encontraron resultados' : 'No hay pacientes registrados'}</div>
        )}
      </div>
    </div>
  )
}