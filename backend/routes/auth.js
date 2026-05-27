const express = require('express')
const router = express.Router()
const pool = require('../db')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const SECRET = process.env.JWT_SECRET || 'saberes_secret_key'

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  try {
    const result = await pool.query('SELECT * FROM usuario WHERE email = $1 AND activo = true', [email])
    if (result.rows.length === 0) return res.status(401).json({ error: 'Credenciales incorrectas' })

    const usuario = result.rows[0]
    const valido = await bcrypt.compare(password, usuario.password_hash)
    if (!valido) return res.status(401).json({ error: 'Credenciales incorrectas' })

    const token = jwt.sign(
      { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
      SECRET,
      { expiresIn: '8h' }
    )

    res.json({ token, id: usuario.id, nombre: usuario.nombre, rol: usuario.rol, email: usuario.email, profesional_id: usuario.profesional_id || null })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Crear usuario (solo admin)
router.post('/registro', async (req, res) => {
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
router.get('/usuarios', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nombre, email, rol, activo, creado_en FROM usuario ORDER BY creado_en DESC')
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Actualizar usuario (activar/desactivar)
router.put('/usuarios/:id', async (req, res) => {
  const { activo } = req.body
  try {
    const result = await pool.query('UPDATE usuario SET activo=$1 WHERE id=$2 RETURNING id, nombre, email, rol, activo', [activo, req.params.id])
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Cambiar contraseña
router.put('/cambiar-password', async (req, res) => {
  const { email, password_actual, password_nuevo } = req.body
  try {
    const usuario = await pool.query('SELECT * FROM usuario WHERE email = $1', [email])
    if (usuario.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' })

    const valido = await bcrypt.compare(password_actual, usuario.rows[0].password)
    if (!valido) return res.status(401).json({ error: 'Contraseña actual incorrecta' })

    const hash = await bcrypt.hash(password_nuevo, 10)
    await pool.query('UPDATE usuario SET password = $1 WHERE email = $2', [hash, email])
    res.json({ mensaje: 'Contraseña actualizada correctamente' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router