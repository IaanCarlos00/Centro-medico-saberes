const express = require('express')
const router = express.Router()
const pool = require('../db')

// Obtener todos los bloqueos
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, u.nombre AS creado_por_nombre
      FROM bloqueo_horario b
      LEFT JOIN usuario u ON b.creado_por = u.id
      ORDER BY b.fecha_inicio
    `)
    res.json(result.rows)
  } catch (error) { res.status(500).json({ error: error.message }) }
})

// Crear bloqueo
router.post('/', async (req, res) => {
  const { fecha_inicio, fecha_fin, motivo, creado_por } = req.body
  try {
    const result = await pool.query(
      'INSERT INTO bloqueo_horario (fecha_inicio, fecha_fin, motivo, creado_por) VALUES ($1,$2,$3,$4) RETURNING *',
      [fecha_inicio, fecha_fin, motivo || null, creado_por || null]
    )
    res.status(201).json(result.rows[0])
  } catch (error) { res.status(500).json({ error: error.message }) }
})

// Eliminar bloqueo
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM bloqueo_horario WHERE id=$1', [req.params.id])
    res.json({ mensaje: 'Bloqueo eliminado' })
  } catch (error) { res.status(500).json({ error: error.message }) }
})

module.exports = router