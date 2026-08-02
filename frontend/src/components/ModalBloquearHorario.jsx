import axios from 'axios'

const API_BLOQUEOS = 'https://centro-medico-saberes-production.up.railway.app/bloqueos'

export default function ModalBloquearHorario({
  modalBloquear,
  setModalBloquear,
  usuarioRol,
  profesionales,
  profesionalBloqueo,
  setProfesionalBloqueo,
  usuarioProfesionalId,
  motivoBloqueo,
  setMotivoBloqueo,
  usuarioId,
  cargar,
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4" onClick={() => setModalBloquear(null)}>
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🚫</span>
          <div>
            <h3 className="text-lg font-bold text-green-800">Bloquear horario</h3>
            <p className="text-sm text-gray-500">{modalBloquear.fechaHora?.replace('T', ' ')}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {usuarioRol !== 'matrona' && (
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Profesional *</label>
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                value={profesionalBloqueo}
                onChange={e => setProfesionalBloqueo(e.target.value)}
              >
                <option value="">Seleccionar profesional</option>
                {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
              </select>
            </div>
          )}
          {usuarioRol === 'matrona' && (
            <p className="text-sm text-gray-600">Profesional: <span className="font-medium">
              {profesionales.find(p => String(p.id) === String(usuarioProfesionalId))?.nombre}{' '}
              {profesionales.find(p => String(p.id) === String(usuarioProfesionalId))?.apellido}
            </span></p>
          )}
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Motivo (opcional)</label>
            <input
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="Ej: Capacitación, día libre, reunión..."
              value={motivoBloqueo}
              onChange={e => setMotivoBloqueo(e.target.value)}
              autoFocus
            />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={async () => {
            const profId = usuarioRol === 'matrona' ? usuarioProfesionalId : profesionalBloqueo
            if (!profId) return alert('Selecciona un profesional')
            await axios.post(API_BLOQUEOS, {
              fecha_inicio: modalBloquear.fechaHora,
              fecha_fin: modalBloquear.fechaHoraFin || modalBloquear.fechaHora.slice(0, 14) + '30',
              motivo: motivoBloqueo || null,
              creado_por: usuarioId || null,
              profesional_id: profId
            })
            setModalBloquear(null)
            setMotivoBloqueo('')
            cargar()
          }} className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 font-medium">🚫 Bloquear</button>
          <button onClick={() => setModalBloquear(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 font-medium">Cancelar</button>
        </div>
      </div>
    </div>
  )
}
