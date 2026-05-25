import { useEffect, useState } from 'react'
import axios from 'axios'
import Fichas from './Fichas'

const API_CITAS = 'https://centro-medico-saberes-production.up.railway.app/citas'
const API_PAC = 'https://centro-medico-saberes-production.up.railway.app/pacientes'
const API_PAGOS = 'https://centro-medico-saberes-production.up.railway.app/pagos'

const estadoColor = {
  pendiente: 'bg-yellow-100 text-yellow-700',
  confirmada: 'bg-blue-100 text-blue-700',
  en_atencion: 'bg-purple-100 text-purple-700',
  realizada: 'bg-green-100 text-green-700',
  cancelada: 'bg-red-100 text-red-700',
}

function ModalCompletarPaciente({ paciente, onConfirmar, onCerrar }) {
  const [form, setForm] = useState({
    rut: paciente.rut || '',
    fecha_nacimiento: paciente.fecha_nacimiento?.slice(0,10) || '',
    telefono: paciente.telefono || ''
  })
  const [errores, setErrores] = useState({})

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrores({ ...errores, [e.target.name]: '' })
  }

  const guardar = async () => {
    const e = {}
    if (!form.rut.trim()) e.rut = 'El RUT es obligatorio'
    if (!form.fecha_nacimiento) e.fecha_nacimiento = 'La fecha es obligatoria'
    if (!form.telefono.trim()) e.telefono = 'El teléfono es obligatorio'
    if (Object.keys(e).length > 0) { setErrores(e); return }
    await axios.put(`${API_PAC}/${paciente.id}`, { ...paciente, ...form })
    onConfirmar()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4" onClick={onCerrar}>
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">📋</span>
          <div>
            <h3 className="text-lg font-bold text-green-800">Completar datos</h3>
            <p className="text-sm text-gray-500">{paciente.nombre} {paciente.apellido}</p>
          </div>
        </div>
        <p className="text-sm text-yellow-700 bg-yellow-50 rounded-lg px-3 py-2 mb-4">Completa los datos antes de iniciar la atención.</p>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">RUT *</label>
            <input className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.rut ? 'border-red-400' : 'border-gray-300'}`} name="rut" placeholder="12.345.678-9" value={form.rut} onChange={handleChange} />
            {errores.rut && <span className="text-red-500 text-xs mt-1">{errores.rut}</span>}
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Fecha de nacimiento *</label>
            <input className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.fecha_nacimiento ? 'border-red-400' : 'border-gray-300'}`} name="fecha_nacimiento" type="date" value={form.fecha_nacimiento} onChange={handleChange} />
            {errores.fecha_nacimiento && <span className="text-red-500 text-xs mt-1">{errores.fecha_nacimiento}</span>}
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Teléfono *</label>
            <input className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.telefono ? 'border-red-400' : 'border-gray-300'}`} name="telefono" placeholder="+56 9 1234 5678" value={form.telefono} onChange={handleChange} />
            {errores.telefono && <span className="text-red-500 text-xs mt-1">{errores.telefono}</span>}
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={guardar} className="flex-1 bg-green-700 text-white py-2 rounded-lg hover:bg-green-800 font-medium">Guardar e iniciar</button>
          <button onClick={onCerrar} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 font-medium">Cancelar</button>
        </div>
      </div>
    </div>
  )
}

function ModalRegistrarPago({ paciente, cita, onConfirmar, onCerrar }) {
  const [form, setForm] = useState({ monto: '', metodo: 'debito', estado: 'pagado', notas: '' })
  const [errores, setErrores] = useState({})

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrores({ ...errores, [e.target.name]: '' })
  }

  const guardar = async () => {
    const e = {}
    if (!form.monto || isNaN(form.monto) || Number(form.monto) <= 0) e.monto = 'Ingresa un monto válido'
    if (Object.keys(e).length > 0) { setErrores(e); return }
    await axios.post(API_PAGOS, { ...form, paciente_id: paciente.id, cita_id: cita.id })
    onConfirmar()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4" onClick={onCerrar}>
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-5">
          <span className="text-3xl">💰</span>
          <div>
            <h3 className="text-lg font-bold text-green-800">Registrar pago</h3>
            <p className="text-sm text-gray-500">{paciente.nombre} {paciente.apellido}</p>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Monto ($) *</label>
            <input className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${errores.monto ? 'border-red-400' : 'border-gray-300'}`} name="monto" type="number" placeholder="25000" value={form.monto} onChange={handleChange} />
            {errores.monto && <span className="text-red-500 text-xs mt-1">{errores.monto}</span>}
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Método de pago</label>
            <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" name="metodo" value={form.metodo} onChange={handleChange}>
              <option value="debito">💳 Débito</option>
              <option value="efectivo">💵 Efectivo</option>
              <option value="transferencia">🏦 Transferencia</option>
              <option value="fonasa">🏥 Fonasa</option>
              <option value="credito">💳 Crédito</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Estado</label>
            <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" name="estado" value={form.estado} onChange={handleChange}>
              <option value="pagado">Pagado</option>
              <option value="pendiente">Pendiente</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Notas (opcional)</label>
            <input className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" name="notas" placeholder="Ej: Bono enviado, procedimiento adicional..." value={form.notas} onChange={handleChange} />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={guardar} className="flex-1 bg-green-700 text-white py-2 rounded-lg hover:bg-green-800 font-medium">Registrar pago</button>
          <button onClick={onCerrar} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 font-medium">Omitir</button>
        </div>
      </div>
    </div>
  )
}

