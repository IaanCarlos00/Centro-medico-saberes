import { useEffect, useState } from 'react'
import axios from 'axios'
import FichaIngreso1 from './FichaIngreso1'
import FichaIngreso2 from './FichaIngreso2'

const API = 'https://centro-medico-saberes-production.up.railway.app/fichas'
const API_PRO = 'https://centro-medico-saberes-production.up.railway.app/profesionales'
const API_FI = 'https://centro-medico-saberes-production.up.railway.app/fichas-ingreso'

const hoyStr = new Date().toISOString().slice(0, 10)

const formatFecha = fecha => {
  if (!fecha) return ''
  const solo = fecha.slice(0, 10)
  return new Date(solo + 'T12:00:00').toLocaleDateString('es-CL')
}

function ModalProcedimientos({ paciente, onCerrar }) {
  const [catalogo, setCatalogo] = useState([])
  const [procedimientos, setProcedimientos] = useState([])
  const [form, setForm] = useState({ catalogo_procedimiento_id: '', nombre: '', monto: '', metodo: 'efectivo', estado: 'pagado', notas: '' })
  const [errores, setErrores] = useState({})
  const API_PROC = 'https://centro-medico-saberes-production.up.railway.app/procedimientos'

  const formatCLP = n => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n)

  const cargar = async () => {
    const [cat, proc] = await Promise.all([
      axios.get(`${API_PROC}/catalogo`),
      axios.get(`${API_PROC}/paciente/${paciente.id}`)
    ])
    setCatalogo(cat.data)
    setProcedimientos(proc.data)
  }

  useEffect(() => { cargar() }, [])

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

        {/* Formulario nuevo procedimiento */}
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

        {/* Lista de procedimientos realizados */}
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

