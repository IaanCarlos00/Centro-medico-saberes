import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const API = 'https://centro-medico-saberes-production.up.railway.app/dashboard'

const estadoColor = {
  pendiente: 'bg-yellow-100 text-yellow-700',
  confirmada: 'bg-blue-100 text-blue-700',
  realizada: 'bg-green-100 text-green-700',
  cancelada: 'bg-red-100 text-red-700',
}

export default function Inicio() {
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const nombre = localStorage.getItem('nombre')

  const hoy = new Date().toLocaleDateString('es-CL', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  useEffect(() => {
    axios.get(API)
      .then(res => setDatos(res.data))
      .finally(() => setCargando(false))
  }, [])

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-green-800">Bienvenido, {nombre} 👋</h2>
        <p className="text-gray-500 capitalize">{hoy}</p>
      </div>

      {cargando ? (
        <div className="text-center text-gray-400 py-12">Cargando estadísticas...</div>
      ) : (
        <>
          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow p-4 border-t-4 border-green-700">
              <p className="text-3xl font-bold text-green-800">{datos.totalPacientes}</p>
              <p className="text-gray-500 text-sm mt-1">Pacientes registrados</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4 border-t-4 border-orange-500">
              <p className="text-3xl font-bold text-green-800">{datos.totalProfesionales}</p>
              <p className="text-gray-500 text-sm mt-1">Profesionales</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4 border-t-4 border-blue-500">
              <p className="text-3xl font-bold text-green-800">{datos.citasHoy}</p>
              <p className="text-gray-500 text-sm mt-1">Citas hoy</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4 border-t-4 border-yellow-500">
              <p className="text-3xl font-bold text-green-800">{datos.estados.pendiente}</p>
              <p className="text-gray-500 text-sm mt-1">Citas pendientes</p>
            </div>
          </div>

          {/* Estados de citas */}
          <div className="bg-white rounded-xl shadow p-4 md:p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Estado de todas las citas</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(datos.estados).map(([estado, count]) => (
                <div key={estado} className={`rounded-lg px-4 py-3 flex items-center gap-3 ${estadoColor[estado]}`}>
                  <span className="text-2xl font-bold">{count}</span>
                  <span className="text-sm font-medium capitalize">{estado}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Citas de hoy */}
          <div className="bg-white rounded-xl shadow p-4 md:p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Citas de hoy</h3>
            {datos.proximasCitas.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No hay citas programadas para hoy</p>
            ) : (
              <div className="flex flex-col gap-3">
                {datos.proximasCitas.map((c, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-gray-800">{c.paciente_nombre} {c.paciente_apellido}</p>
                      <p className="text-sm text-gray-500">con {c.profesional_nombre} {c.profesional_apellido}</p>
                      {c.observaciones && <p className="text-xs text-gray-400 mt-0.5">{c.observaciones}</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-800">{c.fecha_hora?.slice(11,16)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoColor[c.estado]}`}>{c.estado}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Accesos rápidos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/pacientes" className="bg-white rounded-xl shadow p-5 hover:shadow-md transition-shadow border-t-4 border-green-700">
              <div className="text-3xl mb-2">👤</div>
              <h3 className="font-semibold text-green-800">Pacientes</h3>
              <p className="text-gray-500 text-sm">Registra y gestiona pacientes</p>
            </Link>
            <Link to="/profesionales" className="bg-white rounded-xl shadow p-5 hover:shadow-md transition-shadow border-t-4 border-orange-500">
              <div className="text-3xl mb-2">🩺</div>
              <h3 className="font-semibold text-green-800">Profesionales</h3>
              <p className="text-gray-500 text-sm">Administra el equipo de salud</p>
            </Link>
            <Link to="/citas" className="bg-white rounded-xl shadow p-5 hover:shadow-md transition-shadow border-t-4 border-blue-500">
              <div className="text-3xl mb-2">📅</div>
              <h3 className="font-semibold text-green-800">Citas</h3>
              <p className="text-gray-500 text-sm">Agenda y controla las citas</p>
            </Link>
          </div>
        </>
      )}
    </div>
  )
}