import { useState } from 'react'
import axios from 'axios'

const API_PAGOS = 'https://centro-medico-saberes-production.up.railway.app/pagos'

export default function ModalPago({ cita, onConfirmar, onCerrar }) {
  const [form, setForm] = useState({ monto: '', metodo: 'fonasa', estado: 'pagado', notas: '' })
  const [errores, setErrores] = useState({})

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrores({ ...errores, [e.target.name]: '' })
  }

  const guardar = async () => {
    const e = {}
    if (!form.monto || isNaN(form.monto) || Number(form.monto) <= 0) e.monto = 'Ingresa un monto válido'
    if (Object.keys(e).length > 0) { setErrores(e); return }
    await axios.post(API_PAGOS, { ...form, paciente_id: cita.paciente_id, cita_id: cita.id })
    onConfirmar()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4" onClick={onCerrar}>
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-5">
          <span className="text-3xl">💰</span>
          <div>
            <h3 className="text-lg font-bold text-green-800">Registrar pago</h3>
            <p className="text-sm text-gray-500">{cita.paciente_nombre} {cita.paciente_apellido}</p>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Monto ($) *</label>
            <input className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.monto ? 'border-red-400' : 'border-gray-300'}`} name="monto" type="number" placeholder="25000" value={form.monto} onChange={handleChange} />
            {errores.monto && <span className="text-red-500 text-xs mt-1">{errores.monto}</span>}
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Método de pago</label>
            <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" name="metodo" value={form.metodo} onChange={handleChange}>
              <option value="debito">💳 Débito</option>
              <option value="efectivo">💵 Efectivo</option>
              <option value="transferencia">🏦 Transferencia</option>
              <option value="fonasa">🏥 Fonasa</option>
              <option value="credito">💳 Crédito</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Estado</label>
            <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" name="estado" value={form.estado} onChange={handleChange}>
              <option value="pagado">Pagado</option>
              <option value="pendiente">Pendiente</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Notas (opcional)</label>
            <input className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" name="notas" placeholder="Ej: Bono FONASA recibido..." value={form.notas} onChange={handleChange} />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={guardar} className="flex-1 bg-green-700 text-white py-2 rounded-lg hover:bg-green-800 font-medium">Registrar pago</button>
          <button onClick={onCerrar} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 font-medium">Cancelar</button>
        </div>
      </div>
    </div>
  )
}
