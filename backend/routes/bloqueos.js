const express = require('express')
const router = express.Router()
const pool = require('../db')

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, u.nombre AS creado_por_nombre,
        pr.nombre AS profesional_nombre, pr.apellido AS profesional_apellido
      FROM bloqueo_horario b
      LEFT JOIN usuario u ON b.creado_por = u.id
      LEFT JOIN profesional pr ON b.profesional_id = pr.id
      ORDER BY b.fecha_inicio
    `)
    res.json(result.rows)
  } catch (error) { res.status(500).json({ error: error.message }) }
})

router.post('/', async (req, res) => {
  const { fecha_inicio, fecha_fin, motivo, creado_por, profesional_id } = req.body
  try {
    const result = await pool.query(
      'INSERT INTO bloqueo_horario (fecha_inicio, fecha_fin, motivo, creado_por, profesional_id) VALUES ($1::timestamp,$2::timestamp,$3,$4,$5) RETURNING *',
      [fecha_inicio, fecha_fin, motivo || null, creado_por || null, profesional_id || null]
    )
    res.status(201).json(result.rows[0])
  } catch (error) { res.status(500).json({ error: error.message }) }
})

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM bloqueo_horario WHERE id=$1', [req.params.id])
    res.json({ mensaje: 'Bloqueo eliminado' })
  } catch (error) { res.status(500).json({ error: error.message }) }
})

module.exports = router