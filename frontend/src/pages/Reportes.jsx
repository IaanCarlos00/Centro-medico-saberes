import { useEffect, useState } from 'react'
import axios from 'axios'
import * as XLSX from 'xlsx'

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

function descargarExcel(wb, nombre) {
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([buf], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  a.click()
  URL.revokeObjectURL(url)
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

function BarraHorizontal({ label, valor, max, color = 'bg-green-500', suffix = '' }) {
  const pct = max > 0 ? Math.round((valor / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-32 truncate">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-3">
        <div className={`h-3 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-bold text-gray-800 text-right min-w-[60px]">{suffix}{valor}</span>
    </div>
  )
}

function GraficoBarras({ data }) {
  const max = Math.max(...data.map(d => parseFloat(d.total)), 1)
  return (
    <div className="flex items-end gap-2 h-48 px-2">
      {data.map((d, i) => {
        const pct = Math.round((parseFloat(d.total) / max) * 100)
        return (
          <div key={i} className="flex flex-col items-center flex-1 gap-1">
            <span className="text-xs font-bold text-green-800 whitespace-nowrap">
              {parseFloat(d.total) > 0 ? `$${(parseFloat(d.total)/1000).toFixed(0)}k` : ''}
            </span>
            <div className="w-full bg-green-600 rounded-t-lg transition-all" style={{ height: `${Math.max(pct, parseFloat(d.total) > 0 ? 4 : 0)}%` }} />
            <span className="text-xs text-gray-500">{d.mes_nombre}</span>
          </div>
        )
      })}
    </div>
  )
}

function GraficoPie({ data }) {
  const total = data.reduce((s, d) => s + parseFloat(d.value), 0)
  if (total === 0) return <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>

  let acumulado = 0
  const segmentos = data.map((d, i) => {
    const pct = parseFloat(d.value) / total
    const inicio = acumulado
    acumulado += pct * 360
    return { ...d, inicio, fin: acumulado, color: COLORES[i % COLORES.length], pct }
  })

  const polarToCartesian = (cx, cy, r, angle) => {
    const rad = (angle - 90) * Math.PI / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      <svg viewBox="0 0 200 200" className="w-40 h-40 shrink-0">
        {segmentos.map((s, i) => {
          const start = polarToCartesian(100, 100, 80, s.inicio)
          const end = polarToCartesian(100, 100, 80, s.fin)
          const largeArc = (s.fin - s.inicio) > 180 ? 1 : 0
          return (
            <path key={i}
              d={`M 100 100 L ${start.x} ${start.y} A 80 80 0 ${largeArc} 1 ${end.x} ${end.y} Z`}
              fill={s.color}
            />
          )
        })}
        <circle cx="100" cy="100" r="45" fill="white" />
        <text x="100" y="95" textAnchor="middle" className="text-xs" fontSize="10" fill="#374151">Total</text>
        <text x="100" y="112" textAnchor="middle" fontSize="9" fill="#374151">{formatCLP(total)}</text>
      </svg>
      <div className="flex flex-col gap-2 flex-1 w-full">
        {segmentos.map((s, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: s.color }} />
              <span className="capitalize text-gray-600">{metodoIcono[s.name] || ''} {s.name}</span>
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-xs text-gray-400">{Math.round(s.pct * 100)}%</span>
              <span className="font-semibold text-gray-800">{formatCLP(s.value)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
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
      console.error('Error reportes:', e)
    }
    setCargando(false)
  }

  useEffect(() => { cargar(mes) }, [mes])

  const exportarPagos = () => {
    const filtrados = pagosRaw.filter(p => p.fecha?.slice(0, 7) === mes)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filtrados.map(p => ({
      'Paciente': `${p.paciente_nombre} ${p.paciente_apellido}`,
      'RUT': p.paciente_rut || '',
      'Fecha': new Date(String(p.fecha).slice(0,10) + 'T12:00:00').toLocaleDateString('es-CL'),
      'Monto': p.monto, 'Método': p.metodo, 'Estado': p.estado,
      'Notas': p.notas || '', 'N° Bono': p.numero_bono || '',
    }))), 'Pagos')
    descargarExcel(wb, `Pagos_${mes}.xlsx`)
  }

  const exportarCitas = () => {
    const filtradas = citasRaw.filter(c => c.fecha_hora?.slice(0, 7) === mes)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filtradas.map(c => ({
      'Paciente': `${c.paciente_nombre} ${c.paciente_apellido}`,
      'Profesional': `${c.profesional_nombre} ${c.profesional_apellido}`,
      'Fecha y Hora': c.fecha_hora?.slice(0, 16).replace('T', ' '),
      'Procedimiento': c.procedimiento_nombre || '',
      'Estado': c.estado, 'Observaciones': c.observaciones || '',
    }))), 'Citas')
    descargarExcel(wb, `Citas_${mes}.xlsx`)
  }

  const exportarPacientes = () => {
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(pacientesRaw.map(p => ({
      'Nombre': p.nombre, 'Apellido': p.apellido, 'RUT': p.rut || '',
      'Fecha Nacimiento': p.fecha_nacimiento?.slice(0, 10) || '',
      'Teléfono': p.telefono || '', 'Email': p.email || '',
    }))), 'Pacientes')
    descargarExcel(wb, `Pacientes_${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  const exportarCompleto = () => {
    const wb = XLSX.utils.book_new()
    const pagosFiltrados = pagosRaw.filter(p => p.fecha?.slice(0, 7) === mes)
    const citasFiltradas = citasRaw.filter(c => c.fecha_hora?.slice(0, 7) === mes)
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(pagosFiltrados.map(p => ({
      'Paciente': `${p.paciente_nombre} ${p.paciente_apellido}`,
      'RUT': p.paciente_rut || '',
      'Fecha': new Date(String(p.fecha).slice(0,10) + 'T12:00:00').toLocaleDateString('es-CL'),
      'Monto': p.monto, 'Método': p.metodo, 'Estado': p.estado, 'Notas': p.notas || '',
    }))), 'Pagos')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(citasFiltradas.map(c => ({
      'Paciente': `${c.paciente_nombre} ${c.paciente_apellido}`,
      'Profesional': `${c.profesional_nombre} ${c.profesional_apellido}`,
      'Fecha y Hora': c.fecha_hora?.slice(0, 16).replace('T', ' '),
      'Procedimiento': c.procedimiento_nombre || '', 'Estado': c.estado,
    }))), 'Citas')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(pacientesRaw.map(p => ({
      'Nombre': p.nombre, 'Apellido': p.apellido, 'RUT': p.rut || '',
      'Teléfono': p.telefono || '', 'Email': p.email || '',
    }))), 'Pacientes')
    descargarExcel(wb, `Reporte_completo_${mes}.xlsx`)
  }

  if (cargando) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="text-4xl mb-3">📊</div>
        <p className="text-gray-400">Generando reporte...</p>
      </div>
    </div>
  )

  if (!datos) return (
    <div className="flex items-center justify-center py-20">
      <p className="text-gray-400">Error al cargar reportes</p>
    </div>
  )

  const tasaAsistencia = datos.citasMes > 0
    ? Math.round((datos.citasPorEstado.find(e => e.estado === 'realizada')?.total || 0) / datos.citasMes * 100)
    : 0

  const pieData = datos.ingresosPorMetodo.map(m => ({
    name: m.metodo, value: parseFloat(m.total)
  }))

  const maxCitas = Math.max(...datos.citasPorEstado.map(e => parseInt(e.total)), 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-green-800">Reportes</h2>
        <div className="flex items-center gap-3">
          <input type="month"
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
            value={mes} onChange={e => setMes(e.target.value)}
          />
          <button onClick={exportarCompleto} className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 font-medium text-sm whitespace-nowrap">
            📥 Exportar todo
          </button>
        </div>
      </div>

      {/* KPIs */}
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

      {/* Gráfico barras últimos 6 meses */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h3 className="text-lg font-bold text-gray-800 mb-4">📈 Ingresos últimos 6 meses</h3>
        {datos.ultimos6meses.length > 0
          ? <GraficoBarras data={datos.ultimos6meses} />
          : <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>
        }
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie métodos */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="text-lg font-bold text-gray-800 mb-4">💳 Ingresos por método</h3>
          <GraficoPie data={pieData} />
        </div>

        {/* Citas por estado y profesional */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="text-lg font-bold text-gray-800 mb-4">📅 Citas por estado</h3>
          <div className="flex flex-col gap-3 mb-6">
            {['realizada', 'confirmada', 'pendiente', 'cancelada'].map(estado => {
              const total = parseInt(datos.citasPorEstado.find(e => e.estado === estado)?.total || 0)
              const colores = { realizada: 'bg-green-500', confirmada: 'bg-blue-500', pendiente: 'bg-yellow-400', cancelada: 'bg-red-400' }
              const iconos = { realizada: '✅', confirmada: '📋', pendiente: '🕐', cancelada: '❌' }
              return (
                <BarraHorizontal key={estado}
                  label={`${iconos[estado]} ${estado}`}
                  valor={total}
                  max={maxCitas}
                  color={colores[estado]}
                />
              )
            })}
          </div>

          <h3 className="text-lg font-bold text-gray-800 mb-3">👩‍⚕️ Por profesional</h3>
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
              const totalProf = datos.ingresosPorProfesional.reduce((s, x) => s + parseFloat(x.total), 0)
              const pct = totalProf > 0 ? Math.round(parseFloat(p.total) / totalProf * 100) : 0
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm w-40 font-medium text-gray-700 truncate">{p.nombre} {p.apellido}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-3">
                    <div className="h-3 rounded-full bg-green-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm font-bold text-gray-800">{formatCLP(p.total)}</span>
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
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                    {p.visitas} visita{p.visitas > 1 ? 's' : ''}
                  </span>
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

      {/* Exportar */}
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