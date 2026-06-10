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

  useEffect(() => { cargar() }, [])

  useEffect(() => {
    const tieneCambios = vista === 'control' && mostrarForm && (form.motivo_consulta.trim() !== '' || form.diagnostico.trim() !== '' || form.tratamiento.trim() !== '')
    const handler = e => {
      if (!tieneCambios) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [vista, form, mostrarForm])

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
    setForm({ motivo_consulta: '', diagnostico: '', tratamiento: '', observaciones: '', profesional_id: '', fecha: hoyStr, proximo_control: '' })
    setErrores({})
    setMostrarForm(false)
    cargar()
  }

  const editar = f => {
    setForm({
      motivo_consulta: f.motivo_consulta,
      diagnostico: f.diagnostico || '',
      tratamiento: f.tratamiento || '',
      observaciones: f.observaciones || '',
      profesional_id: f.profesional_id,
      fecha: f.fecha?.slice(0, 10) || hoyStr,
      proximo_control: f.proximo_control?.slice(0, 10) || ''
    })
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
    const [fi1, fi2] = await Promise.all([
      axios.get(`${API_FI}/1/paciente/${paciente.id}`),
      axios.get(`${API_FI}/2/paciente/${paciente.id}`)
    ])
    setFichasIngresoData({ i1: fi1.data, i2: fi2.data })
    setModalFichasIngreso(true)
  }

  const generarHTMLPDF = f => `
    <html><head><title>Ficha Control — ${paciente.nombre} ${paciente.apellido}</title>
    <style>
      body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; color: #333; }
      h1 { color: #166534; font-size: 18px; margin-bottom: 4px; }
      h2 { color: #166534; font-size: 13px; margin: 16px 0 6px; border-bottom: 1px solid #dcfce7; padding-bottom: 4px; }
      .campo { margin-bottom: 6px; }
      .valor { border-bottom: 1px solid #ddd; min-height: 18px; padding-bottom: 2px; margin-top: 2px; }
      button { margin-top: 20px; padding: 8px 16px; background: #166534; color: white; border: none; border-radius: 6px; cursor: pointer; }
      @media print { button { display: none; } }
    </style></head><body>
    <h1>Ficha Control — ${paciente.nombre} ${paciente.apellido}</h1>
    <p>RUT: ${paciente.rut || 'No registrado'} | Fecha: ${formatFecha(f.fecha)} | Profesional: ${f.profesional_nombre} ${f.profesional_apellido}</p>
    <h2>Motivo de Consulta</h2><div class="campo"><div class="valor">${f.motivo_consulta || ''}</div></div>
    <h2>Diagnóstico</h2><div class="campo"><div class="valor">${f.diagnostico || ''}</div></div>
    <h2>Tratamiento</h2><div class="campo"><div class="valor">${f.tratamiento || ''}</div></div>
    <h2>Observaciones</h2><div class="campo"><div class="valor">${f.observaciones || ''}</div></div>
    <button onclick="window.print()">Imprimir PDF</button>
    </body></html>
  `

  if (vista === 'ingresoV') return <FichaIngreso1 paciente={paciente} onVolver={() => { setVista(null); cargar() }} />
  if (vista === 'ingresoJ') return <FichaIngreso2 paciente={paciente} onVolver={() => { setVista(null); cargar() }} />

  if (vista === 'control') return (
    <div>
      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onCerrar={() => setToast(null)} />}

      {modalEliminar && (
        <ModalConfirmar
          titulo="¿Eliminar ficha?"
          mensaje="Esta acción no se puede deshacer."
          textoConfirmar="Eliminar"
          onConfirmar={confirmarEliminar}
          onCancelar={() => setModalEliminar(null)}
        />
      )}

      {modalProcedimientos && (
        <ModalProcedimientos paciente={paciente} onCerrar={() => setModalProcedimientos(false)} />
      )}

      {/* Modal PDF */}
      {modalPDF && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 px-4" onClick={() => setModalPDF(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">Vista previa — {paciente.nombre} {paciente.apellido}</h3>
              <div className="flex gap-3">
                <button onClick={() => {
                  const blob = new Blob([generarHTMLPDF(modalPDF)], { type: 'text/html' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.target = '_blank'
                  a.click()
                  URL.revokeObjectURL(url)
                }} className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800">
                  🖨️ Imprimir
                </button>
                <button onClick={() => setModalPDF(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="border-b pb-3 mb-4">
                <p className="text-xs text-gray-400">{formatFecha(modalPDF.fecha)} · {modalPDF.profesional_nombre} {modalPDF.profesional_apellido}</p>
              </div>
              <div className="flex flex-col gap-4 text-sm">
                <div><p className="font-semibold text-gray-600 mb-1">Motivo de consulta</p><p className="text-gray-800 bg-gray-50 rounded-lg p-3">{modalPDF.motivo_consulta || '—'}</p></div>
                {modalPDF.diagnostico && <div><p className="font-semibold text-gray-600 mb-1">Diagnóstico</p><p className="text-gray-800 bg-gray-50 rounded-lg p-3">{modalPDF.diagnostico}</p></div>}
                {modalPDF.tratamiento && <div><p className="font-semibold text-gray-600 mb-1">Tratamiento</p><p className="text-gray-800 bg-gray-50 rounded-lg p-3">{modalPDF.tratamiento}</p></div>}
                {modalPDF.observaciones && <div><p className="font-semibold text-gray-600 mb-1">Observaciones</p><p className="text-gray-800 bg-gray-50 rounded-lg p-3">{modalPDF.observaciones}</p></div>}
                {modalPDF.proximo_control && <div><span className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-xs font-semibold">📅 Próximo control: {formatFecha(modalPDF.proximo_control)}</span></div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {modalFichasIngreso && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4" onClick={() => setModalFichasIngreso(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-green-700 to-green-600 px-6 py-4 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-bold text-white">Fichas de ingreso</h3>
                <p className="text-green-200 text-xs">{paciente.nombre} {paciente.apellido}</p>
              </div>
              <button onClick={() => setModalFichasIngreso(false)} className="text-white hover:text-green-200 text-2xl">✕</button>
            </div>
            <div className="flex border-b border-gray-200 shrink-0">
              <button onClick={() => setTabIngreso('v')} className={`flex-1 py-3 text-sm font-semibold transition-colors ${tabIngreso === 'v' ? 'text-orange-600 border-b-2 border-orange-500' : 'text-gray-400 hover:text-gray-600'}`}>
                📝 Matrona V ({fichasIngresoData.i1.length})
              </button>
              <button onClick={() => setTabIngreso('j')} className={`flex-1 py-3 text-sm font-semibold transition-colors ${tabIngreso === 'j' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-600'}`}>
                🗂️ Matrona J ({fichasIngresoData.i2.length})
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {tabIngreso === 'v' && (
                fichasIngresoData.i1.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">Sin fichas de ingreso registradas</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {fichasIngresoData.i1.map(f => (
                      <div key={f.id} className="border border-orange-100 rounded-xl p-4 bg-orange-50">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="text-xs text-gray-400">{formatFecha(f.fecha)}</p>
                            <p className="text-sm font-medium text-gray-700">{f.profesional_nombre} {f.profesional_apellido}</p>
                          </div>
                          {f.proximo_control && <span className="text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded-full font-semibold">📅 {formatFecha(f.proximo_control)}</span>}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {f.motivo_consulta && <div className="col-span-2"><span className="font-semibold text-gray-600">Motivo:</span> <span className="text-gray-700">{f.motivo_consulta}</span></div>}
                          {f.direccion && <div className="col-span-2"><span className="font-semibold text-gray-600">Dirección:</span> <span className="text-gray-700">{f.direccion}</span></div>}
                          {f.ocupacion && <div><span className="font-semibold text-gray-600">Ocupación:</span> <span className="text-gray-700">{f.ocupacion}</span></div>}
                          {f.paridad && <div><span className="font-semibold text-gray-600">Paridad:</span> <span className="text-gray-700">{f.paridad}</span></div>}
                          {f.fur && <div><span className="font-semibold text-gray-600">FUR:</span> <span className="text-gray-700">{f.fur}</span></div>}
                          {f.ciclos_menstruales && <div><span className="font-semibold text-gray-600">Ciclos menstruales:</span> <span className="text-gray-700">{f.ciclos_menstruales}</span></div>}
                          {f.mac && <div><span className="font-semibold text-gray-600">MAC:</span> <span className="text-gray-700">{f.mac}</span></div>}
                          {f.menarquia && <div><span className="font-semibold text-gray-600">Menarquia:</span> <span className="text-gray-700">{f.menarquia}</span></div>}
                          {f.ivs && <div><span className="font-semibold text-gray-600">IVS:</span> <span className="text-gray-700">{f.ivs}</span></div>}
                          {f.orientacion_sexual && <div><span className="font-semibold text-gray-600">Orientación sexual:</span> <span className="text-gray-700">{f.orientacion_sexual}</span></div>}
                          {f.parejas_sexuales && <div><span className="font-semibold text-gray-600">Parejas sexuales:</span> <span className="text-gray-700">{f.parejas_sexuales}</span></div>}
                          {f.pareja_actual && <div><span className="font-semibold text-gray-600">Pareja actual:</span> <span className="text-gray-700">{f.pareja_actual}</span></div>}
                          {f.its && <div><span className="font-semibold text-gray-600">ITS:</span> <span className="text-gray-700">{f.its}</span></div>}
                          {f.uso_pstv && <div><span className="font-semibold text-gray-600">Uso PSTV:</span> <span className="text-gray-700">{f.uso_pstv}</span></div>}
                          {f.eco_tv && <div><span className="font-semibold text-gray-600">ECO TV:</span> <span className="text-gray-700">{f.eco_tv}</span></div>}
                          {f.pap && <div><span className="font-semibold text-gray-600">PAP:</span> <span className="text-gray-700">{f.pap}</span></div>}
                          {f.presion_arterial && <div><span className="font-semibold text-gray-600">Presión arterial:</span> <span className="text-gray-700">{f.presion_arterial}</span></div>}
                          {f.peso && <div><span className="font-semibold text-gray-600">Peso:</span> <span className="text-gray-700">{f.peso}</span></div>}
                          {f.altura && <div><span className="font-semibold text-gray-600">Altura:</span> <span className="text-gray-700">{f.altura}</span></div>}
                          {f.efm && <div><span className="font-semibold text-gray-600">EFM:</span> <span className="text-gray-700">{f.efm}</span></div>}
                          {f.especulo && <div><span className="font-semibold text-gray-600">Espéculo:</span> <span className="text-gray-700">{f.especulo}</span></div>}
                          {f.vacuna_vph && <div><span className="font-semibold text-gray-600">Vacuna VPH:</span> <span className="text-gray-700">{f.vacuna_vph}</span></div>}
                          {f.ant_morbidos && <div className="col-span-2"><span className="font-semibold text-gray-600">Ant. mórbidos:</span> <span className="text-gray-700">{f.ant_morbidos}</span></div>}
                          {f.ant_familiares && <div className="col-span-2"><span className="font-semibold text-gray-600">Ant. familiares:</span> <span className="text-gray-700">{f.ant_familiares}</span></div>}
                          {f.ant_ca_mama && <div className="col-span-2"><span className="font-semibold text-gray-600">Ant. Ca mama fam:</span> <span className="text-gray-700">{f.ant_ca_mama}</span></div>}
                          {f.medicamentos && <div className="col-span-2"><span className="font-semibold text-gray-600">Medicamentos:</span> <span className="text-gray-700">{f.medicamentos}</span></div>}
                          {f.tabaco && <div><span className="font-semibold text-gray-600">Tabaco:</span> <span className="text-gray-700">{f.tabaco}</span></div>}
                          {f.alcohol && <div><span className="font-semibold text-gray-600">Alcohol:</span> <span className="text-gray-700">{f.alcohol}</span></div>}
                          {f.drogas && <div><span className="font-semibold text-gray-600">Drogas:</span> <span className="text-gray-700">{f.drogas}</span></div>}
                          {f.alimentacion && <div><span className="font-semibold text-gray-600">Alimentación:</span> <span className="text-gray-700">{f.alimentacion}</span></div>}
                          {f.ejercicio && <div><span className="font-semibold text-gray-600">Ejercicio:</span> <span className="text-gray-700">{f.ejercicio}</span></div>}
                          {f.alergias && <div className="col-span-2"><span className="font-semibold text-gray-600">Alergias:</span> <span className="text-gray-700">{f.alergias}</span></div>}
                          {f.cirugias && <div className="col-span-2"><span className="font-semibold text-gray-600">Cirugías:</span> <span className="text-gray-700">{f.cirugias}</span></div>}
                          {f.examenes_sangre && <div className="col-span-2"><span className="font-semibold text-gray-600">Exámenes sangre:</span> <span className="text-gray-700">{f.examenes_sangre}</span></div>}
                          {f.indicaciones && <div className="col-span-2"><span className="font-semibold text-gray-600">Indicaciones:</span> <span className="text-gray-700">{f.indicaciones}</span></div>}
                          {f.observaciones && <div className="col-span-2"><span className="font-semibold text-gray-600">Observaciones:</span> <span className="text-gray-700">{f.observaciones}</span></div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
              {tabIngreso === 'j' && (
                fichasIngresoData.i2.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">Sin fichas de ingreso registradas</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {fichasIngresoData.i2.map(f => (
                      <div key={f.id} className="border border-blue-100 rounded-xl p-4 bg-blue-50">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="text-xs text-gray-400">{formatFecha(f.fecha)}</p>
                            <p className="text-sm font-medium text-gray-700">{f.profesional_nombre} {f.profesional_apellido}</p>
                          </div>
                          {f.proximo_control && <span className="text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded-full font-semibold">📅 {formatFecha(f.proximo_control)}</span>}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {f.motivo_consulta && <div className="col-span-2"><span className="font-semibold text-gray-600">Motivo:</span> <span className="text-gray-700">{f.motivo_consulta}</span></div>}
                          {f.edad && <div><span className="font-semibold text-gray-600">Edad:</span> <span className="text-gray-700">{f.edad}</span></div>}
                          {f.gpa && <div><span className="font-semibold text-gray-600">GPA:</span> <span className="text-gray-700">{f.gpa}</span></div>}
                          {f.ocupacion && <div><span className="font-semibold text-gray-600">Ocupación:</span> <span className="text-gray-700">{f.ocupacion}</span></div>}
                          {f.pareja && <div><span className="font-semibold text-gray-600">Pareja:</span> <span className="text-gray-700">{f.pareja}</span></div>}
                          {f.red_apoyo && <div className="col-span-2"><span className="font-semibold text-gray-600">Red de apoyo:</span> <span className="text-gray-700">{f.red_apoyo}</span></div>}
                          {f.fur && <div><span className="font-semibold text-gray-600">FUR:</span> <span className="text-gray-700">{f.fur}</span></div>}
                          {f.mac && <div><span className="font-semibold text-gray-600">MAC:</span> <span className="text-gray-700">{f.mac}</span></div>}
                          {f.menarquia && <div><span className="font-semibold text-gray-600">Menarquia:</span> <span className="text-gray-700">{f.menarquia}</span></div>}
                          {f.menstruaciones && <div className="col-span-2"><span className="font-semibold text-gray-600">Menstruaciones:</span> <span className="text-gray-700">{f.menstruaciones}</span></div>}
                          {f.ias && <div><span className="font-semibold text-gray-600">IAS:</span> <span className="text-gray-700">{f.ias}</span></div>}
                          {f.parejas_sexuales && <div><span className="font-semibold text-gray-600">Parejas sexuales:</span> <span className="text-gray-700">{f.parejas_sexuales}</span></div>}
                          {f.sexo_biologico && <div><span className="font-semibold text-gray-600">Sexo biológico:</span> <span className="text-gray-700">{f.sexo_biologico}</span></div>}
                          {f.its && <div><span className="font-semibold text-gray-600">ITS:</span> <span className="text-gray-700">{f.its}</span></div>}
                          {f.eco_tv && <div><span className="font-semibold text-gray-600">ECO TV:</span> <span className="text-gray-700">{f.eco_tv}</span></div>}
                          {f.pap && <div><span className="font-semibold text-gray-600">PAP:</span> <span className="text-gray-700">{f.pap}</span></div>}
                          {f.eco_mam_mamo && <div><span className="font-semibold text-gray-600">ECO MAM/MAMO:</span> <span className="text-gray-700">{f.eco_mam_mamo}</span></div>}
                          {f.ant_cacu && <div><span className="font-semibold text-gray-600">Ant. CaCu:</span> <span className="text-gray-700">{f.ant_cacu}</span></div>}
                          {f.ant_ca_mama && <div><span className="font-semibold text-gray-600">Ant. Ca mama:</span> <span className="text-gray-700">{f.ant_ca_mama}</span></div>}
                          {f.ant_morbidos && <div className="col-span-2"><span className="font-semibold text-gray-600">Ant. mórbidos:</span> <span className="text-gray-700">{f.ant_morbidos}</span></div>}
                          {f.cirugias && <div className="col-span-2"><span className="font-semibold text-gray-600">Cirugías:</span> <span className="text-gray-700">{f.cirugias}</span></div>}
                          {f.alergias && <div className="col-span-2"><span className="font-semibold text-gray-600">Alergias:</span> <span className="text-gray-700">{f.alergias}</span></div>}
                          {f.medicamentos && <div className="col-span-2"><span className="font-semibold text-gray-600">Medicamentos:</span> <span className="text-gray-700">{f.medicamentos}</span></div>}
                          {f.tabaco && <div><span className="font-semibold text-gray-600">Tabaco:</span> <span className="text-gray-700">{f.tabaco}</span></div>}
                          {f.alcohol && <div><span className="font-semibold text-gray-600">Alcohol:</span> <span className="text-gray-700">{f.alcohol}</span></div>}
                          {f.drogas && <div><span className="font-semibold text-gray-600">Drogas:</span> <span className="text-gray-700">{f.drogas}</span></div>}
                          {f.examenes_sangre && <div className="col-span-2"><span className="font-semibold text-gray-600">Exámenes sangre:</span> <span className="text-gray-700">{f.examenes_sangre}</span></div>}
                          {f.observaciones && <div className="col-span-2"><span className="font-semibold text-gray-600">Observaciones:</span> <span className="text-gray-700">{f.observaciones}</span></div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {modalSalirAviso && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[200] px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-6 text-center">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-4xl">⚠️</span>
              </div>
              <h3 className="text-xl font-bold text-white">¿Salir sin guardar?</h3>
              <p className="text-orange-100 text-sm mt-1">Tienes cambios sin guardar</p>
            </div>
            <div className="px-6 py-5 text-center">
              <p className="text-gray-600 text-sm leading-relaxed">Si sales ahora perderás los cambios realizados en la ficha.</p>
            </div>
            <div className="px-6 pb-6 flex flex-col gap-3">
              <button onClick={() => setModalSalirAviso(null)} className="w-full bg-green-700 text-white py-3 rounded-2xl font-semibold hover:bg-green-800 transition-colors">✏️ Seguir editando</button>
              <button onClick={() => { modalSalirAviso(); setModalSalirAviso(null) }} className="w-full bg-gray-100 text-gray-600 py-3 rounded-2xl font-medium hover:bg-gray-200 transition-colors">🚪 Salir sin guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => salirConAviso(() => setVista(null))} className="text-green-700 hover:underline font-medium text-sm">← Volver</button>
          <h2 className="text-xl font-bold text-green-800">Ficha Control — {paciente.nombre} {paciente.apellido}</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={cargarFichasIngreso} className="bg-white border border-green-600 text-green-700 px-4 py-2 rounded-xl hover:bg-green-50 font-medium text-sm transition-colors">
            📋 Ver ingreso
          </button>
          <button onClick={() => { cancelar(); setMostrarForm(true) }} className="bg-green-700 text-white px-4 py-2 rounded-xl hover:bg-green-800 font-medium text-sm">
            + Nueva ficha
          </button>
        </div>
      </div>

      {/* Datos del paciente */}
      <div className="bg-green-50 rounded-xl p-4 mb-6 border border-green-100">
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs font-bold text-green-800 uppercase">Datos del paciente</p>
          <button onClick={() => setEditandoDatos(!editandoDatos)} className="text-xs text-green-700 hover:underline font-medium">
            {editandoDatos ? 'Cancelar' : '✏️ Editar datos'}
          </button>
        </div>
        {editandoDatos ? (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col"><label className="text-xs text-gray-500 mb-1">Nombre</label><input className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" value={formDatos.nombre || paciente.nombre} onChange={e => setFormDatos(f => ({ ...f, nombre: e.target.value }))} /></div>
              <div className="flex flex-col"><label className="text-xs text-gray-500 mb-1">Apellido</label><input className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" value={formDatos.apellido || paciente.apellido} onChange={e => setFormDatos(f => ({ ...f, apellido: e.target.value }))} /></div>
              <div className="flex flex-col"><label className="text-xs text-gray-500 mb-1">RUT</label><input className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" value={formDatos.rut} onChange={e => setFormDatos(f => ({ ...f, rut: e.target.value }))} /></div>
              <div className="flex flex-col"><label className="text-xs text-gray-500 mb-1">Teléfono</label><input className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" value={formDatos.telefono} onChange={e => setFormDatos(f => ({ ...f, telefono: e.target.value }))} /></div>
              <div className="flex flex-col"><label className="text-xs text-gray-500 mb-1">Fecha de nacimiento</label><input type="date" className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" value={formDatos.fecha_nacimiento} onChange={e => setFormDatos(f => ({ ...f, fecha_nacimiento: e.target.value }))} /></div>
              <div className="flex flex-col"><label className="text-xs text-gray-500 mb-1">Email</label><input type="email" className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" value={formDatos.email} onChange={e => setFormDatos(f => ({ ...f, email: e.target.value }))} /></div>
            </div>
            <button onClick={async () => {
              await axios.put(`https://centro-medico-saberes-production.up.railway.app/pacientes/${paciente.id}`, { ...paciente, ...formDatos, nombre: formDatos.nombre || paciente.nombre, apellido: formDatos.apellido || paciente.apellido })
              setEditandoDatos(false)
              Object.assign(paciente, formDatos)
            }} className="bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-green-800 self-start">Guardar</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500 text-xs">Nombre</span><p className="font-medium text-gray-800">{paciente.nombre} {paciente.apellido}</p></div>
            <div><span className="text-gray-500 text-xs">RUT</span><p className="font-medium text-gray-800">{paciente.rut || '—'}</p></div>
            <div><span className="text-gray-500 text-xs">Fecha de nacimiento</span><p className="font-medium text-gray-800">{paciente.fecha_nacimiento ? `${new Date(paciente.fecha_nacimiento.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-CL')} (${calcularEdad(paciente.fecha_nacimiento)} años)` : '—'}</p></div>
            <div><span className="text-gray-500 text-xs">Teléfono</span><p className="font-medium text-gray-800">{paciente.telefono || '—'}</p></div>
            {paciente.email && <div><span className="text-gray-500 text-xs">Email</span><p className="font-medium text-gray-800">{paciente.email}</p></div>}
          </div>
        )}
      </div>

      {/* Fichas anteriores PRIMERO */}
      {fichas.length > 0 && (
        <div className="mb-6">
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
                    <button onClick={() => setModalPDF(f)} className="text-blue-600 hover:underline text-sm font-medium">PDF</button>
                    <button onClick={() => editar(f)} className="text-green-700 hover:underline text-sm font-medium">Editar</button>
                    <button onClick={() => eliminar(f.id)} className="text-red-500 hover:underline text-sm font-medium">Eliminar</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div><span className="font-semibold text-gray-600">Motivo:</span> {f.motivo_consulta}</div>
                  {f.diagnostico && <div><span className="font-semibold text-gray-600">Diagnóstico:</span> {f.diagnostico}</div>}
                  {f.tratamiento && <div><span className="font-semibold text-gray-600">Tratamiento:</span> {f.tratamiento}</div>}
                  {f.observaciones && <div><span className="font-semibold text-gray-600">Observaciones:</span> {f.observaciones}</div>}
                  {f.proximo_control && (
                    <div className="md:col-span-2">
                      <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-xs font-semibold">
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

      {/* Formulario colapsable ABAJO */}
      {mostrarForm ? (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">{editando ? 'Editar ficha' : 'Nueva ficha de control'}</h3>
            <button onClick={() => salirConAviso(cancelar)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          </div>
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
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Próximo control (opcional)</label>
              <input className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" name="proximo_control" type="date" value={form.proximo_control || ''} onChange={handleChange} />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={guardar} className="bg-green-700 text-white px-5 py-2 rounded-lg hover:bg-green-800 font-medium">{editando ? 'Actualizar' : 'Guardar ficha'}</button>
            <button onClick={() => setModalProcedimientos(true)} className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-medium">+ Procedimientos</button>
            <button onClick={() => salirConAviso(cancelar)} className="bg-gray-200 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-300 font-medium">Cancelar</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setMostrarForm(true)} className="w-full border-2 border-dashed border-green-300 rounded-xl py-4 text-green-700 font-medium hover:bg-green-50 transition-colors mb-6">
          + Nueva ficha de control
        </button>
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
                <div><p className="font-bold text-green-800">Ficha Control</p><p className="text-xs text-gray-500">{fichas.length} ficha{fichas.length !== 1 ? 's' : ''} registrada{fichas.length !== 1 ? 's' : ''}</p></div>
              </button>
              <button onClick={() => { setModalSelector(false); setVista('ingresoV') }} className="flex items-center gap-3 p-4 rounded-xl border-2 border-orange-500 hover:bg-orange-50 transition-colors text-left">
                <span className="text-2xl">📝</span>
                <div><p className="font-bold text-green-800">Ficha Ingreso — Matrona V</p><p className="text-xs text-gray-500">{fichasI1.length} ficha{fichasI1.length !== 1 ? 's' : ''} registrada{fichasI1.length !== 1 ? 's' : ''}</p></div>
              </button>
              <button onClick={() => { setModalSelector(false); setVista('ingresoJ') }} className="flex items-center gap-3 p-4 rounded-xl border-2 border-blue-500 hover:bg-blue-50 transition-colors text-left">
                <span className="text-2xl">🗂️</span>
                <div><p className="font-bold text-green-800">Ficha Ingreso — Matrona J</p><p className="text-xs text-gray-500">{fichasI2.length} ficha{fichasI2.length !== 1 ? 's' : ''} registrada{fichasI2.length !== 1 ? 's' : ''}</p></div>
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
        <button onClick={() => setModalSelector(true)} className="bg-green-700 text-white px-5 py-2 rounded-lg hover:bg-green-800 font-medium">+ Nueva ficha</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button onClick={() => setVista('control')} className="bg-white rounded-xl shadow p-4 border-t-4 border-green-600 text-left hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-1"><span className="text-xl">📋</span><p className="font-bold text-green-800">Ficha Control</p></div>
          <p className="text-2xl font-bold text-gray-800">{fichas.length}</p>
          <p className="text-xs text-gray-500 mb-2">ficha{fichas.length !== 1 ? 's' : ''} registrada{fichas.length !== 1 ? 's' : ''}</p>
          {fichas[0]?.proximo_control && <p className="text-xs text-teal-700 font-medium">📅 Próx. control: {formatFecha(fichas[0].proximo_control)}</p>}
        </button>
        <button onClick={() => setVista('ingresoV')} className="bg-white rounded-xl shadow p-4 border-t-4 border-orange-500 text-left hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-1"><span className="text-xl">📝</span><p className="font-bold text-green-800">Ingreso Matrona V</p></div>
          <p className="text-2xl font-bold text-gray-800">{fichasI1.length}</p>
          <p className="text-xs text-gray-500 mb-2">ficha{fichasI1.length !== 1 ? 's' : ''} registrada{fichasI1.length !== 1 ? 's' : ''}</p>
          {fichasI1[0]?.proximo_control && <p className="text-xs text-teal-700 font-medium">📅 Próx. control: {formatFecha(fichasI1[0].proximo_control)}</p>}
        </button>
        <button onClick={() => setVista('ingresoJ')} className="bg-white rounded-xl shadow p-4 border-t-4 border-blue-500 text-left hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-1"><span className="text-xl">🗂️</span><p className="font-bold text-green-800">Ingreso Matrona J</p></div>
          <p className="text-2xl font-bold text-gray-800">{fichasI2.length}</p>
          <p className="text-xs text-gray-500 mb-2">ficha{fichasI2.length !== 1 ? 's' : ''} registrada{fichasI2.length !== 1 ? 's' : ''}</p>
          {fichasI2[0]?.proximo_control && <p className="text-xs text-teal-700 font-medium">📅 Próx. control: {formatFecha(fichasI2[0].proximo_control)}</p>}
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
                  <button onClick={() => { setVista('control'); setModalPDF(f) }} className="text-blue-600 text-xs hover:underline">PDF</button>
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
          <h3 className="text-lg font-bold text-gray-700 mb-3">Últimas fichas ingreso — Matrona V</h3>
          <div className="flex flex-col gap-3">
            {fichasI1.slice(0, 3).map(f => (
              <div key={f.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                <div>
                  <p className="font-medium text-gray-800">{f.motivo_consulta}</p>
                  <p className="text-xs text-gray-400">{formatFecha(f.fecha)} · {f.profesional_nombre} {f.profesional_apellido}</p>
                </div>
                <button onClick={() => setVista('ingresoV')} className="text-orange-600 text-xs hover:underline">Ver</button>
              </div>
            ))}
            {fichasI1.length > 3 && <button onClick={() => setVista('ingresoV')} className="text-orange-600 text-xs hover:underline text-left">Ver todas ({fichasI1.length})</button>}
          </div>
        </div>
      )}

      {fichasI2.length > 0 && (
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="text-lg font-bold text-gray-700 mb-3">Últimas fichas ingreso — Matrona J</h3>
          <div className="flex flex-col gap-3">
            {fichasI2.slice(0, 3).map(f => (
              <div key={f.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                <div>
                  <p className="font-medium text-gray-800">{f.motivo_consulta}</p>
                  <p className="text-xs text-gray-400">{formatFecha(f.fecha)} · {f.profesional_nombre} {f.profesional_apellido}</p>
                </div>
                <button onClick={() => setVista('ingresoJ')} className="text-blue-600 text-xs hover:underline">Ver</button>
              </div>
            ))}
            {fichasI2.length > 3 && <button onClick={() => setVista('ingresoJ')} className="text-blue-600 text-xs hover:underline text-left">Ver todas ({fichasI2.length})</button>}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-5 mt-4">
        <h3 className="text-lg font-bold text-gray-700 mb-3">📎 Archivos del paciente</h3>
        <div className="flex flex-col gap-3 mb-4">
          <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="Descripción del archivo (opcional)" value={descripcionArchivo} onChange={e => setDescripcionArchivo(e.target.value)} />
          <label className={`cursor-pointer bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 font-medium text-sm text-center ${subiendoArchivo ? 'opacity-50' : ''}`}>
            {subiendoArchivo ? 'Subiendo...' : '+ Subir archivo (PDF o Word)'}
            <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={subirArchivo} disabled={subiendoArchivo} />
          </label>
        </div>
        {archivos.length === 0 ? (
          <p className="text-sm text-gray-400">No hay archivos subidos</p>
        ) : (
          <div className="flex flex-col gap-2">
            {archivos.map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-800">📄 {a.nombre}</p>
                  {a.descripcion && <p className="text-xs text-gray-400">{a.descripcion}</p>}
                  <p className="text-xs text-gray-400">{new Date(a.created_at).toLocaleDateString('es-CL')}</p>
                </div>
                <div className="flex gap-2">
                  <a href={`https://docs.google.com/viewer?url=${encodeURIComponent(a.url)}&embedded=true`} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline font-medium">Ver</a>
                  <button onClick={() => eliminarArchivo(a.id)} className="text-red-500 text-sm hover:underline font-medium">Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}