const express = require('express')
const router = express.Router()
const pool = require('../db')
const bcrypt = require('bcryptjs')

// Crear usuario (solo admin)
router.post('/', async (req, res) => {
  const { nombre, email, password, rol, profesional_id, ver_finanzas } = req.body
  try {
    const hash = await bcrypt.hash(password, 10)
    const result = await pool.query(
      'INSERT INTO usuario (nombre, email, password_hash, rol, profesional_id, ver_finanzas) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, nombre, email, rol, profesional_id, ver_finanzas',
      [nombre, email, hash, rol || 'personal', profesional_id || null, !!ver_finanzas]
    )
    res.status(201).json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Obtener todos los usuarios (solo admin)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nombre, email, rol, activo, creado_en, profesional_id, ver_finanzas FROM usuario ORDER BY creado_en DESC')
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Actualizar usuario (activar/desactivar, cambiar/vincular profesional, o dar/quitar acceso a dinero)
router.put('/:id', async (req, res) => {
  const { activo, profesional_id, ver_finanzas } = req.body
  try {
    const result = await pool.query(
      `UPDATE usuario SET
        activo = COALESCE($1, activo),
        profesional_id = CASE WHEN $2::text IS NOT NULL THEN $3::integer ELSE profesional_id END,
        ver_finanzas = COALESCE($4, ver_finanzas)
      WHERE id=$5 RETURNING id, nombre, email, rol, activo, profesional_id, ver_finanzas`,
      [activo, profesional_id !== undefined ? 'set' : null, profesional_id ?? null, ver_finanzas, req.params.id]
    )
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Eliminar usuario
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM usuario WHERE id=$1 RETURNING id', [req.params.id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' })
    res.json({ mensaje: 'Usuario eliminado' })
  } catch (error) {
    if (error.code === '23503') {
      return res.status(409).json({ error: 'No se puede eliminar: este usuario tiene registros asociados (bloqueos de horario u otros). Puedes desactivarlo en su lugar.' })
    }
    res.status(500).json({ error: error.message })
  }
})

module.exports = router