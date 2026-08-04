export default function ModalConfirmar({ titulo, mensaje, detalle, onConfirmar, onCancelar, textoConfirmar = 'Confirmar', textoCancelar = 'Cancelar', textoColor = 'bg-red-500 hover:bg-red-600' }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] px-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm text-center">
        <h3 className="text-lg font-bold text-gray-800 mb-2">{titulo}</h3>
        {mensaje && <p className="text-sm text-gray-500 mb-3">{mensaje}</p>}
        {detalle && detalle.length > 0 && (
          <div className="bg-red-50 rounded-xl p-3 mb-4 text-left">
            <p className="text-xs font-semibold text-red-700 mb-2">Se eliminarán todos sus registros:</p>
            <ul className="flex flex-col gap-1">
              {detalle.map((d, i) => (
                <li key={i} className="text-xs text-red-600">• {d}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={onConfirmar} className={`flex-1 text-white py-2 rounded-lg font-medium ${textoColor}`}>{textoConfirmar}</button>
          <button onClick={onCancelar} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 font-medium">{textoCancelar}</button>
        </div>
      </div>
    </div>
  )
}