const express = require('express');
const router = express.Router();
const pool = require('../db');

// Obtener todas las citas
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.id, c.fecha_hora, c.estado, c.observaciones,
             p.nombre AS paciente_nombre, p.apellido AS paciente_apellido,
             pr.nombre AS profesional_nombre, pr.apellido AS profesional_apellido
      FROM cita c
      JOIN paciente p ON c.paciente_id = p.id
      JOIN profesional pr ON c.profesional_id = pr.id
      ORDER BY c.fecha_hora
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener una cita por id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cita WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Cita no encontrada' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear cita
router.post('/', async (req, res) => {
  const { paciente_id, profesional_id, fecha_hora, estado, observaciones } = req.body
  try {
    const result = await pool.query(
      'INSERT INTO cita (paciente_id, profesional_id, fecha_hora, estado, observaciones) VALUES ($1,$2,$3::timestamp AT TIME ZONE \'America/Santiago\',$4,$5) RETURNING *',
      [paciente_id, profesional_id, fecha_hora, estado || 'pendiente', observaciones]
    )
    res.status(201).json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Actualizar cita
router.put('/:id', async (req, res) => {
  const { paciente_id, profesional_id, fecha_hora, estado, observaciones } = req.body
  try {
    const result = await pool.query(
      'UPDATE cita SET paciente_id=$1, profesional_id=$2, fecha_hora=$3::timestamp AT TIME ZONE \'America/Santiago\', estado=$4, observaciones=$5 WHERE id=$6 RETURNING *',
      [paciente_id, profesional_id, fecha_hora, estado, observaciones, req.params.id]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Cita no encontrada' })
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Eliminar cita
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM cita WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Cita no encontrada' });
    res.json({ mensaje: 'Cita eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;