const express = require('express')
const router = express.Router()
const pool = require('../db')

router.get('/paciente/:paciente_id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT f.*, pr.nombre AS profesional_nombre, pr.apellido AS profesional_apellido
      FROM flujo f
      LEFT JOIN profesional pr ON f.profesional_id = pr.id
      WHERE f.paciente_id = $1 ORDER BY f.fecha_toma DESC
    `, [req.params.paciente_id])
    res.json(result.rows)
  } catch (error) { res.status(500).json({ error: error.message }) }
})

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT f.*,
        pa.nombre AS paciente_nombre, pa.apellido AS paciente_apellido,
        pr.nombre AS profesional_nombre, pr.apellido AS profesional_apellido
      FROM flujo f
      JOIN paciente pa ON f.paciente_id = pa.id
      LEFT JOIN profesional pr ON f.profesional_id = pr.id
      ORDER BY f.fecha_toma DESC
    `)
    res.json(result.rows)
  } catch (error) { res.status(500).json({ error: error.message }) }
})

router.post('/', async (req, res) => {
  const { paciente_id, profesional_id, tipo_examen, nombre, fecha_toma, entregado, codigo } = req.body
  try {
    const result = await pool.query(
      'INSERT INTO flujo (paciente_id, profesional_id, tipo_examen, nombre, fecha_toma, entregado, codigo) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [paciente_id, profesional_id || null, tipo_examen, nombre, fecha_toma, entregado || false, codigo || null]
    )
    res.status(201).json(result.rows[0])
  } catch (error) { res.status(500).json({ error: error.message }) }
})

router.put('/:id', async (req, res) => {
  const { profesional_id, tipo_examen, nombre, fecha_toma, entregado, codigo } = req.body
  try {
    const result = await pool.query(
      'UPDATE flujo SET profesional_id=$1, tipo_examen=$2, nombre=$3, fecha_toma=$4, entregado=$5, codigo=$6 WHERE id=$7 RETURNING *',
      [profesional_id || null, tipo_examen, nombre, fecha_toma, entregado, codigo || null, req.params.id]
    )
    res.json(result.rows[0])
  } catch (error) { res.status(500).json({ error: error.message }) }
})

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM flujo WHERE id=$1', [req.params.id])
    res.json({ mensaje: 'Flujo eliminado' })
  } catch (error) { res.status(500).json({ error: error.message }) }
})

module.exports = router