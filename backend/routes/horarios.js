const express = require('express')
const router = express.Router()
const pool = require('../db')

// dia_semana: 0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado
// sobrecupo: hora que solo se ofrece si un paciente cancela/hay espacio (ej. horario de colación)

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT h.id, h.profesional_id, h.dia_semana,
        TO_CHAR(h.hora, 'HH24:MI') AS hora,
        h.sobrecupo,
        pr.nombre AS profesional_nombre, pr.apellido AS profesional_apellido, pr.color AS profesional_color
      FROM horario_profesional h
      LEFT JOIN profesional pr ON h.profesional_id = pr.id
      ORDER BY h.dia_semana, h.hora
    `)
    res.json(result.rows)
  } catch (error) { res.status(500).json({ error: error.message }) }
})

router.post('/', async (req, res) => {
  const { profesional_id, dia_semana, hora, sobrecupo } = req.body
  try {
    const result = await pool.query(
      'INSERT INTO horario_profesional (profesional_id, dia_semana, hora, sobrecupo) VALUES ($1,$2,$3,$4) RETURNING *',
      [profesional_id, dia_semana, hora, !!sobrecupo]
    )
    res.status(201).json(result.rows[0])
  } catch (error) { res.status(500).json({ error: error.message }) }
})

router.put('/:id', async (req, res) => {
  const { profesional_id, dia_semana, hora, sobrecupo } = req.body
  try {
    const result = await pool.query(
      'UPDATE horario_profesional SET profesional_id=$1, dia_semana=$2, hora=$3, sobrecupo=$4 WHERE id=$5 RETURNING *',
      [profesional_id, dia_semana, hora, !!sobrecupo, req.params.id]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Horario no encontrado' })
    res.json(result.rows[0])
  } catch (error) { res.status(500).json({ error: error.message }) }
})

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM horario_profesional WHERE id=$1 RETURNING *', [req.params.id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Horario no encontrado' })
    res.json({ mensaje: 'Horario eliminado' })
  } catch (error) { res.status(500).json({ error: error.message }) }
})

module.exports = router
