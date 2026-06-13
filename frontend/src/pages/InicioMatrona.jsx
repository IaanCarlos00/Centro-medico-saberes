import { useEffect, useState } from 'react'
import { frases } from '../data/frases'
import axios from 'axios'
import Fichas from './Fichas'
import ModalConfirmar from '../components/ModalConfirmar'
import Toast from '../components/Toast'

const API_CITAS = 'https://centro-medico-saberes-production.up.railway.app/citas'
const API_PAC = 'https://centro-medico-saberes-production.up.railway.app/pacientes'

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

export default function InicioMatrona({ usuario }) {
  const [citas, setCitas] = useState([])
  const [pacientesMap, setPacientesMap] = useState({})
  const [cargando, setCargando] = useState(true)
  const [modalCompletar, setModalCompletar] = useState(null)
  const [pacienteAtendiendo, setPacienteAtendiendo] = useState(null)
  const [citaAtendiendo, setCitaAtendiendo] = useState(null)
  const [modalEncuesta, setModalEncuesta] = useState(null)
  const [modalFinalizar, setModalFinalizar] = useState(false)
  const [toast, setToast] = useState(null)

  const getFrase = () => {
    const usuarioId = parseInt(localStorage.getItem('id') || '1')
    const diaNro = Math.floor(Date.now() / 86400000)
    return frases[(diaNro + usuarioId) % frases.length]
  }

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

  const [citasSinFinalizar, setCitasSinFinalizar] = useState([])
  const [atencionesProf, setAtencionesProf] = useState([])

  useEffect(() => {
    const profesionalId = localStorage.getItem('profesional_id')
    const ahora = new Date()
    const sinFinalizar = citas.filter(c => {
      const horaCita = new Date(c.fecha_hora.replace(' ', 'T'))
      return (c.estado === 'pendiente' || c.estado === 'confirmada') && horaCita < ahora
    })
    setCitasSinFinalizar(sinFinalizar)
  }, [citas])

  useEffect(() => {
    axios.get('https://centro-medico-saberes-production.up.railway.app/dashboard/atenciones-profesional')
      .then(res => setAtencionesProf(res.data))
      .catch(() => {})
  }, [])

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
      if (pacienteAtendiendo.email) {
        setModalEncuesta(pacienteAtendiendo)
      }
    }
    setPacienteAtendiendo(null)
    setCitaAtendiendo(null)
  }

  if (pacienteAtendiendo) {
  return (
    <div>
      {modalFinalizar && (
        <ModalConfirmar
          titulo="¿Finalizar atención?"
          mensaje="La cita quedará marcada como realizada."
          textoConfirmar="✅ Finalizar"
          textoColor="bg-green-700 hover:bg-green-800"
          onConfirmar={() => { setModalFinalizar(false); finalizarAtencion() }}
          onCancelar={() => {
            setModalFinalizar(false)
            setPacienteAtendiendo(null)
            setCitaAtendiendo(null)
            cargar()
          }}
        />
      )}
      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onCerrar={() => setToast(null)} />}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className="text-sm text-gray-500">Atendiendo a <strong>{pacienteAtendiendo.nombre} {pacienteAtendiendo.apellido}</strong></span>
          <button
            onClick={() => setModalFinalizar(true)}
            className="ml-auto bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-green-800"
          >
            ✅ Finalizar atención
          </button>
        </div>
        <Fichas paciente={pacienteAtendiendo} onVolver={() => { setPacienteAtendiendo(null); setCitaAtendiendo(null); cargar() }} />
      </div>
    )
  }

  {modalFinalizar && (
    <ModalConfirmar
      titulo="¿Finalizar atención?"
      mensaje="La cita quedará marcada como realizada."
      textoConfirmar="✅ Finalizar"
      textoColor="bg-green-700 hover:bg-green-800"
      onConfirmar={() => { setModalFinalizar(false); finalizarAtencion() }}
      onCancelar={() => {
        setModalFinalizar(false)
        setPacienteAtendiendo(null)
        setCitaAtendiendo(null)
        cargar()
      }}
    />
  )}

  return (
    <div className="min-h-screen bg-white">
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

      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onCerrar={() => setToast(null)} />}

      {modalEncuesta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm text-center">
            <span className="text-5xl mb-4 block">⭐</span>
            <h3 className="text-lg font-bold text-green-800 mb-2">¿Enviar encuesta de satisfacción?</h3>
            <p className="text-sm text-gray-500 mb-6">{modalEncuesta.nombre} {modalEncuesta.apellido} recibirá un email para evaluar su atención.</p>
            <div className="flex gap-3">
              <button onClick={async () => {
                await axios.post(`https://centro-medico-saberes-production.up.railway.app/encuestas/enviar/${modalEncuesta.id}`)
                  .then(() => setToast({ mensaje: 'Encuesta enviada correctamente', tipo: 'exito' }))
                  .catch(() => setToast({ mensaje: 'Error al enviar la encuesta', tipo: 'error' }))
                setModalEncuesta(null)
              }} className="flex-1 bg-green-700 text-white py-2 rounded-lg hover:bg-green-800 font-medium">Sí, enviar</button>
              <button onClick={() => setModalEncuesta(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 font-medium">No por ahora</button>
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl mb-8 p-8" style={{ background: 'linear-gradient(135deg, #052e16 0%, #166534 50%, #15803d 100%)' }}>
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #86efac, transparent)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #4ade80, transparent)', transform: 'translate(-30%, 30%)' }} />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-green-300 text-sm font-medium capitalize mb-2">{hoy}</p>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">Mi Agenda 🩺</h1>
            <p className="text-green-100 text-xl font-semibold mb-2">{usuario.nombre}</p>
            <p className="text-green-200 text-sm italic">✨ {getFrase()}</p>
          </div>
          <img src="/logo.png" alt="Saberes" className="h-20 w-20 rounded-full object-cover hidden md:block" style={{ boxShadow: '0 0 0 4px rgba(255,255,255,0.15), 0 8px 32px rgba(0,0,0,0.3)' }} />
        </div>
      </div>

      {cargando ? (
        <div className="flex items-center justify-center py-32">
          <div className="w-16 h-16 border-4 border-green-200 border-t-green-700 rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <>
          {citasSinFinalizar.length > 0 && (
            <div className="rounded-2xl p-4 mb-6 flex items-center justify-between gap-3 border border-orange-200" style={{ background: 'linear-gradient(135deg, #fff7ed, #ffedd5)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-xl shrink-0">⏰</div>
                <div>
                  <p className="text-sm font-bold text-orange-800">{citasSinFinalizar.length} cita{citasSinFinalizar.length !== 1 ? 's' : ''} sin finalizar</p>
                  <p className="text-xs text-orange-600">{citasSinFinalizar.map(c => `${c.paciente_nombre} ${c.paciente_apellido} (${c.fecha_hora?.slice(11,16)})`).join(', ')}</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0 flex-wrap">
                {citasSinFinalizar.map(c => (
                  <button key={c.id} onClick={async () => { await axios.put(`${API_CITAS}/${c.id}`, { ...c, estado: 'realizada' }); cargar() }} className="text-xs bg-orange-500 text-white px-3 py-1.5 rounded-lg hover:bg-orange-600 font-semibold whitespace-nowrap">
                    ✅ {c.paciente_nombre?.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: '📅', label: 'Citas hoy', value: citas.length, gradient: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '#3b82f6', text: '#1d4ed8' },
              { icon: '🕐', label: 'Pendientes', value: citas.filter(c => c.estado === 'pendiente').length, gradient: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '#f59e0b', text: '#b45309' },
              { icon: '✅', label: 'Confirmadas', value: citas.filter(c => c.estado === 'confirmada').length, gradient: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '#22c55e', text: '#166534' },
              { icon: '🏥', label: 'Realizadas', value: citas.filter(c => c.estado === 'realizada').length, gradient: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', border: '#8b5cf6', text: '#6d28d9' },
            ].map((card, i) => (
              <div key={i} className="rounded-2xl p-5 transition-all hover:scale-105 hover:shadow-lg cursor-default" style={{ background: card.gradient, border: `1px solid ${card.border}33` }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: `${card.border}22` }}>{card.icon}</div>
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: card.text }}>{card.label}</span>
                </div>
                <p className="text-4xl font-black" style={{ color: card.text }}>{card.value}</p>
              </div>
            ))}
          </div>

          {/* Citas */}
          <div className="rounded-2xl p-6 mb-6 border border-gray-100 shadow-sm" style={{ background: 'linear-gradient(145deg, #ffffff, #f9fafb)' }}>
            <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
              <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-base">📋</span>
              Citas de hoy
            </h3>
            {citas.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-5xl mb-3">📭</p>
                <p className="text-gray-400">No hay citas programadas para hoy</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {citas.map(c => {
                  const paciente = getPaciente(c.paciente_id)
                  const incompleto = necesitaCompletar(paciente)
                  const bgMap = { en_atencion: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', realizada: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', cancelada: 'linear-gradient(135deg, #fef2f2, #fee2e2)' }
                  return (
                    <div key={c.id} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-green-200 transition-all hover:shadow-sm" style={{ background: bgMap[c.estado] || 'white' }}>
                      <div className="text-white rounded-xl px-3 py-2.5 text-center min-w-[64px] shrink-0" style={{ background: 'linear-gradient(135deg, #166534, #15803d)' }}>
                        <p className="text-lg font-black leading-none">{c.fecha_hora?.slice(11,16)}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-800">{c.paciente_nombre} {c.paciente_apellido}</p>
                        {c.procedimiento_nombre && <p className="text-xs text-blue-600 mt-0.5 font-semibold">📋 {c.procedimiento_nombre}</p>}
                        {c.observaciones && <p className="text-xs text-gray-400 mt-0.5">{c.observaciones}</p>}
                        {incompleto && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full mt-1 inline-block font-medium">Datos incompletos</span>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                        <span className={`text-xs px-3 py-1 rounded-full font-bold ${estadoColor[c.estado] || 'bg-gray-100 text-gray-600'}`}>
                          {c.estado === 'en_atencion' ? 'En atención' : c.estado}
                        </span>
                        {(c.estado === 'confirmada' || c.estado === 'pendiente') && (
                          <button onClick={() => iniciarAtencion(c)} className="text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity whitespace-nowrap" style={{ background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)' }}>
                            Iniciar atención
                          </button>
                        )}
                        {c.estado === 'en_atencion' && (
                          <button onClick={() => { setPacienteAtendiendo(paciente || { id: c.paciente_id, nombre: c.paciente_nombre, apellido: c.paciente_apellido }); setCitaAtendiendo(c) }} className="text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity whitespace-nowrap" style={{ background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)' }}>
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

          {/* Atenciones por profesional */}
          {atencionesProf.length > 0 && (
            <div className="rounded-2xl p-6 border border-gray-100 shadow-sm" style={{ background: 'linear-gradient(145deg, #ffffff, #f9fafb)' }}>
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-base">🩺</span>
                Atenciones e ingresos este mes
              </h3>
              <div className="flex flex-col gap-3">
                {atencionesProf.map((p, i) => (
                  <div key={i} className="flex justify-between items-center p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-teal-200 transition-colors">
                    <p className="font-bold text-gray-800">{p.nombre} {p.apellido}</p>
                    <div className="flex gap-6 text-sm">
                      <div className="text-center">
                        <p className="font-black text-teal-600 text-lg">{p.atenciones}</p>
                        <p className="text-xs text-gray-400">atenciones</p>
                      </div>
                      <div className="text-center">
                        <p className="font-black text-green-700">{new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(p.ingresos || 0)}</p>
                        <p className="text-xs text-gray-400">ingresos</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}