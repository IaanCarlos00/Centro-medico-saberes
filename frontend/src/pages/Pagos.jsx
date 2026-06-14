import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { registrarLog } from '../utils/log'
import ListaConVerMas from '../components/ListaConVerMas'

const API = 'https://centro-medico-saberes-production.up.railway.app/pagos'
const API_PAC = 'https://centro-medico-saberes-production.up.railway.app/pacientes'
const API_PROC = 'https://centro-medico-saberes-production.up.railway.app/procedimientos'
const API_PRO = 'https://centro-medico-saberes-production.up.railway.app/profesionales'

const metodoBadge = {
  fonasa: 'bg-teal-100 text-teal-700',
  efectivo: 'bg-green-100 text-green-700',
  transferencia: 'bg-blue-100 text-blue-700',
  debito: 'bg-purple-100 text-purple-700',
  credito: 'bg-orange-100 text-orange-700',
}

const estadoBadge = {
  pagado: 'bg-green-100 text-green-700',
  pendiente: 'bg-yellow-100 text-yellow-700',
  condonado: 'bg-gray-100 text-gray-600',
}

const metodoIcono = {
  fonasa: '🏥', efectivo: '💵', transferencia: '🏦', debito: '💳', credito: '💳',
}

function formatCLP(n) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n)
}

function formatFecha(f) {
  if (!f) return '—'
  return new Date(String(f).slice(0, 10) + 'T12:00:00').toLocaleDateString('es-CL')
}

const formInicial = {
  paciente_id: '', monto: '', metodo: 'debito', estado: 'pendiente',
  notas: '', numero_bono: '', estado_bono: 'pendiente', estado_boleta: 'pendiente',
  procedimiento_nombre: '', profesional_id: '', fecha: ''
}

