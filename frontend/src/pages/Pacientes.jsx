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
    if (name === 'rut') setForm({ ...form, rut: formatearRut(value) })
    else setForm({ ...form, [name]: value })
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
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4" onClick={onCerrar}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #166534, #15803d)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: 'rgba(255,255,255,0.15)' }}>📋</div>
          <div>
            <h3 className="text-lg font-bold text-white">Completar datos</h3>
            <p className="text-green-200 text-xs">{paciente.nombre} {paciente.apellido}</p>
          </div>
        </div>
        <div className="p-6 flex flex-col gap-4">
          {[
            { label: 'RUT *', name: 'rut', placeholder: '12.345.678-9', error: errores.rut },
            { label: 'Teléfono *', name: 'telefono', placeholder: '+56 9 1234 5678', error: errores.telefono },
          ].map(f => (
            <div key={f.name} className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">{f.label}</label>
              <input className={`border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 ${f.error ? 'border-red-400 bg-red-50' : 'border-gray-200'}`} name={f.name} placeholder={f.placeholder} value={form[f.name]} onChange={handleChange} />
              {f.error && <span className="text-red-500 text-xs">{f.error}</span>}
            </div>
          ))}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Fecha de nacimiento *</label>
            <input type="date" className={`border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.fecha_nacimiento ? 'border-red-400 bg-red-50' : 'border-gray-200'}`} name="fecha_nacimiento" value={form.fecha_nacimiento} onChange={handleChange} />
            {errores.fecha_nacimiento && <span className="text-red-500 text-xs">{errores.fecha_nacimiento}</span>}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Email <span className="text-gray-400 font-normal">(opcional)</span></label>
            <input type="email" className="border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" name="email" placeholder="correo@ejemplo.cl" value={form.email} onChange={handleChange} />
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onCerrar} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 font-medium">Cancelar</button>
          <button onClick={guardar} className="flex-1 text-white py-3 rounded-xl font-semibold" style={{ background: 'linear-gradient(135deg, #166534, #15803d)' }}>Guardar</button>
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
  return `${cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}`
}

function formatFecha(fecha) {
  if (!fecha) return '—'
  return new Date(String(fecha).slice(0, 10) + 'T12:00:00').toLocaleDateString('es-CL')
}

