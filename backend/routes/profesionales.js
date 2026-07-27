const express = require('express');
const router = express.Router();
const pool = require('../db');

// Obtener todos los profesionales
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM profesional ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener un profesional por id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM profesional WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Profesional no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear profesional
router.post('/', async (req, res) => {
  const { rut, nombre, apellido, especialidad, color } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO profesional (rut, nombre, apellido, especialidad, color) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [rut, nombre, apellido, especialidad, color || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar profesional
router.put('/:id', async (req, res) => {
  const { rut, nombre, apellido, especialidad, color } = req.body;
  try {
    const result = await pool.query(
      'UPDATE profesional SET rut=$1, nombre=$2, apellido=$3, especialidad=$4, color=COALESCE($5, color) WHERE id=$6 RETURNING *',
      [rut, nombre, apellido, especialidad, color || null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Profesional no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar profesional
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM profesional WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Profesional no encontrado' });
    res.json({ mensaje: 'Profesional eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;