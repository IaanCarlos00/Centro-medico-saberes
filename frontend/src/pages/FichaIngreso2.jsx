import { useEffect, useState } from 'react'
import axios from 'axios'

const API = 'https://centro-medico-saberes-production.up.railway.app/fichas-ingreso'
const API_PRO = 'https://centro-medico-saberes-production.up.railway.app/profesionales'

const campoVacio = {
  profesional_id: '', motivo_consulta: '', edad: '', gpa: '', ocupacion: '',
  pareja: '', red_apoyo: '', ant_morbidos: '', cirugias: '', alergias: '',
  medicamentos: '', tabaco: '', alcohol: '', drogas: '', examenes_sangre: '',
  ant_cacu: '', ant_ca_mama: '', menarquia: '', mac: '', menstruaciones: '',
  fur: '', ias: '', parejas_sexuales: '', sexo_biologico: '', its: '',
  eco_tv: '', pap: '', eco_mam_mamo: '', observaciones: ''
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
        <textarea
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 resize-none"
          name={name} rows={2} value={form[name] || ''} onChange={onChange}
        />
      ) : (
        <input
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
          name={name} type={type} value={form[name] || ''} onChange={onChange}
        />
      )}
    </div>
  )
}

export default function FichaIngreso2({ paciente, onVolver }) {
  const [fichas, setFichas] = useState([])
  const [profesionales, setProfesionales] = useState([])
  const [form, setForm] = useState(campoVacio)
  const [editando, setEditando] = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)

  const cargar = async () => {
    const [f, pr] = await Promise.all([
      axios.get(`${API}/2/paciente/${paciente.id}`),
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
      await axios.put(`${API}/2/${editando}`, form)
      setEditando(null)
    } else {
      await axios.post(`${API}/2`, { ...form, paciente_id: paciente.id })
    }
    setForm(campoVacio)
    setMostrarForm(false)
    cargar()
  }

  const editar = f => {
    setForm({ ...campoVacio, ...f })
    setEditando(f.id)
    setMostrarForm(true)
  }

  const eliminar = async id => {
    if (confirm('¿Eliminar ficha?')) {
      await axios.delete(`${API}/2/${id}`)
      cargar()
    }
  }

  const imprimirPDF = f => {
    const ventana = window.open('', '_blank')
    ventana.document.write(`
      <html><head><title>Ficha Clínica — ${paciente.nombre} ${paciente.apellido}</title>
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
      <h1>Ficha Clínica — ${paciente.nombre} ${paciente.apellido}</h1>
      <p>RUT: ${paciente.rut} | Fecha: ${new Date(f.fecha).toLocaleDateString('es-CL')} | Profesional: ${f.profesional_nombre} ${f.profesional_apellido}</p>

      <h2>Motivo de Consulta</h2>
      <div class="grid">
        <div class="campo full"><div class="valor">${f.motivo_consulta || ''}</div></div>
        <div class="campo"><span class="label">Edad:</span><div class="valor">${f.edad || ''}</div></div>
        <div class="campo"><span class="label">GPA:</span><div class="valor">${f.gpa || ''}</div></div>
        <div class="campo"><span class="label">Ocupación:</span><div class="valor">${f.ocupacion || ''}</div></div>
        <div class="campo"><span class="label">Pareja:</span><div class="valor">${f.pareja || ''}</div></div>
        <div class="campo full"><span class="label">Red de apoyo:</span><div class="valor">${f.red_apoyo || ''}</div></div>
      </div>

      <h2>Antecedentes Personales</h2>
      <div class="grid">
        <div class="campo"><span class="label">Ant. mórbidos:</span><div class="valor">${f.ant_morbidos || ''}</div></div>
        <div class="campo"><span class="label">Cirugías:</span><div class="valor">${f.cirugias || ''}</div></div>
        <div class="campo"><span class="label">Alergias:</span><div class="valor">${f.alergias || ''}</div></div>
        <div class="campo"><span class="label">Medicamentos:</span><div class="valor">${f.medicamentos || ''}</div></div>
        <div class="campo"><span class="label">Tabaco:</span><div class="valor">${f.tabaco || ''}</div></div>
        <div class="campo"><span class="label">Alcohol:</span><div class="valor">${f.alcohol || ''}</div></div>
        <div class="campo"><span class="label">Drogas:</span><div class="valor">${f.drogas || ''}</div></div>
        <div class="campo full"><span class="label">Exámenes de sangre:</span><div class="valor">${f.examenes_sangre || ''}</div></div>
      </div>

      <h2>Antecedentes Familiares</h2>
      <div class="grid">
        <div class="campo"><span class="label">Ant. CaCu:</span><div class="valor">${f.ant_cacu || ''}</div></div>
        <div class="campo"><span class="label">Ant. Ca mama:</span><div class="valor">${f.ant_ca_mama || ''}</div></div>
      </div>

      <h2>Antecedentes Gineco-Obstétricos</h2>
      <div class="grid">
        <div class="campo"><span class="label">Menarquia:</span><div class="valor">${f.menarquia || ''}</div></div>
        <div class="campo"><span class="label">MAC:</span><div class="valor">${f.mac || ''}</div></div>
        <div class="campo full"><span class="label">Menstruaciones:</span><div class="valor">${f.menstruaciones || ''}</div></div>
        <div class="campo"><span class="label">FUR:</span><div class="valor">${f.fur || ''}</div></div>
        <div class="campo"><span class="label">IAS:</span><div class="valor">${f.ias || ''}</div></div>
        <div class="campo"><span class="label">Parejas sexuales:</span><div class="valor">${f.parejas_sexuales || ''}</div></div>
        <div class="campo"><span class="label">Sexo biológico:</span><div class="valor">${f.sexo_biologico || ''}</div></div>
        <div class="campo"><span class="label">ITS:</span><div class="valor">${f.its || ''}</div></div>
        <div class="campo"><span class="label">ECO TV:</span><div class="valor">${f.eco_tv || ''}</div></div>
        <div class="campo"><span class="label">PAP:</span><div class="valor">${f.pap || ''}</div></div>
        <div class="campo"><span class="label">ECO MAM/MAMO:</span><div class="valor">${f.eco_mam_mamo || ''}</div></div>
      </div>

      <h2>Observaciones</h2>
      <div class="campo full"><div class="valor">${f.observaciones || ''}</div></div>

      <script>window.onload = () => window.print()</script>
      </body></html>
    `)
    ventana.document.close()
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onVolver} className="text-green-700 hover:underline text-sm font-medium">← Volver</button>
        <h2 className="text-xl font-bold text-green-800">Ficha Clínica — Matrona 2</h2>
        <span className="text-gray-400 text-sm">/ {paciente.nombre} {paciente.apellido}</span>
      </div>

      {!mostrarForm && (
        <button onClick={() => setMostrarForm(true)} className="bg-green-700 text-white px-5 py-2 rounded-lg hover:bg-green-800 font-medium mb-6">
          + Nueva ficha
        </button>
      )}

      {mostrarForm && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-6">{editando ? 'Editar ficha' : 'Nueva ficha clínica'}</h3>

          <div className="mb-4">
            <label className="text-xs text-gray-500 mb-1 block">Profesional *</label>
            <select
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 w-full md:w-1/3"
              name="profesional_id" value={form.profesional_id} onChange={handleChange}
            >
              <option value="">Seleccionar profesional</option>
              {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
            </select>
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
          </Seccion>

          <div className="flex gap-3 mt-4">
            <button onClick={guardar} className="bg-green-700 text-white px-5 py-2 rounded-lg hover:bg-green-800 font-medium">
              {editando ? 'Actualizar' : 'Guardar ficha'}
            </button>
            <button onClick={() => { setMostrarForm(false); setEditando(null); setForm(campoVacio) }} className="bg-gray-200 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-300 font-medium">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {!mostrarForm && (
        <div className="flex flex-col gap-4">
          {fichas.map(f => (
            <div key={f.id} className="bg-white rounded-xl shadow p-5 border-l-4 border-blue-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-gray-400">{new Date(f.fecha).toLocaleDateString('es-CL')}</p>
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
          {fichas.length === 0 && (
            <div className="bg-white rounded-xl shadow p-8 text-center text-gray-400">No hay fichas clínicas registradas</div>
          )}
        </div>
      )}
    </div>
  )
}