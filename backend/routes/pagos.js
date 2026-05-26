const express = require('express')
const router = express.Router()
const pool = require('../db')

// Obtener todos los pagos
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, 
             pa.nombre AS paciente_nombre, pa.apellido AS paciente_apellido,
             pa.rut AS paciente_rut
      FROM pago p
      JOIN paciente pa ON p.paciente_id = pa.id
      ORDER BY p.fecha DESC
    `)
    res.json(result.rows)
  } catch (error) { res.status(500).json({ error: error.message }) }
})

// Obtener pagos de un paciente
router.get('/paciente/:paciente_id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, pa.nombre AS paciente_nombre, pa.apellido AS paciente_apellido
      FROM pago p
      JOIN paciente pa ON p.paciente_id = pa.id
      WHERE p.paciente_id = $1
      ORDER BY p.fecha DESC
    `, [req.params.paciente_id])
    res.json(result.rows)
  } catch (error) { res.status(500).json({ error: error.message }) }
})

// Resumen mensual
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

// Crear pago
router.post('/', async (req, res) => {
  const { paciente_id, cita_id, monto, metodo, estado, notas, numero_bono, estado_bono } = req.body
  try {
    const result = await pool.query(
      'INSERT INTO pago (paciente_id, cita_id, monto, metodo, estado, notas, numero_bono, estado_bono) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [paciente_id, cita_id || null, monto, metodo, estado || 'pagado', notas || null, numero_bono || null, metodo === 'fonasa' ? (estado_bono || 'pendiente') : null]
    )
    res.status(201).json(result.rows[0])
  } catch (error) { res.status(500).json({ error: error.message }) }
})

// Actualizar pago
router.put('/:id', async (req, res) => {
  const { monto, metodo, estado, notas, numero_bono, estado_bono } = req.body
  try {
    const result = await pool.query(
      'UPDATE pago SET monto=$1, metodo=$2, estado=$3, notas=$4, numero_bono=$5, estado_bono=$6 WHERE id=$7 RETURNING *',
      [monto, metodo, estado, notas || null, numero_bono || null, metodo === 'fonasa' ? (estado_bono || 'pendiente') : null, req.params.id]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Pago no encontrado' })
    res.json(result.rows[0])
  } catch (error) { res.status(500).json({ error: error.message }) }
})

// Eliminar pago
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM pago WHERE id=$1', [req.params.id])
    res.json({ mensaje: 'Pago eliminado' })
  } catch (error) { res.status(500).json({ error: error.message }) }
})

module.exports = router