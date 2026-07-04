const express = require('express')
const router = express.Router()
const pool = require('../db')

router.get('/', async (req, res) => {
  try {
    const hoy = new Date().toISOString().slice(0, 10)

    const [
      totalPacientes,
      totalProfesionales,
      citasHoy,
      citasPendientes,
      citasConfirmadas,
      citasRealizadas,
      citasCanceladas,
      proximasCitas,
      pacientesDeuda,
      atencionesPorMes,
      logsRecientes,
      atencionesMes,
      atencionesTotal,
      controlsMes,
      controlsTotal,
      proximosControles,
      atencionesPorProfesional,
      ingresosMes,
      ingresosTotal
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM paciente'),
      pool.query('SELECT COUNT(*) FROM profesional'),
      pool.query('SELECT COUNT(*) FROM cita WHERE DATE(fecha_hora) = $1', [hoy]),
      pool.query("SELECT COUNT(*) FROM cita WHERE estado = 'pendiente'"),
      pool.query("SELECT COUNT(*) FROM cita WHERE estado = 'confirmada'"),
      pool.query("SELECT COUNT(*) FROM cita WHERE estado = 'realizada'"),
      pool.query("SELECT COUNT(*) FROM cita WHERE estado = 'cancelada'"),
      pool.query(`
        SELECT c.fecha_hora, c.estado, c.observaciones,
               p.nombre AS paciente_nombre, p.apellido AS paciente_apellido,
               pr.nombre AS profesional_nombre, pr.apellido AS profesional_apellido
        FROM cita c
        LEFT JOIN paciente p ON c.paciente_id = p.id
        JOIN profesional pr ON c.profesional_id = pr.id
        WHERE DATE(c.fecha_hora) = $1
        ORDER BY c.fecha_hora ASC
      `, [hoy]),
      pool.query(`
        SELECT pa.id, pa.nombre, pa.apellido, pa.rut, pa.telefono,
               COUNT(pg.id) AS cantidad_pendiente,
               COALESCE(SUM(pg.monto), 0) AS monto_pendiente
        FROM paciente pa
        JOIN pago pg ON pg.paciente_id = pa.id
        WHERE pg.estado = 'pendiente'
        GROUP BY pa.id, pa.nombre, pa.apellido, pa.rut, pa.telefono
        ORDER BY monto_pendiente DESC
      `),
      pool.query(`
        SELECT 
          TO_CHAR(fecha_hora, 'YYYY-MM') AS mes,
          TO_CHAR(fecha_hora, 'Mon') AS mes_nombre,
          COUNT(*) AS total
        FROM cita
        WHERE estado = 'realizada'
          AND fecha_hora >= NOW() - INTERVAL '6 months'
        GROUP BY TO_CHAR(fecha_hora, 'YYYY-MM'), TO_CHAR(fecha_hora, 'Mon')
        ORDER BY mes ASC
      `),
      pool.query(`SELECT * FROM log_actividad ORDER BY created_at DESC LIMIT 10`),
      pool.query(`SELECT COUNT(*) FROM cita WHERE estado = 'realizada' AND DATE_TRUNC('month', fecha_hora) = DATE_TRUNC('month', NOW())`),
      pool.query(`SELECT COUNT(*) FROM cita WHERE estado = 'realizada'`),
      pool.query(`SELECT COUNT(*) FROM ficha_clinica WHERE DATE_TRUNC('month', fecha) = DATE_TRUNC('month', NOW())`),
      pool.query(`SELECT COUNT(*) FROM ficha_clinica`),
      pool.query(`
        SELECT proximo_control, paciente_id,
          p.nombre AS paciente_nombre, p.apellido AS paciente_apellido, p.telefono,
          pr.nombre AS profesional_nombre,
          'Control' AS tipo
        FROM ficha_clinica f
        JOIN paciente p ON f.paciente_id = p.id
        JOIN profesional pr ON f.profesional_id = pr.id
        WHERE f.proximo_control IS NOT NULL
          AND f.proximo_control >= CURRENT_DATE - INTERVAL '6 months'
          AND f.proximo_control <= CURRENT_DATE + INTERVAL '60 days'

        UNION ALL

        SELECT proximo_control, paciente_id,
          p.nombre AS paciente_nombre, p.apellido AS paciente_apellido, p.telefono,
          pr.nombre AS profesional_nombre,
          'Ingreso V' AS tipo
        FROM ficha_ingreso_1 fi1
        JOIN paciente p ON fi1.paciente_id = p.id
        JOIN profesional pr ON fi1.profesional_id = pr.id
        WHERE fi1.proximo_control IS NOT NULL
          AND fi1.proximo_control >= CURRENT_DATE - INTERVAL '6 months'
          AND fi1.proximo_control <= CURRENT_DATE + INTERVAL '60 days'

        UNION ALL

        SELECT proximo_control, paciente_id,
          p.nombre AS paciente_nombre, p.apellido AS paciente_apellido, p.telefono,
          pr.nombre AS profesional_nombre,
          'Ingreso J' AS tipo
        FROM ficha_ingreso_2 fi2
        JOIN paciente p ON fi2.paciente_id = p.id
        JOIN profesional pr ON fi2.profesional_id = pr.id
        WHERE fi2.proximo_control IS NOT NULL
          AND fi2.proximo_control >= CURRENT_DATE - INTERVAL '6 months'
          AND fi2.proximo_control <= CURRENT_DATE + INTERVAL '60 days'

        ORDER BY proximo_control ASC
        LIMIT 100
      `),
      pool.query(`
        WITH citas_realizadas AS (
          SELECT c.id, c.profesional_id, c.paciente_id, c.fecha_hora
          FROM cita c
          WHERE c.estado = 'realizada'
        ),
        pagos_deduplicados AS (
          SELECT DISTINCT ON (pg.id)
            pg.id, pg.monto,
            COALESCE(pg.profesional_id, cr.profesional_id) AS profesional_id,
            cr.fecha_hora
          FROM pago pg
          JOIN citas_realizadas cr ON cr.paciente_id = pg.paciente_id
            AND (
              pg.profesional_id = cr.profesional_id
              OR (pg.profesional_id IS NULL AND DATE(pg.fecha) = DATE(cr.fecha_hora))
            )
          WHERE pg.estado = 'pagado'
          ORDER BY pg.id, (pg.profesional_id IS NOT NULL) DESC
        ),
        ingresos_prof AS (
          SELECT profesional_id,
            SUM(monto) FILTER (WHERE DATE_TRUNC('month', fecha_hora) = DATE_TRUNC('month', NOW())) AS ingresos_mes,
            SUM(monto) AS ingresos_total
          FROM pagos_deduplicados
          GROUP BY profesional_id
        )
        SELECT 
          pr.nombre, pr.apellido,
          COUNT(DISTINCT cr.id) FILTER (WHERE DATE_TRUNC('month', cr.fecha_hora) = DATE_TRUNC('month', NOW())) AS mes,
          COUNT(DISTINCT cr.id) AS total,
          COALESCE(ip.ingresos_mes, 0) AS ingresos_mes,
          COALESCE(ip.ingresos_total, 0) AS ingresos_total
        FROM citas_realizadas cr
        JOIN profesional pr ON cr.profesional_id = pr.id
        LEFT JOIN ingresos_prof ip ON ip.profesional_id = pr.id
        GROUP BY pr.id, pr.nombre, pr.apellido, ip.ingresos_mes, ip.ingresos_total
        ORDER BY total DESC
      `),
      pool.query(`
        SELECT COALESCE(SUM(monto), 0) AS total
        FROM pago 
        WHERE estado = 'pagado' 
        AND DATE_TRUNC('month', fecha) = DATE_TRUNC('month', NOW())
      `),
      pool.query(`
        SELECT COALESCE(SUM(monto), 0) AS total
        FROM pago 
        WHERE estado = 'pagado'
      `)
    ])

    res.json({
      totalPacientes: parseInt(totalPacientes.rows[0].count),
      totalProfesionales: parseInt(totalProfesionales.rows[0].count),
      citasHoy: parseInt(citasHoy.rows[0].count),
      estados: {
        pendiente: parseInt(citasPendientes.rows[0].count),
        confirmada: parseInt(citasConfirmadas.rows[0].count),
        realizada: parseInt(citasRealizadas.rows[0].count),
        cancelada: parseInt(citasCanceladas.rows[0].count),
      },
      proximasCitas: proximasCitas.rows,
      pacientesDeuda: pacientesDeuda.rows,
      atencionesPorMes: atencionesPorMes.rows,
      logsRecientes: logsRecientes.rows,
      atencionesMes: parseInt(atencionesMes.rows[0].count),
      atencionesTotal: parseInt(atencionesTotal.rows[0].count),
      controlsMes: parseInt(controlsMes.rows[0].count),
      controlsTotal: parseInt(controlsTotal.rows[0].count),
      proximosControles: proximosControles.rows,
      atencionesPorProfesional: atencionesPorProfesional.rows,
      ingresosMes: parseFloat(ingresosMes.rows[0].total),
      ingresosTotal: parseFloat(ingresosTotal.rows[0].total)
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})


router.get('/atenciones-profesional', async (req, res) => {
  try {
    const { fecha, desde, hasta } = req.query
    
    let whereClause = "c.estado = 'realizada'"
    let params = []

    if (fecha) {
      whereClause += ` AND DATE(c.fecha_hora) = $1`
      params = [fecha]
    } else if (desde && hasta) {
      whereClause += ` AND DATE(c.fecha_hora) >= $1 AND DATE(c.fecha_hora) <= $2`
      params = [desde, hasta]
    } else {
      whereClause += ` AND DATE_TRUNC('month', c.fecha_hora) = DATE_TRUNC('month', NOW())`
    }

    const result = await pool.query(`
      WITH citas_periodo AS (
        SELECT c.id, c.profesional_id, c.paciente_id, c.fecha_hora
        FROM cita c
        WHERE ${whereClause}
      ),
      pagos_deduplicados AS (
        SELECT DISTINCT ON (pg.id)
          pg.id,
          pg.monto,
          COALESCE(pg.profesional_id, cp.profesional_id) AS profesional_id
        FROM pago pg
        JOIN citas_periodo cp ON cp.paciente_id = pg.paciente_id
          AND (
            pg.profesional_id = cp.profesional_id
            OR (pg.profesional_id IS NULL AND DATE(pg.fecha) = DATE(cp.fecha_hora))
          )
        WHERE pg.estado = 'pagado'
        ORDER BY pg.id, (pg.profesional_id IS NOT NULL) DESC
      ),
      ingresos_por_profesional AS (
        SELECT profesional_id, SUM(monto) AS ingresos
        FROM pagos_deduplicados
        GROUP BY profesional_id
      )
      SELECT
        pr.id, pr.nombre, pr.apellido,
        COUNT(DISTINCT cp.id) AS atenciones,
        COALESCE(ip.ingresos, 0) AS ingresos
      FROM citas_periodo cp
      JOIN profesional pr ON cp.profesional_id = pr.id
      LEFT JOIN ingresos_por_profesional ip ON ip.profesional_id = pr.id
      GROUP BY pr.id, pr.nombre, pr.apellido, ip.ingresos
      ORDER BY atenciones DESC
    `, params)

    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router