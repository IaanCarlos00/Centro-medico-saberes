import { useEffect, useState } from 'react'
import axios from 'axios'
import FichaIngreso1 from './FichaIngreso1'
import FichaIngreso2 from './FichaIngreso2'

const API = 'https://centro-medico-saberes-production.up.railway.app/fichas'
const API_PRO = 'https://centro-medico-saberes-production.up.railway.app/profesionales'
const API_FI = 'https://centro-medico-saberes-production.up.railway.app/fichas-ingreso'

export default function Fichas({ paciente, onVolver }) {
  const [vista, setVista] = useState(null)
  const [fichas, setFichas] = useState([])
  const [fichasI1, setFichasI1] = useState([])
  const [fichasI2, setFichasI2] = useState([])
  const [profesionales, setProfesionales] = useState([])
  const [form, setForm] = useState({ motivo_consulta: '', diagnostico: '', tratamiento: '', observaciones: '', profesional_id: '' })
  const [editando, setEditando] = useState(null)
  const [errores, setErrores] = useState({})

  const cargar = async () => {
    const [f, pr, fi1, fi2] = await Promise.all([
      axios.get(`${API}/paciente/${paciente.id}`),
      axios.get(API_PRO),
      axios.get(`${API_FI}/1/paciente/${paciente.id}`),
      axios.get(`${API_FI}/2/paciente/${paciente.id}`)
    ])
    setFichas(f.data)
    setProfesionales(pr.data)
    setFichasI1(fi1.data)
    setFichasI2(fi2.data)
  }

  useEffect(() => { cargar() }, [])

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
    cargar()
  }

  const editar = f => {
    setForm({ motivo_consulta: f.motivo_consulta, diagnostico: f.diagnostico || '', tratamiento: f.tratamiento || '', observaciones: f.observaciones || '', profesional_id: f.profesional_id })
    setEditando(f.id)
    setVista('control')
    window.scrollTo(0, 0)
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
  }

  if (vista === 'ingreso1') return <FichaIngreso1 paciente={paciente} onVolver={() => { setVista(null); cargar() }} />
  if (vista === 'ingreso2') return <FichaIngreso2 paciente={paciente} onVolver={() => { setVista(null); cargar() }} />

  if (vista === 'control') return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => { setVista(null); cancelar() }} className="text-green-700 hover:underline font-medium text-sm">← Volver</button>
        <h2 className="text-xl font-bold text-green-800">Ficha Control — {paciente.nombre} {paciente.apellido}</h2>
      </div>

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">{editando ? 'Editar ficha' : 'Nueva ficha de control'}</h3>
        <div className="grid grid-cols-1 gap-4">
          <div className="flex flex-col">
            <select className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.profesional_id ? 'border-red-400' : 'border-gray-300'}`} name="profesional_id" value={form.profesional_id} onChange={handleChange}>
              <option value="">Seleccionar profesional</option>
              {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido} — {p.especialidad}</option>)}
            </select>
            {errores.profesional_id && <span className="text-red-500 text-xs mt-1">{errores.profesional_id}</span>}
          </div>
          <div className="flex flex-col">
            <textarea className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.motivo_consulta ? 'border-red-400' : 'border-gray-300'}`} name="motivo_consulta" placeholder="Motivo de consulta *" rows={2} value={form.motivo_consulta} onChange={handleChange} />
            {errores.motivo_consulta && <span className="text-red-500 text-xs mt-1">{errores.motivo_consulta}</span>}
          </div>
          <textarea className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" name="diagnostico" placeholder="Diagnóstico" rows={2} value={form.diagnostico} onChange={handleChange} />
          <textarea className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" name="tratamiento" placeholder="Tratamiento" rows={2} value={form.tratamiento} onChange={handleChange} />
          <textarea className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" name="observaciones" placeholder="Observaciones" rows={2} value={form.observaciones} onChange={handleChange} />
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={guardar} className="bg-green-700 text-white px-5 py-2 rounded-lg hover:bg-green-800 font-medium">{editando ? 'Actualizar' : 'Guardar ficha'}</button>
          {editando && <button onClick={cancelar} className="bg-gray-200 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-300 font-medium">Cancelar</button>}
        </div>
      </div>

      {fichas.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-700 mb-3">Fichas anteriores</h3>
          <div className="flex flex-col gap-4">
            {fichas.map(f => (
              <div key={f.id} className="bg-white rounded-xl shadow p-5 border-l-4 border-green-600">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-xs text-gray-400">{new Date(f.fecha).toLocaleString('es-CL')}</span>
                    <p className="text-sm text-gray-500 mt-1">Por: <span className="font-medium text-gray-700">{f.profesional_nombre} {f.profesional_apellido}</span></p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => editar(f)} className="text-green-700 hover:underline text-sm font-medium">Editar</button>
                    <button onClick={() => eliminar(f.id)} className="text-red-500 hover:underline text-sm font-medium">Eliminar</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div><span className="font-semibold text-gray-600">Motivo:</span> {f.motivo_consulta}</div>
                  {f.diagnostico && <div><span className="font-semibold text-gray-600">Diagnóstico:</span> {f.diagnostico}</div>}
                  {f.tratamiento && <div><span className="font-semibold text-gray-600">Tratamiento:</span> {f.tratamiento}</div>}
                  {f.observaciones && <div><span className="font-semibold text-gray-600">Observaciones:</span> {f.observaciones}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  // Vista principal — todas las fichas visibles
  return (
    <div>
      <h2 className="text-xl font-bold text-green-800 mb-6">Fichas — {paciente.nombre} {paciente.apellido}</h2>

      {/* Ficha Control */}
      <div className="bg-white rounded-2xl shadow p-5 border-t-4 border-green-600 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📋</span>
            <div>
              <h3 className="font-bold text-green-800">Ficha Control</h3>
              <p className="text-xs text-gray-500">{fichas.length} ficha{fichas.length !== 1 ? 's' : ''} registrada{fichas.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button onClick={() => setVista('control')} className="bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-green-800">
            + Nueva ficha
          </button>
        </div>
        {fichas.length > 0 && (
          <div className="flex flex-col gap-2 mt-2">
            {fichas.slice(0, 2).map(f => (
              <div key={f.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                <div>
                  <p className="font-medium text-gray-800 truncate">{f.motivo_consulta}</p>
                  <p className="text-xs text-gray-400">{new Date(f.fecha).toLocaleDateString('es-CL')} · {f.profesional_nombre} {f.profesional_apellido}</p>
                </div>
                <button onClick={() => editar(f)} className="text-green-700 text-xs hover:underline ml-2 flex-shrink-0">Editar</button>
              </div>
            ))}
            {fichas.length > 2 && (
              <button onClick={() => setVista('control')} className="text-green-700 text-xs hover:underline text-left">Ver todas ({fichas.length})</button>
            )}
          </div>
        )}
      </div>

      {/* Ficha Ingreso 1 */}
      <div className="bg-white rounded-2xl shadow p-5 border-t-4 border-orange-500 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📝</span>
            <div>
              <h3 className="font-bold text-green-800">Ficha de Ingreso — Matrona 1</h3>
              <p className="text-xs text-gray-500">{fichasI1.length} ficha{fichasI1.length !== 1 ? 's' : ''} registrada{fichasI1.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button onClick={() => setVista('ingreso1')} className="bg-orange-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-orange-600">
            {fichasI1.length === 0 ? '+ Nueva ficha' : '+ Nueva / Ver'}
          </button>
        </div>
        {fichasI1.length > 0 && (
          <div className="flex flex-col gap-2">
            {fichasI1.slice(0, 2).map(f => (
              <div key={f.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                <div>
                  <p className="font-medium text-gray-800 truncate">{f.motivo_consulta}</p>
                  <p className="text-xs text-gray-400">{new Date(f.fecha).toLocaleDateString('es-CL')} · {f.profesional_nombre} {f.profesional_apellido}</p>
                </div>
              </div>
            ))}
            {fichasI1.length > 2 && (
              <button onClick={() => setVista('ingreso1')} className="text-orange-600 text-xs hover:underline text-left">Ver todas ({fichasI1.length})</button>
            )}
          </div>
        )}
      </div>

      {/* Ficha Ingreso 2 */}
      <div className="bg-white rounded-2xl shadow p-5 border-t-4 border-blue-500 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🗂️</span>
            <div>
              <h3 className="font-bold text-green-800">Ficha de Ingreso — Matrona 2</h3>
              <p className="text-xs text-gray-500">{fichasI2.length} ficha{fichasI2.length !== 1 ? 's' : ''} registrada{fichasI2.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button onClick={() => setVista('ingreso2')} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700">
            {fichasI2.length === 0 ? '+ Nueva ficha' : '+ Nueva / Ver'}
          </button>
        </div>
        {fichasI2.length > 0 && (
          <div className="flex flex-col gap-2">
            {fichasI2.slice(0, 2).map(f => (
              <div key={f.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                <div>
                  <p className="font-medium text-gray-800 truncate">{f.motivo_consulta}</p>
                  <p className="text-xs text-gray-400">{new Date(f.fecha).toLocaleDateString('es-CL')} · {f.profesional_nombre} {f.profesional_apellido}</p>
                </div>
              </div>
            ))}
            {fichasI2.length > 2 && (
              <button onClick={() => setVista('ingreso2')} className="text-blue-600 text-xs hover:underline text-left">Ver todas ({fichasI2.length})</button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}