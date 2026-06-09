import { useEffect, useState } from 'react'
import { registrarModalSalir, resolverModal } from '../hooks/useGuardarAviso'

export default function ModalSalirSinGuardar() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    registrarModalSalir(setVisible)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[200] px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-6 text-center">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-4xl">⚠️</span>
          </div>
          <h3 className="text-xl font-bold text-white">¿Salir sin guardar?</h3>
          <p className="text-orange-100 text-sm mt-1">Tienes cambios sin guardar</p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 text-center">
          <p className="text-gray-600 text-sm leading-relaxed">
            Si sales ahora perderás todos los cambios que has realizado. ¿Estás segura de que quieres continuar?
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex flex-col gap-3">
          <button
            onClick={() => resolverModal(false)}
            className="w-full bg-green-700 text-white py-3 rounded-2xl font-semibold hover:bg-green-800 transition-colors"
          >
            ✏️ Seguir editando
          </button>
          <button
            onClick={() => resolverModal(true)}
            className="w-full bg-gray-100 text-gray-600 py-3 rounded-2xl font-medium hover:bg-gray-200 transition-colors"
          >
            🚪 Salir sin guardar
          </button>
        </div>
      </div>
    </div>
  )
}