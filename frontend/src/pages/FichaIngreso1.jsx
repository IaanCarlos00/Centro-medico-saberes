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
  alimentacion: '', ejercicio: '', vacuna_vph: ''
}

function Seccion({ titulo, children }) {
  return (
    <div className="mb-6">
      <h4 className="text-sm font-bold text-green-800 uppercase tracking-wide mb-3 pb-1 border-b border-green-100">{titulo}</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {children}
      </div>
    </div>
  )
}

function Campo({ label, name, form, onChange, type = 'text', fullWidth = false }) {
  return (
    <div className={`flex flex-col ${fullWidth ? 'sm:col-span-2 md:col-span-3' : ''}`}>
      <label className="text-xs text-gray-500 mb-1">{label}</label>
      {type === 'textarea' ? (
        <textarea className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 resize-none" name={name} rows={2} value={form[name] || ''} onChange={onChange} />
      ) : (
        <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" name={name} type={type} value={form[name] || ''} onChange={onChange} />
      )}
    </div>
  )
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
    setForm({ ...campoVacio, ...f, fecha: f.fecha?.slice(0,10) || new Date().toISOString().slice(0,10) })
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
    ventana.document.write(`
      <html><head><title>Ficha de Ingreso — ${paciente.nombre} ${paciente.apellido}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; color: #333; }
        h1 { color: #166534; font-size: 18px; margin-bottom: 4px; }
        h2 { color: #166534; font-size: 13px; margin: 16px 0 6px; border-bottom: 1px solid #dcfce7; padding-bottom: 4px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 20px; }
        .campo { margin-bottom: 4px; }
        .label { font-weight: bold; color: #555; }
        .valor { border-bottom: 1px solid #ddd; min-height: 18px; padding-bottom: 2px; }
        .full { grid-column: 1 / -1; }
        @media print { button { display: none; } }
      </style></head><body>
      <h1>Ficha de Ingreso — ${paciente.nombre} ${paciente.apellido}</h1>
      <p>RUT: ${paciente.rut || 'No registrado'} | Fecha: ${formatFecha(f.fecha)} | Profesional: ${f.profesional_nombre} ${f.profesional_apellido}</p>
      <h2>Motivo de Consulta</h2>
      <div class="campo full"><div class="valor">${f.motivo_consulta || ''}</div></div>
      <h2>Datos Personales</h2>
      <div class="grid">
        <div class="campo"><span class="label">Dirección:</span><div class="valor">${f.direccion || ''}</div></div>
      </div>
      <h2>Antecedentes</h2>
      <div class="grid">
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
      <h2>Historia Sexual</h2>
      <div class="grid">
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
      <h2>Parámetros Clínicos</h2>
      <div class="grid">
        <div class="campo"><span class="label">Presión arterial:</span><div class="valor">${f.presion_arterial || ''}</div></div>
        <div class="campo"><span class="label">Peso:</span><div class="valor">${f.peso || ''}</div></div>
        <div class="campo"><span class="label">Altura:</span><div class="valor">${f.altura || ''}</div></div>
      </div>
      <h2>Exploración</h2>
      <div class="grid">
        <div class="campo"><span class="label">EFM:</span><div class="valor">${f.efm || ''}</div></div>
        <div class="campo"><span class="label">Espéculo:</span><div class="valor">${f.especulo || ''}</div></div>
      </div>
      <h2>Indicaciones</h2>
      <div class="campo full"><div class="valor">${f.indicaciones || ''}</div></div>
      <h2>Observaciones</h2>
      <div class="campo full"><div class="valor">${f.observaciones || ''}</div></div>
      <script>window.onload = () => window.print()</script>
      </body></html>
    `)
    ventana.document.close()
  }

 return (
    <div>
      {modalProcedimientos && (
        <ModalProcedimientos paciente={paciente} onCerrar={() => setModalProcedimientos(false)} />
      )}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onVolver} className="text-green-700 hover:underline text-sm font-medium">← Volver</button>
        <h2 className="text-xl font-bold text-green-800">Ficha de Ingreso — Matrona V</h2>
        <span className="text-gray-400 text-sm">/ {paciente.nombre} {paciente.apellido}</span>
      </div>

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
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">Nombre</label>
          <input className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" value={formDatos.nombre || paciente.nombre} onChange={e => setFormDatos(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre" />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">Apellido</label>
          <input className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" value={formDatos.apellido || paciente.apellido} onChange={e => setFormDatos(f => ({ ...f, apellido: e.target.value }))} placeholder="Apellido" />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">RUT</label>
          <input className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" value={formDatos.rut} onChange={e => setFormDatos(f => ({ ...f, rut: e.target.value }))} placeholder="12.345.678-9" />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">Teléfono</label>
          <input className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" value={formDatos.telefono} onChange={e => setFormDatos(f => ({ ...f, telefono: e.target.value }))} placeholder="+56 9 1234 5678" />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">Fecha de nacimiento</label>
          <input type="date" className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" value={formDatos.fecha_nacimiento} onChange={e => setFormDatos(f => ({ ...f, fecha_nacimiento: e.target.value }))} />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">Email</label>
          <input type="email" className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" value={formDatos.email} onChange={e => setFormDatos(f => ({ ...f, email: e.target.value }))} placeholder="correo@ejemplo.cl" />
        </div>
      </div>
      <button onClick={async () => {
        await axios.put(`https://centro-medico-saberes-production.up.railway.app/pacientes/${paciente.id}`, { 
          ...paciente, 
          ...formDatos,
          nombre: formDatos.nombre || paciente.nombre,
          apellido: formDatos.apellido || paciente.apellido
        })
        setEditandoDatos(false)
        Object.assign(paciente, formDatos)
      }} className="bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-green-800 self-start">Guardar</button>
    </div>
  ) : (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
      <div><span className="text-gray-500 text-xs">Nombre</span><p className="font-medium text-gray-800">{paciente.nombre} {paciente.apellido}</p></div>
      <div><span className="text-gray-500 text-xs">RUT</span><p className="font-medium text-gray-800">{paciente.rut || '—'}</p></div>
      <div><span className="text-gray-500 text-xs">Fecha de nacimiento</span><p className="font-medium text-gray-800">{paciente.fecha_nacimiento ? `${new Date(paciente.fecha_nacimiento.slice(0,10) + 'T12:00:00').toLocaleDateString('es-CL')} (${calcularEdad(paciente.fecha_nacimiento)} años)` : '—'}</p></div>
      {paciente.email && <div><span className="text-gray-500 text-xs">Email</span><p className="font-medium text-gray-800">{paciente.email}</p></div>}
    </div>
  )}
