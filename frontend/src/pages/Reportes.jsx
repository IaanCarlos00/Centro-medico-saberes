import { useEffect, useState } from 'react'
import axios from 'axios'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

const API_PAGOS = 'https://centro-medico-saberes-production.up.railway.app/pagos'
const API_CITAS = 'https://centro-medico-saberes-production.up.railway.app/citas'
const API_PAC = 'https://centro-medico-saberes-production.up.railway.app/pacientes'

function formatCLP(n) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n)
}

export default function Reportes() {
  const [pagos, setPagos] = useState([])
  const [citas, setCitas] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mes, setMes] = useState(new Date().toISOString().slice(0, 7))

  const cargar = async () => {
    setCargando(true)
    const [p, c, pa] = await Promise.all([axios.get(API_PAGOS), axios.get(API_CITAS), axios.get(API_PAC)])
    setPagos(p.data)
    setCitas(c.data)
    setPacientes(pa.data)
    setCargando(false)
  }

  useEffect(() => { cargar() }, [])

  const pagosFiltrados = pagos.filter(p => p.fecha?.slice(0, 7) === mes)
  const citasFiltradas = citas.filter(c => c.fecha_hora?.slice(0, 7) === mes)

  const totalMes = pagosFiltrados.filter(p => p.estado === 'pagado').reduce((sum, p) => sum + parseFloat(p.monto), 0)
  const pendientesMes = pagosFiltrados.filter(p => p.estado === 'pendiente').reduce((sum, p) => sum + parseFloat(p.monto), 0)

  const exportarPagos = () => {
    const datos = pagosFiltrados.map(p => ({
      'Paciente': `${p.paciente_nombre} ${p.paciente_apellido}`,
      'RUT': p.paciente_rut || '',
      'Fecha': new Date(p.fecha).toLocaleDateString('es-CL'),
      'Monto': p.monto,
      'Método': p.metodo,
      'Estado': p.estado,
      'Notas': p.notas || ''
    }))
    const ws = XLSX.utils.json_to_sheet(datos)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Pagos')
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    saveAs(new Blob([buf]), `Pagos_${mes}.xlsx`)
  }

  const exportarCitas = () => {
    const datos = citasFiltradas.map(c => ({
      'Paciente': `${c.paciente_nombre} ${c.paciente_apellido}`,
      'Profesional': `${c.profesional_nombre} ${c.profesional_apellido}`,
      'Fecha y Hora': c.fecha_hora?.slice(0, 16).replace('T', ' '),
      'Estado': c.estado,
      'Observaciones': c.observaciones || ''
    }))
    const ws = XLSX.utils.json_to_sheet(datos)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Citas')
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    saveAs(new Blob([buf]), `Citas_${mes}.xlsx`)
  }

  const exportarPacientes = () => {
    const datos = pacientes.map(p => ({
      'Nombre': p.nombre,
      'Apellido': p.apellido,
      'RUT': p.rut || '',
      'Fecha Nacimiento': p.fecha_nacimiento?.slice(0, 10) || '',
      'Teléfono': p.telefono || '',
      'Email': p.email || ''
    }))
    const ws = XLSX.utils.json_to_sheet(datos)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Pacientes')
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    saveAs(new Blob([buf]), `Pacientes_${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-green-800 mb-6">Reportes</h2>

      {/* Selector de mes */}
      <div className="bg-white rounded-xl shadow p-4 mb-6 flex items-center gap-4">
        <label className="text-sm font-medium text-gray-600">Mes:</label>
        <input
          type="month"
          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
          value={mes}
          onChange={e => setMes(e.target.value)}
        />
      </div>

      {/* Resumen del mes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-green-600">
          <p className="text-xs text-gray-500 mb-1">Citas del mes</p>
          <p className="text-3xl font-bold text-gray-800">{citasFiltradas.length}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-blue-500">
          <p className="text-xs text-gray-500 mb-1">Citas realizadas</p>
          <p className="text-3xl font-bold text-gray-800">{citasFiltradas.filter(c => c.estado === 'realizada').length}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-green-500">
          <p className="text-xs text-gray-500 mb-1">Recaudado</p>
          <p className="text-2xl font-bold text-gray-800">{formatCLP(totalMes)}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-yellow-500">
          <p className="text-xs text-gray-500 mb-1">Por cobrar</p>
          <p className="text-2xl font-bold text-gray-800">{formatCLP(pendientesMes)}</p>
        </div>
      </div>

      {/* Exportar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">💰</span>
            <div>
              <h3 className="font-bold text-green-800">Pagos</h3>
              <p className="text-xs text-gray-500">{pagosFiltrados.length} registros en {mes}</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-4">Exporta todos los pagos del mes seleccionado con monto, método y estado.</p>
          <button onClick={exportarPagos} className="w-full bg-green-700 text-white py-2 rounded-lg hover:bg-green-800 font-medium text-sm">
            📥 Exportar Excel
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">📅</span>
            <div>
              <h3 className="font-bold text-green-800">Citas</h3>
              <p className="text-xs text-gray-500">{citasFiltradas.length} registros en {mes}</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-4">Exporta todas las citas del mes con paciente, profesional y estado.</p>
          <button onClick={exportarCitas} className="w-full bg-green-700 text-white py-2 rounded-lg hover:bg-green-800 font-medium text-sm">
            📥 Exportar Excel
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">👤</span>
            <div>
              <h3 className="font-bold text-green-800">Pacientes</h3>
              <p className="text-xs text-gray-500">{pacientes.length} pacientes total</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-4">Exporta el listado completo de pacientes con sus datos de contacto.</p>
          <button onClick={exportarPacientes} className="w-full bg-green-700 text-white py-2 rounded-lg hover:bg-green-800 font-medium text-sm">
            📥 Exportar Excel
          </button>
        </div>
      </div>
    </div>
  )
}