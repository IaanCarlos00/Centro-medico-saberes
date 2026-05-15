import { useEffect, useState } from 'react'
import axios from 'axios'
import FichaIngreso1 from './FichaIngreso1'
import FichaIngreso2 from './FichaIngreso2'

const API = 'https://centro-medico-saberes-production.up.railway.app/fichas'
const API_PRO = 'https://centro-medico-saberes-production.up.railway.app/profesionales'

export default function Fichas({ paciente, onVolver }) {
  const [vista, setVista] = useState(null) // null = menu, 'control', 'ingreso1', 'ingreso2'
  const [fichas, setFichas] = useState([])
  const [profesionales, setProfesionales] = useState([])
  const [form, setForm] = useState({ motivo_consulta: '', diagnostico: '', tratamiento: '', observaciones: '', profesional_id: '' })
  const [editando, setEditando] = useState(null)
  const [errores, setErrores] = useState({})
  const [mostrarForm, setMostrarForm] = useState(false)

  const cargar = async () => {
    const [f, pr] = await Promise.all([
      axios.get(`${API}/paciente/${paciente.id}`),
      axios.get(API_PRO)
    ])
    setFichas(f.data)
    setProfesionales(pr.data)
  }

  useEffect(() => { if (vista === 'control') cargar() }, [vista])

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrores({ ...errores, [e.target.name]: '' })
  }

  const validar = () => {
    const e = {}
    if (!form.profesional_id) e.profesional_id = 'Selecciona un profesional'
    if (!form.motivo_consulta.trim()) e.motivo_consulta = 'El motivo es obligatorio'
    return e
  }

  const guardar = async () => {
    const e = validar()
    if (Object.keys(e).length > 0) { setErrores(e); return }
    if (editando) {
      await axios.put(`${API}/${editando}`, form)
      setEditando(null)
    } else {
      await axios.post(API, { ...form, paciente_id: paciente.id })
    }
    setForm({ motivo_consulta: '', diagnostico: '', tratamiento: '', observaciones: '', profesional_id: '' })
    setErrores({})
    setMostrarForm(false)
    cargar()
  }

  const editar = f => {
    setForm({ motivo_consulta: f.motivo_consulta, diagnostico: f.diagnostico || '', tratamiento: f.tratamiento || '', observaciones: f.observaciones || '', profesional_id: f.profesional_id })
    setEditando(f.id)
    setMostrarForm(true)
  }

  const eliminar = async id => {
    if (confirm('¿Eliminar ficha?')) {
      await axios.delete(`${API}/${id}`)
      cargar()
    }
  }

  const cancelar = () => {
    setEditando(null)
    setForm({ motivo_consulta: '', diagnostico: '', tratamiento: '', observaciones: '', profesional_id: '' })
    setErrores({})
    setMostrarForm(false)
  }

  // Vistas de fichas de ingreso
  if (vista === 'ingreso1') return <FichaIngreso1 paciente={paciente} onVolver={() => setVista(null)} />
  if (vista === 'ingreso2') return <FichaIngreso2 paciente={paciente} onVolver={() => setVista(null)} />

  // Menú de selección de tipo de ficha
  if (vista === null) return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onVolver} className="text-green-700 hover:underline font-medium text-sm">← Volver a pacientes</button>
        <h2 className="text-2xl font-bold text-green-800">Fichas — {paciente.nombre} {paciente.apellido}</h2>
      </div>

      <p className="text-gray-500 mb-6">Selecciona el tipo de ficha que deseas ver o crear:</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <button
          onClick={() => setVista('control')}
          className="bg-white rounded-2xl shadow p-6 border-t-4 border-green-600 hover:shadow-md transition-shadow text-left"
        >
          <div className="text-3xl mb-3">📋</div>
          <h3 className="text-lg font-bold text-green-800 mb-1">Ficha Control</h3>
          <p className="text-gray-500 text-sm">Registro de controles periódicos, diagnósticos y tratamientos</p>
        </button>

        <button
          onClick={() => setVista('ingreso1')}
          className="bg-white rounded-2xl shadow p-6 border-t-4 border-orange-500 hover:shadow-md transition-shadow text-left"
        >
          <div className="text-3xl mb-3">📝</div>
          <h3 className="text-lg font-bold text-green-800 mb-1">Ficha de Ingreso 1</h3>
          <p className="text-gray-500 text-sm">Anamnesis completa con parámetros clínicos y exploración</p>
        </button>

        <button
          onClick={() => setVista('ingreso2')}
          className="bg-white rounded-2xl shadow p-6 border-t-4 border-blue-500 hover:shadow-md transition-shadow text-left"
        >
          <div className="text-3xl mb-3">🗂️</div>
          <h3 className="text-lg font-bold text-green-800 mb-1">Ficha de Ingreso 2</h3>
          <p className="text-gray-500 text-sm">Ficha clínica con antecedentes gineco-obstétricos</p>
        </button>
      </div>
    </div>
  )

  // Vista ficha control
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setVista(null)} className="text-green-700 hover:underline font-medium text-sm">← Volver</button>
        <h2 className="text-xl font-bold text-green-800">Ficha Control</h2>
        <span className="text-gray-400 text-sm">/ {paciente.nombre} {paciente.apellido}</span>
      </div>

      {!mostrarForm && (
        <button onClick={() => setMostrarForm(true)} className="bg-green-700 text-white px-5 py-2 rounded-lg hover:bg-green-800 font-medium mb-6">
          + Nueva ficha
        </button>
      )}

      {mostrarForm && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">{editando ? 'Editar ficha' : 'Nueva ficha de control'}</h3>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col">
              <select
                className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.profesional_id ? 'border-red-400' : 'border-gray-300'}`}
                name="profesional_id" value={form.profesional_id} onChange={handleChange}
              >
                <option value="">Seleccionar profesional</option>
                {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido} — {p.especialidad}</option>)}
              </select>
              {errores.profesional_id && <span className="text-red-500 text-xs mt-1">{errores.profesional_id}</span>}
            </div>
            <div className="flex flex-col">
              <textarea
                className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.motivo_consulta ? 'border-red-400' : 'border-gray-300'}`}
                name="motivo_consulta" placeholder="Motivo de consulta *" rows={2}
                value={form.motivo_consulta} onChange={handleChange}
              />
              {errores.motivo_consulta && <span className="text-red-500 text-xs mt-1">{errores.motivo_consulta}</span>}
            </div>
            <textarea className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" name="diagnostico" placeholder="Diagnóstico" rows={2} value={form.diagnostico} onChange={handleChange} />
            <textarea className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" name="tratamiento" placeholder="Tratamiento" rows={2} value={form.tratamiento} onChange={handleChange} />
            <textarea className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" name="observaciones" placeholder="Observaciones" rows={2} value={form.observaciones} onChange={handleChange} />
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={guardar} className="bg-green-700 text-white px-5 py-2 rounded-lg hover:bg-green-800 font-medium">
              {editando ? 'Actualizar' : 'Guardar ficha'}
            </button>
            <button onClick={cancelar} className="bg-gray-200 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-300 font-medium">Cancelar</button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {fichas.map(f => (
          <div key={f.id} className="bg-white rounded-xl shadow p-6 border-l-4 border-green-600">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-xs text-gray-400">{new Date(f.fecha).toLocaleString('es-CL')}</span>
                <p className="text-sm text-gray-500 mt-1">Atendido por: <span className="font-medium text-gray-700">{f.profesional_nombre} {f.profesional_apellido}</span></p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => editar(f)} className="text-green-700 hover:underline text-sm font-medium">Editar</button>
                <button onClick={() => eliminar(f.id)} className="text-red-500 hover:underline text-sm font-medium">Eliminar</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div><span className="font-semibold text-gray-600">Motivo:</span> <span className="text-gray-800">{f.motivo_consulta}</span></div>
              {f.diagnostico && <div><span className="font-semibold text-gray-600">Diagnóstico:</span> <span className="text-gray-800">{f.diagnostico}</span></div>}
              {f.tratamiento && <div><span className="font-semibold text-gray-600">Tratamiento:</span> <span className="text-gray-800">{f.tratamiento}</span></div>}
              {f.observaciones && <div><span className="font-semibold text-gray-600">Observaciones:</span> <span className="text-gray-800">{f.observaciones}</span></div>}
            </div>
          </div>
        ))}
        {fichas.length === 0 && (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-400">No hay fichas de control registradas</div>
        )}
      </div>
    </div>
  )
}