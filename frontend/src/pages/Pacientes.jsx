import { useEffect, useState } from 'react'
import axios from 'axios'
import Fichas from './Fichas'
import { registrarLog } from '../utils/log'
import ModalConfirmar from '../components/ModalConfirmar'
import Toast from '../components/Toast'

const API = 'https://centro-medico-saberes-production.up.railway.app/pacientes'
const API_PAGOS = 'https://centro-medico-saberes-production.up.railway.app/pagos'
const API_CITAS = 'https://centro-medico-saberes-production.up.railway.app/citas'
const API_PROC = 'https://centro-medico-saberes-production.up.railway.app/procedimientos'
const API_PAP = 'https://centro-medico-saberes-production.up.railway.app/pap'
const API_FLUJOS = 'https://centro-medico-saberes-production.up.railway.app/flujos'

function ModalCompletarPaciente({ paciente, onConfirmar, onCerrar }) {
  const [form, setForm] = useState({ rut: paciente.rut || '', fecha_nacimiento: paciente.fecha_nacimiento?.slice(0,10) || '', telefono: paciente.telefono || '', email: paciente.email || '' })
  const [errores, setErrores] = useState({})

  const handleChange = e => {
    const { name, value } = e.target
    if (name === 'rut') {
      setForm({ ...form, rut: formatearRut(value) })
    } else {
      setForm({ ...form, [name]: value })
    }
    setErrores({ ...errores, [name]: '' })
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
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Email (opcional)</label>
            <input className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" name="email" type="email" placeholder="correo@ejemplo.cl" value={form.email || ''} onChange={handleChange} />
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

function formatearRut(rut) {
  if (!rut) return ''
  const limpio = rut.replace(/[^0-9kK]/g, '').toUpperCase()
  if (limpio.length < 2) return limpio
  const cuerpo = limpio.slice(0, -1)
  const dv = limpio.slice(-1)
  const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${cuerpoFormateado}-${dv}`
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
  const [modalHistorial, setModalHistorial] = useState(null)
  const [historial, setHistorial] = useState({ citas: [], procedimientos: [], pap: [], flujos: [], pagos: [] })
  const [cargandoHistorial, setCargandoHistorial] = useState(false)
  const [modalEliminar, setModalEliminar] = useState(null)
  const [toast, setToast] = useState(null)

  const rol = localStorage.getItem('rol')

  const cargar = async () => {
    const [p, pg] = await Promise.all([axios.get(API), axios.get(API_PAGOS)])
    setPacientes(p.data)
    const ids = pg.data.filter(p => p.estado === 'pendiente').map(p => p.paciente_id)
    setDeudores([...new Set(ids)])
  }

  useEffect(() => { cargar() }, [])

  const handleChange = e => {
    const { name, value } = e.target
    if (name === 'rut') {
      setForm({ ...form, rut: formatearRut(value) })
    } else {
      setForm({ ...form, [name]: value })
    }
    setErrores({ ...errores, [name]: '' })
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
      await registrarLog('editar', 'paciente', editando, `${form.nombre} ${form.apellido}`)
      setEditando(null)
    } else {
      await axios.post(API, form)
      await registrarLog('crear', 'paciente', null, `${form.nombre} ${form.apellido}`)
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
    const paciente = pacientes.find(p => p.id === id)
    setModalEliminar(paciente)
  }

  const confirmarEliminar = async () => {
    const paciente = modalEliminar
    setModalEliminar(null)
    try {
      await axios.delete(`${API}/${paciente.id}`)
      cargar()
      setToast({ mensaje: 'Paciente eliminado correctamente', tipo: 'exito' })
    } catch (err) {
      if (err.response?.data?.error === 'tiene_registros') {
        const r = err.response.data.resumen
        const detalle = [
          r.citas > 0 && `${r.citas} cita(s)`,
          r.fichas > 0 && `${r.fichas} ficha(s) clínica(s)`,
          r.pagos > 0 && `${r.pagos} pago(s)`,
          r.procedimientos > 0 && `${r.procedimientos} procedimiento(s)`,
          r.pap > 0 && `${r.pap} PAP`,
          r.flujos > 0 && `${r.flujos} flujo(s)`,
        ].filter(Boolean).join(', ')
        setToast({ mensaje: `No se puede eliminar: tiene ${detalle}`, tipo: 'error' })
      } else {
        setToast({ mensaje: 'Error al eliminar el paciente', tipo: 'error' })
      }
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

  const verHistorial = async p => {
  setModalHistorial(p)
  setCargandoHistorial(true)
  const [citas, proc, pap, flujos, pagos] = await Promise.all([
    axios.get(API_CITAS),
    axios.get(`${API_PROC}/paciente/${p.id}`),
    axios.get(`${API_PAP}/paciente/${p.id}`),
    axios.get(`${API_FLUJOS}/paciente/${p.id}`),
    axios.get(API_PAGOS)
  ])
  setHistorial({
    citas: citas.data.filter(c => c.paciente_id === p.id).slice(0, 10),
    procedimientos: proc.data,
    pap: pap.data,
    flujos: flujos.data,
    pagos: pagos.data.filter(pg => pg.paciente_id === p.id).slice(0, 10)
  })
  setCargandoHistorial(false)
}

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

      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onCerrar={() => setToast(null)} />}
      {modalEliminar && (
        <ModalConfirmar
          titulo={`¿Eliminar a ${modalEliminar.nombre} ${modalEliminar.apellido}?`}
          mensaje="Esta acción no se puede deshacer."
          textoConfirmar="Eliminar"
          onConfirmar={confirmarEliminar}
          onCancelar={() => setModalEliminar(null)}
        />
      )}

      {modalHistorial && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4" onClick={() => setModalHistorial(null)}>
    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-bold text-green-800">Historial — {modalHistorial.nombre} {modalHistorial.apellido}</h3>
          <p className="text-xs text-gray-400">{modalHistorial.rut} · {modalHistorial.telefono}</p>
        </div>
        <button onClick={() => setModalHistorial(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
      </div>
      {cargandoHistorial ? (
        <p className="text-center text-gray-400 py-8">Cargando historial...</p>
      ) : (
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">📅 Últimas citas ({historial.citas.length})</p>
            {historial.citas.length === 0 ? <p className="text-sm text-gray-400">Sin citas</p> : (
              <div className="flex flex-col gap-1">
                {historial.citas.map(c => (
                  <div key={c.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">{c.fecha_hora?.slice(0,16).replace('T',' ')}</span>
                    <span className="text-gray-500 text-xs">{c.profesional_nombre} {c.profesional_apellido}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.estado === 'realizada' ? 'bg-green-100 text-green-700' : c.estado === 'cancelada' ? 'bg-red-100 text-red-600' : c.estado === 'confirmada' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{c.estado}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">🔬 Procedimientos ({historial.procedimientos.length})</p>
            {historial.procedimientos.length === 0 ? <p className="text-sm text-gray-400">Sin procedimientos</p> : (
              <div className="flex flex-col gap-1">
                {historial.procedimientos.map(p => (
                  <div key={p.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">{p.nombre}</span>
                    <span className="text-gray-500 text-xs">${Number(p.monto).toLocaleString('es-CL')}</span>
                    <span className="text-xs text-gray-400">{p.fecha?.slice(0,10)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">🧪 PAP ({historial.pap.length})</p>
            {historial.pap.length === 0 ? <p className="text-sm text-gray-400">Sin PAP</p> : (
              <div className="flex flex-col gap-1">
                {historial.pap.map(p => (
                  <div key={p.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">{p.nombre}</span>
                    <span className="text-xs text-gray-400">{p.fecha_toma?.slice(0,10)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.estado_envio === 'enviado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{p.estado_envio}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">🔬 Flujos ({historial.flujos.length})</p>
            {historial.flujos.length === 0 ? <p className="text-sm text-gray-400">Sin flujos</p> : (
              <div className="flex flex-col gap-1">
                {historial.flujos.map(f => (
                  <div key={f.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">{f.nombre}</span>
                    <span className="text-xs text-gray-400">{f.fecha_toma?.slice(0,10)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${f.entregado ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{f.entregado ? 'Entregado' : 'Pendiente'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">💰 Pagos ({historial.pagos.length})</p>
            {historial.pagos.length === 0 ? <p className="text-sm text-gray-400">Sin pagos</p> : (
              <div className="flex flex-col gap-1">
                {historial.pagos.map(pg => (
                  <div key={pg.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">${Number(pg.monto).toLocaleString('es-CL')}</span>
                    <span className="text-xs text-gray-400">{pg.metodo}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pg.estado === 'pagado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{pg.estado}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  </div>
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
              <th className="px-4 py-3 text-left">Email</th>
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
                <td className="px-4 py-3 text-gray-600">{p.email || <span className="text-gray-400 text-xs">—</span>}</td>
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
                <button onClick={() => verHistorial(p)} className="text-purple-600 hover:underline text-sm font-medium">Historial</button>
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
                <button onClick={() => verHistorial(p)} className="text-purple-600 text-sm font-medium">Historial</button>
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