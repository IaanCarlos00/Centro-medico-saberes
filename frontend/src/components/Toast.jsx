import { useEffect } from 'react'

export default function Toast({ mensaje, tipo = 'exito', onCerrar }) {
  useEffect(() => {
    const timer = setTimeout(onCerrar, 3000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-medium text-sm flex items-center gap-2 ${tipo === 'exito' ? 'bg-green-700' : 'bg-red-500'}`}>
      <span>{tipo === 'exito' ? '✅' : '❌'}</span>
      {mensaje}
    </div>
  )
}