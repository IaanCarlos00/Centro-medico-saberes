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
  const [modalForm, setModalForm] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [usoProcedimientos, setUsoProcedimientos] = useState([])

  const cargar = async () => {
    const [cat, uso] = await Promise.all([
      axios.get(`${API}/catalogo`),
      axios.get(API)
    ])
    setCatalogo(cat.data)
    // Agrupar por nombre de procedimiento y contar
    const conteo = {}
    uso.data.forEach(p => {
      if (!p.nombre) return
      conteo[p.nombre] = (conteo[p.nombre] || 0) + 1
    })
    const ordenado = Object.entries(conteo)
      .map(([nombre, total]) => ({ nombre, total }))
      .sort((a, b) => b.total - a.total)
    setUsoProcedimientos(ordenado)
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
    setModalForm(false)
    cargar()
  }

  const editar = p => {
    setForm({ nombre: p.nombre, monto: p.monto })
    setEditando(p.id)
    setErrores({})
    setModalForm(true)
  }

  const eliminar = async id => {
    if (confirm('¿Desactivar este procedimiento?')) {
      await axios.delete(`${API}/catalogo/${id}`)
      cargar()
    }
  }

  const cerrarModal = () => {
    setModalForm(false)
    setEditando(null)
    setForm({ nombre: '', monto: '' })
    setErrores({})
  }

  const filtrados = catalogo.filter(p =>
    !busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  const totalPromedio = catalogo.length > 0
    ? catalogo.reduce((s, p) => s + parseFloat(p.monto), 0) / catalogo.length
    : 0

  const masCaros = [...catalogo].sort((a, b) => b.monto - a.monto).slice(0, 1)[0]
  const masBarato = [...catalogo].sort((a, b) => a.monto - b.monto).slice(0, 1)[0]

  return (
    <div className="min-h-screen bg-white">

      {/* Modal */}
      {modalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4" onClick={cerrarModal}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #052e16, #166534)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: 'rgba(255,255,255,0.15)' }}>
                  {editando ? '✏️' : '🩺'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{editando ? 'Editar procedimiento' : 'Nuevo procedimiento'}</h3>
                  <p className="text-green-300 text-xs">Completa los campos requeridos</p>
                </div>
              </div>
              <button onClick={cerrarModal} className="text-white hover:text-green-200 text-2xl leading-none">✕</button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-700">Nombre del procedimiento *</label>
                <input className={`border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 transition-colors ${errores.nombre ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`} name="nombre" placeholder="Ej: Control ginecológico" value={form.nombre} onChange={handleChange} />
                {errores.nombre && <span className="text-red-500 text-xs">{errores.nombre}</span>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-700">Monto ($) *</label>
                <input className={`border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 transition-colors ${errores.monto ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`} name="monto" type="number" placeholder="25000" value={form.monto} onChange={handleChange} />
                {errores.monto && <span className="text-red-500 text-xs">{errores.monto}</span>}
                {form.monto && !isNaN(form.monto) && Number(form.monto) > 0 && (
                  <span className="text-green-600 text-xs font-semibold">{formatCLP(Number(form.monto))}</span>
                )}
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={cerrarModal} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 font-medium transition-colors">Cancelar</button>
              <button onClick={guardar} className="flex-1 text-white py-3 rounded-xl font-bold transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg, #166534, #15803d)' }}>
                {editando ? '✓ Actualizar' : '+ Agregar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl mb-8 p-6 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #052e16 0%, #166534 60%, #15803d 100%)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #86efac, transparent)', transform: 'translate(30%, -30%)' }} />
        <div className="relative z-10">
          <p className="text-green-300 text-xs font-semibold uppercase tracking-widest mb-1">Catálogo</p>
          <h2 className="text-3xl font-black text-white">Procedimientos</h2>
          <p className="text-green-200 text-sm mt-1">{catalogo.length} procedimiento{catalogo.length !== 1 ? 's' : ''} registrado{catalogo.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { cerrarModal(); setModalForm(true) }} className="relative z-10 flex items-center gap-2 text-sm font-bold px-5 py-3 rounded-2xl transition-all hover:scale-105 shrink-0" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.25)' }}>
          <span className="text-lg">+</span> Nuevo
        </button>
      </div>

      {/* Stats */}
      {catalogo.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="rounded-2xl p-5 hover:shadow-md transition-shadow" style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #16a34a22' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: '#16a34a22' }}>📊</div>
              <span className="text-xs font-bold uppercase tracking-wider text-green-700">Promedio</span>
            </div>
            <p className="text-2xl font-black text-green-800">{formatCLP(totalPromedio)}</p>
            <p className="text-xs text-green-600 mt-1">Precio promedio</p>
          </div>
          {masCaros && (
            <div className="rounded-2xl p-5 hover:shadow-md transition-shadow" style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '1px solid #3b82f622' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: '#3b82f622' }}>⬆️</div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Más caro</span>
              </div>
              <p className="text-2xl font-black text-blue-800">{formatCLP(masCaros.monto)}</p>
              <p className="text-xs text-blue-600 mt-1 truncate">{masCaros.nombre}</p>
            </div>
          )}
          {masBarato && (
            <div className="rounded-2xl p-5 hover:shadow-md transition-shadow" style={{ background: 'linear-gradient(135deg, #f0fdfa, #ccfbf1)', border: '1px solid #14b8a622' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: '#14b8a622' }}>⬇️</div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Más económico</span>
              </div>
              <p className="text-2xl font-black text-teal-800">{formatCLP(masBarato.monto)}</p>
              <p className="text-xs text-teal-600 mt-1 truncate">{masBarato.nombre}</p>
            </div>
          )}
        </div>
      )}

      {/* Uso de procedimientos */}
      {usoProcedimientos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="rounded-2xl p-5 hover:shadow-md transition-shadow" style={{ background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', border: '1px solid #8b5cf622' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: '#8b5cf622' }}>🏆</div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-700">Más usado</span>
            </div>
            <p className="text-3xl font-black text-purple-800 mb-1">{usoProcedimientos[0].total}</p>
            <p className="text-sm font-bold text-purple-700 truncate">{usoProcedimientos[0].nombre}</p>
            <p className="text-xs text-purple-500 mt-1">{usoProcedimientos[0].total} vez{usoProcedimientos[0].total !== 1 ? 'es' : ''} realizado</p>
          </div>
          {usoProcedimientos.length > 1 && (
            <div className="rounded-2xl p-5 hover:shadow-md transition-shadow" style={{ background: 'linear-gradient(135deg, #fff7ed, #ffedd5)', border: '1px solid #f9741622' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: '#f9741622' }}>📉</div>
                <span className="text-xs font-bold uppercase tracking-wider text-orange-700">Menos usado</span>
              </div>
              <p className="text-3xl font-black text-orange-800 mb-1">{usoProcedimientos[usoProcedimientos.length - 1].total}</p>
              <p className="text-sm font-bold text-orange-700 truncate">{usoProcedimientos[usoProcedimientos.length - 1].nombre}</p>
              <p className="text-xs text-orange-500 mt-1">{usoProcedimientos[usoProcedimientos.length - 1].total} vez{usoProcedimientos[usoProcedimientos.length - 1].total !== 1 ? 'es' : ''} realizado</p>
            </div>
          )}
        </div>
      )}

      {/* Buscador */}
      <div className="mb-5 relative">
        <span className="absolute left-4 top-3 text-gray-400">🔍</span>
        <input className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 pl-11 focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm" placeholder="Buscar procedimiento..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        {busqueda && <button onClick={() => setBusqueda('')} className="absolute right-4 top-3 text-gray-400 hover:text-gray-600">✕</button>}
      </div>

      {/* Grid de procedimientos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtrados.map((p, i) => {
          const gradients = [
            'linear-gradient(135deg, #052e16, #166534)',
            'linear-gradient(135deg, #0f766e, #0d9488)',
            'linear-gradient(135deg, #1d4ed8, #3b82f6)',
            'linear-gradient(135deg, #7c3aed, #8b5cf6)',
            'linear-gradient(135deg, #b45309, #f59e0b)',
            'linear-gradient(135deg, #be185d, #ec4899)',
          ]
          const gradient = gradients[i % gradients.length]
          return (
            <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all hover:scale-[1.01]">
              <div className="h-1.5 w-full" style={{ background: gradient }} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black text-white shrink-0" style={{ background: gradient }}>
                    🩺
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-sm leading-tight">{p.nombre}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl mb-4" style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}>
                  <span className="text-xs text-green-600 font-semibold">Precio</span>
                  <span className="text-lg font-black text-green-800">{formatCLP(p.monto)}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => editar(p)} className="flex-1 text-xs font-semibold py-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">✏️ Editar</button>
                  <button onClick={() => eliminar(p.id)} className="flex-1 text-xs font-semibold py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors">🗑️ Eliminar</button>
                </div>
              </div>
            </div>
          )
        })}
        {filtrados.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-5xl mb-3">🩺</p>
            <p className="text-gray-400">{busqueda ? 'No se encontraron procedimientos' : 'No hay procedimientos registrados'}</p>
          </div>
        )}
      </div>
    </div>
  )
}