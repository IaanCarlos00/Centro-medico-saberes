import { useEffect, useState } from 'react'
import axios from 'axios'
import ModalProcedimientos from './ModalProcedimientos'

const API = 'https://centro-medico-saberes-production.up.railway.app/fichas-ingreso'
const API_PRO = 'https://centro-medico-saberes-production.up.railway.app/profesionales'

const formatFecha = fecha => {
  if (!fecha) return ''
  return new Date(fecha.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-CL')
}

const campoVacio = {
  profesional_id: '', fecha: new Date().toISOString().slice(0,10),
  direccion: '', ocupacion: '', paridad: '', fur: '', ciclos_menstruales: '', mac: '',
  ant_morbidos: '', ant_familiares: '', ant_ca_mama: '', medicamentos: '',
  tabaco: '', alcohol: '', drogas: '', alergias: '', cirugias: '',
  examenes_sangre: '', ivs: '', orientacion_sexual: '', parejas_sexuales: '',
  pareja_actual: '', menarquia: '', its: '', uso_pstv: '', eco_tv: '', pap: '',
  presion_arterial: '', peso: '', altura: '', efm: '', especulo: '',
  motivo_consulta: '', indicaciones: '', observaciones: '',
  alimentacion: '', ejercicio: '', vacuna_vph: '', proximo_control: ''
}

function Seccion({ titulo, children }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-px flex-1 bg-gray-100" />
        <span className="text-xs font-bold text-green-700 uppercase tracking-widest px-2">{titulo}</span>
        <div className="h-px flex-1 bg-gray-100" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {children}
      </div>
    </div>
  )
}

function Campo({ label, name, form, onChange, type = 'text', fullWidth = false }) {
  return (
    <div className={`flex flex-col gap-1 ${fullWidth ? 'sm:col-span-2 md:col-span-3' : ''}`}>
      <label className="text-xs font-semibold text-gray-500">{label}</label>
      {type === 'textarea' ? (
        <textarea className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none hover:border-gray-300 transition-colors" name={name} rows={2} value={form[name] || ''} onChange={onChange} />
      ) : (
        <input className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 hover:border-gray-300 transition-colors" name={name} type={type} value={form[name] || ''} onChange={onChange} />
      )}
    </div>
  )
}

const calcularEdad = fecha => {
  if (!fecha) return null
  const hoy = new Date()
  const nac = new Date(fecha.slice(0,10) + 'T12:00:00')
  let edad = hoy.getFullYear() - nac.getFullYear()
  const m = hoy.getMonth() - nac.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--
  return edad
}

