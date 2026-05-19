const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.id, c.paciente_id, c.profesional_id, c.procedimiento_nombre,
             TO_CHAR(c.fecha_hora, 'YYYY-MM-DD HH24:MI:SS') AS fecha_hora,
             c.estado, c.observaciones,
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

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT *, TO_CHAR(fecha_hora, 'YYYY-MM-DD HH24:MI:SS') AS fecha_hora FROM cita WHERE id = $1",
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Cita no encontrada' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  const { paciente_id, profesional_id, fecha_hora, estado, observaciones, procedimiento_nombre } = req.body
  try {
    const result = await pool.query(
      "INSERT INTO cita (paciente_id, profesional_id, fecha_hora, estado, observaciones, procedimiento_nombre) VALUES ($1,$2,$3::timestamp,$4,$5,$6) RETURNING *, TO_CHAR(fecha_hora, 'YYYY-MM-DD HH24:MI:SS') AS fecha_hora",
      [paciente_id, profesional_id, fecha_hora, estado || 'pendiente', observaciones, procedimiento_nombre || null]
    )
    res.status(201).json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', async (req, res) => {
  const { paciente_id, profesional_id, fecha_hora, estado, observaciones, procedimiento_nombre } = req.body
  try {
    const result = await pool.query(
      "UPDATE cita SET paciente_id=$1, profesional_id=$2, fecha_hora=$3::timestamp, estado=$4, observaciones=$5, procedimiento_nombre=$6 WHERE id=$7 RETURNING *, TO_CHAR(fecha_hora, 'YYYY-MM-DD HH24:MI:SS') AS fecha_hora",
      [paciente_id, profesional_id, fecha_hora, estado, observaciones, procedimiento_nombre || null, req.params.id]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Cita no encontrada' })
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

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