export default function InicioMatrona({ usuario }) {
  const [citas, setCitas] = useState([])
  const [pacientesMap, setPacientesMap] = useState({})
  const [cargando, setCargando] = useState(true)
  const [modalCompletar, setModalCompletar] = useState(null)
  const [modalPago, setModalPago] = useState(null)
  const [pacienteAtendiendo, setPacienteAtendiendo] = useState(null)
  const [citaAtendiendo, setCitaAtendiendo] = useState(null)

  const hoy = new Date().toLocaleDateString('es-CL', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  const cargar = async () => {
    setCargando(true)
    try {
      const [c, p] = await Promise.all([axios.get(API_CITAS), axios.get(API_PAC)])
      const hoyStr = new Date().toISOString().slice(0, 10)
      const profesionalId = localStorage.getItem('profesional_id')
      const citasHoy = c.data
        .filter(ci => {
          const esHoy = ci.fecha_hora?.slice(0, 10) === hoyStr
          const esSuya = !profesionalId || String(ci.profesional_id) === String(profesionalId)
          return esHoy && esSuya
        })
        .sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora))
            setCitas(citasHoy)
      const mapa = {}
      p.data.forEach(pac => { mapa[pac.id] = pac })
      setPacientesMap(mapa)
    } catch (err) {
      console.error(err)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const getPaciente = id => pacientesMap[parseInt(id)] || null

  const necesitaCompletar = p => !p || !p.rut || !p.fecha_nacimiento || !p.telefono

  const iniciarAtencion = async cita => {
    try {
      const res = await axios.get(`${API_PAC}/${cita.paciente_id}`)
      const paciente = res.data
      await cambiarEstado(cita.id, cita, 'en_atencion')
      setPacienteAtendiendo(paciente)
      setCitaAtendiendo(cita)
    } catch (err) {
      console.error('Error al obtener paciente:', err)
    }
  }

  const cambiarEstado = async (id, cita, estado) => {
    await axios.put(`${API_CITAS}/${id}`, { ...cita, estado })
    await cargar()
  }

  const finalizarAtencion = async () => {
    if (citaAtendiendo) {
      await cambiarEstado(citaAtendiendo.id, citaAtendiendo, 'realizada')
      setModalPago({ paciente: pacienteAtendiendo, cita: citaAtendiendo })
    }
    setPacienteAtendiendo(null)
    setCitaAtendiendo(null)
  }

  if (pacienteAtendiendo) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className="text-sm text-gray-500">Atendiendo a <strong>{pacienteAtendiendo.nombre} {pacienteAtendiendo.apellido}</strong></span>
          <button
            onClick={() => {
              if (confirm('¿Deseas finalizar la atención?\n\nAcepta = Finalizar y marcar como realizada\nCancela = Solo volver, retomar después')) {
                finalizarAtencion()
              } else {
                setPacienteAtendiendo(null)
                setCitaAtendiendo(null)
                cargar()
              }
            }}
            className="ml-auto bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-green-800"
          >
            ✅ Finalizar atención
          </button>
        </div>
        <Fichas paciente={pacienteAtendiendo} onVolver={() => { setPacienteAtendiendo(null); setCitaAtendiendo(null); cargar() }} />
      </div>
    )
  }

  return (
    <div>
      {modalCompletar && (
        <ModalCompletarPaciente
          paciente={modalCompletar.paciente}
          onConfirmar={async () => {
            const res = await axios.get(`${API_PAC}/${modalCompletar.paciente.id}`)
            await cambiarEstado(modalCompletar.cita.id, modalCompletar.cita, 'en_atencion')
            setModalCompletar(null)
            setPacienteAtendiendo(res.data)
            setCitaAtendiendo(modalCompletar.cita)
            await cargar()
          }}
          onCerrar={() => setModalCompletar(null)}
        />
      )}

      {modalPago && (
        <ModalRegistrarPago
          paciente={modalPago.paciente}
          cita={modalPago.cita}
          onConfirmar={() => { setModalPago(null); cargar() }}
          onCerrar={() => setModalPago(null)}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-green-800">Mi Agenda — {usuario.nombre}</h2>
          <p className="text-gray-400 capitalize mt-1">{hoy}</p>
        </div>
        <img src="/logo.png" alt="Saberes" className="h-14 w-14 rounded-full object-cover shadow hidden md:block" />
      </div>

      {cargando ? (
        <div className="text-center py-20 text-gray-400">Cargando agenda...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl shadow-sm p-4 border-l-4 border-blue-500">
              <p className="text-3xl font-bold text-gray-800">{citas.length}</p>
              <p className="text-gray-500 text-sm mt-1">Citas hoy</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-4 border-l-4 border-yellow-500">
              <p className="text-3xl font-bold text-gray-800">{citas.filter(c => c.estado === 'pendiente').length}</p>
              <p className="text-gray-500 text-sm mt-1">Pendientes</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-4 border-l-4 border-green-500">
              <p className="text-3xl font-bold text-gray-800">{citas.filter(c => c.estado === 'confirmada').length}</p>
              <p className="text-gray-500 text-sm mt-1">Confirmadas</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-4 border-l-4 border-purple-500">
              <p className="text-3xl font-bold text-gray-800">{citas.filter(c => c.estado === 'realizada').length}</p>
              <p className="text-gray-500 text-sm mt-1">Realizadas</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Citas de hoy</h3>
            {citas.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-gray-400">No hay citas programadas para hoy</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {citas.map(c => {
                  const paciente = getPaciente(c.paciente_id)
                  const incompleto = necesitaCompletar(paciente)
                  return (
                    <div key={c.id} className={`flex items-center gap-4 p-4 rounded-xl border ${
                      c.estado === 'en_atencion' ? 'border-purple-300 bg-purple-50' :
                      c.estado === 'realizada' ? 'border-green-200 bg-green-50' :
                      c.estado === 'cancelada' ? 'border-red-200 bg-red-50' :
                      'border-gray-100 bg-gray-50'
                    }`}>
                      <div className="bg-green-700 text-white rounded-xl px-3 py-2 text-center min-w-[60px]">
                        <p className="text-lg font-bold leading-none">{c.fecha_hora?.slice(11,16)}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800">{c.paciente_nombre} {c.paciente_apellido}</p>
                        {c.procedimiento_nombre && <p className="text-xs text-blue-600 mt-0.5 font-medium">📋 {c.procedimiento_nombre}</p>}
                        {c.observaciones && <p className="text-xs text-gray-500 mt-0.5">{c.observaciones}</p>}
                        {incompleto && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full mt-1 inline-block">Datos incompletos</span>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${estadoColor[c.estado] || 'bg-gray-100 text-gray-600'}`}>
                          {c.estado === 'en_atencion' ? 'En atención' : c.estado}
                        </span>
                        {(c.estado === 'confirmada' || c.estado === 'pendiente') && (
                          <button onClick={() => iniciarAtencion(c)} className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors whitespace-nowrap">
                            Iniciar atención
                          </button>
                        )}
                        {c.estado === 'en_atencion' && (
                          <button onClick={() => { setPacienteAtendiendo(paciente || { id: c.paciente_id, nombre: c.paciente_nombre, apellido: c.paciente_apellido }); setCitaAtendiendo(c) }} className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors whitespace-nowrap">
                            Continuar
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}