export default function FichaIngreso1({ paciente, onVolver }) {
  const [fichas, setFichas] = useState([])
  const [profesionales, setProfesionales] = useState([])
  const [form, setForm] = useState(campoVacio)
  const [editando, setEditando] = useState(null)
  const [modalProcedimientos, setModalProcedimientos] = useState(false)
  const [editandoDatos, setEditandoDatos] = useState(false)
  const [formDatos, setFormDatos] = useState({
    rut: paciente.rut || '',
    telefono: paciente.telefono || '',
    fecha_nacimiento: paciente.fecha_nacimiento?.slice(0,10) || '',
    email: paciente.email || ''
  })

  const cargar = async () => {
    const [f, pr] = await Promise.all([
      axios.get(`${API}/1/paciente/${paciente.id}`),
      axios.get(API_PRO)
    ])
    setFichas(f.data)
    setProfesionales(pr.data)
  }

  useEffect(() => { cargar() }, [])

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const guardar = async () => {
    if (!form.profesional_id || !form.motivo_consulta) return alert('Completa el profesional y motivo de consulta')
    if (editando) {
      await axios.put(`${API}/1/${editando}`, form)
      setEditando(null)
    } else {
      await axios.post(`${API}/1`, { ...form, paciente_id: paciente.id })
    }
    setForm(campoVacio)
    cargar()
  }

  const editar = f => {
    setForm({ ...campoVacio, ...f, fecha: f.fecha?.slice(0,10) || new Date().toISOString().slice(0,10), proximo_control: f.proximo_control?.slice(0,10) || '' })
    setEditando(f.id)
    window.scrollTo(0, 0)
  }

  const eliminar = async id => {
    if (confirm('¿Eliminar ficha?')) {
      await axios.delete(`${API}/1/${id}`)
      cargar()
    }
  }

  const imprimirPDF = f => {
    const ventana = window.open('', '_blank')
    ventana.document.write(`<html><head><title>Ficha de Ingreso — ${paciente.nombre} ${paciente.apellido}</title>
      <style>body{font-family:Arial,sans-serif;font-size:12px;margin:20px;color:#333;}h1{color:#166534;font-size:18px;margin-bottom:4px;}h2{color:#166534;font-size:13px;margin:16px 0 6px;border-bottom:1px solid #dcfce7;padding-bottom:4px;}.grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 20px;}.campo{margin-bottom:4px;}.label{font-weight:bold;color:#555;}.valor{border-bottom:1px solid #ddd;min-height:18px;padding-bottom:2px;}.full{grid-column:1/-1;}@media print{button{display:none;}}</style>
      </head><body>
      <h1>Ficha de Ingreso — ${paciente.nombre} ${paciente.apellido}</h1>
      <p>RUT: ${paciente.rut || 'No registrado'} | Fecha: ${formatFecha(f.fecha)} | Profesional: ${f.profesional_nombre} ${f.profesional_apellido}</p>
      ${f.proximo_control ? `<p><strong>Próximo control:</strong> ${formatFecha(f.proximo_control)}</p>` : ''}
      <h2>Motivo de Consulta</h2><div class="campo full"><div class="valor">${f.motivo_consulta || ''}</div></div>
      <h2>Datos Personales</h2><div class="grid"><div class="campo"><span class="label">Dirección:</span><div class="valor">${f.direccion || ''}</div></div></div>
      <h2>Antecedentes</h2><div class="grid">
        <div class="campo"><span class="label">Paridad:</span><div class="valor">${f.paridad || ''}</div></div>
        <div class="campo"><span class="label">FUR:</span><div class="valor">${f.fur || ''}</div></div>
        <div class="campo"><span class="label">MAC:</span><div class="valor">${f.mac || ''}</div></div>
        <div class="campo"><span class="label">Ant. mórbidos:</span><div class="valor">${f.ant_morbidos || ''}</div></div>
        <div class="campo"><span class="label">Ant. familiares:</span><div class="valor">${f.ant_familiares || ''}</div></div>
        <div class="campo"><span class="label">Ant. Ca mama fam:</span><div class="valor">${f.ant_ca_mama || ''}</div></div>
        <div class="campo"><span class="label">Medicamentos:</span><div class="valor">${f.medicamentos || ''}</div></div>
        <div class="campo"><span class="label">Tabaco:</span><div class="valor">${f.tabaco || ''}</div></div>
        <div class="campo"><span class="label">Alcohol:</span><div class="valor">${f.alcohol || ''}</div></div>
        <div class="campo"><span class="label">Drogas:</span><div class="valor">${f.drogas || ''}</div></div>
        <div class="campo"><span class="label">Alergias:</span><div class="valor">${f.alergias || ''}</div></div>
        <div class="campo"><span class="label">Cirugías:</span><div class="valor">${f.cirugias || ''}</div></div>
        <div class="campo full"><span class="label">Exámenes sangre:</span><div class="valor">${f.examenes_sangre || ''}</div></div>
      </div>
      <h2>Historia Sexual</h2><div class="grid">
        <div class="campo"><span class="label">IVS:</span><div class="valor">${f.ivs || ''}</div></div>
        <div class="campo"><span class="label">Orientación sexual:</span><div class="valor">${f.orientacion_sexual || ''}</div></div>
        <div class="campo"><span class="label">Parejas sexuales:</span><div class="valor">${f.parejas_sexuales || ''}</div></div>
        <div class="campo"><span class="label">Pareja actual:</span><div class="valor">${f.pareja_actual || ''}</div></div>
        <div class="campo"><span class="label">Menarquia:</span><div class="valor">${f.menarquia || ''}</div></div>
        <div class="campo"><span class="label">ITS:</span><div class="valor">${f.its || ''}</div></div>
        <div class="campo"><span class="label">Uso PSTV:</span><div class="valor">${f.uso_pstv || ''}</div></div>
        <div class="campo"><span class="label">ECO TV:</span><div class="valor">${f.eco_tv || ''}</div></div>
        <div class="campo"><span class="label">PAP:</span><div class="valor">${f.pap || ''}</div></div>
      </div>
      <h2>Parámetros Clínicos</h2><div class="grid">
        <div class="campo"><span class="label">Presión arterial:</span><div class="valor">${f.presion_arterial || ''}</div></div>
        <div class="campo"><span class="label">Peso:</span><div class="valor">${f.peso || ''}</div></div>
        <div class="campo"><span class="label">Altura:</span><div class="valor">${f.altura || ''}</div></div>
      </div>
      <h2>Exploración</h2><div class="grid">
        <div class="campo"><span class="label">EFM:</span><div class="valor">${f.efm || ''}</div></div>
        <div class="campo"><span class="label">Espéculo:</span><div class="valor">${f.especulo || ''}</div></div>
      </div>
      <h2>Indicaciones</h2><div class="campo full"><div class="valor">${f.indicaciones || ''}</div></div>
      <h2>Observaciones</h2><div class="campo full"><div class="valor">${f.observaciones || ''}</div></div>
      <script>window.onload=()=>window.print()</script></body></html>`)
    ventana.document.close()
  }

  return (
    <div className="min-h-screen bg-white">
      {modalProcedimientos && <ModalProcedimientos paciente={paciente} onCerrar={() => setModalProcedimientos(false)} />}

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl mb-6 p-6 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #7c2d12 0%, #c2410c 50%, #f97316 100%)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #fed7aa, transparent)', transform: 'translate(30%, -30%)' }} />
        <div className="relative z-10">
          <button onClick={onVolver} className="text-orange-200 text-xs font-semibold hover:text-white mb-2 flex items-center gap-1">← Volver</button>
          <h2 className="text-2xl font-black text-white">Ficha de Ingreso</h2>
          <p className="text-orange-200 text-sm mt-1">Matrona V — {paciente.nombre} {paciente.apellido}</p>
        </div>
        <div className="relative z-10 flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>
            {fichas.length} ficha{fichas.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Datos del paciente */}
      <div className="rounded-2xl p-5 mb-6 border border-orange-100" style={{ background: 'linear-gradient(135deg, #fff7ed, #ffedd5)' }}>
        <div className="flex justify-between items-center mb-3">
          <p className="text-xs font-bold text-orange-800 uppercase tracking-wider flex items-center gap-2">
            <span className="w-6 h-6 bg-orange-600 rounded-lg flex items-center justify-center text-white text-xs">👤</span>
            Datos del paciente
          </p>
          <button onClick={() => setEditandoDatos(!editandoDatos)} className="text-xs font-semibold text-orange-700 bg-white px-3 py-1.5 rounded-lg hover:bg-orange-50 border border-orange-200">
            {editandoDatos ? 'Cancelar' : '✏️ Editar'}
          </button>
        </div>
        {editandoDatos ? (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[['Nombre','nombre','text',formDatos.nombre||paciente.nombre],['Apellido','apellido','text',formDatos.apellido||paciente.apellido],['RUT','rut','text',formDatos.rut],['Teléfono','telefono','text',formDatos.telefono],['Fecha nacimiento','fecha_nacimiento','date',formDatos.fecha_nacimiento],['Email','email','email',formDatos.email]].map(([label, key, type, val]) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600">{label}</label>
                  <input type={type} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white" value={val} onChange={e => setFormDatos(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <button onClick={async () => {
              await axios.put(`https://centro-medico-saberes-production.up.railway.app/pacientes/${paciente.id}`, { ...paciente, ...formDatos, nombre: formDatos.nombre || paciente.nombre, apellido: formDatos.apellido || paciente.apellido })
              setEditandoDatos(false)
              Object.assign(paciente, formDatos)
            }} className="text-white px-4 py-2 rounded-xl text-sm font-bold self-start" style={{ background: 'linear-gradient(135deg, #c2410c, #f97316)' }}>Guardar cambios</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {[['Nombre', `${paciente.nombre} ${paciente.apellido}`], ['RUT', paciente.rut || '—'], ['Nacimiento', paciente.fecha_nacimiento ? `${new Date(paciente.fecha_nacimiento.slice(0,10)+'T12:00:00').toLocaleDateString('es-CL')} (${calcularEdad(paciente.fecha_nacimiento)} años)` : '—'], ['Teléfono', paciente.telefono || '—'], ...(paciente.email ? [['Email', paciente.email]] : [])].map(([label, val]) => (
              <div key={label}>
                <p className="text-xs text-orange-700 font-semibold mb-0.5">{label}</p>
                <p className="font-semibold text-gray-800 text-sm">{val}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-800">{editando ? '✏️ Editar ficha' : '📝 Nueva ficha de ingreso'}</h3>
          {editando && <button onClick={() => { setEditando(null); setForm(campoVacio) }} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">Cancelar edición</button>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">Profesional *</label>
            <select className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white" name="profesional_id" value={form.profesional_id} onChange={handleChange}>
              <option value="">Seleccionar profesional</option>
              {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">Fecha de la consulta</label>
            <input className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white" name="fecha" type="date" value={form.fecha || ''} onChange={handleChange} />
          </div>
        </div>

        <Seccion titulo="Motivo de Consulta">
          <Campo label="Motivo de consulta *" name="motivo_consulta" form={form} onChange={handleChange} type="textarea" fullWidth />
        </Seccion>
        <Seccion titulo="Datos Personales">
          <Campo label="Dirección" name="direccion" form={form} onChange={handleChange} />
          <Campo label="Ocupación" name="ocupacion" form={form} onChange={handleChange} />
        </Seccion>
        <Seccion titulo="Antecedentes">
          <Campo label="Paridad" name="paridad" form={form} onChange={handleChange} />
          <Campo label="FUR" name="fur" form={form} onChange={handleChange} />
          <Campo label="Ciclos menstruales" name="ciclos_menstruales" form={form} onChange={handleChange} />
          <Campo label="MAC" name="mac" form={form} onChange={handleChange} />
          <Campo label="Ant. mórbidos" name="ant_morbidos" form={form} onChange={handleChange} type="textarea" />
          <Campo label="Ant. familiares" name="ant_familiares" form={form} onChange={handleChange} type="textarea" />
          <Campo label="Ant. Ca mama fam" name="ant_ca_mama" form={form} onChange={handleChange} />
          <Campo label="Medicamentos" name="medicamentos" form={form} onChange={handleChange} type="textarea" />
          <Campo label="Tabaco" name="tabaco" form={form} onChange={handleChange} />
          <Campo label="Alcohol" name="alcohol" form={form} onChange={handleChange} />
          <Campo label="Drogas" name="drogas" form={form} onChange={handleChange} />
          <Campo label="Alimentación" name="alimentacion" form={form} onChange={handleChange} />
          <Campo label="Ejercicio" name="ejercicio" form={form} onChange={handleChange} />
          <Campo label="Alergias" name="alergias" form={form} onChange={handleChange} />
          <Campo label="Cirugías" name="cirugias" form={form} onChange={handleChange} />
          <Campo label="Exámenes de sangre" name="examenes_sangre" form={form} onChange={handleChange} type="textarea" fullWidth />
          <Campo label="Vacuna VPH" name="vacuna_vph" form={form} onChange={handleChange} />
        </Seccion>
        <Seccion titulo="Antecedentes Ginecológicos">
          <Campo label="IVS" name="ivs" form={form} onChange={handleChange} />
          <Campo label="Orientación sexual" name="orientacion_sexual" form={form} onChange={handleChange} />
          <Campo label="Parejas sexuales" name="parejas_sexuales" form={form} onChange={handleChange} />
          <Campo label="Pareja actual" name="pareja_actual" form={form} onChange={handleChange} />
          <Campo label="Menarquia" name="menarquia" form={form} onChange={handleChange} />
          <Campo label="ITS" name="its" form={form} onChange={handleChange} />
          <Campo label="Uso PSTV" name="uso_pstv" form={form} onChange={handleChange} />
          <Campo label="ECO TV" name="eco_tv" form={form} onChange={handleChange} />
          <Campo label="PAP" name="pap" form={form} onChange={handleChange} />
        </Seccion>
        <Seccion titulo="Parámetros Clínicos">
          <Campo label="Presión arterial" name="presion_arterial" form={form} onChange={handleChange} />
          <Campo label="Peso" name="peso" form={form} onChange={handleChange} />
          <Campo label="Altura" name="altura" form={form} onChange={handleChange} />
        </Seccion>
        <Seccion titulo="Exploración">
          <Campo label="EFM" name="efm" form={form} onChange={handleChange} />
          <Campo label="Espéculo" name="especulo" form={form} onChange={handleChange} />
        </Seccion>
        <Seccion titulo="Indicaciones y Observaciones">
          <Campo label="Indicaciones" name="indicaciones" form={form} onChange={handleChange} type="textarea" fullWidth />
          <Campo label="Observaciones" name="observaciones" form={form} onChange={handleChange} type="textarea" fullWidth />
          <div className="flex flex-col gap-1 sm:col-span-2 md:col-span-3">
            <label className="text-xs font-semibold text-gray-600">Próximo control</label>
            <input className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" name="proximo_control" type="date" value={form.proximo_control || ''} onChange={handleChange} />
          </div>
        </Seccion>

        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
          <button onClick={guardar} className="text-white px-5 py-2.5 rounded-xl font-bold hover:opacity-90" style={{ background: 'linear-gradient(135deg, #166534, #15803d)' }}>
            {editando ? '✓ Actualizar' : 'Guardar ficha'}
          </button>
          <button onClick={() => setModalProcedimientos(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700">+ Procedimientos</button>
          {editando && <button onClick={() => { setEditando(null); setForm(campoVacio) }} className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-xl font-medium hover:bg-gray-200">Cancelar</button>}
        </div>
      </div>

      {/* Fichas anteriores */}
      {fichas.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center text-sm">📝</span>
            Fichas anteriores
          </h3>
          <div className="flex flex-col gap-3">
            {fichas.map(f => (
              <div key={f.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #c2410c, #f97316)' }} />
                <div className="p-4 flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-orange-600">{formatFecha(f.fecha)}</p>
                    <p className="text-sm text-gray-500 mt-0.5">Por: <span className="font-semibold text-gray-700">{f.profesional_nombre} {f.profesional_apellido}</span></p>
                    {f.motivo_consulta && <p className="text-sm text-gray-700 mt-1"><span className="font-bold text-gray-500">Motivo:</span> {f.motivo_consulta}</p>}
                    {f.proximo_control && <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full text-xs font-bold mt-2">📅 Próx. control: {formatFecha(f.proximo_control)}</span>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => imprimirPDF(f)} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100">🖨️ PDF</button>
                    <button onClick={() => editar(f)} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100">Editar</button>
                    <button onClick={() => eliminar(f.id)} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">Eliminar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}