</div>

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-6">{editando ? 'Editar ficha' : 'Nueva ficha de ingreso'}</h3>

        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Profesional *</label>
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 w-full" name="profesional_id" value={form.profesional_id} onChange={handleChange}>
              <option value="">Seleccionar profesional</option>
              {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Fecha de la consulta</label>
            <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 w-full" name="fecha" type="date" value={form.fecha || ''} onChange={handleChange} />
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
        </Seccion>

        <div className="flex gap-3 mt-4">
          <button onClick={guardar} className="bg-green-700 text-white px-5 py-2 rounded-lg hover:bg-green-800 font-medium">
            {editando ? 'Actualizar' : 'Guardar ficha'}
          </button>
          <button onClick={() => setModalProcedimientos(true)} className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-medium">
            + Procedimientos
          </button>
          {editando && <button onClick={() => { setEditando(null); setForm(campoVacio) }} className="bg-gray-200 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-300 font-medium">Cancelar</button>}
        </div>
      </div>

      {fichas.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-700 mb-3">Fichas anteriores</h3>
          <div className="flex flex-col gap-4">
            {fichas.map(f => (
              <div key={f.id} className="bg-white rounded-xl shadow p-5 border-l-4 border-orange-500">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-xs text-gray-400">{formatFecha(f.fecha)}</p>
                    <p className="text-sm text-gray-600 mt-0.5">Atendido por: <span className="font-medium">{f.profesional_nombre} {f.profesional_apellido}</span></p>
                    {f.motivo_consulta && <p className="text-sm text-gray-700 mt-1"><span className="font-semibold">Motivo:</span> {f.motivo_consulta}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => imprimirPDF(f)} className="text-blue-600 hover:underline text-sm font-medium">PDF</button>
                    <button onClick={() => editar(f)} className="text-green-700 hover:underline text-sm font-medium">Editar</button>
                    <button onClick={() => eliminar(f.id)} className="text-red-500 hover:underline text-sm font-medium">Eliminar</button>
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