export default function Fichas({ paciente, onVolver }) {
  const [vista, setVista] = useState(null)
  const [fichas, setFichas] = useState([])
  const [fichasI1, setFichasI1] = useState([])
  const [fichasI2, setFichasI2] = useState([])
  const [profesionales, setProfesionales] = useState([])
  const [form, setForm] = useState({ motivo_consulta: '', diagnostico: '', tratamiento: '', observaciones: '', profesional_id: '', fecha: hoyStr })
  const [editando, setEditando] = useState(null)
  const [errores, setErrores] = useState({})
  const [modalSelector, setModalSelector] = useState(false)
  const [modalProcedimientos, setModalProcedimientos] = useState(false)

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
    setForm({ motivo_consulta: '', diagnostico: '', tratamiento: '', observaciones: '', profesional_id: '', fecha: hoyStr })
    setErrores({})
    cargar()
    setVista(null)
  }

  const editar = f => {
    setForm({
      motivo_consulta: f.motivo_consulta,
      diagnostico: f.diagnostico || '',
      tratamiento: f.tratamiento || '',
      observaciones: f.observaciones || '',
      profesional_id: f.profesional_id,
      fecha: f.fecha?.slice(0, 10) || hoyStr
    })
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
    setForm({ motivo_consulta: '', diagnostico: '', tratamiento: '', observaciones: '', profesional_id: '', fecha: hoyStr })
    setErrores({})
    setVista(null)
  }

  const imprimirPDF = f => {
    const ventana = window.open('', '_blank')
    ventana.document.write(`
      <html><head><title>Ficha Control — ${paciente.nombre} ${paciente.apellido}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; color: #333; }
        h1 { color: #166534; font-size: 18px; margin-bottom: 4px; }
        h2 { color: #166534; font-size: 13px; margin: 16px 0 6px; border-bottom: 1px solid #dcfce7; padding-bottom: 4px; }
        .campo { margin-bottom: 6px; }
        .valor { border-bottom: 1px solid #ddd; min-height: 18px; padding-bottom: 2px; margin-top: 2px; }
        @media print { button { display: none; } }
      </style></head><body>
      <h1>Ficha Control — ${paciente.nombre} ${paciente.apellido}</h1>
      <p>RUT: ${paciente.rut || 'No registrado'} | Fecha: ${formatFecha(f.fecha)} | Profesional: ${f.profesional_nombre} ${f.profesional_apellido}</p>
      <h2>Motivo de Consulta</h2>
      <div class="campo"><div class="valor">${f.motivo_consulta || ''}</div></div>
      <h2>Diagnóstico</h2>
      <div class="campo"><div class="valor">${f.diagnostico || ''}</div></div>
      <h2>Tratamiento</h2>
      <div class="campo"><div class="valor">${f.tratamiento || ''}</div></div>
      <h2>Observaciones</h2>
      <div class="campo"><div class="valor">${f.observaciones || ''}</div></div>
      <script>window.onload = () => window.print()</script>
      </body></html>
    `)
    ventana.document.close()
  }

  if (vista === 'ingreso1') return <FichaIngreso1 paciente={paciente} onVolver={() => { setVista(null); cargar() }} />
  if (vista === 'ingreso2') return <FichaIngreso2 paciente={paciente} onVolver={() => { setVista(null); cargar() }} />

  if (vista === 'control') return (
  <div>
    {modalProcedimientos && (
      <ModalProcedimientos
        paciente={paciente}
        onCerrar={() => setModalProcedimientos(false)}
      />
    )}

    <div className="flex items-center gap-3 mb-6">
      <button onClick={cancelar} className="text-green-700 hover:underline font-medium text-sm">← Volver</button>
      <h2 className="text-xl font-bold text-green-800">Ficha Control — {paciente.nombre} {paciente.apellido}</h2>
    </div>

    <div className="bg-white rounded-xl shadow p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">{editando ? 'Editar ficha' : 'Nueva ficha de control'}</h3>
      <div className="grid grid-cols-1 gap-4">
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Profesional *</label>
          <select className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.profesional_id ? 'border-red-400' : 'border-gray-300'}`} name="profesional_id" value={form.profesional_id} onChange={handleChange}>
            <option value="">Seleccionar profesional</option>
            {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido} — {p.especialidad}</option>)}
          </select>
          {errores.profesional_id && <span className="text-red-500 text-xs mt-1">{errores.profesional_id}</span>}
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Fecha de la consulta</label>
          <input className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" name="fecha" type="date" value={form.fecha} onChange={handleChange} />
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
        <button onClick={() => setModalProcedimientos(true)} className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-medium">+ Procedimientos</button>
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
                  <span className="text-xs text-gray-400">{formatFecha(f.fecha)}</span>
                  <p className="text-sm text-gray-500 mt-1">Por: <span className="font-medium text-gray-700">{f.profesional_nombre} {f.profesional_apellido}</span></p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => imprimirPDF(f)} className="text-blue-600 hover:underline text-sm font-medium">PDF</button>
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

  return (
    <div>
      {modalSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4" onClick={() => setModalSelector(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-green-800 mb-5">¿Qué tipo de ficha?</h3>
            <div className="flex flex-col gap-3">
              <button onClick={() => { setModalSelector(false); setVista('control') }} className="flex items-center gap-3 p-4 rounded-xl border-2 border-green-600 hover:bg-green-50 transition-colors text-left">
                <span className="text-2xl">📋</span>
                <div>
                  <p className="font-bold text-green-800">Ficha Control</p>
                  <p className="text-xs text-gray-500">{fichas.length} ficha{fichas.length !== 1 ? 's' : ''} registrada{fichas.length !== 1 ? 's' : ''}</p>
                </div>
              </button>
              <button onClick={() => { setModalSelector(false); setVista('ingreso1') }} className="flex items-center gap-3 p-4 rounded-xl border-2 border-orange-500 hover:bg-orange-50 transition-colors text-left">
                <span className="text-2xl">📝</span>
                <div>
                  <p className="font-bold text-green-800">Ficha Ingreso — Matrona 1</p>
                  <p className="text-xs text-gray-500">{fichasI1.length} ficha{fichasI1.length !== 1 ? 's' : ''} registrada{fichasI1.length !== 1 ? 's' : ''}</p>
                </div>
              </button>
              <button onClick={() => { setModalSelector(false); setVista('ingreso2') }} className="flex items-center gap-3 p-4 rounded-xl border-2 border-blue-500 hover:bg-blue-50 transition-colors text-left">
                <span className="text-2xl">🗂️</span>
                <div>
                  <p className="font-bold text-green-800">Ficha Ingreso — Matrona 2</p>
                  <p className="text-xs text-gray-500">{fichasI2.length} ficha{fichasI2.length !== 1 ? 's' : ''} registrada{fichasI2.length !== 1 ? 's' : ''}</p>
                </div>
              </button>
            </div>
            <button onClick={() => setModalSelector(false)} className="w-full mt-4 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 font-medium">Cancelar</button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onVolver} className="text-green-700 hover:underline font-medium text-sm">← Volver</button>
          <h2 className="text-xl font-bold text-green-800">Fichas — {paciente.nombre} {paciente.apellido}</h2>
        </div>
        <button onClick={() => setModalSelector(true)} className="bg-green-700 text-white px-5 py-2 rounded-lg hover:bg-green-800 font-medium">
          + Nueva ficha
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button onClick={() => setVista('control')} className="bg-white rounded-xl shadow p-4 border-t-4 border-green-600 text-left hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-1"><span className="text-xl">📋</span><p className="font-bold text-green-800">Ficha Control</p></div>
          <p className="text-2xl font-bold text-gray-800">{fichas.length}</p>
          <p className="text-xs text-gray-500">ficha{fichas.length !== 1 ? 's' : ''} registrada{fichas.length !== 1 ? 's' : ''}</p>
        </button>
        <button onClick={() => setVista('ingreso1')} className="bg-white rounded-xl shadow p-4 border-t-4 border-orange-500 text-left hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-1"><span className="text-xl">📝</span><p className="font-bold text-green-800">Ingreso Matrona 1</p></div>
          <p className="text-2xl font-bold text-gray-800">{fichasI1.length}</p>
          <p className="text-xs text-gray-500">ficha{fichasI1.length !== 1 ? 's' : ''} registrada{fichasI1.length !== 1 ? 's' : ''}</p>
        </button>
        <button onClick={() => setVista('ingreso2')} className="bg-white rounded-xl shadow p-4 border-t-4 border-blue-500 text-left hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-1"><span className="text-xl">🗂️</span><p className="font-bold text-green-800">Ingreso Matrona 2</p></div>
          <p className="text-2xl font-bold text-gray-800">{fichasI2.length}</p>
          <p className="text-xs text-gray-500">ficha{fichasI2.length !== 1 ? 's' : ''} registrada{fichasI2.length !== 1 ? 's' : ''}</p>
        </button>
      </div>

      {fichas.length > 0 && (
        <div className="bg-white rounded-xl shadow p-5 mb-4">
          <h3 className="text-lg font-bold text-gray-700 mb-3">Últimas fichas de control</h3>
          <div className="flex flex-col gap-3">
            {fichas.slice(0, 3).map(f => (
              <div key={f.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                <div>
                  <p className="font-medium text-gray-800">{f.motivo_consulta}</p>
                  <p className="text-xs text-gray-400">{formatFecha(f.fecha)} · {f.profesional_nombre} {f.profesional_apellido}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => imprimirPDF(f)} className="text-blue-600 text-xs hover:underline">PDF</button>
                  <button onClick={() => editar(f)} className="text-green-700 text-xs hover:underline">Editar</button>
                </div>
              </div>
            ))}
            {fichas.length > 3 && <button onClick={() => setVista('control')} className="text-green-700 text-xs hover:underline text-left">Ver todas ({fichas.length})</button>}
          </div>
        </div>
      )}

      {fichasI1.length > 0 && (
        <div className="bg-white rounded-xl shadow p-5 mb-4">
          <h3 className="text-lg font-bold text-gray-700 mb-3">Últimas fichas ingreso — Matrona 1</h3>
          <div className="flex flex-col gap-3">
            {fichasI1.slice(0, 3).map(f => (
              <div key={f.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                <div>
                  <p className="font-medium text-gray-800">{f.motivo_consulta}</p>
                  <p className="text-xs text-gray-400">{formatFecha(f.fecha)} · {f.profesional_nombre} {f.profesional_apellido}</p>
                </div>
                <button onClick={() => setVista('ingreso1')} className="text-orange-600 text-xs hover:underline">Ver</button>
              </div>
            ))}
            {fichasI1.length > 3 && <button onClick={() => setVista('ingreso1')} className="text-orange-600 text-xs hover:underline text-left">Ver todas ({fichasI1.length})</button>}
          </div>
        </div>
      )}

      {fichasI2.length > 0 && (
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="text-lg font-bold text-gray-700 mb-3">Últimas fichas ingreso — Matrona 2</h3>
          <div className="flex flex-col gap-3">
            {fichasI2.slice(0, 3).map(f => (
              <div key={f.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                <div>
                  <p className="font-medium text-gray-800">{f.motivo_consulta}</p>
                  <p className="text-xs text-gray-400">{formatFecha(f.fecha)} · {f.profesional_nombre} {f.profesional_apellido}</p>
                </div>
                <button onClick={() => setVista('ingreso2')} className="text-blue-600 text-xs hover:underline">Ver</button>
              </div>
            ))}
            {fichasI2.length > 3 && <button onClick={() => setVista('ingreso2')} className="text-blue-600 text-xs hover:underline text-left">Ver todas ({fichasI2.length})</button>}
          </div>
        </div>
      )}
    </div>
  )
}