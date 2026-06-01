const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/paciente/:paciente_id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT f.*, pr.nombre AS profesional_nombre, pr.apellido AS profesional_apellido
      FROM ficha_clinica f
      JOIN profesional pr ON f.profesional_id = pr.id
      WHERE f.paciente_id = $1
      ORDER BY f.fecha DESC
    `, [req.params.paciente_id]);
    res.json(result.rows);
  } catch (error) { res.status(500).json({ error: error.message }) }
});

router.post('/', async (req, res) => {
  const { paciente_id, profesional_id, fecha, motivo_consulta, diagnostico, tratamiento, observaciones, proximo_control } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO ficha_clinica (paciente_id, profesional_id, fecha, motivo_consulta, diagnostico, tratamiento, observaciones, proximo_control) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [paciente_id, profesional_id, fecha || new Date(), motivo_consulta, diagnostico, tratamiento, observaciones, proximo_control || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: error.message }) }
});

router.put('/:id', async (req, res) => {
  const { fecha, motivo_consulta, diagnostico, tratamiento, observaciones, profesional_id, proximo_control } = req.body;
  try {
    const result = await pool.query(
      'UPDATE ficha_clinica SET fecha=$1, profesional_id=$2, motivo_consulta=$3, diagnostico=$4, tratamiento=$5, observaciones=$6, proximo_control=$7 WHERE id=$8 RETURNING *',
      [fecha || new Date(), profesional_id, motivo_consulta, diagnostico, tratamiento, observaciones, proximo_control || null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Ficha no encontrada' });
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: error.message }) }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM ficha_clinica WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Ficha no encontrada' });
    res.json({ mensaje: 'Ficha eliminada' });
  } catch (error) { res.status(500).json({ error: error.message }) }
});

module.exports = router;