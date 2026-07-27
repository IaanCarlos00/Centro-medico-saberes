import { useEffect, useState } from 'react'
import axios from 'axios'

const API = 'https://centro-medico-saberes-production.up.railway.app/horarios'
const API_PRO = 'https://centro-medico-saberes-production.up.railway.app/profesionales'

const DIAS = [
  { valor: 1, label: 'Lunes' },
  { valor: 2, label: 'Martes' },
  { valor: 3, label: 'Miércoles' },
  { valor: 4, label: 'Jueves' },
  { valor: 5, label: 'Viernes' },
  { valor: 6, label: 'Sábado' },
  { valor: 0, label: 'Domingo' },
]

export default function HorariosMatronas() {
  const [horarios, setHorarios] = useState([])
  const [profesionales, setProfesionales] = useState([])
  const [form, setForm] = useState({ profesional_id: '', dia_semana: 1, hora_inicio: '08:00', hora_fin: '12:00' })
  const [editando, setEditando] = useState(null)
  const [errores, setErrores] = useState({})
  const [modalForm, setModalForm] = useState(false)

  const cargar = async () => {
    const [h, p] = await Promise.all([axios.get(API), axios.get(API_PRO)])
    setHorarios(h.data)
    setProfesionales(p.data)
  }

  useEffect(() => { cargar() }, [])

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrores({ ...errores, [e.target.name]: '' })
  }

  const validar = () => {
    const e = {}
    if (!form.profesional_id) e.profesional_id = 'Selecciona una matrona'
    if (!form.hora_inicio) e.hora_inicio = 'Obligatorio'
    if (!form.hora_fin) e.hora_fin = 'Obligatorio'
    if (form.hora_inicio && form.hora_fin && form.hora_fin <= form.hora_inicio) e.hora_fin = 'Debe ser posterior a la hora de inicio'
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
    setForm({ profesional_id: '', dia_semana: 1, hora_inicio: '08:00', hora_fin: '12:00' })
    setErrores({})
    setModalForm(false)
    cargar()
  }

  const editar = h => {
    setForm({ profesional_id: h.profesional_id, dia_semana: h.dia_semana, hora_inicio: h.hora_inicio, hora_fin: h.hora_fin })
    setEditando(h.id)
    setErrores({})
    setModalForm(true)
  }

  const eliminar = async id => {
    if (confirm('¿Eliminar este bloque de horario?')) {
      await axios.delete(`${API}/${id}`)
      cargar()
    }
  }

  const cancelar = () => {
    setEditando(null)
    setForm({ profesional_id: '', dia_semana: 1, hora_inicio: '08:00', hora_fin: '12:00' })
    setErrores({})
    setModalForm(false)
  }

  return (
    <div className="min-h-screen bg-white">
      {modalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4" onClick={cancelar}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg, #052e16, #166534)' }}>
              <h3 className="text-lg font-bold text-white">{editando ? 'Editar bloque' : 'Nuevo bloque de horario'}</h3>
              <p className="text-green-300 text-xs">Define en qué días y horas atiende cada matrona</p>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-700">Matrona *</label>
                <select name="profesional_id" value={form.profesional_id} onChange={handleChange}
                  className={`border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.profesional_id ? 'border-red-400' : 'border-gray-200'}`}>
                  <option value="">Seleccionar matrona</option>
                  {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
                </select>
                {errores.profesional_id && <span className="text-red-500 text-xs">{errores.profesional_id}</span>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-700">Día *</label>
                <select name="dia_semana" value={form.dia_semana} onChange={handleChange}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400">
                  {DIAS.map(d => <option key={d.valor} value={d.valor}>{d.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">Desde *</label>
                  <input type="time" name="hora_inicio" value={form.hora_inicio} onChange={handleChange}
                    className={`border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.hora_inicio ? 'border-red-400' : 'border-gray-200'}`} />
                  {errores.hora_inicio && <span className="text-red-500 text-xs">{errores.hora_inicio}</span>}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">Hasta *</label>
                  <input type="time" name="hora_fin" value={form.hora_fin} onChange={handleChange}
                    className={`border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.hora_fin ? 'border-red-400' : 'border-gray-200'}`} />
                  {errores.hora_fin && <span className="text-red-500 text-xs">{errores.hora_fin}</span>}
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={cancelar} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 font-medium">Cancelar</button>
              <button onClick={guardar} className="flex-1 text-white py-3 rounded-xl font-bold hover:opacity-90" style={{ background: 'linear-gradient(135deg, #166534, #15803d)' }}>
                {editando ? '✓ Actualizar' : '+ Agregar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative overflow-hidden rounded-3xl mb-8 p-6 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #052e16 0%, #166534 60%, #15803d 100%)' }}>
        <div>
          <p className="text-green-300 text-xs font-semibold uppercase tracking-widest mb-1">Agenda</p>
          <h2 className="text-3xl font-black text-white">Horarios por matrona</h2>
          <p className="text-green-200 text-sm mt-1">Disponibilidad semanal que se muestra en el calendario</p>
        </div>
        <button onClick={() => { cancelar(); setModalForm(true) }} className="flex items-center gap-2 text-sm font-bold px-5 py-3 rounded-2xl hover:scale-105 transition-all shrink-0" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.25)' }}>
          <span className="text-lg">+</span> Nuevo bloque
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {DIAS.map(dia => {
          const bloques = horarios.filter(h => Number(h.dia_semana) === dia.valor)
          return (
            <div key={dia.valor} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <p className="font-black text-gray-800 mb-3">{dia.label}</p>
              {bloques.length === 0 ? (
                <p className="text-sm text-gray-400">Sin bloques definidos</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {bloques.map(h => (
                    <div key={h.id} className="flex items-center justify-between gap-3 p-3 rounded-xl" style={{ background: `${h.profesional_color || '#15803d'}1a` }}>
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ background: h.profesional_color || '#15803d' }} />
                        <span className="text-sm font-semibold text-gray-800">{h.profesional_nombre} {h.profesional_apellido}</span>
                        <span className="text-sm text-gray-500">{h.hora_inicio} – {h.hora_fin}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => editar(h)} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white text-gray-600 hover:bg-gray-100">Editar</button>
                        <button onClick={() => eliminar(h.id)} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white text-red-600 hover:bg-red-50">Eliminar</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
