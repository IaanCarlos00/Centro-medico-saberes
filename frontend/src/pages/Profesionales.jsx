import { useEffect, useState } from 'react'
import axios from 'axios'

const API = 'https://centro-medico-saberes-production.up.railway.app/profesionales'

export default function Profesionales() {
  const [profesionales, setProfesionales] = useState([])
  const [form, setForm] = useState({ rut: '', nombre: '', apellido: '', especialidad: '', color: '#15803d' })
  const [editando, setEditando] = useState(null)
  const [errores, setErrores] = useState({})
  const [modalForm, setModalForm] = useState(false)

  const cargar = async () => {
    const res = await axios.get(API)
    setProfesionales(res.data)
  }

  useEffect(() => { cargar() }, [])

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrores({ ...errores, [e.target.name]: '' })
  }

  const validar = () => {
    const e = {}
    if (!form.rut.trim()) e.rut = 'El RUT es obligatorio'
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio'
    if (!form.apellido.trim()) e.apellido = 'El apellido es obligatorio'
    if (!form.especialidad.trim()) e.especialidad = 'La especialidad es obligatoria'
    return e
  }

  const guardar = async () => {
    const e = validar()
    if (Object.keys(e).length > 0) { setErrores(e); return }
    if (editando) {
      await axios.put(`${API}/${editando}`, form)
      setEditando(null)
    } else {
      await axios.post(API, form)
    }
    setForm({ rut: '', nombre: '', apellido: '', especialidad: '', color: '#15803d' })
    setErrores({})
    setModalForm(false)
    cargar()
  }

  const editar = p => {
    setForm({ rut: p.rut, nombre: p.nombre, apellido: p.apellido, especialidad: p.especialidad, color: p.color || '#15803d' })
    setEditando(p.id)
    setErrores({})
    setModalForm(true)
  }

  const eliminar = async id => {
    if (confirm('¿Eliminar profesional?')) {
      await axios.delete(`${API}/${id}`)
      cargar()
    }
  }

  const cancelar = () => {
    setEditando(null)
    setForm({ rut: '', nombre: '', apellido: '', especialidad: '', color: '#15803d' })
    setErrores({})
    setModalForm(false)
  }

  const colores = [
    'linear-gradient(135deg, #166534, #15803d)',
    'linear-gradient(135deg, #0f766e, #0d9488)',
    'linear-gradient(135deg, #1d4ed8, #3b82f6)',
    'linear-gradient(135deg, #7c3aed, #8b5cf6)',
  ]

  return (
    <div className="min-h-screen bg-white">

      {/* Modal */}
      {modalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4" onClick={cancelar}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #052e16, #166534)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: 'rgba(255,255,255,0.15)' }}>
                  {editando ? '✏️' : '👩‍⚕️'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{editando ? 'Editar profesional' : 'Nueva profesional'}</h3>
                  <p className="text-green-300 text-xs">Completa todos los campos</p>
                </div>
              </div>
              <button onClick={cancelar} className="text-white hover:text-green-200 text-2xl leading-none">✕</button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: 'rut', label: 'RUT *', placeholder: '12.345.678-9' },
                  { name: 'especialidad', label: 'Especialidad *', placeholder: 'Ej: Matrona' },
                  { name: 'nombre', label: 'Nombre *', placeholder: 'Ej: Javiera' },
                  { name: 'apellido', label: 'Apellido *', placeholder: 'Ej: Silva' },
                ].map(f => (
                  <div key={f.name} className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-700">{f.label}</label>
                    <input
                      className={`border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 transition-colors ${errores[f.name] ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}
                      name={f.name} placeholder={f.placeholder} value={form[f.name]} onChange={handleChange}
                    />
                    {errores[f.name] && <span className="text-red-500 text-xs">{errores[f.name]}</span>}
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-1 mt-4">
                <label className="text-sm font-semibold text-gray-700">Color en la agenda</label>
                <p className="text-xs text-gray-400 mb-1">Se usa para mostrar su disponibilidad y sus citas en el calendario</p>
                <div className="flex items-center gap-3">
                  <input type="color" name="color" value={form.color} onChange={handleChange} className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer" />
                  <span className="text-sm text-gray-500">{form.color}</span>
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={cancelar} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 font-medium transition-colors">Cancelar</button>
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
          <p className="text-green-300 text-xs font-semibold uppercase tracking-widest mb-1">Equipo</p>
          <h2 className="text-3xl font-black text-white">Profesionales</h2>
          <p className="text-green-200 text-sm mt-1">{profesionales.length} profesional{profesionales.length !== 1 ? 'es' : ''} registrado{profesionales.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { cancelar(); setModalForm(true) }} className="relative z-10 flex items-center gap-2 text-sm font-bold px-5 py-3 rounded-2xl transition-all hover:scale-105 shrink-0" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.25)' }}>
          <span className="text-lg">+</span> Nueva profesional
        </button>
      </div>

      {/* Cards de profesionales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
        {profesionales.map((p, i) => (
          <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            {/* Top colored bar */}
            <div className="h-2 w-full" style={{ background: p.color || colores[i % colores.length] }} />
            <div className="p-5">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white shrink-0 shadow-sm" style={{ background: p.color || colores[i % colores.length] }}>
                  {p.foto
                    ? <img src={p.foto} alt={p.nombre} className="w-14 h-14 rounded-2xl object-cover" />
                    : `${p.nombre?.charAt(0)}${p.apellido?.charAt(0)}`
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-800 text-lg leading-tight">{p.nombre} {p.apellido}</p>
                  <span className="inline-block mt-1 text-xs font-semibold px-2.5 py-1 rounded-full text-white" style={{ background: p.color || colores[i % colores.length] }}>
                    {p.especialidad}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl mb-4">
                <span className="text-gray-400 text-sm">🪪</span>
                <span className="text-sm text-gray-600 font-medium">{p.rut}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => editar(p)} className="flex-1 text-xs font-semibold py-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">Editar</button>
                <button onClick={() => eliminar(p.id)} className="flex-1 text-xs font-semibold py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors">Eliminar</button>
              </div>
            </div>
          </div>
        ))}
        {profesionales.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-5xl mb-3">👩‍⚕️</p>
            <p className="text-gray-400">No hay profesionales registrados</p>
          </div>
        )}
      </div>
    </div>
  )
}