const express = require('express')
const router = express.Router()
const pool = require('../db')
const bcrypt = require('bcryptjs')

// Crear usuario (solo admin)
router.post('/', async (req, res) => {
  const { nombre, email, password, rol, profesional_id } = req.body
  try {
    const hash = await bcrypt.hash(password, 10)
    const result = await pool.query(
      'INSERT INTO usuario (nombre, email, password_hash, rol, profesional_id) VALUES ($1,$2,$3,$4,$5) RETURNING id, nombre, email, rol, profesional_id',
      [nombre, email, hash, rol || 'personal', profesional_id || null]
    )
    res.status(201).json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Obtener todos los usuarios (solo admin)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nombre, email, rol, activo, creado_en, profesional_id FROM usuario ORDER BY creado_en DESC')
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Actualizar usuario (activar/desactivar, o cambiar/vincular profesional)
router.put('/:id', async (req, res) => {
  const { activo, profesional_id } = req.body
  try {
    const result = await pool.query(
      'UPDATE usuario SET activo=COALESCE($1, activo), profesional_id=CASE WHEN $2::text IS NOT NULL THEN $3::integer ELSE profesional_id END WHERE id=$4 RETURNING id, nombre, email, rol, activo, profesional_id',
      [activo, profesional_id !== undefined ? 'set' : null, profesional_id ?? null, req.params.id]
    )
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router