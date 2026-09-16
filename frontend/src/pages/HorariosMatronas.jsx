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
  const [form, setForm] = useState({ profesional_id: '', dia_semana: 1, hora: '08:30', sobrecupo: false })
  const [editando, setEditando] = useState(null)
  const [errores, setErrores] = useState({})
  const [modalForm, setModalForm] = useState(false)

  const [modoMultiple, setModoMultiple] = useState(true)
  const [formRango, setFormRango] = useState({ profesional_id: '', dias: [1], hora_inicio: '08:30', hora_fin: '13:00', intervalo: 30, sobrecupo: false })
  const [generando, setGenerando] = useState(false)
  const [resultadoGeneracion, setResultadoGeneracion] = useState(null)

  const cargar = async () => {
    const [h, p] = await Promise.all([axios.get(API), axios.get(API_PRO)])
    setHorarios(h.data)
    setProfesionales(p.data)
  }

  useEffect(() => { cargar() }, [])

  const handleChange = e => {
    const { name, type, checked, value } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
    setErrores({ ...errores, [name]: '' })
  }

  const validar = () => {
    const e = {}
    if (!form.profesional_id) e.profesional_id = 'Selecciona una matrona'
    if (!form.hora) e.hora = 'Obligatorio'
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
    setForm({ profesional_id: '', dia_semana: 1, hora: '08:30', sobrecupo: false })
    setErrores({})
    setModalForm(false)
    cargar()
  }

  const editar = h => {
    setForm({ profesional_id: h.profesional_id, dia_semana: h.dia_semana, hora: h.hora, sobrecupo: !!h.sobrecupo })
    setEditando(h.id)
    setErrores({})
    setModoMultiple(false)
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
    setForm({ profesional_id: '', dia_semana: 1, hora: '08:30', sobrecupo: false })
    setErrores({})
    setModalForm(false)
    setResultadoGeneracion(null)
  }

  const handleChangeRango = e => {
    const { name, type, checked, value } = e.target
    setFormRango({ ...formRango, [name]: type === 'checkbox' ? checked : value })
    setErrores({ ...errores, [name]: '' })
  }

  const toggleDia = valor => {
    setFormRango(f => ({
      ...f,
      dias: f.dias.includes(valor) ? f.dias.filter(d => d !== valor) : [...f.dias, valor]
    }))
  }

  const generarHoras = (inicio, fin, intervalo) => {
    const horas = []
    let [h, m] = inicio.split(':').map(Number)
    const [hf, mf] = fin.split(':').map(Number)
    let actual = h * 60 + m
    const limite = hf * 60 + mf
    while (actual < limite) {
      const hh = String(Math.floor(actual / 60)).padStart(2, '0')
      const mm = String(actual % 60).padStart(2, '0')
      horas.push(`${hh}:${mm}`)
      actual += Number(intervalo)
    }
    return horas
  }

  const validarRango = () => {
    const e = {}
    if (!formRango.profesional_id) e.profesional_id = 'Selecciona una matrona'
    if (formRango.dias.length === 0) e.dias = 'Selecciona al menos un día'
    if (!formRango.hora_inicio || !formRango.hora_fin) e.hora_inicio = 'Obligatorio'
    else if (formRango.hora_fin <= formRango.hora_inicio) e.hora_fin = 'Debe ser mayor a la hora de inicio'
    return e
  }

  const generarBloques = async () => {
    const e = validarRango()
    if (Object.keys(e).length > 0) { setErrores(e); return }
    setGenerando(true)
    setResultadoGeneracion(null)
    try {
      const horas = generarHoras(formRango.hora_inicio, formRango.hora_fin, formRango.intervalo)
      let creados = 0, omitidos = 0
      for (const dia of formRango.dias) {
        for (const hora of horas) {
          const yaExiste = horarios.some(h => String(h.profesional_id) === String(formRango.profesional_id) && Number(h.dia_semana) === Number(dia) && h.hora === hora)
          if (yaExiste) { omitidos++; continue }
          await axios.post(API, { profesional_id: formRango.profesional_id, dia_semana: dia, hora, sobrecupo: formRango.sobrecupo })
          creados++
        }
      }
      await cargar()
      setResultadoGeneracion({ creados, omitidos })
    } finally {
      setGenerando(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {modalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4" onClick={cancelar}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 shrink-0" style={{ background: 'linear-gradient(135deg, #052e16, #166534)' }}>
              <h3 className="text-lg font-bold text-white">
                {editando ? 'Editar bloque' : modoMultiple ? 'Generar horario semanal' : 'Nuevo bloque suelto'}
              </h3>
              <p className="text-green-300 text-xs">
                {modoMultiple ? 'Crea todos los bloques de un rango de horas en un solo paso' : 'Define en qué día y hora atiende la matrona'}
              </p>
            </div>

            {modoMultiple ? (
              <div className="p-6 flex flex-col gap-4 overflow-y-auto">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">Matrona *</label>
                  <select name="profesional_id" value={formRango.profesional_id} onChange={handleChangeRango}
                    className={`border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.profesional_id ? 'border-red-400' : 'border-gray-200'}`}>
                    <option value="">Seleccionar matrona</option>
                    {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
                  </select>
                  {errores.profesional_id && <span className="text-red-500 text-xs">{errores.profesional_id}</span>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">Días *</label>
                  <div className="flex flex-wrap gap-2">
                    {DIAS.map(d => (
                      <button key={d.valor} type="button" onClick={() => toggleDia(d.valor)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-colors ${formRango.dias.includes(d.valor) ? 'bg-green-600 border-green-600 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                        {d.label.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                  {errores.dias && <span className="text-red-500 text-xs">{errores.dias}</span>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-700">Desde *</label>
                    <input type="time" name="hora_inicio" value={formRango.hora_inicio} onChange={handleChangeRango}
                      className={`border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.hora_inicio ? 'border-red-400' : 'border-gray-200'}`} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-700">Hasta *</label>
                    <input type="time" name="hora_fin" value={formRango.hora_fin} onChange={handleChangeRango}
                      className={`border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.hora_fin ? 'border-red-400' : 'border-gray-200'}`} />
                    {errores.hora_fin && <span className="text-red-500 text-xs">{errores.hora_fin}</span>}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">Cada cuánto atiende *</label>
                  <select name="intervalo" value={formRango.intervalo} onChange={handleChangeRango}
                    className="border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400">
                    <option value={15}>15 minutos</option>
                    <option value={20}>20 minutos</option>
                    <option value={30}>30 minutos</option>
                    <option value={45}>45 minutos</option>
                    <option value={60}>60 minutos</option>
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    {formRango.hora_inicio && formRango.hora_fin && formRango.hora_fin > formRango.hora_inicio
                      ? `Se crearán ${generarHoras(formRango.hora_inicio, formRango.hora_fin, formRango.intervalo).length} bloques por día seleccionado.`
                      : ''}
                  </p>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="sobrecupo" checked={formRango.sobrecupo} onChange={handleChangeRango}
                    className="w-4 h-4 rounded accent-amber-500" />
                  <span className="text-sm text-gray-700">Marcar todos como sobrecupo</span>
                </label>

                {resultadoGeneracion && (
                  <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800">
                    ✅ Se crearon {resultadoGeneracion.creados} bloques nuevos
                    {resultadoGeneracion.omitidos > 0 && ` (${resultadoGeneracion.omitidos} ya existían y se omitieron)`}.
                  </div>
                )}

                <button type="button" onClick={() => { setModoMultiple(false); setErrores({}) }} className="text-xs text-green-700 font-semibold hover:underline self-start">
                  ¿Prefieres agregar solo un bloque suelto? →
                </button>
              </div>
            ) : (
              <div className="p-6 flex flex-col gap-4 overflow-y-auto">
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
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">Hora *</label>
                  <input type="time" name="hora" value={form.hora} onChange={handleChange}
                    className={`border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.hora ? 'border-red-400' : 'border-gray-200'}`} />
                  {errores.hora && <span className="text-red-500 text-xs">{errores.hora}</span>}
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="sobrecupo" checked={form.sobrecupo} onChange={handleChange}
                    className="w-4 h-4 rounded accent-amber-500" />
                  <span className="text-sm text-gray-700">Sobrecupo (solo si hay espacio, ej. colación)</span>
                </label>
                {!editando && (
                  <button type="button" onClick={() => { setModoMultiple(true); setErrores({}) }} className="text-xs text-green-700 font-semibold hover:underline self-start">
                    ← Volver a generar un rango completo
                  </button>
                )}
              </div>
            )}

            <div className="px-6 pb-6 pt-2 flex gap-3 shrink-0">
              <button onClick={cancelar} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 font-medium">Cancelar</button>
              {modoMultiple ? (
                <button onClick={generarBloques} disabled={generando} className={`flex-1 text-white py-3 rounded-xl font-bold transition-all ${generando ? 'bg-gray-400 cursor-not-allowed' : 'hover:opacity-90'}`} style={{ background: generando ? undefined : 'linear-gradient(135deg, #166534, #15803d)' }}>
                  {generando ? 'Generando...' : '⚡ Generar bloques'}
                </button>
              ) : (
                <button onClick={guardar} className="flex-1 text-white py-3 rounded-xl font-bold hover:opacity-90" style={{ background: 'linear-gradient(135deg, #166534, #15803d)' }}>
                  {editando ? '✓ Actualizar' : '+ Agregar'}
                </button>
              )}
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
        <button onClick={() => { cancelar(); setModoMultiple(true); setFormRango({ profesional_id: '', dias: [1], hora_inicio: '08:30', hora_fin: '13:00', intervalo: 30, sobrecupo: false }); setModalForm(true) }} className="flex items-center gap-2 text-sm font-bold px-5 py-3 rounded-2xl hover:scale-105 transition-all shrink-0" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.25)' }}>
          <span className="text-lg">+</span> Nuevo horario
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
                        <span className="text-sm text-gray-500">{h.hora}</span>
                        {h.sobrecupo && <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">Sobrecupo</span>}
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