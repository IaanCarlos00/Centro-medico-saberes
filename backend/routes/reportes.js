const express = require('express')
const router = express.Router()
const pool = require('../db')

router.get('/', async (req, res) => {
  try {
    const { mes } = req.query
    const [anio, mesNum] = mes ? mes.split('-') : [new Date().getFullYear(), new Date().getMonth() + 1]
    const inicio = `${anio}-${mesNum}-01`
    const fin = new Date(anio, mesNum, 0).toISOString().slice(0, 10)

    // Mes anterior
    const mesAnterior = new Date(anio, mesNum - 2, 1)
    const inicioAnterior = mesAnterior.toISOString().slice(0, 10)
    const finAnterior = new Date(anio, mesNum - 1, 0).toISOString().slice(0, 10)

    const [
      ingresosMes, ingresosAnterior, ingresosPorMetodo, ingresosPorProfesional,
      citasMes, citasAnterior, citasPorProfesional, citasPorEstado,
      pacientesNuevos, pacientesDeuda, pacientesFrecuentes,
      ingresosPorDia, pendientesMes, rangoEdades
    ] = await Promise.all([
      pool.query(`SELECT COALESCE(SUM(monto),0) AS total FROM pago WHERE estado='pagado' AND fecha >= $1 AND fecha <= $2`, [inicio, fin]),
      pool.query(`SELECT COALESCE(SUM(monto),0) AS total FROM pago WHERE estado='pagado' AND fecha >= $1 AND fecha <= $2`, [inicioAnterior, finAnterior]),
      pool.query(`SELECT metodo, COALESCE(SUM(monto),0) AS total, COUNT(*) AS cantidad FROM pago WHERE estado='pagado' AND fecha >= $1 AND fecha <= $2 GROUP BY metodo ORDER BY total DESC`, [inicio, fin]),
      pool.query(`SELECT pr.nombre, pr.apellido, COALESCE(SUM(p.monto),0) AS total, COUNT(*) AS cantidad FROM pago p JOIN procedimiento proc ON p.notas LIKE '%' || proc.nombre || '%' JOIN profesional pr ON proc.id IS NOT NULL LEFT JOIN cita c ON p.cita_id = c.id LEFT JOIN profesional pr2 ON c.profesional_id = pr2.id WHERE p.estado='pagado' AND p.fecha >= $1 AND p.fecha <= $2 GROUP BY pr.id, pr.nombre, pr.apellido ORDER BY total DESC`, [inicio, fin]),
      pool.query(`SELECT COUNT(*) AS total FROM cita WHERE fecha_hora >= $1 AND fecha_hora <= $2`, [inicio, fin + ' 23:59:59']),
      pool.query(`SELECT COUNT(*) AS total FROM cita WHERE fecha_hora >= $1 AND fecha_hora <= $2`, [inicioAnterior, finAnterior + ' 23:59:59']),
      pool.query(`SELECT pr.nombre, pr.apellido, COUNT(*) AS total, COUNT(*) FILTER (WHERE c.estado='realizada') AS realizadas FROM cita c JOIN profesional pr ON c.profesional_id = pr.id WHERE c.fecha_hora >= $1 AND c.fecha_hora <= $2 GROUP BY pr.id, pr.nombre, pr.apellido ORDER BY total DESC`, [inicio, fin + ' 23:59:59']),
      pool.query(`SELECT estado, COUNT(*) AS total FROM cita WHERE fecha_hora >= $1 AND fecha_hora <= $2 GROUP BY estado`, [inicio, fin + ' 23:59:59']),
      pool.query(`SELECT COUNT(*) AS total FROM paciente WHERE created_at >= $1 AND created_at <= $2`, [inicio, fin]),
      pool.query(`SELECT p.nombre, p.apellido, p.telefono, COALESCE(SUM(pg.monto),0) AS deuda FROM paciente p JOIN pago pg ON pg.paciente_id = p.id WHERE pg.estado='pendiente' GROUP BY p.id, p.nombre, p.apellido, p.telefono HAVING SUM(pg.monto) > 0 ORDER BY deuda DESC`),
      pool.query(`SELECT p.nombre, p.apellido, COUNT(*) AS visitas FROM paciente p JOIN cita c ON c.paciente_id = p.id WHERE c.estado='realizada' AND c.fecha_hora >= $1 AND c.fecha_hora <= $2 GROUP BY p.id, p.nombre, p.apellido ORDER BY visitas DESC`, [inicio, fin + ' 23:59:59']),
      pool.query(`SELECT TO_CHAR(fecha, 'DD') AS dia, COALESCE(SUM(monto),0) AS total FROM pago WHERE estado='pagado' AND fecha >= $1 AND fecha <= $2 GROUP BY dia ORDER BY dia`, [inicio, fin]),
      pool.query(`SELECT COALESCE(SUM(monto),0) AS total, COUNT(*) AS cantidad FROM pago WHERE estado='pendiente' AND fecha >= $1 AND fecha <= $2`, [inicio, fin]),
      pool.query(`
        SELECT
          CASE
            WHEN EXTRACT(YEAR FROM AGE(fecha_nacimiento)) < 18 THEN 'Menor de 18'
            WHEN EXTRACT(YEAR FROM AGE(fecha_nacimiento)) BETWEEN 18 AND 25 THEN '18 - 25'
            WHEN EXTRACT(YEAR FROM AGE(fecha_nacimiento)) BETWEEN 26 AND 35 THEN '26 - 35'
            WHEN EXTRACT(YEAR FROM AGE(fecha_nacimiento)) BETWEEN 36 AND 45 THEN '36 - 45'
            WHEN EXTRACT(YEAR FROM AGE(fecha_nacimiento)) BETWEEN 46 AND 55 THEN '46 - 55'
            WHEN EXTRACT(YEAR FROM AGE(fecha_nacimiento)) BETWEEN 56 AND 65 THEN '56 - 65'
            ELSE 'Mayor de 65'
          END AS rango,
          COUNT(*) AS total
        FROM paciente
        WHERE fecha_nacimiento IS NOT NULL
        GROUP BY rango
        ORDER BY MIN(EXTRACT(YEAR FROM AGE(fecha_nacimiento)))
      `),
    ])

    // Ingresos últimos 6 meses
    const ultimos6 = await pool.query(`
      SELECT TO_CHAR(DATE_TRUNC('month', fecha), 'YYYY-MM') AS mes,
        TO_CHAR(DATE_TRUNC('month', fecha), 'Mon') AS mes_nombre,
        COALESCE(SUM(monto),0) AS total
      FROM pago WHERE estado='pagado'
        AND fecha >= DATE_TRUNC('month', NOW()) - INTERVAL '5 months'
      GROUP BY DATE_TRUNC('month', fecha)
      ORDER BY DATE_TRUNC('month', fecha)
    `)

    // Ingresos por profesional (via citas)
    const ingPorProf = await pool.query(`
      SELECT pr.nombre, pr.apellido, COALESCE(SUM(p.monto),0) AS total
      FROM pago p
      JOIN cita c ON p.cita_id = c.id
      JOIN profesional pr ON c.profesional_id = pr.id
      WHERE p.estado = 'pagado' AND p.fecha >= $1 AND p.fecha <= $2
      GROUP BY pr.id, pr.nombre, pr.apellido
      ORDER BY total DESC
    `, [inicio, fin])

    res.json({
      ingresosMes: parseFloat(ingresosMes.rows[0].total),
      ingresosAnterior: parseFloat(ingresosAnterior.rows[0].total),
      ingresosPorMetodo: ingresosPorMetodo.rows,
      ingresosPorProfesional: ingPorProf.rows,
      citasMes: parseInt(citasMes.rows[0].total),
      citasAnterior: parseInt(citasAnterior.rows[0].total),
      citasPorProfesional: citasPorProfesional.rows,
      citasPorEstado: citasPorEstado.rows,
      pacientesNuevos: parseInt(pacientesNuevos.rows[0].total),
      pacientesDeuda: pacientesDeuda.rows,
      pacientesFrecuentes: pacientesFrecuentes.rows.slice(0, 5),
      ingresosPorDia: ingresosPorDia.rows,
      pendientesMes: {
        total: parseFloat(pendientesMes.rows[0].total),
        cantidad: parseInt(pendientesMes.rows[0].cantidad)
      },
      ultimos6meses: ultimos6.rows,
      rangoEdades: rangoEdades.rows,
    })
  } catch (error) {
    console.error('Error reportes:', error.message)
    res.status(500).json({ error: error.message })
  }
})

module.exports = router