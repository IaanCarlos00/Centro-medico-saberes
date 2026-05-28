export default function ModalConfirmar({ titulo, mensaje, onConfirmar, onCancelar, textoConfirmar = 'Confirmar', textoColor = 'bg-red-500 hover:bg-red-600' }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] px-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm text-center">
        <h3 className="text-lg font-bold text-gray-800 mb-2">{titulo}</h3>
        {mensaje && <p className="text-sm text-gray-500 mb-6">{mensaje}</p>}
        <div className="flex gap-3">
          <button onClick={onConfirmar} className={`flex-1 text-white py-2 rounded-lg font-medium ${textoColor}`}>{textoConfirmar}</button>
          <button onClick={onCancelar} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 font-medium">Cancelar</button>
        </div>
      </div>
    </div>
  )
}