import { useEffect } from 'react'

export default function Toast({ mensaje, tipo = 'exito', onCerrar }) {
  useEffect(() => {
    const timer = setTimeout(onCerrar, 4000)
    return () => clearTimeout(timer)
  }, [])

  const estilos = {
    exito: 'bg-green-700',
    error: 'bg-red-500',
    info: 'bg-blue-600',
  }

  const iconos = {
    exito: '✅',
    error: '❌',
    info: 'ℹ️',
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-medium text-sm flex items-center gap-2 ${estilos[tipo] || 'bg-green-700'}`}>
      <span>{iconos[tipo] || '✅'}</span>
      {mensaje}
    </div>
  )
}