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
  motivo_consulta: '', edad: '', gpa: '', ocupacion: '',
  pareja: '', red_apoyo: '', ant_morbidos: '', cirugias: '', alergias: '',
  medicamentos: '', tabaco: '', alcohol: '', drogas: '', examenes_sangre: '',
  ant_cacu: '', ant_ca_mama: '', menarquia: '', mac: '', menstruaciones: '',
  fur: '', ias: '', parejas_sexuales: '', sexo_biologico: '', its: '',
  eco_tv: '', pap: '', eco_mam_mamo: '', observaciones: '', proximo_control: ''
}

function Seccion({ titulo, children }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-px flex-1 bg-gray-100" />
        <span className="text-xs font-bold text-green-700 uppercase tracking-widest px-2">{titulo}</span>
        <div className="h-px flex-1 bg-gray-100" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">{children}</div>
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

export default function FichaIngreso2({ paciente, onVolver }) {
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
      axios.get(`${API}/2/paciente/${paciente.id}`),
      axios.get(API_PRO)
    ])
    setFichas(f.data)
    setProfesionales(pr.data)
  }

  useEffect(() => {
    cargar()
    // Recuperar borrador guardado
    try {
  const borrador = localStorage.getItem(`borrador_fi2_${paciente.id}`)
  if (borrador) {
    const datos = JSON.parse(borrador)
    setForm(datos)
  }
} catch (e) {
  localStorage.removeItem(`borrador_fi2_${paciente.id}`)
}
  }, [])

  const handleChange = e => {
    const nuevoForm = { ...form, [e.target.name]: e.target.value }
    setForm(nuevoForm)
    localStorage.setItem(`borrador_fi2_${paciente.id}`, JSON.stringify(nuevoForm))
  }

  const guardar = async () => {
    if (!form.profesional_id || !form.motivo_consulta) return alert('Completa el profesional y motivo de consulta')
    if (editando) {
      await axios.put(`${API}/2/${editando}`, form)
      setEditando(null)
    } else {
      await axios.post(`${API}/2`, { ...form, paciente_id: paciente.id })
    }
    setForm(campoVacio)
    localStorage.removeItem(`borrador_fi2_${paciente.id}`)
    cargar()
  }

  const editar = f => {
    setForm({ ...campoVacio, ...f, fecha: f.fecha?.slice(0,10) || new Date().toISOString().slice(0,10), proximo_control: f.proximo_control?.slice(0,10) || '' })
    setEditando(f.id)
    window.scrollTo(0, 0)
  }

  const eliminar = async id => {
    if (confirm('¿Eliminar ficha?')) {
      await axios.delete(`${API}/2/${id}`)
      cargar()
    }
  }

  const imprimirPDF = f => {
    const ventana = window.open('', '_blank')
    ventana.document.write(`<html><head><title>Ficha Clínica — ${paciente.nombre} ${paciente.apellido}</title>
      <style>body{font-family:Arial,sans-serif;font-size:12px;margin:20px;color:#333;}h1{color:#166534;font-size:18px;margin-bottom:4px;}h2{color:#166534;font-size:13px;margin:16px 0 6px;border-bottom:1px solid #dcfce7;padding-bottom:4px;}.grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 20px;}.campo{margin-bottom:4px;}.label{font-weight:bold;color:#555;}.valor{border-bottom:1px solid #ddd;min-height:18px;padding-bottom:2px;}.full{grid-column:1/-1;}@media print{button{display:none;}}</style>
      </head><body>
      <h1>Ficha Clínica — ${paciente.nombre} ${paciente.apellido}</h1>
      <p>RUT: ${paciente.rut || 'No registrado'} | Fecha: ${formatFecha(f.fecha)} | Profesional: ${f.profesional_nombre} ${f.profesional_apellido}</p>
      ${f.proximo_control ? `<p><strong>Próximo control:</strong> ${formatFecha(f.proximo_control)}</p>` : ''}
      <h2>Motivo de Consulta</h2><div class="grid">
        <div class="campo full"><div class="valor">${f.motivo_consulta || ''}</div></div>
        <div class="campo"><span class="label">Edad:</span><div class="valor">${f.edad || ''}</div></div>
        <div class="campo"><span class="label">GPA:</span><div class="valor">${f.gpa || ''}</div></div>
        <div class="campo"><span class="label">Ocupación:</span><div class="valor">${f.ocupacion || ''}</div></div>
        <div class="campo"><span class="label">Pareja:</span><div class="valor">${f.pareja || ''}</div></div>
        <div class="campo full"><span class="label">Red de apoyo:</span><div class="valor">${f.red_apoyo || ''}</div></div>
      </div>
      <h2>Antecedentes Personales</h2><div class="grid">
        <div class="campo"><span class="label">Ant. mórbidos:</span><div class="valor">${f.ant_morbidos || ''}</div></div>
        <div class="campo"><span class="label">Cirugías:</span><div class="valor">${f.cirugias || ''}</div></div>
        <div class="campo"><span class="label">Alergias:</span><div class="valor">${f.alergias || ''}</div></div>
        <div class="campo"><span class="label">Medicamentos:</span><div class="valor">${f.medicamentos || ''}</div></div>
        <div class="campo"><span class="label">Tabaco:</span><div class="valor">${f.tabaco || ''}</div></div>
        <div class="campo"><span class="label">Alcohol:</span><div class="valor">${f.alcohol || ''}</div></div>
        <div class="campo"><span class="label">Drogas:</span><div class="valor">${f.drogas || ''}</div></div>
        <div class="campo full"><span class="label">Exámenes sangre:</span><div class="valor">${f.examenes_sangre || ''}</div></div>
      </div>
      <h2>Antecedentes Gineco-Obstétricos</h2><div class="grid">
        <div class="campo"><span class="label">Menarquia:</span><div class="valor">${f.menarquia || ''}</div></div>
        <div class="campo"><span class="label">MAC:</span><div class="valor">${f.mac || ''}</div></div>
        <div class="campo full"><span class="label">Menstruaciones:</span><div class="valor">${f.menstruaciones || ''}</div></div>
        <div class="campo"><span class="label">FUR:</span><div class="valor">${f.fur || ''}</div></div>
        <div class="campo"><span class="label">IAS:</span><div class="valor">${f.ias || ''}</div></div>
        <div class="campo"><span class="label">Parejas sexuales:</span><div class="valor">${f.parejas_sexuales || ''}</div></div>
        <div class="campo"><span class="label">ITS:</span><div class="valor">${f.its || ''}</div></div>
        <div class="campo"><span class="label">ECO TV:</span><div class="valor">${f.eco_tv || ''}</div></div>
        <div class="campo"><span class="label">PAP:</span><div class="valor">${f.pap || ''}</div></div>
        <div class="campo"><span class="label">ECO MAM/MAMO:</span><div class="valor">${f.eco_mam_mamo || ''}</div></div>
      </div>
      <h2>Observaciones</h2><div class="campo full"><div class="valor">${f.observaciones || ''}</div></div>
      <script>window.onload=()=>window.print()</script></body></html>`)
    ventana.document.close()
  }

  return (
    <div className="min-h-screen bg-white">
      {modalProcedimientos && <ModalProcedimientos paciente={paciente} onCerrar={() => setModalProcedimientos(false)} />}

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl mb-6 p-6 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #3b82f6 100%)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #bfdbfe, transparent)', transform: 'translate(30%, -30%)' }} />
        <div className="relative z-10">
          <button onClick={onVolver} className="text-blue-200 text-xs font-semibold hover:text-white mb-2 flex items-center gap-1">← Volver</button>
          <h2 className="text-2xl font-black text-white">Ficha Clínica</h2>
          <p className="text-blue-200 text-sm mt-1">Matrona J — {paciente.nombre} {paciente.apellido}</p>
        </div>
        <div className="relative z-10">
          <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>
            {fichas.length} ficha{fichas.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Datos del paciente */}
      <div className="rounded-2xl p-5 mb-6 border border-blue-100" style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)' }}>
        <div className="flex justify-between items-center mb-3">
          <p className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs">👤</span>
            Datos del paciente
          </p>
          <button onClick={() => setEditandoDatos(!editandoDatos)} className="text-xs font-semibold text-blue-700 bg-white px-3 py-1.5 rounded-lg hover:bg-blue-50 border border-blue-200">
            {editandoDatos ? 'Cancelar' : '✏️ Editar'}
          </button>
        </div>
        {editandoDatos ? (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[['Nombre','nombre','text',formDatos.nombre||paciente.nombre],['Apellido','apellido','text',formDatos.apellido||paciente.apellido],['RUT','rut','text',formDatos.rut],['Teléfono','telefono','text',formDatos.telefono],['Fecha nacimiento','fecha_nacimiento','date',formDatos.fecha_nacimiento],['Email','email','email',formDatos.email]].map(([label, key, type, val]) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600">{label}</label>
                  <input type={type} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" value={val} onChange={e => setFormDatos(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <button onClick={async () => {
              await axios.put(`https://centro-medico-saberes-production.up.railway.app/pacientes/${paciente.id}`, { ...paciente, ...formDatos, nombre: formDatos.nombre || paciente.nombre, apellido: formDatos.apellido || paciente.apellido })
              setEditandoDatos(false)
              Object.assign(paciente, formDatos)
            }} className="text-white px-4 py-2 rounded-xl text-sm font-bold self-start" style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}>Guardar cambios</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {[['Nombre', `${paciente.nombre} ${paciente.apellido}`], ['RUT', paciente.rut || '—'], ['Nacimiento', paciente.fecha_nacimiento ? `${new Date(paciente.fecha_nacimiento.slice(0,10)+'T12:00:00').toLocaleDateString('es-CL')} (${calcularEdad(paciente.fecha_nacimiento)} años)` : '—'], ['Teléfono', paciente.telefono || '—'], ...(paciente.email ? [['Email', paciente.email]] : [])].map(([label, val]) => (
              <div key={label}>
                <p className="text-xs text-blue-700 font-semibold mb-0.5">{label}</p>
                <p className="font-semibold text-gray-800 text-sm">{val}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-800">{editando ? '✏️ Editar ficha' : '🗂️ Nueva ficha clínica'}</h3>
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
          <Campo label="Edad" name="edad" form={form} onChange={handleChange} />
          <Campo label="GPA" name="gpa" form={form} onChange={handleChange} />
          <Campo label="Ocupación" name="ocupacion" form={form} onChange={handleChange} />
          <Campo label="Pareja" name="pareja" form={form} onChange={handleChange} />
          <Campo label="Red de apoyo" name="red_apoyo" form={form} onChange={handleChange} type="textarea" fullWidth />
        </Seccion>
        <Seccion titulo="Antecedentes Personales">
          <Campo label="Ant. mórbidos" name="ant_morbidos" form={form} onChange={handleChange} type="textarea" />
          <Campo label="Cirugías" name="cirugias" form={form} onChange={handleChange} />
          <Campo label="Alergias" name="alergias" form={form} onChange={handleChange} />
          <Campo label="Medicamentos" name="medicamentos" form={form} onChange={handleChange} type="textarea" />
          <Campo label="Tabaco" name="tabaco" form={form} onChange={handleChange} />
          <Campo label="Alcohol" name="alcohol" form={form} onChange={handleChange} />
          <Campo label="Drogas" name="drogas" form={form} onChange={handleChange} />
          <Campo label="Exámenes de sangre" name="examenes_sangre" form={form} onChange={handleChange} type="textarea" fullWidth />
        </Seccion>
        <Seccion titulo="Antecedentes Familiares">
          <Campo label="Ant. CaCu" name="ant_cacu" form={form} onChange={handleChange} />
          <Campo label="Ant. Ca mama" name="ant_ca_mama" form={form} onChange={handleChange} />
        </Seccion>
        <Seccion titulo="Antecedentes Gineco-Obstétricos">
          <Campo label="Menarquia" name="menarquia" form={form} onChange={handleChange} />
          <Campo label="MAC" name="mac" form={form} onChange={handleChange} />
          <Campo label="Menstruaciones" name="menstruaciones" form={form} onChange={handleChange} type="textarea" fullWidth />
          <Campo label="FUR" name="fur" form={form} onChange={handleChange} />
          <Campo label="IAS" name="ias" form={form} onChange={handleChange} />
          <Campo label="Parejas sexuales" name="parejas_sexuales" form={form} onChange={handleChange} />
          <Campo label="Sexo biológico" name="sexo_biologico" form={form} onChange={handleChange} />
          <Campo label="ITS" name="its" form={form} onChange={handleChange} />
          <Campo label="ECO TV" name="eco_tv" form={form} onChange={handleChange} />
          <Campo label="PAP" name="pap" form={form} onChange={handleChange} />
          <Campo label="ECO MAM/MAMO" name="eco_mam_mamo" form={form} onChange={handleChange} />
        </Seccion>
        <Seccion titulo="Observaciones">
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
            <span className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center text-sm">🗂️</span>
            Fichas anteriores
          </h3>
          <div className="flex flex-col gap-3">
            {fichas.map(f => (
              <div key={f.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #1d4ed8, #3b82f6)' }} />
                <div className="p-4 flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-blue-600">{formatFecha(f.fecha)}</p>
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