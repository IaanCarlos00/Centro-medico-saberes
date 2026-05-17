import { useEffect, useState } from 'react'
import axios from 'axios'

const API = 'https://centro-medico-saberes-production.up.railway.app/procedimientos'

function formatCLP(n) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n)
}

export default function Procedimientos() {
  const [catalogo, setCatalogo] = useState([])
  const [form, setForm] = useState({ nombre: '', monto: '' })
  const [editando, setEditando] = useState(null)
  const [errores, setErrores] = useState({})
  const [mostrarForm, setMostrarForm] = useState(false)

  const cargar = async () => {
    const res = await axios.get(`${API}/catalogo`)
    setCatalogo(res.data)
  }

  useEffect(() => { cargar() }, [])

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrores({ ...errores, [e.target.name]: '' })
  }

  const validar = () => {
    const e = {}
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio'
    if (!form.monto || isNaN(form.monto) || Number(form.monto) <= 0) e.monto = 'Ingresa un monto válido'
    return e
  }

  const guardar = async () => {
    const e = validar()
    if (Object.keys(e).length > 0) { setErrores(e); return }
    if (editando) {
      await axios.put(`${API}/catalogo/${editando}`, { ...form, activo: true })
      setEditando(null)
    } else {
      await axios.post(`${API}/catalogo`, form)
    }
    setForm({ nombre: '', monto: '' })
    setErrores({})
    setMostrarForm(false)
    cargar()
  }

  const editar = p => {
    setForm({ nombre: p.nombre, monto: p.monto })
    setEditando(p.id)
    setMostrarForm(true)
  }

  const eliminar = async id => {
    if (confirm('¿Desactivar este procedimiento?')) {
      await axios.delete(`${API}/catalogo/${id}`)
      cargar()
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-green-800">Catálogo de procedimientos</h2>
        <button onClick={() => { setMostrarForm(!mostrarForm); if (mostrarForm) { setEditando(null); setForm({ nombre: '', monto: '' }) } }} className="bg-green-700 text-white px-5 py-2 rounded-lg hover:bg-green-800 font-medium">
          {mostrarForm ? 'Cancelar' : '+ Nuevo procedimiento'}
        </button>
      </div>

      {mostrarForm && (
        <div className="bg-white rounded-xl shadow p-5 mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">{editando ? 'Editar procedimiento' : 'Nuevo procedimiento'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Nombre *</label>
              <input className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.nombre ? 'border-red-400' : 'border-gray-300'}`} name="nombre" placeholder="Ej: Control ginecológico" value={form.nombre} onChange={handleChange} />
              {errores.nombre && <span className="text-red-500 text-xs mt-1">{errores.nombre}</span>}
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Monto ($) *</label>
              <input className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.monto ? 'border-red-400' : 'border-gray-300'}`} name="monto" type="number" placeholder="25000" value={form.monto} onChange={handleChange} />
              {errores.monto && <span className="text-red-500 text-xs mt-1">{errores.monto}</span>}
            </div>
          </div>
          <button onClick={guardar} className="bg-green-700 text-white px-5 py-2 rounded-lg hover:bg-green-800 font-medium mt-4">
            {editando ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-green-50 text-green-800 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Procedimiento</th>
              <th className="px-4 py-3 text-left">Monto</th>
              <th className="px-4 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {catalogo.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{p.nombre}</td>
                <td className="px-4 py-3 text-gray-700 font-semibold">{formatCLP(p.monto)}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => editar(p)} className="text-green-700 hover:underline text-sm font-medium">Editar</button>
                  <button onClick={() => eliminar(p.id)} className="text-red-500 hover:underline text-sm font-medium">Eliminar</button>
                </td>
              </tr>
            ))}
            {catalogo.length === 0 && (
              <tr><td colSpan="3" className="px-4 py-6 text-center text-gray-400">No hay procedimientos registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}