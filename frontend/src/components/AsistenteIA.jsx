import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

const API = 'https://centro-medico-saberes-production.up.railway.app/asistente'

export default function AsistenteIA() {
  const [abierto, setAbierto] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [historial, setHistorial] = useState([])
  const [mensajes, setMensajes] = useState([
    { rol: 'asistente', texto: '¡Hola! Soy el asistente de Saberes 🌿\n\nPuedo ayudarte a:\n• Buscar pacientes\n• Ver citas del día\n• Agendar una cita (si la paciente ya está registrada)\n• Confirmar reservas tentativas\n• Ver pagos pendientes\n\n¿En qué te ayudo?' }
  ])
  const [cargando, setCargando] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (abierto) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes, abierto])

  const enviar = async () => {
    if (!mensaje.trim() || cargando) return
    const textoUsuario = mensaje.trim()
    setMensaje('')
    setMensajes(m => [...m, { rol: 'usuario', texto: textoUsuario }])
    setCargando(true)
    try {
      const token = localStorage.getItem('token')
      const res = await axios.post(API, { mensaje: textoUsuario, historial }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setHistorial(res.data.historial)
      setMensajes(m => [...m, { rol: 'asistente', texto: res.data.respuesta }])
    } catch (e) {
      const errorMsg = e.response?.data?.error || 'Error al conectar con el asistente.'
      setMensajes(m => [...m, { rol: 'asistente', texto: `❌ ${errorMsg}` }])
    }
    setCargando(false)
  }

  return (
    <>
      <button
        onClick={() => setAbierto(!abierto)}
        className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-40 w-14 h-14 bg-green-700 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-green-800 transition-all text-2xl"
        title="Asistente IA"
      >
        {abierto ? '✕' : '🤖'}
      </button>

      {abierto && (
        <div className="fixed bottom-44 right-4 md:bottom-24 md:right-6 z-40 w-80 md:w-96 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ height: '500px' }}>
          <div className="bg-gradient-to-r from-green-700 to-green-600 px-4 py-3 flex items-center gap-3">
            <span className="text-2xl">🤖</span>
            <div>
              <p className="text-white font-bold text-sm">Asistente Saberes</p>
              <p className="text-green-200 text-xs">Powered by Gemini ✨</p>
            </div>
            <button onClick={() => setAbierto(false)} className="ml-auto text-white hover:text-green-200 text-xl">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-gray-50">
            {mensajes.map((m, i) => (
              <div key={i} className={`flex ${m.rol === 'usuario' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                  m.rol === 'usuario'
                    ? 'bg-green-700 text-white rounded-br-sm'
                    : 'bg-white text-gray-800 shadow-sm rounded-bl-sm'
                }`}>
                  {m.texto}
                </div>
              </div>
            ))}
            {cargando && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-400 px-3 py-2 rounded-2xl rounded-bl-sm text-sm shadow-sm animate-pulse">
                  Pensando...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-3 border-t border-gray-100 bg-white flex gap-2">
            <input
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="Ej: busca a María González..."
              value={mensaje}
              onChange={e => setMensaje(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && enviar()}
            />
            <button
              onClick={enviar}
              disabled={cargando || !mensaje.trim()}
              className="bg-green-700 text-white px-3 py-2 rounded-xl hover:bg-green-800 disabled:opacity-50 transition-colors"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  )
}