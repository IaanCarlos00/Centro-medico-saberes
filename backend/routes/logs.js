const express = require('express')
const router = express.Router()
const pool = require('../db')

// Registrar actividad
router.post('/', async (req, res) => {
  const { usuario_id, usuario_nombre, accion, entidad, entidad_id, detalle } = req.body
  try {
    await pool.query(
      'INSERT INTO log_actividad (usuario_id, usuario_nombre, accion, entidad, entidad_id, detalle) VALUES ($1,$2,$3,$4,$5,$6)',
      [usuario_id || null, usuario_nombre || null, accion, entidad || null, entidad_id || null, detalle || null]
    )
    res.status(201).json({ ok: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Obtener logs (solo admin)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM log_actividad 
      ORDER BY created_at DESC 
      LIMIT 200
    `)
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router