function ModalPaciente({ editando, form, errores, handleChange, guardar, onCerrar }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4" onClick={onCerrar}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #052e16, #166534)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: 'rgba(255,255,255,0.15)' }}>
              {editando ? '✏️' : '👤'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{editando ? 'Editar paciente' : 'Nueva paciente'}</h3>
              <p className="text-green-300 text-xs">{editando ? 'Modifica los datos' : 'Solo nombre y apellido son obligatorios'}</p>
            </div>
          </div>
          <button onClick={onCerrar} className="text-white hover:text-green-200 text-2xl leading-none">✕</button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Nombre *', name: 'nombre', placeholder: 'Ej: María', error: errores.nombre },
              { label: 'Apellido *', name: 'apellido', placeholder: 'Ej: González', error: errores.apellido },
              { label: 'RUT', name: 'rut', placeholder: '12.345.678-9' },
              { label: 'Teléfono', name: 'telefono', placeholder: '+56 9 1234 5678' },
              { label: 'Email', name: 'email', placeholder: 'correo@ejemplo.cl', type: 'email' },
            ].map(f => (
              <div key={f.name} className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-700">{f.label}</label>
                <input
                  type={f.type || 'text'}
                  className={`border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 transition-colors ${f.error ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}
                  name={f.name} placeholder={f.placeholder} value={form[f.name]} onChange={handleChange}
                />
                {f.error && <span className="text-red-500 text-xs">{f.error}</span>}
              </div>
            ))}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">Fecha de nacimiento</label>
              <input type="date" className="border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" name="fecha_nacimiento" value={form.fecha_nacimiento} onChange={handleChange} />
            </div>
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onCerrar} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 font-medium transition-colors">Cancelar</button>
          <button onClick={guardar} className="flex-1 text-white py-3 rounded-xl font-bold transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg, #166534, #15803d)' }}>
            {editando ? '✓ Actualizar' : '+ Registrar'}
          </button>
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
  const [modalForm, setModalForm] = useState(false)
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null)
  const [modalCompletar, setModalCompletar] = useState(null)
  const [modalHistorial, setModalHistorial] = useState(null)
  const [historial, setHistorial] = useState({ citas: [], procedimientos: [], pap: [], flujos: [], pagos: [] })
  const [cargandoHistorial, setCargandoHistorial] = useState(false)
  const [modalEliminar, setModalEliminar] = useState(null)
  const [resumenEliminar, setResumenEliminar] = useState(null)
  const [modalNombreDuplicado, setModalNombreDuplicado] = useState(null)
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
    if (name === 'rut') setForm({ ...form, rut: formatearRut(value) })
    else setForm({ ...form, [name]: value })
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
      try {
        await axios.post(API, form)
        await registrarLog('crear', 'paciente', null, `${form.nombre} ${form.apellido}`)
      } catch (err) {
        if (err.response?.data?.error === 'rut_duplicado') {
          const p = err.response.data.paciente
          setToast({ mensaje: `⚠️ Ya existe una paciente con ese RUT: ${p.nombre} ${p.apellido}`, tipo: 'error' })
          return
        }
        if (err.response?.data?.error === 'nombre_duplicado') {
          setModalNombreDuplicado(err.response.data.pacientes)
          return
        }
        setToast({ mensaje: 'Error al registrar paciente', tipo: 'error' })
        return
      }
    }
    setForm({ nombre: '', apellido: '', rut: '', fecha_nacimiento: '', telefono: '', email: '' })
    setErrores({})
    setModalForm(false)
    setEditando(null)
    cargar()
  }

  const abrirEditar = p => {
    setForm({ nombre: p.nombre, apellido: p.apellido, rut: p.rut || '', fecha_nacimiento: p.fecha_nacimiento?.slice(0,10) || '', telefono: p.telefono || '', email: p.email || '' })
    setEditando(p.id)
    setErrores({})
    setModalForm(true)
  }

  const cerrarModal = () => {
    setModalForm(false)
    setEditando(null)
    setForm({ nombre: '', apellido: '', rut: '', fecha_nacimiento: '', telefono: '', email: '' })
    setErrores({})
  }

  const eliminar = async id => {
    const paciente = pacientes.find(p => p.id === id)
    const res = await axios.get(`${API}/${id}/resumen`)
    setResumenEliminar(res.data)
    setModalEliminar(paciente)
  }

  const confirmarEliminar = async () => {
    const paciente = modalEliminar
    setModalEliminar(null)
    setResumenEliminar(null)
    try {
      await axios.delete(`${API}/${paciente.id}`)
      await registrarLog('eliminar', 'paciente', paciente.id, `${paciente.nombre} ${paciente.apellido}`)
      cargar()
      setToast({ mensaje: 'Paciente y todos sus registros eliminados', tipo: 'exito' })
    } catch (err) {
      setToast({ mensaje: 'Error al eliminar el paciente', tipo: 'error' })
    }
  }

  const necesitaCompletar = p => !p.rut || !p.fecha_nacimiento || !p.telefono

  const filtrados = pacientes.filter(p => {
    const q = busqueda.toLowerCase()
    const nombreCompleto = `${p.nombre} ${p.apellido}`.toLowerCase()
    const nombreInverso = `${p.apellido} ${p.nombre}`.toLowerCase()
    return (
      nombreCompleto.includes(q) || nombreInverso.includes(q) ||
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

  const detalleEliminar = resumenEliminar ? [
    resumenEliminar.citas > 0 && `${resumenEliminar.citas} cita(s)`,
    resumenEliminar.fichas > 0 && `${resumenEliminar.fichas} ficha(s) clínica(s)`,
    resumenEliminar.pagos > 0 && `${resumenEliminar.pagos} pago(s)`,
    resumenEliminar.procedimientos > 0 && `${resumenEliminar.procedimientos} procedimiento(s)`,
    resumenEliminar.pap > 0 && `${resumenEliminar.pap} PAP`,
    resumenEliminar.flujos > 0 && `${resumenEliminar.flujos} flujo(s)`,
  ].filter(Boolean) : []

  return (
    <div className="min-h-screen bg-white">
      {modalForm && <ModalPaciente editando={editando} form={form} errores={errores} handleChange={handleChange} guardar={guardar} onCerrar={cerrarModal} />}
      {modalCompletar && <ModalCompletarPaciente paciente={modalCompletar} onConfirmar={() => { setModalCompletar(null); cargar() }} onCerrar={() => setModalCompletar(null)} />}
      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onCerrar={() => setToast(null)} />}
      {modalEliminar && resumenEliminar && (
        <ModalConfirmar titulo={`¿Eliminar a ${modalEliminar.nombre} ${modalEliminar.apellido}?`} mensaje="Esta acción no se puede deshacer." detalle={detalleEliminar} textoConfirmar="Eliminar todo" onConfirmar={confirmarEliminar} onCancelar={() => { setModalEliminar(null); setResumenEliminar(null) }} />
      )}

      {modalNombreDuplicado && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4" onClick={() => setModalNombreDuplicado(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center text-2xl">⚠️</div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Posible duplicado</h3>
                <p className="text-sm text-gray-400">Ya existe una paciente con ese nombre</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 mb-5">
              {modalNombreDuplicado.map((p, i) => (
                <div key={i} className="p-3 bg-yellow-50 rounded-xl border border-yellow-100 text-sm">
                  <p className="font-semibold text-gray-800">{p.nombre} {p.apellido}</p>
                  <p className="text-xs text-gray-400">{p.rut || 'Sin RUT'}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 mb-5">¿Deseas registrarla de todas formas?</p>
            <div className="flex gap-3">
              <button onClick={async () => {
                setModalNombreDuplicado(null)
                await axios.post(`${API}?forzar=true`, form)
                await registrarLog('crear', 'paciente', null, `${form.nombre} ${form.apellido}`)
                setForm({ nombre: '', apellido: '', rut: '', fecha_nacimiento: '', telefono: '', email: '' })
                setErrores({})
                setModalForm(false)
                cargar()
              }} className="flex-1 bg-yellow-500 text-white py-3 rounded-xl hover:bg-yellow-600 font-semibold">Sí, registrar igual</button>
              <button onClick={() => setModalNombreDuplicado(null)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 font-medium">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {modalHistorial && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4" onClick={() => setModalHistorial(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 flex items-center justify-between shrink-0" style={{ background: 'linear-gradient(135deg, #052e16, #166534)' }}>
              <div>
                <h3 className="text-lg font-bold text-white">{modalHistorial.nombre} {modalHistorial.apellido}</h3>
                <p className="text-green-300 text-xs">{modalHistorial.rut || 'Sin RUT'} {modalHistorial.telefono ? `· ${modalHistorial.telefono}` : ''}</p>
              </div>
              <button onClick={() => setModalHistorial(null)} className="text-white hover:text-green-200 text-2xl">✕</button>
            </div>
            <div className="overflow-y-auto p-6 flex flex-col gap-5">
              {cargandoHistorial ? (
                <div className="text-center py-12">
                  <div className="w-10 h-10 border-4 border-green-200 border-t-green-700 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">Cargando historial...</p>
                </div>
              ) : (
                [
                  { label: '📅 Citas', items: historial.citas, render: c => (<><span className="text-gray-700">{c.fecha_hora?.slice(0,16).replace('T',' ')}</span><span className="text-gray-400 text-xs">{c.profesional_nombre}</span><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.estado === 'realizada' ? 'bg-green-100 text-green-700' : c.estado === 'cancelada' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-700'}`}>{c.estado}</span></>) },
                  { label: '🔬 Procedimientos', items: historial.procedimientos, render: p => (<><span className="text-gray-700">{p.nombre}</span><span className="text-gray-400 text-xs">${Number(p.monto).toLocaleString('es-CL')}</span><span className="text-xs text-gray-400">{p.fecha?.slice(0,10)}</span></>) },
                  { label: '🧪 PAP', items: historial.pap, render: p => (<><span className="text-gray-700">{p.nombre}</span><span className="text-xs text-gray-400">{p.fecha_toma?.slice(0,10)}</span><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.estado_envio === 'enviado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{p.estado_envio}</span></>) },
                  { label: '🔬 Flujos', items: historial.flujos, render: f => (<><span className="text-gray-700">{f.nombre}</span><span className="text-xs text-gray-400">{f.fecha_toma?.slice(0,10)}</span><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${f.entregado ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{f.entregado ? 'Entregado' : 'Pendiente'}</span></>) },
                  { label: '💰 Pagos', items: historial.pagos, render: pg => (<><span className="text-gray-700 font-semibold">${Number(pg.monto).toLocaleString('es-CL')}</span><span className="text-xs text-gray-400">{pg.metodo}</span><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pg.estado === 'pagado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{pg.estado}</span></>) },
                ].map(({ label, items, render }) => (
                  <div key={label}>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{items.length}</span>
                    </div>
                    {items.length === 0 ? (
                      <p className="text-sm text-gray-300 pl-1">Sin registros</p>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {items.map((item, i) => (
                          <div key={i} className="flex justify-between items-center text-sm p-2.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                            {render(item)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl mb-8 p-6 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #052e16 0%, #166534 60%, #15803d 100%)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #86efac, transparent)', transform: 'translate(30%, -30%)' }} />
        <div className="relative z-10">
          <p className="text-green-300 text-xs font-semibold uppercase tracking-widest mb-1">Gestión</p>
          <h2 className="text-3xl font-black text-white">Pacientes</h2>
          <p className="text-green-200 text-sm mt-1">{pacientes.length} paciente{pacientes.length !== 1 ? 's' : ''} registrada{pacientes.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { cerrarModal(); setModalForm(true) }} className="relative z-10 flex items-center gap-2 text-sm font-bold px-5 py-3 rounded-2xl transition-all hover:scale-105 hover:shadow-lg shrink-0" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.25)' }}>
          <span className="text-lg">+</span> Nueva paciente
        </button>
      </div>

      {/* Buscador */}
      <div className="mb-6 relative">
        <span className="absolute left-4 top-3.5 text-gray-400">🔍</span>
        <input
          className="w-full border border-gray-200 rounded-2xl px-4 py-3 pl-11 focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm hover:border-gray-300 transition-colors"
          placeholder="Buscar por nombre, RUT, teléfono o email..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)}
        />
        {busqueda && <button onClick={() => setBusqueda('')} className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600">✕</button>}
      </div>
      {busqueda && <p className="text-sm text-gray-400 mb-4 pl-1">{filtrados.length} resultado{filtrados.length !== 1 ? 's' : ''}</p>}

      {/* Tabla desktop */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}>
              {['Paciente', 'RUT','Fecha Nac.', 'Teléfono', 'Email', 'Estado', 'Próx. control', 'Acciones'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-green-800 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtrados.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0" style={{ background: 'linear-gradient(135deg, #166534, #15803d)' }}>
                      {p.nombre?.charAt(0)}{p.apellido?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{p.nombre} {p.apellido}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600 text-sm">{p.rut || <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Pendiente</span>}</td>
                <td className="px-4 py-3 text-gray-600 text-sm">{p.fecha_nacimiento ? new Date(p.fecha_nacimiento).toLocaleDateString('es-CL') : <span className="text-gray-300">—</span>}</td>
                <td className="px-4 py-3 text-gray-600 text-sm">{p.telefono || <span className="text-gray-300">—</span>}</td>
                <td className="px-4 py-3 text-gray-600 text-sm">{p.email || <span className="text-gray-300">—</span>}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    {necesitaCompletar(p)
                      ? <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium w-fit">Incompleto</span>
                      : <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium w-fit">Completo</span>
                    }
                    {deudores.includes(p.id) && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium w-fit">💰 Deuda</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {p.proximo_control ? (
                    <div>
                      <p className="text-xs font-bold text-teal-700">{formatFecha(p.proximo_control)}</p>
                      <p className="text-xs text-teal-400">{p.tipo_control}</p>
                    </div>
                  ) : <span className="text-gray-200 text-sm">—</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {rol !== 'secretaria' && (
                      <button onClick={() => setPacienteSeleccionado(p)} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">Fichas</button>
                    )}
                    <button onClick={() => verHistorial(p)} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors">Historial</button>
                    {necesitaCompletar(p) && <button onClick={() => setModalCompletar(p)} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition-colors">Completar</button>}
                    <button onClick={() => abrirEditar(p)} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">Editar</button>
                    <button onClick={() => eliminar(p.id)} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr><td colSpan="7" className="px-4 py-12 text-center">
                <p className="text-4xl mb-2">🔍</p>
                <p className="text-gray-400 text-sm">{busqueda ? 'No se encontraron resultados' : 'No hay pacientes registradas'}</p>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Tarjetas móvil */}
      <div className="md:hidden flex flex-col gap-3">
        {filtrados.map(p => (
          <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0" style={{ background: 'linear-gradient(135deg, #166534, #15803d)' }}>
                {p.nombre?.charAt(0)}{p.apellido?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800">{p.nombre} {p.apellido}</p>
                <p className="text-sm text-gray-400">{p.rut || 'Sin RUT'}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {necesitaCompletar(p) && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">Incompleto</span>}
                  {deudores.includes(p.id) && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">💰 Deuda</span>}
                </div>
              </div>
            </div>
            {p.telefono && <p className="text-sm text-gray-500 mb-1">📞 {p.telefono}</p>}
            {p.proximo_control && (
              <div className="inline-flex items-center gap-1.5 bg-teal-50 border border-teal-100 text-teal-700 px-3 py-1 rounded-full text-xs font-semibold mb-3">
                📅 {formatFecha(p.proximo_control)} · {p.tipo_control}
              </div>
            )}
            <div className="flex gap-2 flex-wrap pt-2 border-t border-gray-50">
              {rol !== 'secretaria' && <button onClick={() => setPacienteSeleccionado(p)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700">Fichas</button>}
              <button onClick={() => verHistorial(p)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700">Historial</button>
              {necesitaCompletar(p) && <button onClick={() => setModalCompletar(p)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-yellow-50 text-yellow-700">Completar</button>}
              <button onClick={() => abrirEditar(p)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600">Editar</button>
              <button onClick={() => eliminar(p.id)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-600">Eliminar</button>
            </div>
          </div>
        ))}
        {filtrados.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
            <p className="text-4xl mb-2">🔍</p>
            <p className="text-gray-400 text-sm">{busqueda ? 'No se encontraron resultados' : 'No hay pacientes registradas'}</p>
          </div>
        )}
      </div>
    </div>
  )
}