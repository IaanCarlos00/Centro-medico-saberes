const express = require('express')
const router = express.Router()
const pool = require('../db')

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, 
             pa.nombre AS paciente_nombre, pa.apellido AS paciente_apellido,
             pa.rut AS paciente_rut,
             c.fecha_hora AS fecha_cita,
             COALESCE(pr_directo.id, pr_cita.id, pr_heuristica.id) AS profesional_efectivo_id,
             COALESCE(pr_directo.nombre, pr_cita.nombre, pr_heuristica.nombre) AS profesional_nombre,
             COALESCE(pr_directo.apellido, pr_cita.apellido, pr_heuristica.apellido) AS profesional_apellido
      FROM pago p
      JOIN paciente pa ON p.paciente_id = pa.id
      LEFT JOIN cita c ON p.cita_id = c.id
      LEFT JOIN profesional pr_directo ON p.profesional_id = pr_directo.id
      LEFT JOIN profesional pr_cita ON c.profesional_id = pr_cita.id
      LEFT JOIN LATERAL (
        SELECT pr.id, pr.nombre, pr.apellido
        FROM cita ch
        JOIN profesional pr ON ch.profesional_id = pr.id
        WHERE ch.paciente_id = p.paciente_id
          AND ch.estado = 'realizada'
          AND DATE(ch.fecha_hora) = DATE(p.fecha)
        LIMIT 1
      ) pr_heuristica ON p.profesional_id IS NULL AND p.cita_id IS NULL
      ORDER BY p.fecha DESC
    `)
    res.json(result.rows)
  } catch (error) { res.status(500).json({ error: error.message }) }
})

router.get('/paciente/:paciente_id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, pa.nombre AS paciente_nombre, pa.apellido AS paciente_apellido,
             c.fecha_hora AS fecha_cita,
             pr.nombre AS profesional_nombre, pr.apellido AS profesional_apellido
      FROM pago p
      JOIN paciente pa ON p.paciente_id = pa.id
      LEFT JOIN cita c ON p.cita_id = c.id
      LEFT JOIN profesional pr ON p.profesional_id = pr.id
      WHERE p.paciente_id = $1
      ORDER BY p.fecha DESC
    `, [req.params.paciente_id])
    res.json(result.rows)
  } catch (error) { res.status(500).json({ error: error.message }) }
})

router.get('/resumen', async (req, res) => {
  try {
    const hoy = new Date()
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString()
    const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).toISOString()

    const [totalMes, totalDia, porMetodo, pendientes] = await Promise.all([
      pool.query(`SELECT COALESCE(SUM(monto), 0) AS total FROM pago WHERE estado = 'pagado' AND fecha >= $1`, [inicioMes]),
      pool.query(`SELECT COALESCE(SUM(monto), 0) AS total FROM pago WHERE estado = 'pagado' AND fecha >= $1`, [inicioDia]),
      pool.query(`SELECT metodo, COALESCE(SUM(monto), 0) AS total, COUNT(*) AS cantidad FROM pago WHERE estado = 'pagado' AND fecha >= $1 GROUP BY metodo`, [inicioMes]),
      pool.query(`SELECT COUNT(*) AS total, COALESCE(SUM(monto), 0) AS monto FROM pago WHERE estado = 'pendiente'`)
    ])

    res.json({
      totalMes: parseFloat(totalMes.rows[0].total),
      totalDia: parseFloat(totalDia.rows[0].total),
      porMetodo: porMetodo.rows,
      pendientes: {
        cantidad: parseInt(pendientes.rows[0].total),
        monto: parseFloat(pendientes.rows[0].monto)
      }
    })
  } catch (error) { res.status(500).json({ error: error.message }) }
})

router.post('/', async (req, res) => {
  const { paciente_id, cita_id, monto, metodo, estado, notas, numero_bono, estado_bono, estado_boleta, profesional_id, procedimiento_nombre } = req.body
  try {
    const result = await pool.query(
      'INSERT INTO pago (paciente_id, cita_id, monto, metodo, estado, notas, numero_bono, estado_bono, estado_boleta, profesional_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
      [
        paciente_id,
        cita_id || null,
        monto,
        metodo,
        estado || 'pendiente',
        procedimiento_nombre ? `Procedimiento: ${procedimiento_nombre}` : (notas || null),
        numero_bono || null,
        metodo === 'fonasa' ? (estado_bono || 'pendiente') : null,
        (metodo === 'efectivo' || metodo === 'transferencia') ? (estado_boleta || 'pendiente') : null,
        profesional_id || null
      ]
    )
    res.status(201).json(result.rows[0])
  } catch (error) { res.status(500).json({ error: error.message }) }
})

router.put('/:id', async (req, res) => {
  const { monto, metodo, estado, notas, numero_bono, estado_bono, estado_boleta, profesional_id, fecha } = req.body
  try {
    const result = await pool.query(
      'UPDATE pago SET monto=$1, metodo=$2, estado=$3, notas=$4, numero_bono=$5, estado_bono=$6, estado_boleta=$7, profesional_id=$8, fecha=$9 WHERE id=$10 RETURNING *',
      [
        monto, metodo, estado || 'pendiente', notas || null, numero_bono || null,
        metodo === 'fonasa' ? (estado_bono || 'pendiente') : null,
        (metodo === 'efectivo' || metodo === 'transferencia') ? (estado_boleta || 'pendiente') : null,
        profesional_id || null, fecha || null, req.params.id
      ]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Pago no encontrado' })
    res.json(result.rows[0])
  } catch (error) { res.status(500).json({ error: error.message }) }
})

router.delete('/:id', async (req, res) => {
  try {
    // Buscar si tiene procedimiento vinculado
    const pago = await pool.query('SELECT procedimiento_id FROM pago WHERE id = $1', [req.params.id])
    const procedimientoId = pago.rows[0]?.procedimiento_id

    await pool.query('DELETE FROM pago WHERE id = $1', [req.params.id])

    // Si tenía procedimiento vinculado, eliminarlo también
    if (procedimientoId) {
      await pool.query('DELETE FROM procedimiento WHERE id = $1', [procedimientoId])
    }

    res.json({ mensaje: 'Pago eliminado' })
  } catch (error) { res.status(500).json({ error: error.message }) }
})

module.exports = router