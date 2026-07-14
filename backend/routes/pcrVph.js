const express = require('express')
const router = express.Router()
const pool = require('../db')

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.*,
        pa.nombre AS paciente_nombre, pa.apellido AS paciente_apellido,
        pr.nombre AS profesional_nombre, pr.apellido AS profesional_apellido
      FROM pcr_vph v
      JOIN paciente pa ON v.paciente_id = pa.id
      LEFT JOIN profesional pr ON v.profesional_id = pr.id
      ORDER BY v.fecha_toma DESC
    `)
    res.json(result.rows)
  } catch (error) { res.status(500).json({ error: error.message }) }
})

router.get('/paciente/:paciente_id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.*, pr.nombre AS profesional_nombre, pr.apellido AS profesional_apellido
      FROM pcr_vph v
      LEFT JOIN profesional pr ON v.profesional_id = pr.id
      WHERE v.paciente_id = $1 ORDER BY v.fecha_toma DESC
    `, [req.params.paciente_id])
    res.json(result.rows)
  } catch (error) { res.status(500).json({ error: error.message }) }
})

router.post('/', async (req, res) => {
  const { paciente_id, profesional_id, fecha_toma, resultado, genotipo, estado_envio, notas } = req.body
  try {
    const result = await pool.query(
      'INSERT INTO pcr_vph (paciente_id, profesional_id, fecha_toma, resultado, genotipo, estado_envio, notas) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [paciente_id, profesional_id || null, fecha_toma, resultado || null, genotipo || null, estado_envio || 'pendiente', notas || null]
    )
    res.status(201).json(result.rows[0])
  } catch (error) { res.status(500).json({ error: error.message }) }
})

router.put('/:id', async (req, res) => {
  const { paciente_id, profesional_id, fecha_toma, resultado, genotipo, estado_envio, notas } = req.body
  try {
    const result = await pool.query(
      'UPDATE pcr_vph SET paciente_id=$1, profesional_id=$2, fecha_toma=$3, resultado=$4, genotipo=$5, estado_envio=$6, notas=$7 WHERE id=$8 RETURNING *',
      [paciente_id, profesional_id || null, fecha_toma, resultado || null, genotipo || null, estado_envio, notas || null, req.params.id]
    )
    res.json(result.rows[0])
  } catch (error) { res.status(500).json({ error: error.message }) }
})

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM pcr_vph WHERE id=$1', [req.params.id])
    res.json({ mensaje: 'PCR VPH eliminado' })
  } catch (error) { res.status(500).json({ error: error.message }) }
})

module.exports = router