export default function Pagos() {
  const [pagos, setPagos] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [resumen, setResumen] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroMetodo, setFiltroMetodo] = useState('')
  const [filtroPeriodo, setFiltroPeriodo] = useState('mes')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [filtroProcedimiento, setFiltroProcedimiento] = useState('')
  const [vistaPagos, setVistaPagos] = useState('cronologica')
  const [expandidoPaciente, setExpandidoPaciente] = useState(null)
  const [filtroBonosProfesional, setFiltroBonosProfesional] = useState('')
  const [fechaDia, setFechaDia] = useState(new Date().toISOString().slice(0, 10))
  const [modalForm, setModalForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(formInicial)
  const [errores, setErrores] = useState({})
  const [busquedaPaciente, setBusquedaPaciente] = useState('')
  const [mostrarDropdown, setMostrarDropdown] = useState(false)
  const dropdownRef = useRef(null)
  const [catalogo, setCatalogo] = useState([])
  const [profesionales, setProfesionales] = useState([])

  const cargar = async () => {
    const [p, pa, r, cat, pro] = await Promise.all([
      axios.get(API), axios.get(API_PAC), axios.get(`${API}/resumen`),
      axios.get(`${API_PROC}/catalogo`), axios.get(API_PRO)
    ])
    setPagos(p.data)
    setPacientes(pa.data)
    setResumen(r.data)
    setCatalogo(cat.data)
    setProfesionales(pro.data)
  }

  useEffect(() => { cargar() }, [])

  useEffect(() => {
    const handleClick = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setMostrarDropdown(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const pacientesFiltrados = pacientes.filter(p => {
    const q = busquedaPaciente.toLowerCase()
    return p.nombre.toLowerCase().includes(q) || p.apellido.toLowerCase().includes(q) || (p.rut && p.rut.toLowerCase().includes(q))
  }).slice(0, 8)

  const seleccionarPaciente = p => {
    setBusquedaPaciente(`${p.nombre} ${p.apellido}${p.rut ? ' — ' + p.rut : ''}`)
    setForm(f => ({ ...f, paciente_id: p.id }))
    setMostrarDropdown(false)
    setErrores(e => ({ ...e, paciente_id: '' }))
  }

  const handleChange = e => {
    const { name, value } = e.target
    if (name === 'procedimiento_nombre') {
      const proc = catalogo.find(c => c.nombre === value)
      setForm({ ...form, procedimiento_nombre: value, monto: proc ? proc.monto : form.monto })
    } else {
      setForm({ ...form, [name]: value })
    }
    setErrores({ ...errores, [name]: '' })
  }

  const validar = () => {
    const e = {}
    if (!form.paciente_id) e.paciente_id = 'Selecciona un paciente'
    if (!form.monto || isNaN(form.monto) || Number(form.monto) <= 0) e.monto = 'Ingresa un monto válido'
    if (!form.profesional_id) e.profesional_id = 'Selecciona una matrona'
    return e
  }

  const guardar = async () => {
    const e = validar()
    if (Object.keys(e).length > 0) { setErrores(e); return }
    if (editando) {
      await axios.put(`${API}/${editando}`, form)
      await registrarLog('editar', 'pago', editando, `Pago de ${busquedaPaciente}`)
    } else {
      await axios.post(API, form)
      await registrarLog('crear', 'pago', null, `Pago de ${busquedaPaciente}`)
    }
    setForm(formInicial)
    setBusquedaPaciente('')
    setErrores({})
    setModalForm(false)
    setEditando(null)
    cargar()
  }

  const abrirEditar = p => {
    setForm({
      paciente_id: p.paciente_id, monto: p.monto, metodo: p.metodo, estado: p.estado,
      notas: p.notas || '', numero_bono: p.numero_bono || '', estado_bono: p.estado_bono || 'pendiente',
      estado_boleta: p.estado_boleta || 'pendiente', procedimiento_nombre: p.procedimiento_nombre || '',
      profesional_id: p.profesional_id || '', fecha: String(p.fecha_cita || p.fecha || '').slice(0, 10)
    })
    setBusquedaPaciente(`${p.paciente_nombre} ${p.paciente_apellido}`)
    setEditando(p.id)
    setModalForm(true)
  }

  const cerrarModal = () => {
    setEditando(null)
    setForm(formInicial)
    setBusquedaPaciente('')
    setErrores({})
    setModalForm(false)
  }

  const eliminar = async id => {
    if (confirm('¿Eliminar pago?')) {
      await axios.delete(`${API}/${id}`)
      await registrarLog('eliminar', 'pago', id, 'Pago eliminado')
      cargar()
    }
  }

  const toggleBoleta = async p => {
    const nuevo = p.estado_boleta === 'pendiente' ? 'emitida' : 'pendiente'
    await axios.put(`${API}/${p.id}`, { ...p, estado_boleta: nuevo })
    cargar()
  }

  const marcarPagado = async p => {
    await axios.put(`${API}/${p.id}`, { ...p, estado: 'pagado' })
    cargar()
  }

  const fechaOrden = p => p.fecha_cita || p.fecha

  const pendientes = pagos.filter(p => p.estado === 'pendiente').sort((a, b) => new Date(fechaOrden(a)) - new Date(fechaOrden(b)))
  const bonosPendientesTodos = pagos.filter(p => p.metodo === 'fonasa' && p.estado_bono === 'pendiente' && p.numero_bono).sort((a, b) => new Date(fechaOrden(a)) - new Date(fechaOrden(b)))
  const bonosPendientes = bonosPendientesTodos.filter(p => !filtroBonosProfesional || String(p.profesional_id) === String(filtroBonosProfesional))
  const boletasPendientes = pagos.filter(p => (p.metodo === 'efectivo' || p.metodo === 'transferencia') && p.estado_boleta === 'pendiente').sort((a, b) => new Date(fechaOrden(a)) - new Date(fechaOrden(b)))

  const filtrados = pagos.filter(p => {
    const q = busqueda.toLowerCase()
    const coincideBusqueda = !busqueda ||
      `${p.paciente_nombre} ${p.paciente_apellido}`.toLowerCase().includes(q) ||
      (p.paciente_rut && p.paciente_rut.toLowerCase().includes(q)) ||
      (p.notas && p.notas.toLowerCase().includes(q))
    const coincideEstado = !filtroEstado || p.estado === filtroEstado
    const coincideMetodo = !filtroMetodo || p.metodo === filtroMetodo
    const fecha = new Date(String(p.fecha_cita || p.fecha).slice(0, 10) + 'T12:00:00')
    const hoy = new Date()
    let coincidePeriodo = true
    if (filtroPeriodo === 'hoy') coincidePeriodo = fecha.toDateString() === hoy.toDateString()
    else if (filtroPeriodo === 'semana') {
      const lunes = new Date(hoy); lunes.setDate(hoy.getDate() - hoy.getDay() + 1); lunes.setHours(0,0,0,0)
      coincidePeriodo = fecha >= lunes
    } else if (filtroPeriodo === 'mes') coincidePeriodo = fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear()
    else if (filtroPeriodo === 'personalizado') {
      if (fechaDesde) coincidePeriodo = coincidePeriodo && fecha >= new Date(fechaDesde + 'T00:00:00')
      if (fechaHasta) coincidePeriodo = coincidePeriodo && fecha <= new Date(fechaHasta + 'T23:59:59')
    }
    const coincideProcedimiento = !filtroProcedimiento || (p.notas || '').toLowerCase().includes(filtroProcedimiento.toLowerCase())
    return coincideBusqueda && coincideEstado && coincideMetodo && coincidePeriodo && coincideProcedimiento
  }).sort((a, b) => new Date(fechaOrden(b)) - new Date(fechaOrden(a)))

  const pagosAgrupadosPorPaciente = filtrados.reduce((acc, p) => {
    const key = p.paciente_id
    if (!acc[key]) acc[key] = { paciente_id: p.paciente_id, paciente_nombre: p.paciente_nombre, paciente_apellido: p.paciente_apellido, paciente_rut: p.paciente_rut, pagos: [], total: 0, pendiente: 0 }
    acc[key].pagos.push(p)
    acc[key].total += parseFloat(p.monto)
    if (p.estado === 'pendiente') acc[key].pendiente += parseFloat(p.monto)
    return acc
  }, {})

  const gruposPaciente = Object.values(pagosAgrupadosPorPaciente).sort((a, b) => new Date(fechaOrden(b.pagos[0])) - new Date(fechaOrden(a.pagos[0])))

  return (
    <div className="min-h-screen bg-white">

      {/* Modal */}
      {modalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4" onClick={cerrarModal}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #052e16, #166534)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: 'rgba(255,255,255,0.15)' }}>
                  {editando ? '✏️' : '💰'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{editando ? 'Editar pago' : 'Registrar pago'}</h3>
                  <p className="text-green-300 text-xs">{editando ? 'Modifica los datos del pago' : 'Registra un nuevo pago'}</p>
                </div>
              </div>
              <button onClick={cerrarModal} className="text-white hover:text-green-200 text-2xl leading-none">✕</button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col relative sm:col-span-2" ref={dropdownRef}>
                  <label className="text-sm font-semibold text-gray-700 mb-1">Paciente *</label>
                  <input className={`border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.paciente_id ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`} placeholder="Buscar por nombre, apellido o RUT..." value={busquedaPaciente} onChange={e => { setBusquedaPaciente(e.target.value); setMostrarDropdown(true); setForm(f => ({ ...f, paciente_id: '' })); setErrores(er => ({ ...er, paciente_id: '' })) }} onFocus={() => setMostrarDropdown(true)} />
                  {errores.paciente_id && <span className="text-red-500 text-xs mt-1">{errores.paciente_id}</span>}
                  {mostrarDropdown && busquedaPaciente.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto mt-1">
                      {pacientesFiltrados.length === 0
                        ? <p className="px-3 py-2 text-sm text-gray-400">No se encontraron pacientes</p>
                        : pacientesFiltrados.map(p => (
                          <button key={p.id} className="w-full text-left px-3 py-2 hover:bg-green-50 text-sm border-b border-gray-100 last:border-0" onClick={() => seleccionarPaciente(p)}>
                            <span className="font-semibold text-gray-800">{p.nombre} {p.apellido}</span>
                            {p.rut && <span className="text-gray-400 ml-2 text-xs">{p.rut}</span>}
                          </button>
                        ))
                      }
                    </div>
                  )}
                </div>

                {[
                  { label: 'Monto ($) *', name: 'monto', type: 'number', placeholder: '25000', error: errores.monto },
                ].map(f => (
                  <div key={f.name} className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-700">{f.label}</label>
                    <input type={f.type} className={`border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 ${f.error ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`} name={f.name} placeholder={f.placeholder} value={form[f.name]} onChange={handleChange} />
                    {f.error && <span className="text-red-500 text-xs">{f.error}</span>}
                  </div>
                ))}

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">Método de pago</label>
                  <select className="border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" name="metodo" value={form.metodo} onChange={handleChange}>
                    <option value="debito">💳 Débito</option>
                    <option value="efectivo">💵 Efectivo</option>
                    <option value="transferencia">🏦 Transferencia</option>
                    <option value="fonasa">🏥 Fonasa</option>
                    <option value="credito">💳 Crédito</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">Estado</label>
                  <select className="border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" name="estado" value={form.estado} onChange={handleChange}>
                    <option value="pagado">Pagado</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="condonado">Condonado</option>
                  </select>
                </div>

                {form.metodo === 'fonasa' && (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-gray-700">Número de bono</label>
                      <input className="border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" name="numero_bono" placeholder="Ej: 123456789" value={form.numero_bono || ''} onChange={handleChange} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-gray-700">Estado del bono</label>
                      <select className="border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" name="estado_bono" value={form.estado_bono || 'pendiente'} onChange={handleChange}>
                        <option value="pendiente">⏳ Pendiente</option>
                        <option value="verificado">✅ Verificado</option>
                        <option value="rechazado">❌ Rechazado</option>
                      </select>
                    </div>
                  </>
                )}

                {(form.metodo === 'efectivo' || form.metodo === 'transferencia') && (
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-700">Estado boleta</label>
                    <select className="border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" name="estado_boleta" value={form.estado_boleta || 'pendiente'} onChange={handleChange}>
                      <option value="pendiente">⏳ Pendiente emisión</option>
                      <option value="emitida">✅ Emitida</option>
                    </select>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">Procedimiento <span className="text-gray-400 font-normal text-xs">(opcional)</span></label>
                  <select className="border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" name="procedimiento_nombre" value={form.procedimiento_nombre} onChange={handleChange}>
                    <option value="">Sin procedimiento</option>
                    {catalogo.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">Matrona *</label>
                  <select className={`border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.profesional_id ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`} name="profesional_id" value={form.profesional_id} onChange={handleChange}>
                    <option value="">Seleccionar matrona</option>
                    {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
                  </select>
                  {errores.profesional_id && <span className="text-red-500 text-xs">{errores.profesional_id}</span>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">Fecha del pago</label>
                  <input type="date" className="border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" name="fecha" value={form.fecha || ''} onChange={handleChange} />
                </div>

                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">Notas <span className="text-gray-400 font-normal text-xs">(opcional)</span></label>
                  <input className="border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" name="notas" placeholder="Ej: Control mensual..." value={form.notas} onChange={handleChange} />
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={cerrarModal} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 font-medium transition-colors">Cancelar</button>
              <button onClick={guardar} className="flex-1 text-white py-3 rounded-xl font-bold transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg, #166534, #15803d)' }}>
                {editando ? '✓ Actualizar' : '+ Registrar pago'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl mb-8 p-6 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #052e16 0%, #166534 60%, #15803d 100%)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #86efac, transparent)', transform: 'translate(30%, -30%)' }} />
        <div className="relative z-10">
          <p className="text-green-300 text-xs font-semibold uppercase tracking-widest mb-1">Finanzas</p>
          <h2 className="text-3xl font-black text-white">Pagos</h2>
          <p className="text-green-200 text-sm mt-1">{pagos.length} registro{pagos.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { cerrarModal(); setModalForm(true) }} className="relative z-10 flex items-center gap-2 text-sm font-bold px-5 py-3 rounded-2xl transition-all hover:scale-105 shrink-0" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.25)' }}>
          <span className="text-lg">+</span> Registrar pago
        </button>
      </div>

      {/* Stats cards */}
      {resumen && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Recaudado hoy', value: formatCLP(resumen.totalDia), gradient: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '#16a34a', text: '#166534', icon: '📅' },
            { label: 'Recaudado este mes', value: formatCLP(resumen.totalMes), gradient: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '#3b82f6', text: '#1d4ed8', icon: '📈' },
            { label: 'Pagos pendientes', value: resumen.pendientes.cantidad, sub: formatCLP(resumen.pendientes.monto), gradient: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '#f59e0b', text: '#b45309', icon: '⚠️' },
          ].map((card, i) => (
            <div key={i} className="rounded-2xl p-5 hover:shadow-md transition-shadow" style={{ background: card.gradient, border: `1px solid ${card.border}22` }}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: `${card.border}22` }}>{card.icon}</div>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: card.text }}>{card.label}</span>
              </div>
              <p className="text-2xl font-black" style={{ color: card.text }}>{card.value}</p>
              {card.sub && <p className="text-xs mt-1" style={{ color: card.text }}>{card.sub}</p>}
            </div>
          ))}
          <div className="rounded-2xl p-5 hover:shadow-md transition-shadow" style={{ background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', border: '1px solid #8b5cf622' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: '#8b5cf622' }}>💳</div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-700">Por método</span>
            </div>
            <div className="flex flex-col gap-1">
              {resumen.porMetodo.map(m => (
                <div key={m.metodo} className="flex justify-between text-xs">
                  <span className="text-gray-600 capitalize">{metodoIcono[m.metodo]} {m.metodo}</span>
                  <span className="font-bold text-gray-800">{formatCLP(m.total)}</span>
                </div>
              ))}
              {resumen.porMetodo.length === 0 && <span className="text-xs text-gray-400">Sin pagos este mes</span>}
            </div>
          </div>
        </div>
      )}

      {/* Resumen por día */}
      <div className="rounded-2xl p-6 mb-6 border border-gray-100 shadow-sm" style={{ background: 'linear-gradient(145deg, #ffffff, #f9fafb)' }}>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-base">📆</span>
          Resumen por día
        </h3>
        <div className="flex items-center gap-3 mb-4">
          <input type="date" className="border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 text-sm" value={fechaDia} onChange={e => setFechaDia(e.target.value)} />
          <span className="text-sm text-gray-400">{new Date(fechaDia + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
        {(() => {
          const pagosDia = pagos.filter(p => String(p.fecha_cita || p.fecha).slice(0, 10) === fechaDia)
          const totalDia = pagosDia.filter(p => p.estado === 'pagado').reduce((s, p) => s + parseFloat(p.monto), 0)
          const porMetodo = pagosDia.reduce((acc, p) => { acc[p.metodo] = (acc[p.metodo] || 0) + parseFloat(p.monto); return acc }, {})
          const pacientesUnicos = new Set(pagosDia.map(p => p.paciente_id)).size
          return (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-500 text-sm">{pacientesUnicos} paciente{pacientesUnicos !== 1 ? 's' : ''} · {pagosDia.filter(p => p.estado === 'pagado').length} pagos confirmados</span>
                <span className="text-2xl font-black text-green-800">{formatCLP(totalDia)}</span>
              </div>
              {pagosDia.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(porMetodo).map(([metodo, total]) => (
                    <div key={metodo} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${metodoBadge[metodo]}`}>
                      {metodoIcono[metodo]} {metodo}: {formatCLP(total)}
                    </div>
                  ))}
                </div>
              ) : <p className="text-gray-300 text-sm">Sin pagos registrados este día</p>}
            </div>
          )
        })()}
      </div>

      {/* Alertas */}
      {pendientes.length > 0 && (
        <div className="rounded-2xl p-5 mb-6 border border-yellow-200" style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)' }}>
          <h3 className="text-sm font-bold text-yellow-800 mb-3 flex items-center gap-2">
            <span className="w-7 h-7 bg-yellow-200 rounded-lg flex items-center justify-center text-sm">⚠️</span>
            Pagos pendientes de cobro ({pendientes.length}) — {formatCLP(pendientes.reduce((s, p) => s + parseFloat(p.monto), 0))}
          </h3>
          <ListaConVerMas items={pendientes} limite={5} renderItem={(p, i) => (
            <div key={i} className="flex items-center justify-between bg-white rounded-xl p-3 border border-yellow-100">
              <div>
                <p className="text-sm font-semibold text-gray-800">{p.paciente_nombre} {p.paciente_apellido}</p>
                <p className="text-xs text-gray-400">{metodoIcono[p.metodo]} {p.metodo} · {formatFecha(p.fecha_cita || p.fecha)}</p>
                {p.notas && <p className="text-xs text-gray-400 mt-0.5">{p.notas}</p>}
              </div>
              <div className="flex items-center gap-2 ml-3">
                <span className="font-bold text-gray-800 text-sm">{formatCLP(p.monto)}</span>
                <button onClick={() => marcarPagado(p)} className="text-xs bg-green-100 text-green-700 px-2.5 py-1.5 rounded-lg hover:bg-green-200 font-semibold whitespace-nowrap">✅ Realizada</button>
                <button onClick={() => abrirEditar(p)} className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1.5 rounded-lg hover:bg-blue-100 font-semibold">Editar</button>
              </div>
            </div>
          )} />
        </div>
      )}

      {bonosPendientesTodos.length > 0 && (
        <div className="rounded-2xl p-5 mb-6 border border-teal-200" style={{ background: 'linear-gradient(135deg, #f0fdfa, #ccfbf1)' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-teal-800 flex items-center gap-2">
              <span className="w-7 h-7 bg-teal-200 rounded-lg flex items-center justify-center text-sm">🏥</span>
              Bonos Fonasa por verificar ({bonosPendientes.length})
            </h3>
            <select className="border border-teal-200 rounded-xl px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white" value={filtroBonosProfesional} onChange={e => setFiltroBonosProfesional(e.target.value)}>
              <option value="">Todas las matronas</option>
              {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
            </select>
          </div>
          <ListaConVerMas items={bonosPendientes} limite={5} renderItem={(p, i) => (
            <div key={i} className="flex items-center justify-between bg-white rounded-xl p-3 border border-teal-100">
              <div>
                <p className="text-sm font-semibold text-gray-800">{p.paciente_nombre} {p.paciente_apellido}</p>
                <p className="text-xs text-gray-400">🏥 Bono: {p.numero_bono} · {formatFecha(p.fecha_cita || p.fecha)}</p>
                {p.paciente_rut && <p className="text-xs text-gray-400">🪪 {p.paciente_rut}</p>}
                {p.profesional_nombre && <p className="text-xs text-teal-600">👩‍⚕️ {p.profesional_nombre} {p.profesional_apellido}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={async () => { await axios.put(`${API}/${p.id}`, { ...p, estado_bono: 'verificado' }); cargar() }} className="text-xs bg-green-100 text-green-700 px-2.5 py-1.5 rounded-lg hover:bg-green-200 font-semibold">✅ Verificado</button>
                <button onClick={async () => { await axios.put(`${API}/${p.id}`, { ...p, estado_bono: 'rechazado' }); cargar() }} className="text-xs bg-red-100 text-red-600 px-2.5 py-1.5 rounded-lg hover:bg-red-200 font-semibold">❌ Rechazado</button>
              </div>
            </div>
          )} />
        </div>
      )}

      {boletasPendientes.length > 0 && (
        <div className="rounded-2xl p-5 mb-6 border border-blue-200" style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)' }}>
          <h3 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
            <span className="w-7 h-7 bg-blue-200 rounded-lg flex items-center justify-center text-sm">🧾</span>
            Boletas pendientes ({boletasPendientes.length})
          </h3>
          <ListaConVerMas items={boletasPendientes} limite={5} renderItem={(p, i) => (
            <div key={i} className="flex items-center justify-between bg-white rounded-xl p-3 border border-blue-100">
              <div>
                <p className="text-sm font-semibold text-gray-800">{p.paciente_nombre} {p.paciente_apellido}</p>
                <p className="text-xs text-gray-400">{metodoIcono[p.metodo]} {p.metodo} · {formatCLP(p.monto)} · {formatFecha(p.fecha_cita || p.fecha)}</p>
              </div>
              <button onClick={() => toggleBoleta(p)} className="text-xs bg-green-100 text-green-700 px-2.5 py-1.5 rounded-lg hover:bg-green-200 font-semibold">✅ Emitida</button>
            </div>
          )} />
        </div>
      )}

      {/* Selector de vista */}
      <div className="flex gap-2 mb-5">
        {[
          { key: 'cronologica', label: '📅 Cronológica' },
          { key: 'paciente', label: '👤 Por paciente' },
        ].map(v => (
          <button key={v.key} onClick={() => setVistaPagos(v.key)} className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${vistaPagos === v.key ? 'text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'}`} style={vistaPagos === v.key ? { background: 'linear-gradient(135deg, #166534, #15803d)' } : {}}>
            {v.label}
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pl-10 focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm" placeholder="Buscar por paciente, RUT o notas..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          <span className="absolute left-3 top-3 text-gray-400">🔍</span>
          {busqueda && <button onClick={() => setBusqueda('')} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">✕</button>}
        </div>
        {[
          { value: filtroPeriodo, onChange: e => setFiltroPeriodo(e.target.value), options: [['hoy','Hoy'],['semana','Esta semana'],['mes','Este mes'],['personalizado','Rango'],['todos','Todos']] },
          { value: filtroEstado, onChange: e => setFiltroEstado(e.target.value), options: [['','Todos los estados'],['pagado','Pagado'],['pendiente','Pendiente'],['condonado','Condonado']] },
          { value: filtroMetodo, onChange: e => setFiltroMetodo(e.target.value), options: [['','Todos los métodos'],['efectivo','Efectivo'],['transferencia','Transferencia'],['debito','Débito'],['credito','Crédito'],['fonasa','Fonasa']] },
        ].map((f, i) => (
          <select key={i} className="border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm" value={f.value} onChange={f.onChange}>
            {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        ))}
        <select className="border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm" value={filtroProcedimiento} onChange={e => setFiltroProcedimiento(e.target.value)}>
          <option value="">Todos los procedimientos</option>
          {catalogo.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
        </select>
      </div>

      {filtroPeriodo === 'personalizado' && (
        <div className="flex gap-2 items-center mb-4">
          <input type="date" className="border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 text-sm" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
          <span className="text-gray-300">→</span>
          <input type="date" className="border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 text-sm" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
        </div>
      )}

      {/* Vista por paciente */}
      {vistaPagos === 'paciente' && (
        <div className="flex flex-col gap-3 mb-6">
          {gruposPaciente.length === 0 && (
            <div className="rounded-2xl border border-gray-100 p-12 text-center bg-white">
              <p className="text-4xl mb-2">💰</p>
              <p className="text-gray-400">No hay pagos registrados</p>
            </div>
          )}
          {gruposPaciente.map(grupo => (
            <div key={grupo.paciente_id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setExpandidoPaciente(expandidoPaciente === grupo.paciente_id ? null : grupo.paciente_id)}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white" style={{ background: 'linear-gradient(135deg, #166534, #15803d)' }}>
                    {grupo.paciente_nombre?.charAt(0)}{grupo.paciente_apellido?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{grupo.paciente_nombre} {grupo.paciente_apellido}</p>
                    <p className="text-xs text-gray-400">{grupo.paciente_rut || 'Sin RUT'} · {grupo.pagos.length} pago{grupo.pagos.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-black text-gray-800">{formatCLP(grupo.total)}</p>
                    {grupo.pendiente > 0 && <p className="text-xs text-yellow-600 font-semibold">⚠️ {formatCLP(grupo.pendiente)} pendiente</p>}
                  </div>
                  <span className="text-gray-300">{expandidoPaciente === grupo.paciente_id ? '▲' : '▼'}</span>
                </div>
              </div>
              {expandidoPaciente === grupo.paciente_id && (
                <div className="border-t border-gray-100">
                  {grupo.pagos.map((p, i) => (
                    <div key={p.id} className={`flex items-center justify-between px-4 py-3 text-sm ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'} ${p.estado === 'pendiente' ? 'border-l-4 border-yellow-400' : ''}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-gray-700 font-semibold">{p.notas || 'Pago'}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${metodoBadge[p.metodo]}`}>{metodoIcono[p.metodo]} {p.metodo}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${estadoBadge[p.estado]}`}>{p.estado}</span>
                        </div>
                        <div className="flex gap-3 mt-0.5 flex-wrap">
                          <span className="text-xs text-gray-400">{formatFecha(p.fecha_cita || p.fecha)}</span>
                          {p.profesional_nombre && <span className="text-xs text-teal-600">👩‍⚕️ {p.profesional_nombre} {p.profesional_apellido}</span>}
                          {p.numero_bono && <span className="text-xs text-blue-600">🏥 {p.numero_bono}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-3 shrink-0">
                        <span className="font-black text-gray-800">{formatCLP(p.monto)}</span>
                        <div className="flex gap-1">
                          {p.estado === 'pendiente' && <button onClick={() => marcarPagado(p)} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-lg hover:bg-green-100 font-semibold">✅</button>}
                          <button onClick={() => abrirEditar(p)} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg hover:bg-blue-100 font-semibold">Editar</button>
                          <button onClick={() => eliminar(p.id)} className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-lg hover:bg-red-100 font-semibold">Eliminar</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between items-center px-4 py-3 border-t border-green-100" style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}>
                    <span className="text-sm font-bold text-green-800">Total {grupo.paciente_nombre}</span>
                    <span className="text-lg font-black text-green-800">{formatCLP(grupo.total)}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Vista cronológica */}
      {vistaPagos === 'cronologica' && (
        <>
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}>
                  {['Paciente', 'Fecha', 'Procedimiento', 'Matrona', 'Monto', 'Método', 'Estado', 'Extra', 'Acciones'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-green-800 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtrados.map(p => (
                  <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${p.estado === 'pendiente' ? 'bg-yellow-50' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800">{p.paciente_nombre} {p.paciente_apellido}</p>
                      {p.paciente_rut && <p className="text-xs text-gray-400">{p.paciente_rut}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {formatFecha(p.fecha_cita || p.fecha)}
                      {p.fecha_cita && <p className="text-teal-500">fecha cita</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{p.notas || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{p.profesional_nombre ? `${p.profesional_nombre} ${p.profesional_apellido}` : '—'}</td>
                    <td className="px-4 py-3 font-black text-gray-800">{formatCLP(p.monto)}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${metodoBadge[p.metodo]}`}>{metodoIcono[p.metodo]} {p.metodo}</span></td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-bold ${estadoBadge[p.estado]}`}>{p.estado}</span></td>
                    <td className="px-4 py-3 text-xs">
                      {p.numero_bono && <p className="text-blue-600 mb-1">🏥 {p.numero_bono} <span className={`px-1 rounded ${p.estado_bono === 'verificado' ? 'bg-green-100 text-green-700' : p.estado_bono === 'rechazado' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>{p.estado_bono}</span></p>}
                      {(p.metodo === 'efectivo' || p.metodo === 'transferencia') && (
                        <button onClick={() => toggleBoleta(p)} className={`px-2 py-0.5 rounded-full text-xs font-semibold cursor-pointer ${p.estado_boleta === 'emitida' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {p.estado_boleta === 'emitida' ? '✅ Emitida' : '🧾 Pendiente'}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {p.estado === 'pendiente' && <button onClick={() => marcarPagado(p)} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-lg hover:bg-green-100 font-semibold">✅</button>}
                        <button onClick={() => abrirEditar(p)} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg hover:bg-blue-100 font-semibold">Editar</button>
                        <button onClick={() => eliminar(p.id)} className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-lg hover:bg-red-100 font-semibold">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtrados.length === 0 && (
                  <tr><td colSpan="9" className="px-4 py-12 text-center">
                    <p className="text-4xl mb-2">💰</p>
                    <p className="text-gray-400 text-sm">{busqueda || filtroEstado || filtroMetodo ? 'No se encontraron resultados' : 'No hay pagos registrados'}</p>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden flex flex-col gap-3">
            {filtrados.map(p => (
              <div key={p.id} className={`rounded-2xl shadow-sm border p-4 ${p.estado === 'pendiente' ? 'border-yellow-200 bg-yellow-50' : 'border-gray-100 bg-white'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-gray-800">{p.paciente_nombre} {p.paciente_apellido}</p>
                    <p className="text-xs text-gray-400">{formatFecha(p.fecha_cita || p.fecha)}</p>
                  </div>
                  <p className="font-black text-green-800 text-lg">{formatCLP(p.monto)}</p>
                </div>
                {p.notas && <p className="text-xs text-gray-500 mb-1">{p.notas}</p>}
                {p.profesional_nombre && <p className="text-xs text-teal-600 mb-1">👩‍⚕️ {p.profesional_nombre} {p.profesional_apellido}</p>}
                <div className="flex gap-2 mb-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${metodoBadge[p.metodo]}`}>{metodoIcono[p.metodo]} {p.metodo}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${estadoBadge[p.estado]}`}>{p.estado}</span>
                </div>
                <div className="flex gap-2 pt-2 border-t border-gray-100 flex-wrap">
                  {p.estado === 'pendiente' && <button onClick={() => marcarPagado(p)} className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg font-semibold">✅ Realizada</button>}
                  <button onClick={() => abrirEditar(p)} className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-semibold">Editar</button>
                  <button onClick={() => eliminar(p.id)} className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg font-semibold">Eliminar</button>
                </div>
              </div>
            ))}
            {filtrados.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                <p className="text-4xl mb-2">💰</p>
                <p className="text-gray-400 text-sm">{busqueda || filtroEstado || filtroMetodo ? 'No se encontraron resultados' : 'No hay pagos registrados'}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}