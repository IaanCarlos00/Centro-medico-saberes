import { useEffect, useState } from 'react'
import axios from 'axios'

const API_PROC = 'https://centro-medico-saberes-production.up.railway.app/procedimientos'
const API_PAGOS = 'https://centro-medico-saberes-production.up.railway.app/pagos'

const formatFecha = fecha => {
  if (!fecha) return ''
  return new Date(fecha.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-CL')
}

const formatCLP = n => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n)

const metodoIcono = { fonasa: '🏥', efectivo: '💵', transferencia: '🏦', debito: '💳', credito: '💳' }

export default function ModalProcedimientos({ paciente, citaId, onCerrar }) {
  const [catalogo, setCatalogo] = useState([])
  const [procedimientos, setProcedimientos] = useState([])
  const [pagos, setPagos] = useState([])
  const [tab, setTab] = useState('procedimientos')
  const [form, setForm] = useState({
    catalogo_procedimiento_id: '', nombre: '', monto: '', metodo: 'debito',
    estado: 'pendiente', notas: '', numero_bono: '', fecha_atencion: new Date().toISOString().slice(0, 10)
  })
  const [errores, setErrores] = useState({})
  const [editandoProc, setEditandoProc] = useState(null)
  const [editandoPago, setEditandoPago] = useState(null)
  const [formEdit, setFormEdit] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [aviso, setAviso] = useState(null)
  const [duplicados, setDuplicados] = useState([])

  const cargar = async () => {
    const [cat, proc, pag] = await Promise.all([
      axios.get(`${API_PROC}/catalogo`),
      axios.get(`${API_PROC}/paciente/${paciente.id}`),
      axios.get(`${API_PAGOS}/paciente/${paciente.id}`)
    ])
    setCatalogo(cat.data)
    setProcedimientos(proc.data)
    setPagos(pag.data)

    // Detectar duplicados automáticamente
    const vistos = {}
    const dups = []
    proc.data.forEach(p => {
      const key = `${p.nombre}__${p.fecha?.slice(0, 10)}`
      if (vistos[key]) dups.push(p)
      else vistos[key] = true
    })
    setDuplicados(dups)
  }

  useEffect(() => { cargar() }, [])

  const handleChange = e => {
    const { name, value } = e.target
    if (name === 'catalogo_procedimiento_id') {
      const sel = catalogo.find(c => c.id === parseInt(value))
      setForm({ ...form, catalogo_procedimiento_id: value, nombre: sel?.nombre || '', monto: sel?.monto || '' })
    } else {
      setForm({ ...form, [name]: value })
    }
    setErrores({ ...errores, [name]: '' })
  }

  const guardar = async (forzar = false) => {
    const e = {}
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio'
    if (!form.monto || isNaN(form.monto) || Number(form.monto) <= 0) e.monto = 'Ingresa un monto válido'
    if (Object.keys(e).length > 0) { setErrores(e); return }
    if (guardando) return

    // Detectar duplicado
    if (!forzar) {
      const dup = procedimientos.find(p =>
        p.nombre === form.nombre && p.fecha?.slice(0, 10) === form.fecha_atencion
      )
      if (dup) {
        setAviso({ mensaje: `Ya existe "${form.nombre}" registrado el ${formatFecha(form.fecha_atencion)}. ¿Registrar de todas formas?`, onConfirmar: () => { setAviso(null); guardar(true) } })
        return
      }
    }

    setGuardando(true)
    try {
      await axios.post(API_PROC, {
        ...form,
        paciente_id: paciente.id,
        profesional_id: localStorage.getItem('profesional_id') || null,
        cita_id: citaId || null
      })
      if (citaId) {
        const citaActual = await axios.get(`https://centro-medico-saberes-production.up.railway.app/citas/${citaId}`)
        await axios.put(`https://centro-medico-saberes-production.up.railway.app/citas/${citaId}`, { ...citaActual.data, estado: 'confirmada' })
      }
      setForm({ catalogo_procedimiento_id: '', nombre: '', monto: '', metodo: 'debito', estado: 'pendiente', notas: '', numero_bono: '', fecha_atencion: new Date().toISOString().slice(0, 10) })
      setErrores({})
      cargar()
    } finally {
      setGuardando(false)
    }
  }

  const eliminarTodo = async () => {
    if (!confirm(`¿Eliminar TODOS los procedimientos y pagos de ${paciente.nombre} ${paciente.apellido}? Esta acción no se puede deshacer.`)) return
    await Promise.all([
      ...procedimientos.map(p => axios.delete(`${API_PROC}/${p.id}`)),
      ...pagos.map(p => axios.delete(`${API_PAGOS}/${p.id}`))
    ])
    cargar()
  }

  const eliminarProc = async id => {
    if (confirm('¿Eliminar procedimiento?')) { await axios.delete(`${API_PROC}/${id}`); cargar() }
  }

  const eliminarPago = async id => {
    if (confirm('¿Eliminar pago?')) { await axios.delete(`${API_PAGOS}/${id}`); cargar() }
  }

  const guardarEditProc = async id => {
    await axios.put(`${API_PROC}/${id}`, { ...formEdit, paciente_id: paciente.id })
    setEditandoProc(null)
    cargar()
  }

  const guardarEditPago = async id => {
    await axios.put(`${API_PAGOS}/${id}`, { ...formEdit, paciente_id: paciente.id })
    setEditandoPago(null)
    cargar()
  }

  const totalProc = procedimientos.reduce((s, p) => s + parseFloat(p.monto), 0)
  const totalPagos = pagos.reduce((s, p) => s + parseFloat(p.monto), 0)
  const totalPendiente = pagos.filter(p => p.estado === 'pendiente').reduce((s, p) => s + parseFloat(p.monto), 0)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4" onClick={onCerrar}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="bg-gradient-to-r from-green-700 to-green-600 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold text-white">Procedimientos y pagos</h3>
            <p className="text-green-200 text-sm">{paciente.nombre} {paciente.apellido}</p>
          </div>
          <button onClick={onCerrar} className="text-white hover:text-green-200 text-2xl leading-none">✕</button>
        </div>

        {/* Resumen rápido */}
        <div className="grid grid-cols-3 gap-3 px-6 py-3 bg-gray-50 border-b border-gray-100 shrink-0">
          <div className="text-center">
            <p className="text-xs text-gray-500">Procedimientos</p>
            <p className="font-bold text-gray-800">{formatCLP(totalProc)}</p>
          </div>
          <div className="text-center border-x border-gray-200">
            <p className="text-xs text-gray-500">Pagado</p>
            <p className="font-bold text-green-700">{formatCLP(totalPagos - totalPendiente)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Pendiente</p>
            <p className="font-bold text-yellow-600">{formatCLP(totalPendiente)}</p>
          </div>
        </div>

        {duplicados.length > 0 && (
          <div className="px-6 py-3 bg-red-50 border-b border-red-200 shrink-0">
            <p className="text-sm font-semibold text-red-700 mb-1">⚠️ Se detectaron {duplicados.length} posible{duplicados.length > 1 ? 's' : ''} duplicado{duplicados.length > 1 ? 's' : ''}:</p>
            <div className="flex flex-col gap-1">
              {duplicados.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-xs text-red-600">
                  <span>{d.nombre} — {formatFecha(d.fecha)}</span>
                  <button onClick={() => eliminarProc(d.id)} className="text-red-700 font-semibold hover:underline ml-3">Eliminar</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 shrink-0">
          <button onClick={() => setTab('procedimientos')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === 'procedimientos' ? 'text-green-700 border-b-2 border-green-700' : 'text-gray-400 hover:text-gray-600'}`}>
            🩺 Procedimientos ({procedimientos.length})
          </button>
          <button onClick={() => setTab('pagos')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === 'pagos' ? 'text-green-700 border-b-2 border-green-700' : 'text-gray-400 hover:text-gray-600'}`}>
            💰 Pagos ({pagos.length})
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto px-6 py-4">

          {/* Modal aviso duplicado */}
          {aviso && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 mb-4">
              <p className="text-sm text-yellow-800 font-medium mb-3">⚠️ {aviso.mensaje}</p>
              <div className="flex gap-2">
                <button onClick={aviso.onConfirmar} className="flex-1 bg-yellow-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-yellow-600">Sí, registrar igual</button>
                <button onClick={() => setAviso(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium">Cancelar</button>
              </div>
            </div>
          )}

          {/* TAB PROCEDIMIENTOS */}
          {tab === 'procedimientos' && (
            <div className="flex flex-col gap-4">
              {/* Formulario */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-gray-600 mb-3">+ Agregar procedimiento</h4>
                <div className="flex flex-col gap-3">
                  <select className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                    name="catalogo_procedimiento_id" value={form.catalogo_procedimiento_id} onChange={handleChange}>
                    <option value="">Seleccionar del catálogo...</option>
                    {catalogo.map(c => <option key={c.id} value={c.id}>{c.nombre} — {formatCLP(c.monto)}</option>)}
                  </select>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col">
                      <input className={`border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 ${errores.nombre ? 'border-red-400' : 'border-gray-200'}`}
                        name="nombre" placeholder="Nombre *" value={form.nombre} onChange={handleChange} />
                      {errores.nombre && <span className="text-red-500 text-xs mt-1">{errores.nombre}</span>}
                    </div>
                    <div className="flex flex-col">
                      <input className={`border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 ${errores.monto ? 'border-red-400' : 'border-gray-200'}`}
                        name="monto" type="number" placeholder="Monto *" value={form.monto} onChange={handleChange} />
                      {errores.monto && <span className="text-red-500 text-xs mt-1">{errores.monto}</span>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <select className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                      name="metodo" value={form.metodo} onChange={handleChange}>
                      <option value="debito">💳 Débito</option>
                      <option value="efectivo">💵 Efectivo</option>
                      <option value="transferencia">🏦 Transferencia</option>
                      <option value="fonasa">🏥 Fonasa</option>
                      <option value="credito">💳 Crédito</option>
                    </select>
                    <select className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                      name="estado" value={form.estado} onChange={handleChange}>
                      <option value="pagado">Pagado</option>
                      <option value="pendiente">Pendiente</option>
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-500 mb-1">Fecha de atención</label>
                    <input type="date" className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                      name="fecha_atencion" value={form.fecha_atencion} onChange={handleChange} />
                  </div>
                    {form.metodo === 'fonasa' && (
                      <input className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                        name="numero_bono" placeholder="🏥 Número de bono" value={form.numero_bono || ''} onChange={handleChange} />
                    )}
                    <input className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                      name="notas" placeholder="Notas (opcional)" value={form.notas} onChange={handleChange} />
                  <button onClick={() => guardar(false)} disabled={guardando}
                    className={`py-2.5 rounded-xl font-semibold text-sm text-white transition-colors ${guardando ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-700 hover:bg-green-800'}`}>
                    {guardando ? 'Guardando...' : '+ Agregar procedimiento'}
                  </button>
                </div>
              </div>

              {/* Lista */}
              {procedimientos.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-6">Sin procedimientos registrados</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {procedimientos.map(p => (
                    <div key={p.id} className="border border-gray-100 rounded-xl p-3">
                      {editandoProc === p.id ? (
                        <div className="flex flex-col gap-2">
                          <div className="grid grid-cols-2 gap-2">
                            <input className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" placeholder="Nombre" value={formEdit.nombre} onChange={e => setFormEdit({ ...formEdit, nombre: e.target.value })} />
                            <input className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" type="number" placeholder="Monto" value={formEdit.monto} onChange={e => setFormEdit({ ...formEdit, monto: e.target.value })} />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <select className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" value={formEdit.metodo} onChange={e => setFormEdit({ ...formEdit, metodo: e.target.value })}>
                              <option value="debito">Débito</option><option value="efectivo">Efectivo</option>
                              <option value="transferencia">Transferencia</option><option value="fonasa">Fonasa</option><option value="credito">Crédito</option>
                            </select>
                            <select className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" value={formEdit.estado} onChange={e => setFormEdit({ ...formEdit, estado: e.target.value })}>
                              <option value="pagado">Pagado</option><option value="pendiente">Pendiente</option>
                            </select>
                          </div>
                          <input className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" placeholder="Notas" value={formEdit.notas} onChange={e => setFormEdit({ ...formEdit, notas: e.target.value })} />
                          <div className="flex gap-2">
                            <button onClick={() => guardarEditProc(p.id)} className="flex-1 bg-green-700 text-white py-1.5 rounded-lg text-sm font-medium">Guardar</button>
                            <button onClick={() => setEditandoProc(null)} className="flex-1 bg-gray-100 text-gray-700 py-1.5 rounded-lg text-sm font-medium">Cancelar</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 text-sm">{p.nombre}</p>
                            <p className="text-xs text-gray-400">{formatFecha(p.fecha)} · {metodoIcono[p.metodo]} {p.metodo}</p>
                            {p.notas && <p className="text-xs text-gray-400">{p.notas}</p>}
                          </div>
                          <div className="flex items-center gap-2 ml-3 shrink-0">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${p.estado === 'pagado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{p.estado}</span>
                            <span className="font-bold text-gray-800 text-sm">{formatCLP(p.monto)}</span>
                            <button onClick={() => { setEditandoProc(p.id); setFormEdit({ nombre: p.nombre, monto: p.monto, metodo: p.metodo, estado: p.estado, notas: p.notas || '' }) }} className="text-blue-600 hover:underline text-xs">Editar</button>
                            <button onClick={() => eliminarProc(p.id)} className="text-red-500 hover:underline text-xs">Eliminar</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-sm font-semibold text-gray-600">Total</span>
                    <span className="text-lg font-bold text-green-800">{formatCLP(totalProc)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB PAGOS */}
          {tab === 'pagos' && (
            <div className="flex flex-col gap-4">
              {pagos.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-4xl mb-2">💳</p>
                  <p className="text-gray-400 text-sm">Sin pagos registrados</p>
                  <p className="text-gray-400 text-xs mt-1">Los pagos se crean al agregar procedimientos</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {pagos.map(p => (
                    <div key={p.id} className={`border rounded-xl p-3 ${p.estado === 'pendiente' ? 'border-yellow-200 bg-yellow-50' : 'border-gray-100'}`}>
                      {editandoPago === p.id ? (
                        <div className="flex flex-col gap-2">
                          <div className="grid grid-cols-2 gap-2">
                            <input className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" type="number" placeholder="Monto" value={formEdit.monto} onChange={e => setFormEdit({ ...formEdit, monto: e.target.value })} />
                            <select className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" value={formEdit.metodo} onChange={e => setFormEdit({ ...formEdit, metodo: e.target.value })}>
                              <option value="debito">Débito</option><option value="efectivo">Efectivo</option>
                              <option value="transferencia">Transferencia</option><option value="fonasa">Fonasa</option><option value="credito">Crédito</option>
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <select className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" value={formEdit.estado} onChange={e => setFormEdit({ ...formEdit, estado: e.target.value })}>
                              <option value="pagado">Pagado</option><option value="pendiente">Pendiente</option><option value="condonado">Condonado</option>
                            </select>
                            <input className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" placeholder="N° bono" value={formEdit.numero_bono} onChange={e => setFormEdit({ ...formEdit, numero_bono: e.target.value })} />
                          </div>
                          <input className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" placeholder="Notas" value={formEdit.notas} onChange={e => setFormEdit({ ...formEdit, notas: e.target.value })} />
                          <div className="flex gap-2">
                            <button onClick={() => guardarEditPago(p.id)} className="flex-1 bg-green-700 text-white py-1.5 rounded-lg text-sm font-medium">Guardar</button>
                            <button onClick={() => setEditandoPago(null)} className="flex-1 bg-gray-100 text-gray-700 py-1.5 rounded-lg text-sm font-medium">Cancelar</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 text-sm">{p.notas || 'Pago'}</p>
                            <p className="text-xs text-gray-400">{formatFecha(p.fecha)} · {metodoIcono[p.metodo]} {p.metodo}</p>
                            {p.numero_bono && <p className="text-xs text-blue-600">🏥 Bono: {p.numero_bono}</p>}
                          </div>
                          <div className="flex items-center gap-2 ml-3 shrink-0">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${p.estado === 'pagado' ? 'bg-green-100 text-green-700' : p.estado === 'condonado' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-700'}`}>{p.estado}</span>
                            <span className="font-bold text-gray-800 text-sm">{formatCLP(p.monto)}</span>
                            <button onClick={() => { setEditandoPago(p.id); setFormEdit({ monto: p.monto, metodo: p.metodo, estado: p.estado, notas: p.notas || '', numero_bono: p.numero_bono || '' }) }} className="text-blue-600 hover:underline text-xs">Editar</button>
                            <button onClick={() => eliminarPago(p.id)} className="text-red-500 hover:underline text-xs">Eliminar</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-sm font-semibold text-gray-600">Total pagado</span>
                    <span className="text-lg font-bold text-green-800">{formatCLP(totalPagos - totalPendiente)}</span>
                  </div>
                  {totalPendiente > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-yellow-600">Total pendiente</span>
                      <span className="text-lg font-bold text-yellow-600">{formatCLP(totalPendiente)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {(procedimientos.length > 0 || pagos.length > 0) && (
          <div className="px-6 py-4 border-t border-gray-100 shrink-0">
            <button onClick={eliminarTodo} className="w-full bg-red-50 text-red-600 py-2.5 rounded-xl hover:bg-red-100 font-medium text-sm transition-colors">
              🗑️ Eliminar todos los registros
            </button>
          </div>
        )}
      </div>
    </div>
  )
}