import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'

const API = 'https://centro-medico-saberes-production.up.railway.app/encuestas'

function EstrellaRating({ label, value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1,2,3,4,5].map(n => (
          <button key={n} type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            className="text-3xl transition-transform hover:scale-110 focus:outline-none"
          >
            {n <= (hover || value) ? '⭐' : '☆'}
          </button>
        ))}
      </div>
    </div>
  )
}

const labelEstrellas = {
  1: 'Muy insatisfecha 😞',
  2: 'Insatisfecha 😕',
  3: 'Regular 😐',
  4: 'Satisfecha 😊',
  5: '¡Muy satisfecha! 🤩'
}

export default function Encuesta() {
  const { token } = useParams()
  const [encuesta, setEncuesta] = useState(null)
  const [paso, setPaso] = useState(1)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)

  const [form, setForm] = useState({
    profesional_id: '',
    estrellas: 0,
    calidad_atencion: 0,
    puntualidad: 0,
    instalaciones: 0,
    trato: 0,
    recomendaria: null,
    aspectos_positivos: '',
    aspectos_mejorar: '',
    comentario: '',
  })

  useEffect(() => {
    axios.get(`${API}/responder/${token}`)
      .then(r => {
        setEncuesta(r.data)
        if (r.data.estado === 'respondida') setEnviado(true)
        setCargando(false)
      })
      .catch(() => { setError('Encuesta no encontrada o expirada'); setCargando(false) })
  }, [token])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const enviar = async () => {
    if (form.estrellas === 0) { alert('Por favor selecciona una calificación general'); return }
    setEnviando(true)
    try {
      await axios.post(`${API}/responder/${token}`, form)
      setEnviado(true)
    } catch (e) {
      alert(e.response?.data?.error || 'Error al enviar')
    }
    setEnviando(false)
  }

  if (cargando) return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4 animate-pulse">🌿</div>
        <p className="text-green-700 font-medium">Cargando...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 text-center max-w-md w-full">
        <div className="text-5xl mb-4">😕</div>
        <p className="text-red-500 text-lg font-medium">{error}</p>
      </div>
    </div>
  )

  if (enviado) return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 text-center max-w-md w-full">
        <div className="text-7xl mb-6">💚</div>
        <h2 className="text-2xl font-bold text-green-800 mb-3">¡Muchas gracias!</h2>
        <p className="text-gray-600 text-lg mb-2">Tu opinión es muy valiosa para nosotras.</p>
        <p className="text-gray-500">Seguiremos trabajando para brindarte la mejor atención.</p>
        <div className="mt-8 p-4 bg-green-50 rounded-2xl">
          <p className="text-green-700 font-medium text-sm">Saberes — Espacio de Salud Integral 🌿</p>
        </div>
      </div>
    </div>
  )

  const totalPasos = 3

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8 px-4">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-md mb-3">
            <span className="text-3xl">🌿</span>
          </div>
          <h1 className="text-2xl font-bold text-green-800">Saberes</h1>
          <p className="text-green-600 text-sm">Espacio de Salud Integral</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          {[1,2,3].map(n => (
            <div key={n} className={`flex-1 h-2 rounded-full transition-all ${n <= paso ? 'bg-green-600' : 'bg-green-100'}`} />
          ))}
        </div>
        <p className="text-xs text-gray-400 text-center mb-6">Paso {paso} de {totalPasos}</p>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">

          {/* PASO 1 — Profesional y calificación general */}
          {paso === 1 && (
            <div className="p-8">
              <h2 className="text-xl font-bold text-gray-800 mb-1">Hola {encuesta?.nombre} 👋</h2>
              <p className="text-gray-500 mb-6">¿Cómo fue tu experiencia en tu última atención?</p>

              {/* Selector profesional */}
              <div className="mb-6">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">¿Con qué matrona te atendiste? *</label>
                <div className="flex flex-col gap-2">
                  {encuesta?.profesionales?.map(p => (
                    <button key={p.id} type="button"
                      onClick={() => set('profesional_id', p.id)}
                      className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                        form.profesional_id === p.id
                          ? 'border-green-600 bg-green-50'
                          : 'border-gray-100 hover:border-green-300 bg-gray-50'
                      }`}
                    >
                      {p.foto ? (
                        <img src={p.foto} alt={p.nombre} className={`w-20 h-20 rounded-full object-cover border-4 shadow-md ${form.profesional_id === p.id ? 'border-green-600' : 'border-gray-200'}`} />
                      ) : (
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg ${
                          form.profesional_id === p.id ? 'bg-green-600 text-white' : 'bg-gray-200'
                        }`}>
                          👩‍⚕️
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-800">{p.nombre} {p.apellido}</p>
                        <p className="text-xs text-gray-400">Matrona</p>
                      </div>
                      {form.profesional_id === p.id && (
                        <span className="ml-auto text-green-600 text-xl">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calificación general */}
              <div className="mb-6">
                <label className="text-sm font-semibold text-gray-700 mb-3 block">¿Cómo calificarías tu experiencia general? *</label>
                <div className="flex justify-center mb-2">
                  <EstrellaRating label="" value={form.estrellas} onChange={v => set('estrellas', v)} />
                </div>
                {form.estrellas > 0 && (
                  <p className="text-center text-sm font-medium text-green-700 bg-green-50 rounded-xl py-2 mt-2">
                    {labelEstrellas[form.estrellas]}
                  </p>
                )}
              </div>

              <button
                onClick={() => {
                  if (!form.profesional_id) { alert('Por favor selecciona con qué matrona te atendiste'); return }
                  if (form.estrellas === 0) { alert('Por favor selecciona una calificación general'); return }
                  setPaso(2)
                }}
                className="w-full bg-green-700 text-white py-4 rounded-2xl font-semibold text-lg hover:bg-green-800 transition-colors"
              >
                Continuar →
              </button>
            </div>
          )}

          {/* PASO 2 — Aspectos específicos */}
          {paso === 2 && (
            <div className="p-8">
              <h2 className="text-xl font-bold text-gray-800 mb-1">Cuéntanos más 🔍</h2>
              <p className="text-gray-500 mb-6">Evalúa los siguientes aspectos de tu atención</p>

              <div className="flex flex-col gap-5 mb-6">
                <EstrellaRating label="🩺 Calidad de la atención médica" value={form.calidad_atencion} onChange={v => set('calidad_atencion', v)} />
                <EstrellaRating label="⏰ Puntualidad" value={form.puntualidad} onChange={v => set('puntualidad', v)} />
                <EstrellaRating label="🏥 Instalaciones y comodidad" value={form.instalaciones} onChange={v => set('instalaciones', v)} />
                <EstrellaRating label="💚 Trato y empatía" value={form.trato} onChange={v => set('trato', v)} />
              </div>

              {/* ¿Recomendaría? */}
              <div className="mb-6">
                <label className="text-sm font-semibold text-gray-700 mb-3 block">¿Recomendarías Saberes a familia o amigas?</label>
                <div className="flex gap-3">
                  <button type="button"
                    onClick={() => set('recomendaria', true)}
                    className={`flex-1 py-3 rounded-2xl border-2 font-semibold transition-all ${
                      form.recomendaria === true ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-100 text-gray-500 hover:border-green-300'
                    }`}
                  >
                    👍 Sí, definitivamente
                  </button>
                  <button type="button"
                    onClick={() => set('recomendaria', false)}
                    className={`flex-1 py-3 rounded-2xl border-2 font-semibold transition-all ${
                      form.recomendaria === false ? 'border-red-400 bg-red-50 text-red-600' : 'border-gray-100 text-gray-500 hover:border-red-200'
                    }`}
                  >
                    👎 No por ahora
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setPaso(1)} className="flex-1 py-4 rounded-2xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50">
                  ← Volver
                </button>
                <button onClick={() => setPaso(3)} className="flex-1 bg-green-700 text-white py-4 rounded-2xl font-semibold hover:bg-green-800 transition-colors">
                  Continuar →
                </button>
              </div>
            </div>
          )}

          {/* PASO 3 — Comentarios libres */}
          {paso === 3 && (
            <div className="p-8">
              <h2 className="text-xl font-bold text-gray-800 mb-1">Tu opinión en detalle ✍️</h2>
              <p className="text-gray-500 mb-6">Estos campos son opcionales pero muy valiosos para nosotras</p>

              <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">✨ ¿Qué fue lo que más te gustó?</label>
                  <textarea
                    className="border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none text-sm"
                    rows={3}
                    placeholder="Ej: La atención fue muy cálida, me sentí escuchada..."
                    value={form.aspectos_positivos}
                    onChange={e => set('aspectos_positivos', e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">🔧 ¿Qué podríamos mejorar?</label>
                  <textarea
                    className="border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none text-sm"
                    rows={3}
                    placeholder="Ej: Los tiempos de espera, la señalización..."
                    value={form.aspectos_mejorar}
                    onChange={e => set('aspectos_mejorar', e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">💬 Comentario adicional</label>
                  <textarea
                    className="border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none text-sm"
                    rows={3}
                    placeholder="Cualquier otro comentario que quieras compartir..."
                    value={form.comentario}
                    onChange={e => set('comentario', e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-green-50 rounded-2xl p-4 mb-6">
                <p className="text-green-700 text-sm text-center font-medium">
                  💚 Gracias por tomarte el tiempo de compartir tu experiencia
                </p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setPaso(2)} className="flex-1 py-4 rounded-2xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50">
                  ← Volver
                </button>
                <button
                  onClick={enviar}
                  disabled={enviando}
                  className={`flex-1 py-4 rounded-2xl font-semibold text-white transition-colors ${enviando ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-700 hover:bg-green-800'}`}
                >
                  {enviando ? 'Enviando...' : '✓ Enviar respuesta'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}