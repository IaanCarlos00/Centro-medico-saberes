import { useEffect, useState } from 'react'
import axios from 'axios'

const API_PROC = 'https://centro-medico-saberes-production.up.railway.app/procedimientos'
const API_PAGOS = 'https://centro-medico-saberes-production.up.railway.app/pagos'

const formatFecha = fecha => {
  if (!fecha) return ''
  return new Date(fecha.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-CL')
}

const formatCLP = n => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n)

export default function ModalProcedimientos({ paciente, citaId, onCerrar }) {
  const [catalogo, setCatalogo] = useState([])
  const [procedimientos, setProcedimientos] = useState([])
  const [pagos, setPagos] = useState([])
  const [form, setForm] = useState({ catalogo_procedimiento_id: '', nombre: '', monto: '', metodo: 'debito', estado: 'pendiente', notas: '' })
  const [errores, setErrores] = useState({})
  const [editandoProc, setEditandoProc] = useState(null)
  const [editandoPago, setEditandoPago] = useState(null)
  const [formEdit, setFormEdit] = useState({})
  const [guardando, setGuardando] = useState(false)

  const cargar = async () => {
    const [cat, proc, pag] = await Promise.all([
      axios.get(`${API_PROC}/catalogo`),
      axios.get(`${API_PROC}/paciente/${paciente.id}`),
      axios.get(`${API_PAGOS}/paciente/${paciente.id}`)
    ])
    setCatalogo(cat.data)
    setProcedimientos(proc.data)
    setPagos(pag.data)
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

  const guardar = async () => {
    const e = {}
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio'
    if (!form.monto || isNaN(form.monto) || Number(form.monto) <= 0) e.monto = 'Ingresa un monto válido'
    if (Object.keys(e).length > 0) { setErrores(e); return }
    if (guardando) return
    setGuardando(true)
    try {
      await axios.post(API_PROC, {
        ...form,
        paciente_id: paciente.id,
        profesional_id: localStorage.getItem('profesional_id') || null
      })
      if (citaId) {
        const citaActual = await axios.get(`https://centro-medico-saberes-production.up.railway.app/citas/${citaId}`)
        await axios.put(`https://centro-medico-saberes-production.up.railway.app/citas/${citaId}`, { ...citaActual.data, estado: 'confirmada' })
      }
      setForm({ catalogo_procedimiento_id: '', nombre: '', monto: '', metodo: 'debito', estado: 'pendiente', notas: '' })
      cargar()
    } finally {
      setGuardando(false)
    }
  }

  const iniciarEditProc = p => {
    setEditandoProc(p.id)
    setFormEdit({ nombre: p.nombre, monto: p.monto, metodo: p.metodo, estado: p.estado, notas: p.notas || '' })
  }

  const guardarEditProc = async id => {
    await axios.put(`${API_PROC}/${id}`, { ...formEdit, paciente_id: paciente.id })
    setEditandoProc(null)
    cargar()
  }

  const iniciarEditPago = p => {
    setEditandoPago(p.id)
    setFormEdit({ monto: p.monto, metodo: p.metodo, estado: p.estado, notas: p.notas || '', numero_bono: p.numero_bono || '' })
  }

  const guardarEditPago = async id => {
    await axios.put(`${API_PAGOS}/${id}`, { ...formEdit, paciente_id: paciente.id })
    setEditandoPago(null)
    cargar()
  }

  const eliminarProc = async id => {
    if (confirm('¿Eliminar procedimiento?')) {
      await axios.delete(`${API_PROC}/${id}`)
      cargar()
    }
  }

  const eliminarPago = async id => {
    if (confirm('¿Eliminar pago?')) {
      await axios.delete(`${API_PAGOS}/${id}`)
      cargar()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4" onClick={onCerrar}>
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-green-800">Procedimientos y pagos</h3>
            <p className="text-sm text-gray-500">{paciente.nombre} {paciente.apellido}</p>
          </div>
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {/* Formulario nuevo procedimiento */}
        <div className="bg-gray-50 rounded-xl p-4 mb-5">
          <h4 className="text-sm font-semibold text-gray-600 mb-3">Agregar procedimiento</h4>
          <div className="flex flex-col gap-3">
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" name="catalogo_procedimiento_id" value={form.catalogo_procedimiento_id} onChange={handleChange}>
              <option value="">Seleccionar del catálogo...</option>
              {catalogo.map(c => <option key={c.id} value={c.id}>{c.nombre} — {formatCLP(c.monto)}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col">
                <input className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 ${errores.nombre ? 'border-red-400' : 'border-gray-200'}`} name="nombre" placeholder="Nombre *" value={form.nombre} onChange={handleChange} />
                {errores.nombre && <span className="text-red-500 text-xs mt-1">{errores.nombre}</span>}
              </div>
              <div className="flex flex-col">
                <input className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 ${errores.monto ? 'border-red-400' : 'border-gray-200'}`} name="monto" type="number" placeholder="Monto *" value={form.monto} onChange={handleChange} />
                {errores.monto && <span className="text-red-500 text-xs mt-1">{errores.monto}</span>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" name="metodo" value={form.metodo} onChange={handleChange}>
                <option value="debito">💳 Débito</option>
                <option value="efectivo">💵 Efectivo</option>
                <option value="transferencia">🏦 Transferencia</option>
                <option value="fonasa">🏥 Fonasa</option>
                <option value="credito">💳 Crédito</option>
              </select>
              <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" name="estado" value={form.estado} onChange={handleChange}>
                <option value="pagado">Pagado</option>
                <option value="pendiente">Pendiente</option>
              </select>
            </div>
            <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" name="notas" placeholder="Notas (opcional)" value={form.notas} onChange={handleChange} />
            <button
              onClick={guardar}
              disabled={guardando}
              className={`px-4 py-2 rounded-lg font-medium text-sm text-white transition-colors ${guardando ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-700 hover:bg-green-800'}`}
            >
              {guardando ? 'Guardando...' : '+ Agregar'}
            </button>
          </div>
        </div>

        {/* Lista procedimientos */}
        {procedimientos.length > 0 && (
          <div className="mb-5">
            <h4 className="text-sm font-semibold text-gray-600 mb-3">Procedimientos registrados</h4>
            <div className="flex flex-col gap-2">
              {procedimientos.map(p => (
                <div key={p.id} className="bg-gray-50 rounded-lg p-3">
                  {editandoProc === p.id ? (
                    <div className="flex flex-col gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input className="border border-gray-300 rounded-lg px-2 py-1 text-sm" placeholder="Nombre" value={formEdit.nombre} onChange={e => setFormEdit({ ...formEdit, nombre: e.target.value })} />
                        <input className="border border-gray-300 rounded-lg px-2 py-1 text-sm" type="number" placeholder="Monto" value={formEdit.monto} onChange={e => setFormEdit({ ...formEdit, monto: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <select className="border border-gray-300 rounded-lg px-2 py-1 text-sm" value={formEdit.metodo} onChange={e => setFormEdit({ ...formEdit, metodo: e.target.value })}>
                          <option value="debito">Débito</option>
                          <option value="efectivo">Efectivo</option>
                          <option value="transferencia">Transferencia</option>
                          <option value="fonasa">Fonasa</option>
                          <option value="credito">Crédito</option>
                        </select>
                        <select className="border border-gray-300 rounded-lg px-2 py-1 text-sm" value={formEdit.estado} onChange={e => setFormEdit({ ...formEdit, estado: e.target.value })}>
                          <option value="pagado">Pagado</option>
                          <option value="pendiente">Pendiente</option>
                        </select>
                      </div>
                      <input className="border border-gray-300 rounded-lg px-2 py-1 text-sm" placeholder="Notas" value={formEdit.notas} onChange={e => setFormEdit({ ...formEdit, notas: e.target.value })} />
                      <div className="flex gap-2">
                        <button onClick={() => guardarEditProc(p.id)} className="flex-1 bg-green-700 text-white py-1 rounded-lg text-sm font-medium hover:bg-green-800">Guardar</button>
                        <button onClick={() => setEditandoProc(null)} className="flex-1 bg-gray-200 text-gray-700 py-1 rounded-lg text-sm font-medium hover:bg-gray-300">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{p.nombre}</p>
                        <p className="text-xs text-gray-400">{formatFecha(p.fecha)} · {p.metodo} · <span className={p.estado === 'pagado' ? 'text-green-600' : 'text-yellow-600'}>{p.estado}</span></p>
                        {p.notas && <p className="text-xs text-gray-400 mt-0.5">{p.notas}</p>}
                      </div>
                      <div className="flex items-center gap-3 ml-3">
                        <span className="font-bold text-gray-800 text-sm">{formatCLP(p.monto)}</span>
                        <button onClick={() => iniciarEditProc(p)} className="text-blue-600 hover:underline text-xs font-medium">Editar</button>
                        <button onClick={() => eliminarProc(p.id)} className="text-red-500 hover:underline text-xs">Eliminar</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-sm font-semibold text-gray-600">Total procedimientos</span>
                <span className="text-lg font-bold text-green-800">{formatCLP(procedimientos.reduce((sum, p) => sum + parseFloat(p.monto), 0))}</span>
              </div>
            </div>
          </div>
        )}

        {/* Lista pagos */}
        {pagos.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-600 mb-3">Pagos registrados</h4>
            <div className="flex flex-col gap-2">
              {pagos.map(p => (
                <div key={p.id} className="bg-gray-50 rounded-lg p-3">
                  {editandoPago === p.id ? (
                    <div className="flex flex-col gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input className="border border-gray-300 rounded-lg px-2 py-1 text-sm" type="number" placeholder="Monto" value={formEdit.monto} onChange={e => setFormEdit({ ...formEdit, monto: e.target.value })} />
                        <select className="border border-gray-300 rounded-lg px-2 py-1 text-sm" value={formEdit.metodo} onChange={e => setFormEdit({ ...formEdit, metodo: e.target.value })}>
                          <option value="debito">Débito</option>
                          <option value="efectivo">Efectivo</option>
                          <option value="transferencia">Transferencia</option>
                          <option value="fonasa">Fonasa</option>
                          <option value="credito">Crédito</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <select className="border border-gray-300 rounded-lg px-2 py-1 text-sm" value={formEdit.estado} onChange={e => setFormEdit({ ...formEdit, estado: e.target.value })}>
                          <option value="pagado">Pagado</option>
                          <option value="pendiente">Pendiente</option>
                          <option value="condonado">Condonado</option>
                        </select>
                        <input className="border border-gray-300 rounded-lg px-2 py-1 text-sm" placeholder="N° bono" value={formEdit.numero_bono} onChange={e => setFormEdit({ ...formEdit, numero_bono: e.target.value })} />
                      </div>
                      <input className="border border-gray-300 rounded-lg px-2 py-1 text-sm" placeholder="Notas" value={formEdit.notas} onChange={e => setFormEdit({ ...formEdit, notas: e.target.value })} />
                      <div className="flex gap-2">
                        <button onClick={() => guardarEditPago(p.id)} className="flex-1 bg-green-700 text-white py-1 rounded-lg text-sm font-medium hover:bg-green-800">Guardar</button>
                        <button onClick={() => setEditandoPago(null)} className="flex-1 bg-gray-200 text-gray-700 py-1 rounded-lg text-sm font-medium hover:bg-gray-300">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{p.notas || 'Pago'}</p>
                        <p className="text-xs text-gray-400">{new Date(p.fecha).toLocaleDateString('es-CL')} · {p.metodo} · <span className={p.estado === 'pagado' ? 'text-green-600' : 'text-yellow-600'}>{p.estado}</span></p>
                        {p.numero_bono && <p className="text-xs text-blue-600">🏥 Bono: {p.numero_bono}</p>}
                      </div>
                      <div className="flex items-center gap-3 ml-3">
                        <span className="font-bold text-gray-800 text-sm">{formatCLP(p.monto)}</span>
                        <button onClick={() => iniciarEditPago(p)} className="text-blue-600 hover:underline text-xs font-medium">Editar</button>
                        <button onClick={() => eliminarPago(p.id)} className="text-red-500 hover:underline text-xs">Eliminar</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-sm font-semibold text-gray-600">Total pagos</span>
                <span className="text-lg font-bold text-green-800">{formatCLP(pagos.reduce((sum, p) => sum + parseFloat(p.monto), 0))}</span>
              </div>
            </div>
          </div>
        )}

        {procedimientos.length === 0 && pagos.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-4">No hay registros aún</p>
        )}
      </div>
    </div>
  )
}