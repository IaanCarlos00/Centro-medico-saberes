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
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrores({ ...errores, [e.target.name]: '' })
  }

  const validar = () => {
    const e = {}
    if (!form.paciente_id) e.paciente_id = 'Selecciona un paciente'
    if (!form.monto || isNaN(form.monto) || Number(form.monto) <= 0) e.monto = 'Ingresa un monto válido'
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
      paciente_id: p.paciente_id,
      monto: p.monto,
      metodo: p.metodo,
      estado: p.estado,
      notas: p.notas || '',
      numero_bono: p.numero_bono || '',
      estado_bono: p.estado_bono || 'pendiente',
      estado_boleta: p.estado_boleta || 'pendiente',
      procedimiento_nombre: p.procedimiento_nombre || '',
      profesional_id: p.profesional_id || '',
      fecha: String(p.fecha_cita || p.fecha || '').slice(0, 10)
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
  const bonosPendientesTodos = pagos
    .filter(p => p.metodo === 'fonasa' && p.estado_bono === 'pendiente' && p.numero_bono)
    .sort((a, b) => new Date(fechaOrden(a)) - new Date(fechaOrden(b)))

  const bonosPendientes = bonosPendientesTodos
    .filter(p => !filtroBonosProfesional || String(p.profesional_id) === String(filtroBonosProfesional))
  const boletasPendientes = pagos.filter(p => (p.metodo === 'efectivo' || p.metodo === 'transferencia') && p.estado_boleta === 'pendiente').sort((a, b) => new Date(fechaOrden(a)) - new Date(fechaOrden(b)))

  const filtrados = pagos
    .filter(p => {
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
      return coincideBusqueda && coincideEstado && coincideMetodo && coincidePeriodo
    })
    .sort((a, b) => new Date(fechaOrden(b)) - new Date(fechaOrden(a)))

  return (
    <div>
      {/* Modal registrar/editar pago */}
      {modalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4" onClick={cerrarModal}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-green-700 to-green-600 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                  <span className="text-xl">{editando ? '✏️' : '💰'}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{editando ? 'Editar pago' : 'Registrar pago'}</h3>
                  <p className="text-green-200 text-xs">{editando ? 'Modifica los datos del pago' : 'Registra un nuevo pago'}</p>
                </div>
              </div>
              <button onClick={cerrarModal} className="text-white hover:text-green-200 text-2xl leading-none">✕</button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col relative sm:col-span-2" ref={dropdownRef}>
                  <label className="text-sm font-medium text-gray-700 mb-1">Paciente *</label>
                  <input
                    className={`border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.paciente_id ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}
                    placeholder="Buscar por nombre, apellido o RUT..."
                    value={busquedaPaciente}
                    onChange={e => { setBusquedaPaciente(e.target.value); setMostrarDropdown(true); setForm(f => ({ ...f, paciente_id: '' })); setErrores(er => ({ ...er, paciente_id: '' })) }}
                    onFocus={() => setMostrarDropdown(true)}
                  />
                  {errores.paciente_id && <span className="text-red-500 text-xs mt-1">{errores.paciente_id}</span>}
                  {mostrarDropdown && busquedaPaciente.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto mt-1">
                      {pacientesFiltrados.length === 0
                        ? <p className="px-3 py-2 text-sm text-gray-400">No se encontraron pacientes</p>
                        : pacientesFiltrados.map(p => (
                          <button key={p.id} className="w-full text-left px-3 py-2 hover:bg-green-50 text-sm border-b border-gray-100 last:border-0" onClick={() => seleccionarPaciente(p)}>
                            <span className="font-medium text-gray-800">{p.nombre} {p.apellido}</span>
                            {p.rut && <span className="text-gray-400 ml-2 text-xs">{p.rut}</span>}
                          </button>
                        ))
                      }
                    </div>
                  )}
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">Monto ($) *</label>
                  <input className={`border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.monto ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`} name="monto" type="number" placeholder="25000" value={form.monto} onChange={handleChange} />
                  {errores.monto && <span className="text-red-500 text-xs mt-1">{errores.monto}</span>}
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">Método de pago</label>
                  <select className="border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" name="metodo" value={form.metodo} onChange={handleChange}>
                    <option value="debito">💳 Débito</option>
                    <option value="efectivo">💵 Efectivo</option>
                    <option value="transferencia">🏦 Transferencia</option>
                    <option value="fonasa">🏥 Fonasa</option>
                    <option value="credito">💳 Crédito</option>
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select className="border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" name="estado" value={form.estado} onChange={handleChange}>
                    <option value="pagado">Pagado</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="condonado">Condonado</option>
                  </select>
                </div>

                {form.metodo === 'fonasa' && (
                  <>
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">Número de bono</label>
                      <input className="border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" name="numero_bono" placeholder="Ej: 123456789" value={form.numero_bono || ''} onChange={handleChange} />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">Estado del bono</label>
                      <select className="border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" name="estado_bono" value={form.estado_bono || 'pendiente'} onChange={handleChange}>
                        <option value="pendiente">⏳ Pendiente verificación</option>
                        <option value="verificado">✅ Verificado</option>
                        <option value="rechazado">❌ Rechazado</option>
                      </select>
                    </div>
                  </>
                )}

                {(form.metodo === 'efectivo' || form.metodo === 'transferencia') && (
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Estado boleta</label>
                    <select className="border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" name="estado_boleta" value={form.estado_boleta || 'pendiente'} onChange={handleChange}>
                      <option value="pendiente">⏳ Pendiente emisión</option>
                      <option value="emitida">✅ Emitida</option>
                    </select>
                  </div>
                )}

                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">Procedimiento <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <select className="border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" name="procedimiento_nombre" value={form.procedimiento_nombre} onChange={handleChange}>
                    <option value="">Sin procedimiento</option>
                    {catalogo.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">Matrona <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <select className="border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" name="profesional_id" value={form.profesional_id} onChange={handleChange}>
                    <option value="">Sin especificar</option>
                    {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">Fecha del pago</label>
                  <input type="date" className="border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" name="fecha" value={form.fecha || ''} onChange={handleChange} />
                </div>

                <div className="flex flex-col sm:col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1">Notas <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <input className="border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" name="notas" placeholder="Ej: Control mensual, primera consulta..." value={form.notas} onChange={handleChange} />
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button onClick={cerrarModal} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 font-medium transition-colors">Cancelar</button>
              <button onClick={guardar} className="flex-1 bg-green-700 text-white py-3 rounded-xl hover:bg-green-800 font-semibold transition-colors">
                {editando ? '✓ Actualizar' : '+ Registrar pago'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-green-800">Pagos</h2>
        <button
          onClick={() => { cerrarModal(); setModalForm(true) }}
          className="flex items-center gap-2 bg-green-700 text-white px-5 py-2.5 rounded-xl hover:bg-green-800 font-medium transition-colors shadow-sm"
        >
          <span className="text-lg">+</span> Registrar pago
        </button>
      </div>

      {/* Resumen */}
      {resumen && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-green-600">
            <p className="text-xs text-gray-500 mb-1">Recaudado hoy</p>
            <p className="text-2xl font-bold text-gray-800">{formatCLP(resumen.totalDia)}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-blue-500">
            <p className="text-xs text-gray-500 mb-1">Recaudado este mes</p>
            <p className="text-2xl font-bold text-gray-800">{formatCLP(resumen.totalMes)}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-yellow-500">
            <p className="text-xs text-gray-500 mb-1">Pagos pendientes</p>
            <p className="text-2xl font-bold text-gray-800">{resumen.pendientes.cantidad}</p>
            <p className="text-xs text-yellow-600 mt-1">{formatCLP(resumen.pendientes.monto)}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-purple-500">
            <p className="text-xs text-gray-500 mb-2">Por método (mes)</p>
            <div className="flex flex-col gap-1">
              {resumen.porMetodo.map(m => (
                <div key={m.metodo} className="flex justify-between text-xs">
                  <span className="text-gray-600 capitalize">{metodoIcono[m.metodo]} {m.metodo}</span>
                  <span className="font-medium text-gray-800">{formatCLP(m.total)}</span>
                </div>
              ))}
              {resumen.porMetodo.length === 0 && <span className="text-xs text-gray-400">Sin pagos este mes</span>}
            </div>
          </div>
        </div>
      )}

      {/* Resumen por día */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-3">📆 Resumen por día</h3>
        <div className="flex items-center gap-3 mb-4">
          <input type="date" className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 text-sm" value={fechaDia} onChange={e => setFechaDia(e.target.value)} />
          <span className="text-sm text-gray-500">{new Date(fechaDia + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
        {(() => {
          const pagosDia = pagos.filter(p => String(p.fecha_cita || p.fecha).slice(0, 10) === fechaDia)
          const totalDia = pagosDia.filter(p => p.estado === 'pagado').reduce((s, p) => s + parseFloat(p.monto), 0)
          const porMetodo = pagosDia.reduce((acc, p) => { acc[p.metodo] = (acc[p.metodo] || 0) + parseFloat(p.monto); return acc }, {})
          return (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-600 text-sm">{pagosDia.length} paciente{pagosDia.length !== 1 ? 's' : ''} atendida{pagosDia.length !== 1 ? 's' : ''} · {pagosDia.filter(p => p.estado === 'pagado').length} pago{pagosDia.filter(p => p.estado === 'pagado').length !== 1 ? 's' : ''} confirmado{pagosDia.filter(p => p.estado === 'pagado').length !== 1 ? 's' : ''}</span>
                <span className="text-2xl font-bold text-green-800">{formatCLP(totalDia)}</span>
              </div>
              {pagosDia.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(porMetodo).map(([metodo, total]) => (
                    <div key={metodo} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${metodoBadge[metodo]}`}>
                      {metodoIcono[metodo]} {metodo}: {formatCLP(total)}
                    </div>
                  ))}
                </div>
              ) : <p className="text-gray-400 text-sm">Sin pagos registrados este día</p>}
            </div>
          )
        })()}
      </div>

      {/* Pagos pendientes */}
      {pendientes.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-bold text-yellow-800 mb-3">⚠️ Pagos pendientes de cobro ({pendientes.length}) — {formatCLP(pendientes.reduce((s, p) => s + parseFloat(p.monto), 0))}</h3>
          <ListaConVerMas items={pendientes} limite={5} renderItem={(p, i) => (
            <div key={i} className="flex items-center justify-between bg-white rounded-lg p-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">{p.paciente_nombre} {p.paciente_apellido}</p>
                <p className="text-xs text-gray-500">{metodoIcono[p.metodo]} {p.metodo} · {formatFecha(p.fecha_cita || p.fecha)}{p.fecha_cita && <span className="ml-1 text-teal-600">(fecha cita)</span>}</p>
                {p.notas && <p className="text-xs text-gray-400 mt-0.5">{p.notas}</p>}
              </div>
              <div className="flex items-center gap-2 ml-3">
                <span className="font-bold text-gray-800 text-sm">{formatCLP(p.monto)}</span>
                <button onClick={() => marcarPagado(p)} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg hover:bg-green-200 font-medium whitespace-nowrap">✅ Marcar realizada</button>
                <button onClick={() => abrirEditar(p)} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg hover:bg-blue-100 font-medium">Editar</button>
              </div>
            </div>
          )} />
        </div>
      )}

      {/* Bonos Fonasa */}
      {bonosPendientesTodos.length > 0 && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-teal-800">🏥 Bonos Fonasa por verificar ({bonosPendientes.length})</h3>
            <select
              className="border border-teal-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
              value={filtroBonosProfesional}
              onChange={e => setFiltroBonosProfesional(e.target.value)}
            >
              <option value="">Todas las matronas</option>
              {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
            </select>
          </div>
          <ListaConVerMas items={bonosPendientes} limite={5} renderItem={(p, i) => (
            <div key={i} className="flex items-center justify-between bg-white rounded-lg p-3">
              <div>
                  <p className="text-sm font-medium text-gray-800">{p.paciente_nombre} {p.paciente_apellido}</p>
                  <p className="text-xs text-gray-500">🏥 Bono: {p.numero_bono} · {formatFecha(p.fecha_cita || p.fecha)}</p>
                  {p.paciente_rut && <p className="text-xs text-gray-400">RUT: {p.paciente_rut}</p>}
                  {p.profesional_nombre && <p className="text-xs text-teal-600">👩‍⚕️ {p.profesional_nombre} {p.profesional_apellido}</p>}
                </div>
              <div className="flex gap-2">
                <button onClick={async () => { await axios.put(`${API}/${p.id}`, { ...p, estado_bono: 'verificado' }); cargar() }} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg hover:bg-green-200 font-medium">✅ Verificado</button>
                <button onClick={async () => { await axios.put(`${API}/${p.id}`, { ...p, estado_bono: 'rechazado' }); cargar() }} className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-lg hover:bg-red-200 font-medium">❌ Rechazado</button>
              </div>
            </div>
          )} />
        </div>
      )}

      {/* Boletas pendientes */}
      {boletasPendientes.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-bold text-blue-800 mb-3">🧾 Boletas pendientes de emitir ({boletasPendientes.length})</h3>
          <ListaConVerMas items={boletasPendientes} limite={5} renderItem={(p, i) => (
            <div key={i} className="flex items-center justify-between bg-white rounded-lg p-3">
              <div>
                <p className="text-sm font-medium text-gray-800">{p.paciente_nombre} {p.paciente_apellido}</p>
                <p className="text-xs text-gray-500">{metodoIcono[p.metodo]} {p.metodo} · {formatCLP(p.monto)} · {formatFecha(p.fecha_cita || p.fecha)}</p>
              </div>
              <button onClick={() => toggleBoleta(p)} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg hover:bg-green-200 font-medium">✅ Marcar emitida</button>
            </div>
          )} />
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <input className="w-full border border-gray-300 rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="Buscar por paciente, RUT o notas..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          {busqueda && <button onClick={() => setBusqueda('')} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">✕</button>}
        </div>
        <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" value={filtroPeriodo} onChange={e => setFiltroPeriodo(e.target.value)}>
          <option value="hoy">Hoy</option>
          <option value="semana">Esta semana</option>
          <option value="mes">Este mes</option>
          <option value="personalizado">Rango de fechas</option>
          <option value="todos">Todos</option>
        </select>
        {filtroPeriodo === 'personalizado' && (
          <div className="flex gap-2 items-center">
            <input type="date" className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 text-sm" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
            <span className="text-gray-400 text-sm">→</span>
            <input type="date" className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 text-sm" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
          </div>
        )}
        <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="pagado">Pagado</option>
          <option value="pendiente">Pendiente</option>
          <option value="condonado">Condonado</option>
        </select>
        <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" value={filtroMetodo} onChange={e => setFiltroMetodo(e.target.value)}>
          <option value="">Todos los métodos</option>
          <option value="efectivo">Efectivo</option>
          <option value="transferencia">Transferencia</option>
          <option value="debito">Débito</option>
          <option value="credito">Crédito</option>
          <option value="fonasa">Fonasa</option>
        </select>
      </div>

      {/* Tabla desktop */}
      <div className="hidden md:block bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-green-50 text-green-800 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Paciente</th>
              <th className="px-4 py-3 text-left">Fecha atención</th>
              <th className="px-4 py-3 text-left">Procedimiento</th>
              <th className="px-4 py-3 text-left">Monto</th>
              <th className="px-4 py-3 text-left">Método</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-left">Extra</th>
              <th className="px-4 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtrados.map(p => (
              <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${p.estado === 'pendiente' ? 'bg-yellow-50' : ''}`}>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-800">{p.paciente_nombre} {p.paciente_apellido}</p>
                  {p.paciente_rut && <p className="text-xs text-gray-400">{p.paciente_rut}</p>}
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">
                  {formatFecha(p.fecha_cita || p.fecha)}
                  {p.fecha_cita && <p className="text-teal-500">fecha cita</p>}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{p.notas || '—'}</td>
                <td className="px-4 py-3 font-semibold text-gray-800">{formatCLP(p.monto)}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${metodoBadge[p.metodo]}`}>{metodoIcono[p.metodo]} {p.metodo}</span></td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${estadoBadge[p.estado]}`}>{p.estado}</span></td>
                <td className="px-4 py-3 text-xs">
                  {p.numero_bono && <p className="text-blue-600 mb-1">🏥 {p.numero_bono} <span className={`px-1 rounded ${p.estado_bono === 'verificado' ? 'bg-green-100 text-green-700' : p.estado_bono === 'rechazado' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>{p.estado_bono}</span></p>}
                  {(p.metodo === 'efectivo' || p.metodo === 'transferencia') && (
                    <button onClick={() => toggleBoleta(p)} className={`px-2 py-0.5 rounded-full text-xs font-semibold cursor-pointer ${p.estado_boleta === 'emitida' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {p.estado_boleta === 'emitida' ? '✅ Boleta emitida' : '🧾 Boleta pendiente'}
                    </button>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 flex-wrap">
                    {p.estado === 'pendiente' && <button onClick={() => marcarPagado(p)} className="text-green-700 hover:underline text-xs font-medium">✅ Realizada</button>}
                    <button onClick={() => abrirEditar(p)} className="text-blue-600 hover:underline text-xs font-medium">Editar</button>
                    <button onClick={() => eliminar(p.id)} className="text-red-500 hover:underline text-xs font-medium">Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && <tr><td colSpan="8" className="px-4 py-6 text-center text-gray-400">{busqueda || filtroEstado || filtroMetodo ? 'No se encontraron resultados' : 'No hay pagos registrados'}</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Tarjetas móvil */}
      <div className="md:hidden flex flex-col gap-3">
        {filtrados.map(p => (
          <div key={p.id} className={`rounded-xl shadow p-4 ${p.estado === 'pendiente' ? 'bg-yellow-50 border border-yellow-200' : 'bg-white'}`}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold text-gray-800">{p.paciente_nombre} {p.paciente_apellido}</p>
                <p className="text-xs text-gray-400">{formatFecha(p.fecha_cita || p.fecha)}{p.fecha_cita && <span className="text-teal-500 ml-1">cita</span>}</p>
              </div>
              <p className="font-bold text-green-800 text-lg">{formatCLP(p.monto)}</p>
            </div>
            {p.notas && <p className="text-xs text-gray-500 mb-1">{p.notas}</p>}
            <div className="flex gap-2 mb-2 flex-wrap">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${metodoBadge[p.metodo]}`}>{metodoIcono[p.metodo]} {p.metodo}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${estadoBadge[p.estado]}`}>{p.estado}</span>
            </div>
            {p.numero_bono && <p className="text-xs text-blue-600 mb-1">🏥 Bono: {p.numero_bono} <span className={`px-1 rounded ${p.estado_bono === 'verificado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{p.estado_bono}</span></p>}
            {(p.metodo === 'efectivo' || p.metodo === 'transferencia') && (
              <button onClick={() => toggleBoleta(p)} className={`text-xs px-2 py-0.5 rounded-full font-semibold mb-2 ${p.estado_boleta === 'emitida' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {p.estado_boleta === 'emitida' ? '✅ Boleta emitida' : '🧾 Boleta pendiente'}
              </button>
            )}
            <div className="flex gap-3">
              {p.estado === 'pendiente' && <button onClick={() => marcarPagado(p)} className="text-green-700 text-sm font-medium">✅ Realizada</button>}
              <button onClick={() => abrirEditar(p)} className="text-blue-600 text-sm font-medium">Editar</button>
              <button onClick={() => eliminar(p.id)} className="text-red-500 text-sm font-medium">Eliminar</button>
            </div>
          </div>
        ))}
        {filtrados.length === 0 && <div className="bg-white rounded-xl shadow p-6 text-center text-gray-400">{busqueda || filtroEstado || filtroMetodo ? 'No se encontraron resultados' : 'No hay pagos registrados'}</div>}
      </div>
    </div>
  )
}