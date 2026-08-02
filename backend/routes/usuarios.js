const express = require('express')
const router = express.Router()
const pool = require('../db')
const bcrypt = require('bcryptjs')

// Crear usuario (solo admin)
router.post('/', async (req, res) => {
  const { nombre, email, password, rol } = req.body
  try {
    const hash = await bcrypt.hash(password, 10)
    const result = await pool.query(
      'INSERT INTO usuario (nombre, email, password_hash, rol) VALUES ($1,$2,$3,$4) RETURNING id, nombre, email, rol',
      [nombre, email, hash, rol || 'personal']
    )
    res.status(201).json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Obtener todos los usuarios (solo admin)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nombre, email, rol, activo, creado_en FROM usuario ORDER BY creado_en DESC')
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Actualizar usuario (activar/desactivar)
router.put('/:id', async (req, res) => {
  const { activo } = req.body
  try {
    const result = await pool.query('UPDATE usuario SET activo=$1 WHERE id=$2 RETURNING id, nombre, email, rol, activo', [activo, req.params.id])
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router