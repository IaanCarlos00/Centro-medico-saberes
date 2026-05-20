import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'

const API = 'https://centro-medico-saberes.onrender.com/encuestas'

export default function Encuesta() {
  const { token } = useParams()
  const [encuesta, setEncuesta] = useState(null)
  const [estrellas, setEstrellas] = useState(0)
  const [hover, setHover] = useState(0)
  const [comentario, setComentario] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    axios.get(`${API}/responder/${token}`)
      .then(r => {
        setEncuesta(r.data)
        if (r.data.estado === 'respondida') setEnviado(true)
        setCargando(false)
      })
      .catch(() => { setError('Encuesta no encontrada o expirada'); setCargando(false) })
  }, [token])

  const enviar = async () => {
    if (estrellas === 0) return alert('Por favor selecciona una calificación')
    await axios.post(`${API}/responder/${token}`, { estrellas, comentario })
    setEnviado(true)
  }

  if (cargando) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500">Cargando...</p>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow p-8 text-center max-w-md w-full">
        <p className="text-red-500 text-lg font-medium">{error}</p>
      </div>
    </div>
  )

  if (enviado) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow p-8 text-center max-w-md w-full">
        <div className="text-6xl mb-4">💚</div>
        <h2 className="text-2xl font-bold text-green-800 mb-2">¡Gracias por tu respuesta!</h2>
        <p className="text-gray-500">Tu opinión es muy importante para nosotros.</p>
        <p className="text-gray-400 text-sm mt-4">Saberes — Espacio de Salud Integral</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-green-800">Saberes</h1>
          <p className="text-gray-500 text-sm">Espacio de Salud Integral</p>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-1">Hola {encuesta?.nombre} 👋</h2>
        <p className="text-gray-500 mb-6">¿Cómo fue tu experiencia en tu última atención?</p>

        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onClick={() => setEstrellas(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              className="text-4xl transition-transform hover:scale-110"
            >
              {n <= (hover || estrellas) ? '⭐' : '☆'}
            </button>
          ))}
        </div>

        {estrellas > 0 && (
          <p className="text-center text-sm text-gray-500 mb-4">
            {estrellas === 1 && 'Muy insatisfecho'}
            {estrellas === 2 && 'Insatisfecho'}
            {estrellas === 3 && 'Regular'}
            {estrellas === 4 && 'Satisfecho'}
            {estrellas === 5 && '¡Muy satisfecho!'}
          </p>
        )}

        <div className="flex flex-col mb-6">
          <label className="text-sm text-gray-600 mb-1">Comentario (opcional)</label>
          <textarea
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
            rows={3}
            placeholder="Cuéntanos más sobre tu experiencia..."
            value={comentario}
            onChange={e => setComentario(e.target.value)}
          />
        </div>

        <button onClick={enviar} className="w-full bg-green-700 text-white py-3 rounded-lg hover:bg-green-800 font-medium text-lg">
          Enviar respuesta
        </button>
      </div>
    </div>
  )
}