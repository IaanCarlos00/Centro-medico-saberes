import { useEffect, useState } from 'react'
import axios from 'axios'

const API_PROC = 'https://centro-medico-saberes-production.up.railway.app/procedimientos'

const formatFecha = fecha => {
  if (!fecha) return ''
  return new Date(fecha.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-CL')
}

const formatCLP = n => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n)

export default function ModalProcedimientos({ paciente, citaId, onCerrar }) {
  const [catalogo, setCatalogo] = useState([])
  const [procedimientos, setProcedimientos] = useState([])
  const [form, setForm] = useState({ catalogo_procedimiento_id: '', nombre: '', monto: '', metodo: 'efectivo', estado: 'pagado', notas: '' })
  const [errores, setErrores] = useState({})

  const cargar = async () => {
    const [cat, proc] = await Promise.all([
      axios.get(`${API_PROC}/catalogo`),
      axios.get(`${API_PROC}/paciente/${paciente.id}`)
    ])
    setCatalogo(cat.data)
    setProcedimientos(proc.data)
  }

  useEffect(() => {
    cargar()
    const intervalo = setInterval(() => cargar(), 30000) // recarga cada 30 segundos
    return () => clearInterval(intervalo)
  }, [])

  const handleChange = e => {
    const { name, value } = e.target
    if (name === 'catalogo_procedimiento_id') {
      const seleccionado = catalogo.find(c => c.id === parseInt(value))
      setForm({ ...form, catalogo_procedimiento_id: value, nombre: seleccionado?.nombre || '', monto: seleccionado?.monto || '' })
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
    await axios.post(API_PROC, { ...form, paciente_id: paciente.id })
    // Si viene de una cita, confirmarla automáticamente
    if (citaId) {
      await axios.put(`https://centro-medico-saberes-production.up.railway.app/citas/${citaId}`, { estado: 'confirmada' })
    }
    setForm({ catalogo_procedimiento_id: '', nombre: '', monto: '', metodo: 'efectivo', estado: 'pagado', notas: '' })
    cargar()
  }

  const eliminar = async id => {
    if (confirm('¿Eliminar procedimiento?')) {
      await axios.delete(`${API_PROC}/${id}`)
      cargar()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4" onClick={onCerrar}>
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-green-800">Procedimientos realizados</h3>
            <p className="text-sm text-gray-500">{paciente.nombre} {paciente.apellido}</p>
          </div>
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-5">
          <h4 className="text-sm font-semibold text-gray-600 mb-3">Agregar procedimiento</h4>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 mb-1">Seleccionar del catálogo</label>
              <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" name="catalogo_procedimiento_id" value={form.catalogo_procedimiento_id} onChange={handleChange}>
                <option value="">Seleccionar procedimiento...</option>
                {catalogo.map(c => <option key={c.id} value={c.id}>{c.nombre} — {formatCLP(c.monto)}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">Nombre *</label>
                <input className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 ${errores.nombre ? 'border-red-400' : 'border-gray-200'}`} name="nombre" placeholder="Nombre del procedimiento" value={form.nombre} onChange={handleChange} />
                {errores.nombre && <span className="text-red-500 text-xs mt-1">{errores.nombre}</span>}
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">Monto ($) *</label>
                <input className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 ${errores.monto ? 'border-red-400' : 'border-gray-200'}`} name="monto" type="number" placeholder="25000" value={form.monto} onChange={handleChange} />
                {errores.monto && <span className="text-red-500 text-xs mt-1">{errores.monto}</span>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">Método de pago</label>
                <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" name="metodo" value={form.metodo} onChange={handleChange}>
                  <option value="fonasa">🏥 Fonasa</option>
                  <option value="efectivo">💵 Efectivo</option>
                  <option value="transferencia">🏦 Transferencia</option>
                  <option value="debito">💳 Débito</option>
                  <option value="credito">💳 Crédito</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">Estado</label>
                <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" name="estado" value={form.estado} onChange={handleChange}>
                  <option value="pagado">Pagado</option>
                  <option value="pendiente">Pendiente</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 mb-1">Notas (opcional)</label>
              <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" name="notas" placeholder="Observaciones del procedimiento..." value={form.notas} onChange={handleChange} />
            </div>
            <button onClick={guardar} className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 font-medium text-sm">
              + Agregar procedimiento
            </button>
          </div>
        </div>

        {procedimientos.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-600 mb-3">Procedimientos registrados</h4>
            <div className="flex flex-col gap-2">
              {procedimientos.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                  <div>
                    <p className="font-medium text-gray-800">{p.nombre}</p>
                    <p className="text-xs text-gray-400">{formatFecha(p.fecha)} · {p.metodo} · <span className={p.estado === 'pagado' ? 'text-green-600' : 'text-yellow-600'}>{p.estado}</span></p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-800">{formatCLP(p.monto)}</span>
                    <button onClick={() => eliminar(p.id)} className="text-red-500 hover:underline text-xs">Eliminar</button>
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-1">
                <span className="text-sm font-semibold text-gray-600">Total</span>
                <span className="text-lg font-bold text-green-800">{formatCLP(procedimientos.reduce((sum, p) => sum + parseFloat(p.monto), 0))}</span>
              </div>
            </div>
          </div>
        )}

        {procedimientos.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-4">No hay procedimientos registrados</p>
        )}
      </div>
    </div>
  )
}