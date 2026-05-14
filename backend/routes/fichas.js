const express = require('express');
const router = express.Router();
const pool = require('../db');

// Obtener todas las fichas de un paciente
router.get('/paciente/:paciente_id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT f.*, 
             pr.nombre AS profesional_nombre, pr.apellido AS profesional_apellido
      FROM ficha_clinica f
      JOIN profesional pr ON f.profesional_id = pr.id
      WHERE f.paciente_id = $1
      ORDER BY f.fecha DESC
    `, [req.params.paciente_id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear ficha
router.post('/', async (req, res) => {
  const { paciente_id, profesional_id, motivo_consulta, diagnostico, tratamiento, observaciones } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO ficha_clinica (paciente_id, profesional_id, motivo_consulta, diagnostico, tratamiento, observaciones) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [paciente_id, profesional_id, motivo_consulta, diagnostico, tratamiento, observaciones]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar ficha
router.put('/:id', async (req, res) => {
  const { motivo_consulta, diagnostico, tratamiento, observaciones } = req.body;
  try {
    const result = await pool.query(
      'UPDATE ficha_clinica SET motivo_consulta=$1, diagnostico=$2, tratamiento=$3, observaciones=$4 WHERE id=$5 RETURNING *',
      [motivo_consulta, diagnostico, tratamiento, observaciones, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Ficha no encontrada' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar ficha
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM ficha_clinica WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Ficha no encontrada' });
    res.json({ mensaje: 'Ficha eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;