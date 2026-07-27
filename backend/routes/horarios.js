const express = require('express')
const router = express.Router()
const pool = require('../db')

// dia_semana: 0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT h.id, h.profesional_id, h.dia_semana,
        TO_CHAR(h.hora_inicio, 'HH24:MI') AS hora_inicio,
        TO_CHAR(h.hora_fin, 'HH24:MI') AS hora_fin,
        pr.nombre AS profesional_nombre, pr.apellido AS profesional_apellido, pr.color AS profesional_color
      FROM horario_profesional h
      LEFT JOIN profesional pr ON h.profesional_id = pr.id
      ORDER BY h.dia_semana, h.hora_inicio
    `)
    res.json(result.rows)
  } catch (error) { res.status(500).json({ error: error.message }) }
})

router.post('/', async (req, res) => {
  const { profesional_id, dia_semana, hora_inicio, hora_fin } = req.body
  try {
    const result = await pool.query(
      'INSERT INTO horario_profesional (profesional_id, dia_semana, hora_inicio, hora_fin) VALUES ($1,$2,$3,$4) RETURNING *',
      [profesional_id, dia_semana, hora_inicio, hora_fin]
    )
    res.status(201).json(result.rows[0])
  } catch (error) { res.status(500).json({ error: error.message }) }
})

router.put('/:id', async (req, res) => {
  const { profesional_id, dia_semana, hora_inicio, hora_fin } = req.body
  try {
    const result = await pool.query(
      'UPDATE horario_profesional SET profesional_id=$1, dia_semana=$2, hora_inicio=$3, hora_fin=$4 WHERE id=$5 RETURNING *',
      [profesional_id, dia_semana, hora_inicio, hora_fin, req.params.id]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Bloque de horario no encontrado' })
    res.json(result.rows[0])
  } catch (error) { res.status(500).json({ error: error.message }) }
})

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM horario_profesional WHERE id=$1 RETURNING *', [req.params.id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Bloque de horario no encontrado' })
    res.json({ mensaje: 'Bloque de horario eliminado' })
  } catch (error) { res.status(500).json({ error: error.message }) }
})

module.exports = router
