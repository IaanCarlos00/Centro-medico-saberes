import { useEffect, useState } from 'react'
import axios from 'axios'

const API_CITAS = 'https://centro-medico-saberes-production.up.railway.app/citas'

const estadoBadge = {
  pendiente: 'bg-yellow-100 text-yellow-700',
  confirmada: 'bg-blue-100 text-blue-700',
  realizada: 'bg-green-100 text-green-700',
  cancelada: 'bg-red-100 text-red-600',
}

function formatHora(fechaHora) {
  if (!fechaHora) return ''
  return new Date(fechaHora.replace(' ', 'T')).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
}

export default function InicioRecepcionista() {
  const [citas, setCitas] = useState([])
  const [cargando, setCargando] = useState(true)

  const hoyStr = new Date().toISOString().slice(0, 10)
  const hoyFormateado = new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const cargar = async () => {
    setCargando(true)
    const res = await axios.get(API_CITAS)
    const citasHoy = res.data
      .filter(c => c.fecha_hora?.slice(0, 10) === hoyStr && c.paciente_id)
      .sort((a, b) => new Date(a.fecha_hora.replace(' ', 'T')) - new Date(b.fecha_hora.replace(' ', 'T')))
    setCitas(citasHoy)
    setCargando(false)
  }

  useEffect(() => {
    cargar()
    const intervalo = setInterval(cargar, 5 * 60 * 1000)
    return () => clearInterval(intervalo)
  }, [])

  const citasJ = citas.filter(c => String(c.profesional_id) === '1')
  const citasV = citas.filter(c => String(c.profesional_id) === '2')

  if (cargando) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-12 h-12 border-4 border-green-200 border-t-green-700 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-white">

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl mb-8 p-6" style={{ background: 'linear-gradient(135deg, #052e16 0%, #166534 60%, #15803d 100%)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #86efac, transparent)', transform: 'translate(30%, -30%)' }} />
        <div className="relative z-10">
          <p className="text-green-300 text-xs font-semibold uppercase tracking-widest mb-1">Recepción</p>
          <h2 className="text-3xl font-black text-white">Agenda del día</h2>
          <p className="text-green-200 text-sm mt-1 capitalize">{hoyFormateado}</p>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total citas', value: citas.length, icon: '📅', gradient: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '#16a34a', text: '#166534' },
          { label: 'Matrona J', value: citasJ.length, icon: '🩺', gradient: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '#3b82f6', text: '#1d4ed8' },
          { label: 'Matrona V', value: citasV.length, icon: '🩺', gradient: 'linear-gradient(135deg, #fff7ed, #ffedd5)', border: '#f97316', text: '#c2410c' },
        ].map((card, i) => (
          <div key={i} className="rounded-2xl p-5" style={{ background: card.gradient, border: `1px solid ${card.border}22` }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl">{card.icon}</span>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: card.text }}>{card.label}</span>
            </div>
            <p className="text-4xl font-black" style={{ color: card.text }}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Lista de citas */}
      {citas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <p className="text-5xl mb-3">📭</p>
          <p className="text-gray-400 font-medium">No hay citas agendadas para hoy</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {citas.map(c => (
            <div key={c.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                {/* Hora */}
                <div className="text-center shrink-0 w-14">
                  <p className="text-xl font-black text-green-800">{formatHora(c.fecha_hora)}</p>
                </div>
                <div className="w-px h-10 bg-gray-200 shrink-0" />
                {/* Paciente */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-base">
                    {c.paciente_nombre ? `${c.paciente_nombre} ${c.paciente_apellido}` : '—'}
                  </p>
                  <p className="text-sm text-gray-400">
                    👩‍⚕️ {c.profesional_nombre} {c.profesional_apellido}
                  </p>
                  {c.observaciones && (
                    <p className="text-xs text-gray-400 mt-0.5">💬 {c.observaciones}</p>
                  )}
                </div>
                {/* Estado */}
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${estadoBadge[c.estado]}`}>
                  {c.estado}
                </span>
              </div>
            </div>
          ))}
          <p className="text-xs text-gray-400 text-center mt-2">Se actualiza automáticamente cada 5 minutos</p>
        </div>
      )}
    </div>
  )
}