import { Link } from 'react-router-dom'

export default function Inicio() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <img src="/logo.png" alt="Saberes" className="h-32 w-32 rounded-full object-cover shadow-lg mb-6" />
      <h1 className="text-4xl font-bold text-green-800 mb-2">Saberes</h1>
      <p className="text-gray-500 text-lg mb-10">Espacio de Salud Integral — Concepción</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
        <Link to="/pacientes" className="bg-white rounded-xl shadow p-6 hover:shadow-md transition-shadow border-t-4 border-green-700 text-left">
          <div className="text-3xl mb-3">👤</div>
          <h2 className="text-lg font-semibold text-green-800 mb-1">Pacientes</h2>
          <p className="text-gray-500 text-sm">Registra y gestiona los pacientes del centro</p>
        </Link>

        <Link to="/profesionales" className="bg-white rounded-xl shadow p-6 hover:shadow-md transition-shadow border-t-4 border-orange-500 text-left">
          <div className="text-3xl mb-3">🩺</div>
          <h2 className="text-lg font-semibold text-green-800 mb-1">Profesionales</h2>
          <p className="text-gray-500 text-sm">Administra el equipo de salud del centro</p>
        </Link>

        <Link to="/citas" className="bg-white rounded-xl shadow p-6 hover:shadow-md transition-shadow border-t-4 border-green-500 text-left">
          <div className="text-3xl mb-3">📅</div>
          <h2 className="text-lg font-semibold text-green-800 mb-1">Citas</h2>
          <p className="text-gray-500 text-sm">Agenda y controla las citas médicas</p>
        </Link>
      </div>
    </div>
  )
}