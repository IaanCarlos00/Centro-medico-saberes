import { useEffect, useState } from 'react'
import axios from 'axios'
import ExcelJS from 'exceljs'

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

function BarraHorizontal({ label, valor, max, color = 'bg-green-500' }) {
  const pct = max > 0 ? Math.round((valor / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-32 truncate">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-3">
        <div className={`h-3 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-bold text-gray-800 text-right min-w-[40px]">{valor}</span>
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
          return <path key={i} d={`M 100 100 L ${start.x} ${start.y} A 80 80 0 ${largeArc} 1 ${end.x} ${end.y} Z`} fill={s.color} />
        })}
        <circle cx="100" cy="100" r="45" fill="white" />
        <text x="100" y="95" textAnchor="middle" fontSize="10" fill="#374151">Total</text>
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

// ═══════════════════════════════════════
// EXPORTAR EXCEL CON EXCELJS
// ═══════════════════════════════════════
async function exportarExcel({ pagosRaw, citasRaw, pacientesRaw, datos, mes }) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Saberes'
  wb.created = new Date()

  const VERDE_OSC = 'FF1B5E20'
  const VERDE_MED = 'FF2E7D32'
  const VERDE_CLAR = 'FFC8E6C9'
  const GRIS = 'FFF5F5F5'
  const AMARILLO = 'FFFFF9C4'
  const BLANCO = 'FFFFFFFF'
  const ROJO_CLAR = 'FFFFCDD2'

  const fmtCLP = '#,##0" CLP"'

  const encStyle = (cell, fondo = VERDE_OSC) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Arial', size: 11 }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fondo } }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFFFFFFF' } },
      bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
      left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
      right: { style: 'thin', color: { argb: 'FFFFFFFF' } },
    }
  }

  const filaStyle = (row, fondo = BLANCO) => {
    row.eachCell(cell => {
      cell.font = { name: 'Arial', size: 10 }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fondo } }
      cell.alignment = { vertical: 'middle' }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        right: { style: 'thin', color: { argb: 'FFDDDDDD' } },
      }
    })
  }

  // ── HOJA RESUMEN ──
  const ws1 = wb.addWorksheet('Resumen')
  ws1.views = [{ showGridLines: false }]
  ws1.columns = [{ width: 36 }, { width: 26 }]

  ws1.mergeCells('A1:B1')
  const t1 = ws1.getCell('A1')
  t1.value = `REPORTE MENSUAL — ${mes}`
  t1.font = { bold: true, size: 16, color: { argb: VERDE_OSC }, name: 'Arial' }
  t1.alignment = { horizontal: 'center', vertical: 'middle' }
  t1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: VERDE_CLAR } }
  ws1.getRow(1).height = 42

  const addSeccion = (ws, fila, titulo) => {
    ws.mergeCells(`A${fila}:B${fila}`)
    const c = ws.getCell(`A${fila}`)
    c.value = titulo
    c.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' }, name: 'Arial' }
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: VERDE_MED } }
    c.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
    ws.getRow(fila).height = 30
  }

  const addKpi = (ws, fila, label, valor, esMoneda = false) => {
    ws.getRow(fila).height = 24
    const fondo = fila % 2 === 0 ? GRIS : BLANCO
    const row = ws.getRow(fila)
    row.getCell(1).value = label
    row.getCell(1).font = { name: 'Arial', size: 10 }
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fondo } }
    row.getCell(1).border = { top: { style: 'thin', color: { argb: 'FFDDDDDD' } }, bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } }, left: { style: 'thin', color: { argb: 'FFDDDDDD' } }, right: { style: 'thin', color: { argb: 'FFDDDDDD' } } }
    const c2 = row.getCell(2)
    c2.value = esMoneda ? parseFloat(valor) || 0 : valor
    if (esMoneda) c2.numFmt = fmtCLP
    c2.font = { bold: true, name: 'Arial', size: 10, color: { argb: VERDE_OSC } }
    c2.alignment = { horizontal: 'right' }
    c2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fondo } }
    c2.border = { top: { style: 'thin', color: { argb: 'FFDDDDDD' } }, bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } }, left: { style: 'thin', color: { argb: 'FFDDDDDD' } }, right: { style: 'thin', color: { argb: 'FFDDDDDD' } } }
  }

  addSeccion(ws1, 3, '💰 FINANCIERO')
  addKpi(ws1, 4, 'Total recaudado', datos.ingresosMes, true)
  addKpi(ws1, 5, 'Mes anterior', datos.ingresosAnterior, true)
  addKpi(ws1, 6, 'Por cobrar', datos.pendientesMes?.total || 0, true)
  addKpi(ws1, 7, 'Pagos pendientes (cantidad)', datos.pendientesMes?.cantidad || 0)

  addSeccion(ws1, 9, '📅 CITAS')
  const estados = {}
  datos.citasPorEstado?.forEach(e => { estados[e.estado] = parseInt(e.total) })
  const realizadas = estados['realizada'] || 0
  const tasa = datos.citasMes > 0 ? Math.round(realizadas / datos.citasMes * 100) : 0
  addKpi(ws1, 10, 'Total agendadas', datos.citasMes)
  addKpi(ws1, 11, 'Realizadas', realizadas)
  addKpi(ws1, 12, 'Canceladas', estados['cancelada'] || 0)
  addKpi(ws1, 13, 'Pendientes', estados['pendiente'] || 0)
  addKpi(ws1, 14, 'Tasa de asistencia', `${tasa}%`)

  addSeccion(ws1, 16, '💳 POR MÉTODO DE PAGO')
  datos.ingresosPorMetodo?.forEach((m, i) => addKpi(ws1, 17 + i, m.metodo.toUpperCase(), m.total, true))

  const base = 17 + (datos.ingresosPorMetodo?.length || 0) + 2
  addSeccion(ws1, base - 1, '👩‍⚕️ POR PROFESIONAL')
  datos.citasPorProfesional?.forEach((p, i) => {
    addKpi(ws1, base + i, `${p.nombre} ${p.apellido}`, `${p.total} citas (${p.realizadas} realizadas)`)
  })

  // ── HOJA PAGOS ──
  const pagosFiltrados = pagosRaw.filter(p => p.fecha?.slice(0, 7) === mes)
  const ws2 = wb.addWorksheet('Pagos')
  ws2.views = [{ showGridLines: false }]

  ws2.mergeCells('A1:H1')
  const t2 = ws2.getCell('A1')
  t2.value = `DETALLE DE PAGOS — ${mes}`
  t2.font = { bold: true, size: 14, color: { argb: VERDE_OSC }, name: 'Arial' }
  t2.alignment = { horizontal: 'center', vertical: 'middle' }
  t2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: VERDE_CLAR } }
  ws2.getRow(1).height = 38

  ws2.columns = [
    { key: 'paciente', width: 30 },
    { key: 'rut', width: 16 },
    { key: 'fecha', width: 14 },
    { key: 'procedimiento', width: 35 },
    { key: 'monto', width: 18 },
    { key: 'metodo', width: 14 },
    { key: 'estado', width: 12 },
    { key: 'bono', width: 14 },
  ]

  const headers2 = ['Paciente', 'RUT', 'Fecha', 'Procedimiento', 'Monto', 'Método', 'Estado', 'N° Bono']
  const hRow2 = ws2.addRow(headers2)
  hRow2.height = 28
  hRow2.eachCell(cell => encStyle(cell))

  let totalPagado = 0, totalPendiente = 0
  pagosFiltrados.forEach((p, i) => {
    const monto = parseFloat(p.monto) || 0
    const estado = p.estado || ''
    if (estado === 'pagado') totalPagado += monto
    else if (estado === 'pendiente') totalPendiente += monto

    const notas = p.notas || ''
    const proc = notas.startsWith('Procedimiento:') ? notas.replace('Procedimiento: ', '') : notas
    const nombre = `${(p.paciente_nombre || '').trim()} ${(p.paciente_apellido || '').trim()}`.trim()

    const row = ws2.addRow([
      nombre, p.paciente_rut || '', (p.fecha || '').slice(0, 10),
      proc, monto, (p.metodo || '').toUpperCase(),
      estado.toUpperCase(), p.numero_bono || ''
    ])
    row.height = 20

    const fondo = estado === 'pendiente' ? AMARILLO : (i % 2 === 0 ? BLANCO : GRIS)
    filaStyle(row, fondo)

    const montoCell = row.getCell(5)
    montoCell.numFmt = fmtCLP
    montoCell.alignment = { horizontal: 'right', vertical: 'middle' }

    const estadoCell = row.getCell(7)
    if (estado === 'pagado') estadoCell.font = { bold: true, color: { argb: 'FF1B5E20' }, name: 'Arial', size: 10 }
    else if (estado === 'pendiente') estadoCell.font = { bold: true, color: { argb: 'FFE65100' }, name: 'Arial', size: 10 }
  })

  const totalRow2 = ws2.addRow([
    `TOTAL: ${pagosFiltrados.length} registros`, '', '', 'PAGADO:',
    totalPagado, 'PENDIENTE:', totalPendiente, ''
  ])
  totalRow2.height = 28
  totalRow2.eachCell(cell => encStyle(cell))
  totalRow2.getCell(5).numFmt = fmtCLP
  totalRow2.getCell(5).alignment = { horizontal: 'right' }
  totalRow2.getCell(7).numFmt = fmtCLP
  totalRow2.getCell(7).alignment = { horizontal: 'right' }

  ws2.autoFilter = { from: 'A2', to: `H${pagosFiltrados.length + 2}` }
  ws2.views = [{ state: 'frozen', ySplit: 2, showGridLines: false }]

  // ── HOJA CITAS ──
  const citasFiltradas = citasRaw.filter(c => c.fecha_hora?.slice(0, 7) === mes)
  const ws3 = wb.addWorksheet('Citas')
  ws3.views = [{ showGridLines: false }]

  ws3.mergeCells('A1:F1')
  const t3 = ws3.getCell('A1')
  t3.value = `DETALLE DE CITAS — ${mes}`
  t3.font = { bold: true, size: 14, color: { argb: VERDE_OSC }, name: 'Arial' }
  t3.alignment = { horizontal: 'center', vertical: 'middle' }
  t3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: VERDE_CLAR } }
  ws3.getRow(1).height = 38

  ws3.columns = [
    { width: 30 }, { width: 28 }, { width: 20 }, { width: 30 }, { width: 14 }, { width: 30 }
  ]

  const hRow3 = ws3.addRow(['Paciente', 'Profesional', 'Fecha y Hora', 'Procedimiento', 'Estado', 'Observaciones'])
  hRow3.height = 28
  hRow3.eachCell(cell => encStyle(cell))

  const colEstado = { realizada: 'FFC8E6C9', cancelada: ROJO_CLAR, confirmada: 'FFBBDEFB', pendiente: AMARILLO }
  citasFiltradas.forEach((c, i) => {
    const estado = c.estado || ''
    const nombre = `${(c.paciente_nombre || '').trim()} ${(c.paciente_apellido || '').trim()}`.trim()
    const prof = `${(c.profesional_nombre || '').trim()} ${(c.profesional_apellido || '').trim()}`.trim()
    const fecha = (c.fecha_hora || '').slice(0, 16).replace('T', ' ')

    const row = ws3.addRow([nombre, prof, fecha, c.procedimiento_nombre || '', estado.toUpperCase(), c.observaciones || ''])
    row.height = 20
    filaStyle(row, colEstado[estado] || BLANCO)
  })

  const totalRow3 = ws3.addRow([`TOTAL: ${citasFiltradas.length} citas`])
  totalRow3.height = 28
  totalRow3.eachCell(cell => encStyle(cell))
  ws3.autoFilter = { from: 'A2', to: `F${citasFiltradas.length + 2}` }
  ws3.views = [{ state: 'frozen', ySplit: 2, showGridLines: false }]

  // ── HOJA PACIENTES ──
  const ws4 = wb.addWorksheet('Pacientes')
  ws4.views = [{ showGridLines: false }]

  ws4.mergeCells('A1:F1')
  const t4 = ws4.getCell('A1')
  t4.value = 'LISTADO DE PACIENTES'
  t4.font = { bold: true, size: 14, color: { argb: VERDE_OSC }, name: 'Arial' }
  t4.alignment = { horizontal: 'center', vertical: 'middle' }
  t4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: VERDE_CLAR } }
  ws4.getRow(1).height = 38

  ws4.columns = [{ width: 20 }, { width: 24 }, { width: 16 }, { width: 18 }, { width: 16 }, { width: 28 }]

  const hRow4 = ws4.addRow(['Nombre', 'Apellido', 'RUT', 'Fecha Nacimiento', 'Teléfono', 'Email'])
  hRow4.height = 28
  hRow4.eachCell(cell => encStyle(cell))

  pacientesRaw.forEach((p, i) => {
    const row = ws4.addRow([
      p.nombre || '', p.apellido || '', p.rut || '',
      (p.fecha_nacimiento || '').slice(0, 10), p.telefono || '', p.email || ''
    ])
    row.height = 20
    filaStyle(row, i % 2 === 0 ? GRIS : BLANCO)
  })

  const totalRow4 = ws4.addRow([`TOTAL: ${pacientesRaw.length} pacientes`])
  totalRow4.height = 28
  totalRow4.eachCell(cell => encStyle(cell))
  ws4.autoFilter = { from: 'A2', to: `F${pacientesRaw.length + 2}` }
  ws4.views = [{ state: 'frozen', ySplit: 2, showGridLines: false }]

  // ── DESCARGAR ──
  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Reporte_Saberes_${mes}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}

export default function Reportes() {
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [exportando, setExportando] = useState(false)
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

  const handleExportar = async () => {
    setExportando(true)
    await exportarExcel({ pagosRaw, citasRaw, pacientesRaw, datos, mes })
    setExportando(false)
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
    ? Math.round((datos.citasPorEstado?.find(e => e.estado === 'realizada')?.total || 0) / datos.citasMes * 100)
    : 0

  const pieData = datos.ingresosPorMetodo?.map(m => ({ name: m.metodo, value: parseFloat(m.total) })) || []
  const maxCitas = Math.max(...(datos.citasPorEstado?.map(e => parseInt(e.total)) || [0]), 1)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-green-800">Reportes</h2>
        <div className="flex items-center gap-3">
          <input type="month"
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
            value={mes} onChange={e => setMes(e.target.value)}
          />
          <button
            onClick={handleExportar}
            disabled={exportando}
            className={`px-4 py-2 rounded-lg font-medium text-sm text-white whitespace-nowrap transition-colors ${exportando ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-700 hover:bg-green-800'}`}
          >
            {exportando ? '⏳ Generando...' : '📥 Exportar Excel'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-green-600">
          <p className="text-xs text-gray-500 mb-1">Recaudado</p>
          <p className="text-xl font-bold text-gray-800">{formatCLP(datos.ingresosMes)}</p>
          <Variacion actual={datos.ingresosMes} anterior={datos.ingresosAnterior} />
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-yellow-500">
          <p className="text-xs text-gray-500 mb-1">Por cobrar</p>
          <p className="text-xl font-bold text-gray-800">{formatCLP(datos.pendientesMes?.total || 0)}</p>
          <p className="text-xs text-yellow-600 mt-1">{datos.pendientesMes?.cantidad || 0} pagos</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-blue-500">
          <p className="text-xs text-gray-500 mb-1">Citas</p>
          <p className="text-xl font-bold text-gray-800">{datos.citasMes}</p>
          <Variacion actual={datos.citasMes} anterior={datos.citasAnterior} />
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-teal-500">
          <p className="text-xs text-gray-500 mb-1">Tasa asistencia</p>
          <p className="text-xl font-bold text-gray-800">{tasaAsistencia}%</p>
          <p className="text-xs text-gray-400 mt-1">{datos.citasPorEstado?.find(e => e.estado === 'realizada')?.total || 0} realizadas</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h3 className="text-lg font-bold text-gray-800 mb-4">📈 Ingresos últimos 6 meses</h3>
        {datos.ultimos6meses?.length > 0
          ? <GraficoBarras data={datos.ultimos6meses} />
          : <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>
        }
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="text-lg font-bold text-gray-800 mb-4">💳 Ingresos por método</h3>
          <GraficoPie data={pieData} />
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="text-lg font-bold text-gray-800 mb-4">📅 Citas por estado</h3>
          <div className="flex flex-col gap-3 mb-6">
            {['realizada', 'confirmada', 'pendiente', 'cancelada'].map(estado => {
              const total = parseInt(datos.citasPorEstado?.find(e => e.estado === estado)?.total || 0)
              const colores = { realizada: 'bg-green-500', confirmada: 'bg-blue-500', pendiente: 'bg-yellow-400', cancelada: 'bg-red-400' }
              const iconos = { realizada: '✅', confirmada: '📋', pendiente: '🕐', cancelada: '❌' }
              return <BarraHorizontal key={estado} label={`${iconos[estado]} ${estado}`} valor={total} max={maxCitas} color={colores[estado]} />
            })}
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-3">👩‍⚕️ Por profesional</h3>
          <div className="flex flex-col gap-2">
            {datos.citasPorProfesional?.map((p, i) => {
              const ingreso = datos.ingresosPorProfesional?.find(ip => ip.nombre === p.nombre && ip.apellido === p.apellido)
              return (
                <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl text-sm">
                  <span className="font-medium text-gray-800">{p.nombre} {p.apellido}</span>
                  <div className="flex gap-4 text-xs">
                    <div className="text-center"><p className="font-bold text-gray-800">{p.total}</p><p className="text-gray-400">total</p></div>
                    <div className="text-center"><p className="font-bold text-green-700">{p.realizadas}</p><p className="text-gray-400">realiz.</p></div>
                    {ingreso && <div className="text-center"><p className="font-bold text-teal-700">{formatCLP(ingreso.total)}</p><p className="text-gray-400">recaudado</p></div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {datos.ingresosPorProfesional?.length > 0 && (
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
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="text-lg font-bold text-gray-800 mb-4">⭐ Pacientes más frecuentes</h3>
          {datos.pacientesFrecuentes?.length > 0 ? (
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
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="text-lg font-bold text-gray-800 mb-4">⚠️ Pacientes con deuda</h3>
          {datos.pacientesDeuda?.length > 0 ? (
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
              {datos.pacientesDeuda.length > 5 && <p className="text-xs text-gray-400 text-center">+{datos.pacientesDeuda.length - 5} más</p>}
            </div>
          ) : <p className="text-gray-400 text-sm text-center py-4">Sin deudas pendientes 🎉</p>}
        </div>
      </div>
    </div>
  )
}