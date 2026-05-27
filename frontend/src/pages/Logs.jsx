import { useEffect, useState } from 'react'
import axios from 'axios'

const API = 'https://centro-medico-saberes-production.up.railway.app/logs'

const accionColor = {
  crear: 'bg-green-100 text-green-700',
  editar: 'bg-blue-100 text-blue-700',
  eliminar: 'bg-red-100 text-red-700',
}

export default function Logs() {
  const [logs, setLogs] = useState([])
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    axios.get(API).then(r => setLogs(r.data))
  }, [])

  const filtrados = logs.filter(l => {
    const q = busqueda.toLowerCase()
    return !busqueda ||
      (l.usuario_nombre || '').toLowerCase().includes(q) ||
      (l.accion || '').toLowerCase().includes(q) ||
      (l.entidad || '').toLowerCase().includes(q) ||
      (l.detalle || '').toLowerCase().includes(q)
  })

  return (
    <div>
      <h2 className="text-2xl font-bold text-green-800 mb-6">Registro de actividad</h2>
      <div className="relative mb-4">
        <input
          className="w-full border border-gray-300 rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-green-400"
          placeholder="Buscar por usuario, acción o detalle..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
        <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
      </div>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-green-50 text-green-800 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-left">Usuario</th>
              <th className="px-4 py-3 text-left">Acción</th>
              <th className="px-4 py-3 text-left">Entidad</th>
              <th className="px-4 py-3 text-left">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtrados.map(l => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500 text-xs">{new Date(l.created_at).toLocaleString('es-CL')}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{l.usuario_nombre}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${accionColor[l.accion] || 'bg-gray-100 text-gray-600'}`}>{l.accion}</span></td>
                <td className="px-4 py-3 text-gray-600 capitalize">{l.entidad}</td>
                <td className="px-4 py-3 text-gray-500">{l.detalle}</td>
              </tr>
            ))}
            {filtrados.length === 0 && <tr><td colSpan="5" className="px-4 py-6 text-center text-gray-400">No hay registros</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}