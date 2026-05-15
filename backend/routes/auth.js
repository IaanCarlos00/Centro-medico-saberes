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

    res.json({ token, nombre: usuario.nombre, rol: usuario.rol })
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

module.exports = router