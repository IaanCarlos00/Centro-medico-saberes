import { useEffect, useState } from 'react'
import axios from 'axios'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const API = 'https://centro-medico-saberes-production.up.railway.app/reportes'
const API_PAGOS = 'https://centro-medico-saberes-production.up.railway.app/pagos'
const API_CITAS = 'https://centro-medico-saberes-production.up.railway.app/citas'
const API_PAC = 'https://centro-medico-saberes-production.up.railway.app/pacientes'

const COLORES = ['#16a34a', '#0891b2', '#7c3aed', '#ea580c', '#db2777', '#ca8a04']

const metodoIcono = {
  fonasa: '🏥', efectivo: '💵', transferencia: '🏦', debito: '💳', credito: '💳'
}

function formatCLP(n) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n || 0)
}

function Variacion({ actual, anterior }) {
  if (!anterior || anterior === 0) return null
  const pct = ((actual - anterior) / anterior * 100).toFixed(1)
  const subio = actual >= anterior
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ml-2 ${subio ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
      {subio ? '▲' : '▼'} {Math.abs(pct)}% vs mes ant.
    </span>
  )
}

export default function Reportes() {
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [mes, setMes] = useState(new Date().toISOString().slice(0, 7))
  const [pagosRaw, setPagosRaw] = useState([])
  const [citasRaw, setCitasRaw] = useState([])
  const [pacientesRaw, setPacientesRaw] = useState([])

  const cargar = async (m) => {
    setCargando(true)
    try {
      const [rep, pagos, citas, pacientes] = await Promise.all([
        axios.get(`${API}?mes=${m}`),
        axios.get(API_PAGOS),
        axios.get(API_CITAS),
        axios.get(API_PAC),
      ])
      setDatos(rep.data)
      setPagosRaw(pagos.data)
      setCitasRaw(citas.data)
      setPacientesRaw(pacientes.data)
    } catch (e) {
      console.error(e)
    }
    setCargando(false)
  }

  useEffect(() => { cargar(mes) }, [mes])

  const exportarPagos = () => {
    const filtrados = pagosRaw.filter(p => p.fecha?.slice(0, 7) === mes)
    const datos = filtrados.map(p => ({
      'Paciente': `${p.paciente_nombre} ${p.paciente_apellido}`,
      'RUT': p.paciente_rut || '',
      'Fecha': new Date(String(p.fecha).slice(0,10) + 'T12:00:00').toLocaleDateString('es-CL'),
      'Monto': p.monto,
      'Método': p.metodo,
      'Estado': p.estado,
      'Notas': p.notas || '',
      'N° Bono': p.numero_bono || '',
    }))
    const ws = XLSX.utils.json_to_sheet(datos)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Pagos')
    saveAs(new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })]), `Pagos_${mes}.xlsx`)
  }

  const exportarCitas = () => {
    const filtradas = citasRaw.filter(c => c.fecha_hora?.slice(0, 7) === mes)
    const datos = filtradas.map(c => ({
      'Paciente': `${c.paciente_nombre} ${c.paciente_apellido}`,
      'Profesional': `${c.profesional_nombre} ${c.profesional_apellido}`,
      'Fecha y Hora': c.fecha_hora?.slice(0, 16).replace('T', ' '),
      'Procedimiento': c.procedimiento_nombre || '',
      'Estado': c.estado,
      'Observaciones': c.observaciones || '',
    }))
    const ws = XLSX.utils.json_to_sheet(datos)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Citas')
    saveAs(new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })]), `Citas_${mes}.xlsx`)
  }

  const exportarPacientes = () => {
    const datos = pacientesRaw.map(p => ({
      'Nombre': p.nombre,
      'Apellido': p.apellido,
      'RUT': p.rut || '',
      'Fecha Nacimiento': p.fecha_nacimiento?.slice(0, 10) || '',
      'Teléfono': p.telefono || '',
      'Email': p.email || '',
    }))
    const ws = XLSX.utils.json_to_sheet(datos)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Pacientes')
    saveAs(new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })]), `Pacientes_${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  const exportarCompleto = () => {
    const pagosFiltrados = pagosRaw.filter(p => p.fecha?.slice(0, 7) === mes)
    const citasFiltradas = citasRaw.filter(c => c.fecha_hora?.slice(0, 7) === mes)
    const wb = XLSX.utils.book_new()

    const wsPagos = XLSX.utils.json_to_sheet(pagosFiltrados.map(p => ({
      'Paciente': `${p.paciente_nombre} ${p.paciente_apellido}`,
      'RUT': p.paciente_rut || '',
      'Fecha': new Date(String(p.fecha).slice(0,10) + 'T12:00:00').toLocaleDateString('es-CL'),
      'Monto': p.monto, 'Método': p.metodo, 'Estado': p.estado, 'Notas': p.notas || '',
    })))
    XLSX.utils.book_append_sheet(wb, wsPagos, 'Pagos')

    const wsCitas = XLSX.utils.json_to_sheet(citasFiltradas.map(c => ({
      'Paciente': `${c.paciente_nombre} ${c.paciente_apellido}`,
      'Profesional': `${c.profesional_nombre} ${c.profesional_apellido}`,
      'Fecha y Hora': c.fecha_hora?.slice(0, 16).replace('T', ' '),
      'Procedimiento': c.procedimiento_nombre || '',
      'Estado': c.estado,
    })))
    XLSX.utils.book_append_sheet(wb, wsCitas, 'Citas')

    const wsPac = XLSX.utils.json_to_sheet(pacientesRaw.map(p => ({
      'Nombre': p.nombre, 'Apellido': p.apellido, 'RUT': p.rut || '',
      'Teléfono': p.telefono || '', 'Email': p.email || '',
    })))
    XLSX.utils.book_append_sheet(wb, wsPac, 'Pacientes')

    saveAs(new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })]), `Reporte_completo_${mes}.xlsx`)
  }

  if (cargando) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="text-4xl mb-3">📊</div>
        <p className="text-gray-400">Generando reporte...</p>
      </div>
    </div>
  )

  const tasaAsistencia = datos.citasMes > 0
    ? Math.round((datos.citasPorEstado.find(e => e.estado === 'realizada')?.total || 0) / datos.citasMes * 100)
    : 0

  const pieData = datos.ingresosPorMetodo.map(m => ({
    name: m.metodo, value: parseFloat(m.total)
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-green-800">Reportes</h2>
        <div className="flex items-center gap-3">
          <input
            type="month"
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
            value={mes}
            onChange={e => setMes(e.target.value)}
          />
          <button onClick={exportarCompleto} className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 font-medium text-sm whitespace-nowrap">
            📥 Exportar todo
          </button>
        </div>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-green-600">
          <p className="text-xs text-gray-500 mb-1">Recaudado</p>
          <p className="text-xl font-bold text-gray-800">{formatCLP(datos.ingresosMes)}</p>
          <Variacion actual={datos.ingresosMes} anterior={datos.ingresosAnterior} />
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-yellow-500">
          <p className="text-xs text-gray-500 mb-1">Por cobrar</p>
          <p className="text-xl font-bold text-gray-800">{formatCLP(datos.pendientesMes.total)}</p>
          <p className="text-xs text-yellow-600 mt-1">{datos.pendientesMes.cantidad} pago{datos.pendientesMes.cantidad !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-blue-500">
          <p className="text-xs text-gray-500 mb-1">Citas</p>
          <p className="text-xl font-bold text-gray-800">{datos.citasMes}</p>
          <Variacion actual={datos.citasMes} anterior={datos.citasAnterior} />
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-teal-500">
          <p className="text-xs text-gray-500 mb-1">Tasa asistencia</p>
          <p className="text-xl font-bold text-gray-800">{tasaAsistencia}%</p>
          <p className="text-xs text-gray-400 mt-1">{datos.citasPorEstado.find(e => e.estado === 'realizada')?.total || 0} realizadas</p>
        </div>
      </div>

      {/* Gráfico ingresos últimos 6 meses */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h3 className="text-lg font-bold text-gray-800 mb-4">📈 Ingresos últimos 6 meses</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={datos.ultimos6meses}>
            <XAxis dataKey="mes_nombre" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={v => formatCLP(v)} />
            <Bar dataKey="total" fill="#16a34a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ingresos por método */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="text-lg font-bold text-gray-800 mb-4">💳 Ingresos por método</h3>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORES[i % COLORES.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => formatCLP(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 mt-3">
                {datos.ingresosPorMetodo.map((m, i) => (
                  <div key={m.metodo} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: COLORES[i % COLORES.length] }} />
                      <span className="capitalize text-gray-600">{metodoIcono[m.metodo]} {m.metodo}</span>
                      <span className="text-xs text-gray-400">({m.cantidad} pagos)</span>
                    </div>
                    <span className="font-semibold text-gray-800">{formatCLP(m.total)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <p className="text-gray-400 text-sm text-center py-8">Sin pagos este mes</p>}
        </div>

        {/* Citas por estado */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="text-lg font-bold text-gray-800 mb-4">📅 Citas por estado</h3>
          <div className="flex flex-col gap-3">
            {['realizada', 'confirmada', 'pendiente', 'cancelada'].map(estado => {
              const item = datos.citasPorEstado.find(e => e.estado === estado)
              const total = parseInt(item?.total || 0)
              const max = Math.max(...datos.citasPorEstado.map(e => parseInt(e.total)))
              const colores = { realizada: 'bg-green-500', confirmada: 'bg-blue-500', pendiente: 'bg-yellow-400', cancelada: 'bg-red-400' }
              const iconos = { realizada: '✅', confirmada: '📋', pendiente: '🕐', cancelada: '❌' }
              return (
                <div key={estado} className="flex items-center gap-3">
                  <span className="text-sm w-24 capitalize text-gray-600">{iconos[estado]} {estado}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-3">
                    <div className={`h-3 rounded-full ${colores[estado]}`} style={{ width: max > 0 ? `${(total/max)*100}%` : '0%' }} />
                  </div>
                  <span className="font-bold text-gray-800 w-8 text-right">{total}</span>
                </div>
              )
            })}
          </div>

          <h3 className="text-lg font-bold text-gray-800 mt-6 mb-4">👩‍⚕️ Citas por profesional</h3>
          <div className="flex flex-col gap-2">
            {datos.citasPorProfesional.map((p, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl text-sm">
                <span className="font-medium text-gray-800">{p.nombre} {p.apellido}</span>
                <div className="flex gap-4 text-xs">
                  <div className="text-center">
                    <p className="font-bold text-gray-800">{p.total}</p>
                    <p className="text-gray-400">total</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-green-700">{p.realizadas}</p>
                    <p className="text-gray-400">realiz.</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ingresos por profesional */}
      {datos.ingresosPorProfesional.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="text-lg font-bold text-gray-800 mb-4">💰 Ingresos por profesional</h3>
          <div className="flex flex-col gap-3">
            {datos.ingresosPorProfesional.map((p, i) => {
              const total = datos.ingresosPorProfesional.reduce((s, x) => s + parseFloat(x.total), 0)
              const pct = total > 0 ? (parseFloat(p.total) / total * 100).toFixed(0) : 0
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm w-40 font-medium text-gray-700 truncate">{p.nombre} {p.apellido}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-3">
                    <div className="h-3 rounded-full bg-green-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm font-bold text-gray-800 text-right">{formatCLP(p.total)}</span>
                  <span className="text-xs text-gray-400 w-8">{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pacientes frecuentes */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="text-lg font-bold text-gray-800 mb-4">⭐ Pacientes más frecuentes</h3>
          {datos.pacientesFrecuentes.length > 0 ? (
            <div className="flex flex-col gap-2">
              {datos.pacientesFrecuentes.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-300">#{i+1}</span>
                    <span className="text-sm font-medium text-gray-800">{p.nombre} {p.apellido}</span>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">{p.visitas} visita{p.visitas > 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400 text-sm text-center py-4">Sin atenciones este mes</p>}
        </div>

        {/* Pacientes con deuda */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="text-lg font-bold text-gray-800 mb-4">⚠️ Pacientes con deuda</h3>
          {datos.pacientesDeuda.length > 0 ? (
            <div className="flex flex-col gap-2">
              {datos.pacientesDeuda.slice(0, 5).map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{p.nombre} {p.apellido}</p>
                    {p.telefono && <p className="text-xs text-gray-400">{p.telefono}</p>}
                  </div>
                  <span className="text-sm font-bold text-red-600">{formatCLP(p.deuda)}</span>
                </div>
              ))}
              {datos.pacientesDeuda.length > 5 && (
                <p className="text-xs text-gray-400 text-center">+{datos.pacientesDeuda.length - 5} más</p>
              )}
            </div>
          ) : <p className="text-gray-400 text-sm text-center py-4">Sin deudas pendientes 🎉</p>}
        </div>
      </div>

      {/* Exportar individual */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h3 className="text-lg font-bold text-gray-800 mb-4">📥 Exportar datos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button onClick={exportarPagos} className="flex items-center gap-3 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
            <span className="text-2xl">💰</span>
            <div className="text-left">
              <p className="font-semibold text-green-800 text-sm">Pagos del mes</p>
              <p className="text-xs text-gray-500">{pagosRaw.filter(p => p.fecha?.slice(0,7) === mes).length} registros</p>
            </div>
          </button>
          <button onClick={exportarCitas} className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
            <span className="text-2xl">📅</span>
            <div className="text-left">
              <p className="font-semibold text-blue-800 text-sm">Citas del mes</p>
              <p className="text-xs text-gray-500">{citasRaw.filter(c => c.fecha_hora?.slice(0,7) === mes).length} registros</p>
            </div>
          </button>
          <button onClick={exportarPacientes} className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors">
            <span className="text-2xl">👤</span>
            <div className="text-left">
              <p className="font-semibold text-purple-800 text-sm">Todos los pacientes</p>
              <p className="text-xs text-gray-500">{pacientesRaw.length} pacientes</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}