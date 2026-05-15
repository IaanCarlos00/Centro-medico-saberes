const express = require('express');
const router = express.Router();
const pool = require('../db');

// Obtener todos los pacientes
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM paciente ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener un paciente por id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM paciente WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Paciente no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear paciente
router.post('/', async (req, res) => {
  const { rut, nombre, apellido, fecha_nacimiento, telefono, email } = req.body
  try {
    const result = await pool.query(
      'INSERT INTO paciente (rut, nombre, apellido, fecha_nacimiento, telefono, email) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [
        rut || null,
        nombre,
        apellido,
        fecha_nacimiento || null,
        telefono || null,
        email || null
      ]
    )
    res.status(201).json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Actualizar paciente
router.put('/:id', async (req, res) => {
  const { rut, nombre, apellido, fecha_nacimiento, telefono, email } = req.body
  try {
    const result = await pool.query(
      'UPDATE paciente SET rut=$1, nombre=$2, apellido=$3, fecha_nacimiento=$4, telefono=$5, email=$6 WHERE id=$7 RETURNING *',
      [
        rut || null,
        nombre,
        apellido,
        fecha_nacimiento || null,
        telefono || null,
        email || null,
        req.params.id
      ]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Paciente no encontrado' })
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
});

// Eliminar paciente
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM paciente WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Paciente no encontrado' });
    res.json({ mensaje: 'Paciente eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;