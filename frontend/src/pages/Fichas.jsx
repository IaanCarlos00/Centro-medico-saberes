import { useEffect, useState } from 'react'
import axios from 'axios'
import FichaIngreso1 from './FichaIngreso1'
import FichaIngreso2 from './FichaIngreso2'
import ModalProcedimientos from './ModalProcedimientos'
import ModalConfirmar from '../components/ModalConfirmar'
import Toast from '../components/Toast'

const API = 'https://centro-medico-saberes-production.up.railway.app/fichas'
const API_PRO = 'https://centro-medico-saberes-production.up.railway.app/profesionales'
const API_FI = 'https://centro-medico-saberes-production.up.railway.app/fichas-ingreso'
const API_ARCHIVOS = 'https://centro-medico-saberes-production.up.railway.app/archivos'

const hoyStr = new Date().toISOString().slice(0, 10)

const formatFecha = fecha => {
  if (!fecha) return ''
  return new Date(fecha.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-CL')
}

const CAMPOS_I1 = [
  ['motivo_consulta','Motivo',2],['direccion','Dirección',2],['ocupacion','Ocupación',1],['paridad','Paridad',1],
  ['fur','FUR',1],['ciclos_menstruales','Ciclos menstruales',1],['mac','MAC',1],['menarquia','Menarquia',1],
  ['ivs','IVS',1],['orientacion_sexual','Orientación sexual',1],['parejas_sexuales','Parejas sexuales',1],
  ['pareja_actual','Pareja actual',1],['its','ITS',1],['uso_pstv','Uso PSTV',1],['eco_tv','ECO TV',1],
  ['pap','PAP',1],['presion_arterial','Presión arterial',1],['peso','Peso',1],['altura','Altura',1],
  ['efm','EFM',1],['especulo','Espéculo',1],['vacuna_vph','Vacuna VPH',1],
  ['ant_morbidos','Ant. mórbidos',2],['ant_familiares','Ant. familiares',2],['ant_ca_mama','Ant. Ca mama fam.',2],
  ['medicamentos','Medicamentos',2],['tabaco','Tabaco',1],['alcohol','Alcohol',1],['drogas','Drogas',1],
  ['alimentacion','Alimentación',1],['ejercicio','Ejercicio',1],['alergias','Alergias',2],
  ['cirugias','Cirugías',2],['examenes_sangre','Exámenes sangre',2],['indicaciones','Indicaciones',2],
  ['observaciones','Observaciones',2],
]

const CAMPOS_I2 = [
  ['motivo_consulta','Motivo',2],['edad','Edad',1],['gpa','GPA',1],['ocupacion','Ocupación',1],
  ['pareja','Pareja',1],['red_apoyo','Red de apoyo',2],['fur','FUR',1],['mac','MAC',1],
  ['menarquia','Menarquia',1],['menstruaciones','Menstruaciones',2],['ias','IAS',1],
  ['parejas_sexuales','Parejas sexuales',1],['sexo_biologico','Sexo biológico',1],['its','ITS',1],
  ['eco_tv','ECO TV',1],['pap','PAP',1],['eco_mam_mamo','ECO MAM/MAMO',1],['ant_cacu','Ant. CaCu',1],
  ['ant_ca_mama','Ant. Ca mama',1],['ant_morbidos','Ant. mórbidos',2],['cirugias','Cirugías',2],
  ['alergias','Alergias',2],['medicamentos','Medicamentos',2],['tabaco','Tabaco',1],['alcohol','Alcohol',1],
  ['drogas','Drogas',1],['examenes_sangre','Exámenes sangre',2],['observaciones','Observaciones',2],
]

export default function Fichas({ paciente, onVolver }) {
  const [vista, setVista] = useState(null)
  const [fichas, setFichas] = useState([])
  const [fichasI1, setFichasI1] = useState([])
  const [fichasI2, setFichasI2] = useState([])
  const [profesionales, setProfesionales] = useState([])
  const [form, setForm] = useState({ motivo_consulta: '', diagnostico: '', tratamiento: '', observaciones: '', profesional_id: '', fecha: hoyStr, proximo_control: '' })
  const [editando, setEditando] = useState(null)
  const [errores, setErrores] = useState({})
  const [mostrarForm, setMostrarForm] = useState(false)
  const [modalSelector, setModalSelector] = useState(false)
  const [modalProcedimientos, setModalProcedimientos] = useState(false)
  const [archivos, setArchivos] = useState([])
  const [subiendoArchivo, setSubiendoArchivo] = useState(false)
  const [descripcionArchivo, setDescripcionArchivo] = useState('')
  const [editandoDatos, setEditandoDatos] = useState(false)
  const [modalEliminar, setModalEliminar] = useState(null)
  const [toast, setToast] = useState(null)
  const [modalSalirAviso, setModalSalirAviso] = useState(null)
  const [modalPDF, setModalPDF] = useState(null)
  const [modalFichasIngreso, setModalFichasIngreso] = useState(false)
  const [fichasIngresoData, setFichasIngresoData] = useState({ i1: [], i2: [] })
  const [tabIngreso, setTabIngreso] = useState('v')
  const [formDatos, setFormDatos] = useState({
    rut: paciente.rut || '',
    telefono: paciente.telefono || '',
    fecha_nacimiento: paciente.fecha_nacimiento?.slice(0, 10) || '',
    email: paciente.email || ''
  })

  const cargar = async () => {
    const [f, pr, fi1, fi2, arch] = await Promise.all([
      axios.get(`${API}/paciente/${paciente.id}`),
      axios.get(API_PRO),
      axios.get(`${API_FI}/1/paciente/${paciente.id}`),
      axios.get(`${API_FI}/2/paciente/${paciente.id}`),
      axios.get(`${API_ARCHIVOS}/paciente/${paciente.id}`)
    ])
    setFichas(f.data)
    setProfesionales(pr.data)
    setFichasI1(fi1.data)
    setFichasI2(fi2.data)
    setArchivos(arch.data)
  }

  useEffect(() => {
    cargar()
    try {
  const borrador = localStorage.getItem(`borrador_control_${paciente.id}`)
  if (borrador) {
    const datos = JSON.parse(borrador)
    setForm(datos)
    setMostrarForm(true)
  }
} catch (e) {
  localStorage.removeItem(`borrador_control_${paciente.id}`)
}
  }, [])

  useEffect(() => {
    const tieneCambios = vista === 'control' && mostrarForm && (form.motivo_consulta.trim() !== '' || form.diagnostico.trim() !== '' || form.tratamiento.trim() !== '')
    const handler = e => { if (!tieneCambios) return; e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [vista, form, mostrarForm])

  const handleChange = e => {
    const nuevoForm = { ...form, [e.target.name]: e.target.value }
    setForm(nuevoForm)
    setErrores({ ...errores, [e.target.name]: '' })
    localStorage.setItem(`borrador_control_${paciente.id}`, JSON.stringify(nuevoForm))
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
    setForm({ motivo_consulta: '', diagnostico: '', tratamiento: '', observaciones: '', profesional_id: '', fecha: hoyStr, proximo_control: '' })
    setErrores({})
    setMostrarForm(false)
    localStorage.removeItem(`borrador_control_${paciente.id}`)
    cargar()
  }
s
  const editar = f => {
    setForm({ motivo_consulta: f.motivo_consulta, diagnostico: f.diagnostico || '', tratamiento: f.tratamiento || '', observaciones: f.observaciones || '', profesional_id: f.profesional_id, fecha: f.fecha?.slice(0, 10) || hoyStr, proximo_control: f.proximo_control?.slice(0, 10) || '' })
    setEditando(f.id)
    setMostrarForm(true)
    window.scrollTo(0, 0)
  }

  const eliminar = async id => setModalEliminar(id)

  const salirConAviso = (accion) => {
    const tieneCambios = mostrarForm && (form.motivo_consulta.trim() !== '' || form.diagnostico.trim() !== '' || form.tratamiento.trim() !== '')
    if (tieneCambios) setModalSalirAviso(() => accion)
    else accion()
  }

  const confirmarEliminar = async () => {
    await axios.delete(`${API}/${modalEliminar}`)
    setModalEliminar(null)
    setToast({ mensaje: 'Ficha eliminada', tipo: 'exito' })
    cargar()
  }

  const cancelar = () => {
    setEditando(null)
    setForm({ motivo_consulta: '', diagnostico: '', tratamiento: '', observaciones: '', profesional_id: '', fecha: hoyStr, proximo_control: '' })
    setErrores({})
    setMostrarForm(false)
  }

  const calcularEdad = fecha => {
    if (!fecha) return null
    const hoy = new Date()
    const nac = new Date(fecha.slice(0, 10) + 'T12:00:00')
    let edad = hoy.getFullYear() - nac.getFullYear()
    const m = hoy.getMonth() - nac.getMonth()
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--
    return edad
  }

  const subirArchivo = async e => {
    const archivo = e.target.files[0]
    if (!archivo) return
    setSubiendoArchivo(true)
    const formData = new FormData()
    formData.append('archivo', archivo)
    formData.append('paciente_id', paciente.id)
    formData.append('descripcion', descripcionArchivo)
    await axios.post(`${API_ARCHIVOS}/subir`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    setDescripcionArchivo('')
    setSubiendoArchivo(false)
    cargar()
  }

  const eliminarArchivo = async id => {
    if (confirm('¿Eliminar archivo?')) {
      await axios.delete(`${API_ARCHIVOS}/${id}`)
      cargar()
    }
  }

  const cargarFichasIngreso = async () => {
    const [fi1, fi2] = await Promise.all([axios.get(`${API_FI}/1/paciente/${paciente.id}`), axios.get(`${API_FI}/2/paciente/${paciente.id}`)])
    setFichasIngresoData({ i1: fi1.data, i2: fi2.data })
    setModalFichasIngreso(true)
  }

  const generarHTMLPDF = f => `
    <html><head><title>Ficha Control — ${paciente.nombre} ${paciente.apellido}</title>
    <style>body{font-family:Arial,sans-serif;font-size:12px;margin:20px;color:#333;}h1{color:#166534;font-size:18px;margin-bottom:4px;}h2{color:#166534;font-size:13px;margin:16px 0 6px;border-bottom:1px solid #dcfce7;padding-bottom:4px;}.campo{margin-bottom:6px;}.valor{border-bottom:1px solid #ddd;min-height:18px;padding-bottom:2px;margin-top:2px;}button{margin-top:20px;padding:8px 16px;background:#166534;color:white;border:none;border-radius:6px;cursor:pointer;}@media print{button{display:none;}}</style>
    </head><body>
    <h1>Ficha Control — ${paciente.nombre} ${paciente.apellido}</h1>
    <p>RUT: ${paciente.rut || 'No registrado'} | Fecha: ${formatFecha(f.fecha)} | Profesional: ${f.profesional_nombre} ${f.profesional_apellido}</p>
    <h2>Motivo de Consulta</h2><div class="campo"><div class="valor">${f.motivo_consulta || ''}</div></div>
    <h2>Diagnóstico</h2><div class="campo"><div class="valor">${f.diagnostico || ''}</div></div>
    <h2>Tratamiento</h2><div class="campo"><div class="valor">${f.tratamiento || ''}</div></div>
    <h2>Observaciones</h2><div class="campo"><div class="valor">${f.observaciones || ''}</div></div>
    <button onclick="window.print()">Imprimir PDF</button></body></html>`

  if (vista === 'ingresoV') return <FichaIngreso1 paciente={paciente} onVolver={() => { setVista(null); cargar() }} />
  if (vista === 'ingresoJ') return <FichaIngreso2 paciente={paciente} onVolver={() => { setVista(null); cargar() }} />

  // ══════════════════════════════
  // VISTA CONTROL
  // ══════════════════════════════
  if (vista === 'control') return (
    <div className="min-h-screen bg-white">
      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onCerrar={() => setToast(null)} />}
      {modalEliminar && <ModalConfirmar titulo="¿Eliminar ficha?" mensaje="Esta acción no se puede deshacer." textoConfirmar="Eliminar" onConfirmar={confirmarEliminar} onCancelar={() => setModalEliminar(null)} />}
      {modalProcedimientos && <ModalProcedimientos paciente={paciente} onCerrar={() => setModalProcedimientos(false)} />}

      {/* Modal PDF */}
      {modalPDF && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 px-4" onClick={() => setModalPDF(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #052e16, #166534)' }}>
              <div>
                <h3 className="font-bold text-white">Vista previa</h3>
                <p className="text-green-300 text-xs">{paciente.nombre} {paciente.apellido}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { const blob = new Blob([generarHTMLPDF(modalPDF)], { type: 'text/html' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.target = '_blank'; a.click(); URL.revokeObjectURL(url) }} className="bg-white text-green-800 px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-50">🖨️ Imprimir</button>
                <button onClick={() => setModalPDF(null)} className="text-white hover:text-green-200 text-2xl">✕</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <p className="text-xs text-gray-400 mb-4 pb-3 border-b border-gray-100">{formatFecha(modalPDF.fecha)} · {modalPDF.profesional_nombre} {modalPDF.profesional_apellido}</p>
              <div className="flex flex-col gap-4 text-sm">
                {[['Motivo de consulta', modalPDF.motivo_consulta], ['Diagnóstico', modalPDF.diagnostico], ['Tratamiento', modalPDF.tratamiento], ['Observaciones', modalPDF.observaciones]].map(([label, val]) => val ? (
                  <div key={label}>
                    <p className="font-bold text-gray-500 text-xs uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-gray-800 bg-gray-50 rounded-xl p-3 border border-gray-100">{val}</p>
                  </div>
                ) : null)}
                {modalPDF.proximo_control && <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 px-3 py-1.5 rounded-full text-xs font-bold w-fit">📅 Próximo control: {formatFecha(modalPDF.proximo_control)}</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal fichas ingreso */}
      {modalFichasIngreso && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4" onClick={() => setModalFichasIngreso(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 flex items-center justify-between shrink-0" style={{ background: 'linear-gradient(135deg, #052e16, #166534)' }}>
              <div>
                <h3 className="text-lg font-bold text-white">Fichas de ingreso</h3>
                <p className="text-green-300 text-xs">{paciente.nombre} {paciente.apellido}</p>
              </div>
              <button onClick={() => setModalFichasIngreso(false)} className="text-white hover:text-green-200 text-2xl">✕</button>
            </div>
            <div className="flex border-b border-gray-100 shrink-0">
              {[['v', '📝 Matrona V', fichasIngresoData.i1.length, 'text-orange-600 border-orange-500'], ['j', '🗂️ Matrona J', fichasIngresoData.i2.length, 'text-blue-600 border-blue-500']].map(([key, label, count, activeClass]) => (
                <button key={key} onClick={() => setTabIngreso(key)} className={`flex-1 py-3 text-sm font-semibold transition-colors ${tabIngreso === key ? `${activeClass} border-b-2` : 'text-gray-400 hover:text-gray-600'}`}>
                  {label} ({count})
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {(tabIngreso === 'v' ? fichasIngresoData.i1 : fichasIngresoData.i2).length === 0 ? (
                <p className="text-center text-gray-300 py-8">Sin fichas de ingreso registradas</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {(tabIngreso === 'v' ? fichasIngresoData.i1 : fichasIngresoData.i2).map(f => (
                    <div key={f.id} className={`rounded-2xl p-4 border ${tabIngreso === 'v' ? 'border-orange-100 bg-orange-50' : 'border-blue-100 bg-blue-50'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-xs text-gray-400">{formatFecha(f.fecha)}</p>
                          <p className="text-sm font-semibold text-gray-700">{f.profesional_nombre} {f.profesional_apellido}</p>
                        </div>
                        {f.proximo_control && <span className="text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded-full font-bold">📅 {formatFecha(f.proximo_control)}</span>}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {(tabIngreso === 'v' ? CAMPOS_I1 : CAMPOS_I2).map(([key, label, cols]) => f[key] ? (
                          <div key={key} className={cols === 2 ? 'col-span-2' : ''}>
                            <span className="font-bold text-gray-500">{label}: </span>
                            <span className="text-gray-700">{f[key]}</span>
                          </div>
                        ) : null)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal salir aviso */}
      {modalSalirAviso && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[200] px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-6 text-center" style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <span className="text-4xl">⚠️</span>
              </div>
              <h3 className="text-xl font-bold text-white">¿Salir sin guardar?</h3>
              <p className="text-orange-100 text-sm mt-1">Tienes cambios sin guardar</p>
            </div>
            <div className="px-6 py-5 text-center">
              <p className="text-gray-500 text-sm">Si sales ahora perderás los cambios realizados en la ficha.</p>
            </div>
            <div className="px-6 pb-6 flex flex-col gap-3">
              <button onClick={() => setModalSalirAviso(null)} className="w-full text-white py-3 rounded-2xl font-bold" style={{ background: 'linear-gradient(135deg, #166534, #15803d)' }}>✏️ Seguir editando</button>
              <button onClick={() => { modalSalirAviso(); setModalSalirAviso(null) }} className="w-full bg-gray-100 text-gray-600 py-3 rounded-2xl font-medium hover:bg-gray-200">🚪 Salir sin guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Header sticky */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 py-3 mb-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => salirConAviso(() => setVista(null))} className="flex items-center gap-1 text-green-700 hover:text-green-800 font-semibold text-sm">← Volver</button>
          <div className="w-px h-5 bg-gray-200" />
          <h2 className="text-base font-bold text-gray-800 hidden sm:block">Ficha Control — <span className="text-green-700">{paciente.nombre} {paciente.apellido}</span></h2>
          <h2 className="text-sm font-bold text-green-800 sm:hidden">{paciente.nombre}</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={cargarFichasIngreso} className="border border-gray-200 text-gray-600 px-3 py-2 rounded-xl hover:bg-gray-50 font-semibold text-sm transition-colors">📋 Ingreso</button>
          <button onClick={() => { cancelar(); setMostrarForm(true) }} className="text-white px-3 py-2 rounded-xl font-bold text-sm" style={{ background: 'linear-gradient(135deg, #166534, #15803d)' }}>+ Nueva ficha</button>
        </div>
      </div>

      {/* Datos del paciente */}
      <div className="rounded-2xl p-5 mb-6 border border-green-100" style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}>
        <div className="flex justify-between items-center mb-3">
          <p className="text-xs font-bold text-green-800 uppercase tracking-wider flex items-center gap-2">
            <span className="w-6 h-6 bg-green-700 rounded-lg flex items-center justify-center text-white text-xs">👤</span>
            Datos del paciente
          </p>
          <button onClick={() => setEditandoDatos(!editandoDatos)} className="text-xs font-semibold text-green-700 bg-white px-3 py-1.5 rounded-lg hover:bg-green-50 border border-green-200 transition-colors">
            {editandoDatos ? 'Cancelar' : '✏️ Editar'}
          </button>
        </div>
        {editandoDatos ? (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[['Nombre','nombre','text',formDatos.nombre||paciente.nombre],['Apellido','apellido','text',formDatos.apellido||paciente.apellido],['RUT','rut','text',formDatos.rut],['Teléfono','telefono','text',formDatos.telefono],['Fecha nacimiento','fecha_nacimiento','date',formDatos.fecha_nacimiento],['Email','email','email',formDatos.email]].map(([label, key, type, val]) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600">{label}</label>
                  <input type={type} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white" value={val} onChange={e => setFormDatos(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <button onClick={async () => {
              await axios.put(`https://centro-medico-saberes-production.up.railway.app/pacientes/${paciente.id}`, { ...paciente, ...formDatos, nombre: formDatos.nombre || paciente.nombre, apellido: formDatos.apellido || paciente.apellido })
              setEditandoDatos(false)
              Object.assign(paciente, formDatos)
            }} className="text-white px-4 py-2 rounded-xl text-sm font-bold self-start" style={{ background: 'linear-gradient(135deg, #166534, #15803d)' }}>Guardar cambios</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {[['Nombre', `${paciente.nombre} ${paciente.apellido}`], ['RUT', paciente.rut || '—'], ['Nacimiento', paciente.fecha_nacimiento ? `${new Date(paciente.fecha_nacimiento.slice(0,10)+'T12:00:00').toLocaleDateString('es-CL')} (${calcularEdad(paciente.fecha_nacimiento)} años)` : '—'], ['Teléfono', paciente.telefono || '—'], ...(paciente.email ? [['Email', paciente.email]] : [])].map(([label, val]) => (
              <div key={label}>
                <p className="text-xs text-green-700 font-semibold mb-0.5">{label}</p>
                <p className="font-semibold text-gray-800 text-sm">{val}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fichas anteriores */}
      {fichas.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center text-sm">📋</span>
            Fichas anteriores
          </h3>
          <div className="flex flex-col gap-4">
            {fichas.map(f => (
              <div key={f.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #166534, #15803d)' }} />
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-xs font-semibold text-green-700">{formatFecha(f.fecha)}</p>
                      <p className="text-sm text-gray-500 mt-0.5">Por: <span className="font-semibold text-gray-700">{f.profesional_nombre} {f.profesional_apellido}</span></p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setModalPDF(f)} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">🖨️ PDF</button>
                      <button onClick={() => editar(f)} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors">Editar</button>
                      <button onClick={() => eliminar(f.id)} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">Eliminar</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {[['Motivo', f.motivo_consulta], ['Diagnóstico', f.diagnostico], ['Tratamiento', f.tratamiento], ['Observaciones', f.observaciones]].map(([label, val]) => val ? (
                      <div key={label}>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                        <p className="text-gray-700">{val}</p>
                      </div>
                    ) : null)}
                  </div>
                  {f.proximo_control && (
                    <div className="mt-3">
                      <span className="inline-flex items-center gap-1.5 bg-teal-50 text-teal-700 px-3 py-1.5 rounded-full text-xs font-bold border border-teal-100">
                        📅 Próximo control: {formatFecha(f.proximo_control)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulario */}
      {mostrarForm ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-gray-800">{editando ? '✏️ Editar ficha' : '📝 Nueva ficha de control'}</h3>
            <button onClick={() => salirConAviso(cancelar)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">Profesional *</label>
              <select className={`border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.profesional_id ? 'border-red-400 bg-red-50' : 'border-gray-200'}`} name="profesional_id" value={form.profesional_id} onChange={handleChange}>
                <option value="">Seleccionar profesional</option>
                {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido} — {p.especialidad}</option>)}
              </select>
              {errores.profesional_id && <span className="text-red-500 text-xs">{errores.profesional_id}</span>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">Fecha de la consulta</label>
              <input type="date" className="border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" name="fecha" value={form.fecha} onChange={handleChange} />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {[['motivo_consulta','Motivo de consulta *',errores.motivo_consulta],['diagnostico','Diagnóstico',null],['tratamiento','Tratamiento',null],['observaciones','Observaciones',null]].map(([name, placeholder, error]) => (
              <div key={name} className="flex flex-col gap-1">
                <textarea className={`border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none ${error ? 'border-red-400 bg-red-50' : 'border-gray-200'}`} name={name} placeholder={placeholder} rows={2} value={form[name]} onChange={handleChange} />
                {error && <span className="text-red-500 text-xs">{error}</span>}
              </div>
            ))}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">Próximo control <span className="text-gray-400 font-normal">(opcional)</span></label>
              <input type="date" className="border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" name="proximo_control" value={form.proximo_control || ''} onChange={handleChange} />
            </div>
          </div>
          <div className="flex gap-2 mt-5">
            <button onClick={guardar} className="text-white px-5 py-2.5 rounded-xl font-bold hover:opacity-90" style={{ background: 'linear-gradient(135deg, #166534, #15803d)' }}>{editando ? '✓ Actualizar' : 'Guardar ficha'}</button>
            <button onClick={() => setModalProcedimientos(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700">+ Procedimientos</button>
            <button onClick={() => salirConAviso(cancelar)} className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-xl font-medium hover:bg-gray-200">Cancelar</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setMostrarForm(true)} className="w-full border-2 border-dashed border-green-200 rounded-2xl py-4 text-green-700 font-semibold hover:bg-green-50 transition-colors mb-6 flex items-center justify-center gap-2">
          <span className="text-xl">+</span> Nueva ficha de control
        </button>
      )}
    </div>
  )

  // ══════════════════════════════
  // VISTA PRINCIPAL
  // ══════════════════════════════
  return (
    <div className="min-h-screen bg-white">
      {modalSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4" onClick={() => setModalSelector(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg, #052e16, #166534)' }}>
              <h3 className="text-lg font-bold text-white">¿Qué tipo de ficha?</h3>
              <p className="text-green-300 text-xs mt-1">{paciente.nombre} {paciente.apellido}</p>
            </div>
            <div className="p-5 flex flex-col gap-3">
              {[
                { label: 'Ficha Control', sub: `${fichas.length} ficha${fichas.length !== 1 ? 's' : ''}`, icon: '📋', border: '#16a34a', bg: '#f0fdf4', action: () => { setModalSelector(false); setVista('control') } },
                { label: 'Ficha Ingreso — Matrona V', sub: `${fichasI1.length} ficha${fichasI1.length !== 1 ? 's' : ''}`, icon: '📝', border: '#f97316', bg: '#fff7ed', action: () => { setModalSelector(false); setVista('ingresoV') } },
                { label: 'Ficha Ingreso — Matrona J', sub: `${fichasI2.length} ficha${fichasI2.length !== 1 ? 's' : ''}`, icon: '🗂️', border: '#3b82f6', bg: '#eff6ff', action: () => { setModalSelector(false); setVista('ingresoJ') } },
              ].map((item, i) => (
                <button key={i} onClick={item.action} className="flex items-center gap-3 p-4 rounded-2xl text-left transition-all hover:scale-[1.01]" style={{ border: `2px solid ${item.border}`, background: item.bg }}>
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="font-bold text-gray-800">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.sub} registrada{fichas.length !== 1 ? 's' : ''}</p>
                  </div>
                </button>
              ))}
              <button onClick={() => setModalSelector(false)} className="w-full bg-gray-100 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-200">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl mb-8 p-6 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #052e16 0%, #166534 60%, #15803d 100%)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #86efac, transparent)', transform: 'translate(30%, -30%)' }} />
        <div className="relative z-10">
          <button onClick={onVolver} className="text-green-300 text-xs font-semibold hover:text-white mb-2 flex items-center gap-1">← Volver a pacientes</button>
          <h2 className="text-2xl font-black text-white">Fichas Clínicas</h2>
          <p className="text-green-200 text-sm mt-1">{paciente.nombre} {paciente.apellido}</p>
        </div>
        <button onClick={() => setModalSelector(true)} className="relative z-10 flex items-center gap-2 text-sm font-bold px-5 py-3 rounded-2xl transition-all hover:scale-105 shrink-0" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.25)' }}>
          <span className="text-lg">+</span> Nueva ficha
        </button>
      </div>

      {/* Cards de tipo de ficha */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Ficha Control', icon: '📋', count: fichas.length, control: fichas[0]?.proximo_control, gradient: 'linear-gradient(135deg, #166534, #15803d)', border: '#16a34a22', action: () => setVista('control') },
          { label: 'Ingreso Matrona V', icon: '📝', count: fichasI1.length, control: fichasI1[0]?.proximo_control, gradient: 'linear-gradient(135deg, #c2410c, #f97316)', border: '#f9741622', action: () => setVista('ingresoV') },
          { label: 'Ingreso Matrona J', icon: '🗂️', count: fichasI2.length, control: fichasI2[0]?.proximo_control, gradient: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', border: '#3b82f622', action: () => setVista('ingresoJ') },
        ].map((card, i) => (
          <button key={i} onClick={card.action} className="bg-white rounded-2xl shadow-sm border text-left p-5 hover:shadow-md transition-all hover:scale-[1.01] overflow-hidden" style={{ border: `1px solid ${card.border}` }}>
            <div className="h-1 w-full rounded-full mb-4" style={{ background: card.gradient }} />
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{card.icon}</span>
              <p className="font-bold text-gray-800 text-sm">{card.label}</p>
            </div>
            <p className="text-4xl font-black text-gray-800 mb-1">{card.count}</p>
            <p className="text-xs text-gray-400">ficha{card.count !== 1 ? 's' : ''} registrada{card.count !== 1 ? 's' : ''}</p>
            {card.control && <p className="text-xs text-teal-700 font-semibold mt-2">📅 Próx. control: {formatFecha(card.control)}</p>}
          </button>
        ))}
      </div>

      {/* Resúmenes */}
      {[
        { fichasArr: fichas, title: 'Últimas fichas de control', color: 'text-green-700', action: () => setVista('control'), actionLabel: 'Ver todas', onItemClick: f => { setVista('control'); setModalPDF(f) }, itemActionLabel: 'PDF', itemAction2: editar, itemAction2Label: 'Editar' },
        { fichasArr: fichasI1, title: 'Últimas fichas — Matrona V', color: 'text-orange-600', action: () => setVista('ingresoV'), actionLabel: 'Ver todas', onItemClick: null },
        { fichasArr: fichasI2, title: 'Últimas fichas — Matrona J', color: 'text-blue-600', action: () => setVista('ingresoJ'), actionLabel: 'Ver todas', onItemClick: null },
      ].map(({ fichasArr, title, color, action, actionLabel, onItemClick, itemActionLabel, itemAction2, itemAction2Label }, idx) => fichasArr.length > 0 && (
        <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-800">{title}</h3>
            <button onClick={action} className={`text-xs font-semibold ${color} hover:underline`}>{actionLabel} ({fichasArr.length}) →</button>
          </div>
          <div className="flex flex-col gap-2">
            {fichasArr.slice(0, 3).map(f => (
              <div key={f.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{f.motivo_consulta}</p>
                  <p className="text-xs text-gray-400">{formatFecha(f.fecha)} · {f.profesional_nombre} {f.profesional_apellido}</p>
                </div>
                <div className="flex gap-1">
                  {onItemClick && <button onClick={() => onItemClick(f)} className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100`}>{itemActionLabel}</button>}
                  {itemAction2 && <button onClick={() => itemAction2(f)} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100">{itemAction2Label}</button>}
                  {!onItemClick && <button onClick={action} className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-gray-100 ${color} hover:bg-gray-200`}>Ver</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Archivos */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mt-4">
        <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center text-sm">📎</span>
          Archivos del paciente
        </h3>
        <div className="flex flex-col gap-3 mb-4">
          <input className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="Descripción del archivo (opcional)" value={descripcionArchivo} onChange={e => setDescripcionArchivo(e.target.value)} />
          <label className={`cursor-pointer text-white px-4 py-2.5 rounded-xl font-bold text-sm text-center transition-all hover:opacity-90 ${subiendoArchivo ? 'opacity-50' : ''}`} style={{ background: 'linear-gradient(135deg, #166534, #15803d)' }}>
            {subiendoArchivo ? '⏳ Subiendo...' : '+ Subir archivo (PDF o Word)'}
            <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={subirArchivo} disabled={subiendoArchivo} />
          </label>
        </div>
        {archivos.length === 0 ? (
          <p className="text-sm text-gray-300 text-center py-4">No hay archivos subidos</p>
        ) : (
          <div className="flex flex-col gap-2">
            {archivos.map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-gray-800">📄 {a.nombre}</p>
                  {a.descripcion && <p className="text-xs text-gray-400">{a.descripcion}</p>}
                  <p className="text-xs text-gray-300">{new Date(a.created_at).toLocaleDateString('es-CL')}</p>
                </div>
                <div className="flex gap-1">
                  <a href={`https://docs.google.com/viewer?url=${encodeURIComponent(a.url)}&embedded=true`} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100">Ver</a>
                  <button onClick={() => eliminarArchivo(a.id)} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}