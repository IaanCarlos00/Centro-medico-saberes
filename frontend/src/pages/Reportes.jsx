import { useEffect, useState } from 'react'
import axios from 'axios'
import ExcelJS from 'exceljs'
import { estadoColorReporte } from '../utils/estadoColor'

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
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ml-2 ${subio ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
      {subio ? '▲' : '▼'} {Math.abs(pct)}%
    </span>
  )
}

function BarraHorizontal({ label, valor, max, color = '#22c55e' }) {
  const pct = max > 0 ? Math.round((valor / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-32 truncate">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
        <div className="h-3 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-sm font-black text-gray-800 text-right min-w-[40px]">{valor}</span>
    </div>
  )
}

function GraficoBarras({ data }) {
  const [hover, setHover] = useState(null)
  const valores = data.map(d => parseFloat(d.total))
  const max = Math.max(...valores, 1)
  const total = valores.reduce((s, v) => s + v, 0)
  const promedio = total / (valores.filter(v => v > 0).length || 1)
  const mejor = valores.indexOf(Math.max(...valores))

  return (
    <div className="flex flex-col gap-6">
      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total 6 meses', value: formatCLP(total), icon: '💰', color: '#166534', bg: '#f0fdf4' },
          { label: 'Promedio mensual', value: formatCLP(promedio), icon: '📊', color: '#1d4ed8', bg: '#eff6ff' },
          { label: 'Mejor mes', value: data[mejor]?.mes_nombre || '—', icon: '🏆', color: '#7c3aed', bg: '#f5f3ff' },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl p-4 text-center" style={{ background: s.bg, border: `1px solid ${s.color}22` }}>
            <span className="text-xl">{s.icon}</span>
            <p className="text-xs font-bold uppercase tracking-wider mt-1" style={{ color: s.color }}>{s.label}</p>
            <p className="text-base font-black mt-1" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Gráfico premium */}
      <div className="relative">
        {/* Líneas de referencia */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none" style={{ bottom: '28px', top: '8px' }}>
          {[100, 75, 50, 25, 0].map(pct => (
            <div key={pct} className="flex items-center gap-2">
              <span className="text-xs text-gray-300 w-12 text-right shrink-0">{formatCLP(max * pct / 100).replace('CLP','').trim()}</span>
              <div className="flex-1 border-t border-dashed border-gray-100" />
            </div>
          ))}
        </div>

        {/* Barras */}
        <div className="flex gap-2 h-56 pl-16 pr-2 pb-7 pt-2 relative">
          {data.map((d, i) => {
            const val = parseFloat(d.total)
            const pct = max > 0 ? (val / max) * 100 : 0
            const esMejor = i === mejor
            const esHover = hover === i
            const gradient = esMejor
              ? 'linear-gradient(180deg, #7c3aed, #a78bfa)'
              : `linear-gradient(180deg, #166534, #22c55e)`

            return (
              <div key={i} className="flex flex-col items-center justify-end flex-1 gap-1 relative"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              >
                {/* Tooltip */}
                {esHover && val > 0 && (
                  <div className="absolute bottom-full mb-2 z-10 pointer-events-none" style={{ left: '50%', transform: 'translateX(-50%)' }}>
                    <div className="bg-gray-900 text-white text-xs rounded-xl px-3 py-2 whitespace-nowrap shadow-xl">
                      <p className="font-bold">{d.mes_nombre}</p>
                      <p>{formatCLP(val)}</p>
                      <p className="text-gray-400">{Math.round(pct)}% del máximo</p>
                    </div>
                    <div className="w-2 h-2 bg-gray-900 rotate-45 mx-auto -mt-1" />
                  </div>
                )}

                {/* Valor encima */}
                <span className="text-xs font-black whitespace-nowrap transition-all" style={{ color: esMejor ? '#7c3aed' : '#166534', opacity: val > 0 ? 1 : 0 }}>
                  ${(val/1000).toFixed(0)}k
                </span>

                {/* Barra */}
                <div className="w-full relative rounded-t-xl overflow-hidden transition-all duration-300" style={{ height: `${Math.max(pct, val > 0 ? 4 : 0)}%`, background: gradient, opacity: esHover ? 1 : 0.85, transform: esHover ? 'scaleX(1.05)' : 'scaleX(1)', transformOrigin: 'bottom' }}>
                  {esMejor && (
                    <div className="absolute top-2 left-0 right-0 flex justify-center">
                      <span className="text-white text-xs">🏆</span>
                    </div>
                  )}
                </div>

                {/* Mes */}
                <span className="text-xs font-semibold absolute bottom-0" style={{ color: esMejor ? '#7c3aed' : '#6b7280' }}>{d.mes_nombre}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tendencia */}
      {data.length >= 2 && (() => {
        const ultimo = parseFloat(data[data.length - 1]?.total || 0)
        const penultimo = parseFloat(data[data.length - 2]?.total || 0)
        const diff = ultimo - penultimo
        const pctCambio = penultimo > 0 ? ((diff / penultimo) * 100).toFixed(1) : null
        const subio = diff >= 0
        return (
          <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: subio ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)' : 'linear-gradient(135deg, #fef2f2, #fee2e2)', border: `1px solid ${subio ? '#16a34a' : '#ef4444'}22` }}>
            <span className="text-2xl">{subio ? '📈' : '📉'}</span>
            <div>
              <p className="text-sm font-bold" style={{ color: subio ? '#166534' : '#dc2626' }}>
                {subio ? 'Tendencia al alza' : 'Tendencia a la baja'} respecto al mes anterior
              </p>
              <p className="text-xs" style={{ color: subio ? '#15803d' : '#b91c1c' }}>
                {pctCambio ? `${subio ? '+' : ''}${pctCambio}% (${formatCLP(Math.abs(diff))})` : 'Sin datos comparativos'}
              </p>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

function GraficoPie({ data }) {
  const total = data.reduce((s, d) => s + parseFloat(d.value), 0)
  if (total === 0) return <p className="text-gray-300 text-sm text-center py-8">Sin datos</p>
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
        <circle cx="100" cy="100" r="48" fill="white" />
        <text x="100" y="95" textAnchor="middle" fontSize="9" fill="#6b7280" fontFamily="Arial">Total</text>
        <text x="100" y="112" textAnchor="middle" fontSize="8" fill="#166534" fontWeight="bold" fontFamily="Arial">{formatCLP(total)}</text>
      </svg>
      <div className="flex flex-col gap-2.5 flex-1 w-full">
        {segmentos.map((s, i) => (
          <div key={i} className="flex items-center justify-between text-sm p-2 rounded-xl hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: s.color }} />
              <span className="capitalize text-gray-600">{metodoIcono[s.name] || ''} {s.name}</span>
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-xs text-gray-300">{Math.round(s.pct * 100)}%</span>
              <span className="font-black text-gray-800">{formatCLP(s.value)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

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
    cell.border = { top: { style: 'thin', color: { argb: 'FFFFFFFF' } }, bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } }, left: { style: 'thin', color: { argb: 'FFFFFFFF' } }, right: { style: 'thin', color: { argb: 'FFFFFFFF' } } }
  }

  const filaStyle = (row, fondo = BLANCO) => {
    row.eachCell(cell => {
      cell.font = { name: 'Arial', size: 10 }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fondo } }
      cell.alignment = { vertical: 'middle' }
      cell.border = { top: { style: 'thin', color: { argb: 'FFDDDDDD' } }, bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } }, left: { style: 'thin', color: { argb: 'FFDDDDDD' } }, right: { style: 'thin', color: { argb: 'FFDDDDDD' } } }
    })
  }

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
  ws2.columns = [{ key: 'paciente', width: 30 }, { key: 'rut', width: 16 }, { key: 'fecha', width: 14 }, { key: 'procedimiento', width: 35 }, { key: 'monto', width: 18 }, { key: 'metodo', width: 14 }, { key: 'estado', width: 12 }, { key: 'bono', width: 14 }]
  const hRow2 = ws2.addRow(['Paciente', 'RUT', 'Fecha', 'Procedimiento', 'Monto', 'Método', 'Estado', 'N° Bono'])
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
    const row = ws2.addRow([nombre, p.paciente_rut || '', (p.fecha || '').slice(0, 10), proc, monto, (p.metodo || '').toUpperCase(), estado.toUpperCase(), p.numero_bono || ''])
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
  const totalRow2 = ws2.addRow([`TOTAL: ${pagosFiltrados.length} registros`, '', '', 'PAGADO:', totalPagado, 'PENDIENTE:', totalPendiente, ''])
  totalRow2.height = 28
  totalRow2.eachCell(cell => encStyle(cell))
  totalRow2.getCell(5).numFmt = fmtCLP
  totalRow2.getCell(5).alignment = { horizontal: 'right' }
  totalRow2.getCell(7).numFmt = fmtCLP
  totalRow2.getCell(7).alignment = { horizontal: 'right' }
  ws2.autoFilter = { from: 'A2', to: `H${pagosFiltrados.length + 2}` }
  ws2.views = [{ state: 'frozen', ySplit: 2, showGridLines: false }]

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
  ws3.columns = [{ width: 30 }, { width: 28 }, { width: 20 }, { width: 30 }, { width: 14 }, { width: 30 }]
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
    const row = ws4.addRow([p.nombre || '', p.apellido || '', p.rut || '', (p.fecha_nacimiento || '').slice(0, 10), p.telefono || '', p.email || ''])
    row.height = 20
    filaStyle(row, i % 2 === 0 ? GRIS : BLANCO)
  })
  const totalRow4 = ws4.addRow([`TOTAL: ${pacientesRaw.length} pacientes`])
  totalRow4.height = 28
  totalRow4.eachCell(cell => encStyle(cell))
  ws4.autoFilter = { from: 'A2', to: `F${pacientesRaw.length + 2}` }
  ws4.views = [{ state: 'frozen', ySplit: 2, showGridLines: false }]

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
    <div className="flex items-center justify-center py-32">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-green-200 border-t-green-700 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 font-medium">Generando reporte...</p>
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

  const estadoColors = estadoColorReporte

  // Aceptación de estudiantes en las citas del período seleccionado
  const citasMesRaw = citasRaw.filter(c => c.fecha_hora?.startsWith(mes))
  const totalCitasEstudiantes = citasMesRaw.length
  const aceptanEstudiantes = citasMesRaw.filter(c => c.permite_estudiantes === true).length
  const noAceptanEstudiantes = citasMesRaw.filter(c => c.permite_estudiantes === false).length
  const noPreguntadoEstudiantes = totalCitasEstudiantes - aceptanEstudiantes - noAceptanEstudiantes
  const pctAceptan = totalCitasEstudiantes > 0 ? Math.round((aceptanEstudiantes / totalCitasEstudiantes) * 100) : 0

  return (
    <div className="min-h-screen bg-white">

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl mb-8 p-6 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #052e16 0%, #166534 60%, #15803d 100%)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #86efac, transparent)', transform: 'translate(30%, -30%)' }} />
        <div className="relative z-10">
          <p className="text-green-300 text-xs font-semibold uppercase tracking-widest mb-1">Análisis</p>
          <h2 className="text-3xl font-black text-white">Reportes</h2>
          <p className="text-green-200 text-sm mt-1">Período: {new Date(mes + '-01T12:00:00').toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <input type="month" className="border-0 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 font-semibold" style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }} value={mes} onChange={e => setMes(e.target.value)} />
          <button onClick={handleExportar} disabled={exportando} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${exportando ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`} style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.25)' }}>
            {exportando ? '⏳' : '📥'} {exportando ? 'Generando...' : 'Exportar Excel'}
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Recaudado', value: formatCLP(datos.ingresosMes), sub: <Variacion actual={datos.ingresosMes} anterior={datos.ingresosAnterior} />, gradient: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '#16a34a', text: '#166534', icon: '💵' },
          { label: 'Por cobrar', value: formatCLP(datos.pendientesMes?.total || 0), sub: <span className="text-xs text-yellow-600 font-semibold">{datos.pendientesMes?.cantidad || 0} pagos</span>, gradient: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '#f59e0b', text: '#b45309', icon: '⚠️' },
          { label: 'Citas', value: datos.citasMes, sub: <Variacion actual={datos.citasMes} anterior={datos.citasAnterior} />, gradient: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '#3b82f6', text: '#1d4ed8', icon: '📅' },
          { label: 'Tasa asistencia', value: `${tasaAsistencia}%`, sub: <span className="text-xs text-teal-600 font-semibold">{datos.citasPorEstado?.find(e => e.estado === 'realizada')?.total || 0} realizadas</span>, gradient: 'linear-gradient(135deg, #f0fdfa, #ccfbf1)', border: '#14b8a6', text: '#0f766e', icon: '✅' },
        ].map((card, i) => (
          <div key={i} className="rounded-2xl p-5 hover:shadow-md transition-shadow" style={{ background: card.gradient, border: `1px solid ${card.border}22` }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: `${card.border}22` }}>{card.icon}</div>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: card.text }}>{card.label}</span>
            </div>
            <p className="text-2xl font-black mb-1" style={{ color: card.text }}>{card.value}</p>
            <div>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Gráfico ingresos */}
      <div className="rounded-2xl p-6 mb-6 border border-gray-100 shadow-sm card-surface">
        <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
          <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-base">📈</span>
          Ingresos últimos 6 meses
        </h3>
        {datos.ultimos6meses?.length > 0
          ? <GraficoBarras data={datos.ultimos6meses} />
          : <p className="text-gray-300 text-sm text-center py-8">Sin datos</p>
        }
      </div>

      {/* Pie + Estados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="rounded-2xl p-6 border border-gray-100 shadow-sm card-surface">
          <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-base">💳</span>
            Ingresos por método
          </h3>
          <GraficoPie data={pieData} />
        </div>

        <div className="rounded-2xl p-6 border border-gray-100 shadow-sm card-surface">
          <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
            <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-base">📅</span>
            Citas por estado
          </h3>
          <div className="flex flex-col gap-3 mb-6">
            {['realizada', 'confirmada', 'pendiente', 'cancelada'].map(estado => {
              const total = parseInt(datos.citasPorEstado?.find(e => e.estado === estado)?.total || 0)
              const iconos = { realizada: '✅', confirmada: '📋', pendiente: '🕐', cancelada: '❌' }
              return <BarraHorizontal key={estado} label={`${iconos[estado]} ${estado}`} valor={total} max={maxCitas} color={estadoColors[estado]} />
            })}
          </div>
          <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-7 h-7 bg-teal-100 rounded-lg flex items-center justify-center text-sm">👩‍⚕️</span>
            Por profesional
          </h3>
          <div className="flex flex-col gap-2">
            {datos.citasPorProfesional?.map((p, i) => {
              const ingreso = datos.ingresosPorProfesional?.find(ip => ip.nombre === p.nombre && ip.apellido === p.apellido)
              return (
                <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-teal-200 transition-colors">
                  <span className="font-semibold text-gray-800 text-sm">{p.nombre} {p.apellido}</span>
                  <div className="flex gap-3 text-xs">
                    <div className="text-center"><p className="font-black text-gray-800">{p.total}</p><p className="text-gray-400">total</p></div>
                    <div className="text-center"><p className="font-black text-green-700">{p.realizadas}</p><p className="text-gray-400">realiz.</p></div>
                    {ingreso && <div className="text-center"><p className="font-black text-teal-700">{formatCLP(ingreso.total)}</p><p className="text-gray-400">recaudado</p></div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Ingresos por profesional */}
      {datos.ingresosPorProfesional?.length > 0 && (
        <div className="rounded-2xl p-6 mb-6 border border-gray-100 shadow-sm card-surface">
          <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
            <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-base">💰</span>
            Ingresos por profesional
          </h3>
          <div className="flex flex-col gap-4">
            {datos.ingresosPorProfesional.map((p, i) => {
              const totalProf = datos.ingresosPorProfesional.reduce((s, x) => s + parseFloat(x.total), 0)
              const pct = totalProf > 0 ? Math.round(parseFloat(p.total) / totalProf * 100) : 0
              const gradients = ['linear-gradient(90deg, #166534, #22c55e)', 'linear-gradient(90deg, #0f766e, #2dd4bf)']
              return (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0" style={{ background: gradients[i % gradients.length] }}>
                    {p.nombre?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-700">{p.nombre} {p.apellido}</span>
                      <span className="text-sm font-black text-gray-800">{formatCLP(p.total)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div className="h-2.5 rounded-full transition-all" style={{ width: `${pct}%`, background: gradients[i % gradients.length] }} />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gray-400 w-8 text-right">{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Rango de edades */}
      {datos.rangoEdades?.length > 0 && (
        <div className="rounded-2xl p-6 mb-6 border border-gray-100 shadow-sm card-surface">
          <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
            <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-base">👥</span>
            Distribución por edad de pacientes
          </h3>
          <div className="flex flex-col gap-3">
            {(() => {
              const maxEdad = Math.max(...datos.rangoEdades.map(r => parseInt(r.total)), 1)
              const totalEdad = datos.rangoEdades.reduce((s, r) => s + parseInt(r.total), 0)
              const gradients = [
                'linear-gradient(90deg, #7c3aed, #a78bfa)',
                'linear-gradient(90deg, #1d4ed8, #60a5fa)',
                'linear-gradient(90deg, #166534, #22c55e)',
                'linear-gradient(90deg, #0f766e, #2dd4bf)',
                'linear-gradient(90deg, #b45309, #fbbf24)',
                'linear-gradient(90deg, #be185d, #f472b6)',
                'linear-gradient(90deg, #c2410c, #fb923c)',
              ]
              return datos.rangoEdades.map((r, i) => {
                const pct = Math.round((parseInt(r.total) / maxEdad) * 100)
                const pctTotal = Math.round((parseInt(r.total) / totalEdad) * 100)
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-600 w-28 shrink-0">{r.rango}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                      <div className="h-4 rounded-full transition-all" style={{ width: `${pct}%`, background: gradients[i % gradients.length] }} />
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-black text-gray-800 w-6 text-right">{r.total}</span>
                      <span className="text-xs text-gray-400 w-8">({pctTotal}%)</span>
                    </div>
                  </div>
                )
              })
            })()}
          </div>
          <p className="text-xs text-gray-400 mt-4 text-right">
            {datos.rangoEdades.reduce((s, r) => s + parseInt(r.total), 0)} pacientes con fecha de nacimiento registrada
          </p>
        </div>
      )}

      {/* Aceptación de estudiantes */}
      <div className="rounded-2xl p-6 mb-6 border border-gray-100 shadow-sm card-surface">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-base">🎓</span>
            Aceptación de estudiantes
          </h3>
          {totalCitasEstudiantes > 0 && (
            <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-bold">{pctAceptan}% acepta</span>
          )}
        </div>
        {totalCitasEstudiantes > 0 ? (
          <>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Acepta estudiantes', icono: '🎓', total: aceptanEstudiantes, color: 'linear-gradient(90deg, #1d4ed8, #60a5fa)' },
                { label: 'No acepta estudiantes', icono: '🚫', total: noAceptanEstudiantes, color: 'linear-gradient(90deg, #b91c1c, #f87171)' },
                { label: 'No se preguntó', icono: '❔', total: noPreguntadoEstudiantes, color: 'linear-gradient(90deg, #6b7280, #d1d5db)' },
              ].map((fila, i) => (
                <BarraHorizontal key={i} label={`${fila.icono} ${fila.label}`} valor={fila.total} max={totalCitasEstudiantes} color={fila.color} />
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4 text-right">
              {totalCitasEstudiantes} cita{totalCitasEstudiantes !== 1 ? 's' : ''} en el período con este dato
            </p>
          </>
        ) : (
          <p className="text-gray-300 text-sm text-center py-6">Sin citas registradas este mes</p>
        )}
      </div>

      {/* Frecuentes + Deuda */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="rounded-2xl p-6 border border-gray-100 shadow-sm card-surface">
          <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
            <span className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center text-base">⭐</span>
            Pacientes más frecuentes
          </h3>
          {datos.pacientesFrecuentes?.length > 0 ? (
            <div className="flex flex-col gap-2">
              {datos.pacientesFrecuentes.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-yellow-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-gray-200 w-6">#{i+1}</span>
                    <span className="text-sm font-semibold text-gray-800">{p.nombre} {p.apellido}</span>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-bold">{p.visitas} visita{p.visitas > 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-300 text-sm text-center py-6">Sin atenciones este mes</p>}
        </div>

        <div className="rounded-2xl p-6 border border-red-100 shadow-sm card-surface-alert">
          <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
            <span className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-base">⚠️</span>
            Pacientes con deuda
          </h3>
          {datos.pacientesDeuda?.length > 0 ? (
            <div className="flex flex-col gap-2">
              {datos.pacientesDeuda.slice(0, 5).map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white rounded-xl border border-red-100 hover:border-red-200 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{p.nombre} {p.apellido}</p>
                    {p.telefono && <p className="text-xs text-gray-400">{p.telefono}</p>}
                  </div>
                  <span className="text-sm font-black text-red-600">{formatCLP(p.deuda)}</span>
                </div>
              ))}
              {datos.pacientesDeuda.length > 5 && <p className="text-xs text-gray-400 text-center pt-1">+{datos.pacientesDeuda.length - 5} más</p>}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-3xl mb-2">🎉</p>
              <p className="text-gray-400 text-sm">Sin deudas pendientes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}