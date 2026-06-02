const express = require('express')
const router = express.Router()
const pool = require('../db')

function calcularProximoControl(resultado) {
  const hoy = new Date()
  let meses = null
  if (resultado === 'Normal') meses = 12
  else if (resultado === 'Alterado') meses = 6
  else if (resultado === 'Inadecuado') meses = 3
  else return null
  hoy.setMonth(hoy.getMonth() + meses)
  return hoy.toISOString().split('T')[0]
}

router.get('/paciente/:paciente_id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, pr.nombre AS profesional_nombre, pr.apellido AS profesional_apellido
      FROM pap p
      LEFT JOIN profesional pr ON p.profesional_id = pr.id
      WHERE p.paciente_id = $1 ORDER BY p.fecha_toma DESC
    `, [req.params.paciente_id])
    res.json(result.rows)
  } catch (error) { res.status(500).json({ error: error.message }) }
})

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, 
        pa.nombre AS paciente_nombre, pa.apellido AS paciente_apellido,
        pr.nombre AS profesional_nombre, pr.apellido AS profesional_apellido
      FROM pap p
      JOIN paciente pa ON p.paciente_id = pa.id
      LEFT JOIN profesional pr ON p.profesional_id = pr.id
      ORDER BY p.fecha_toma DESC
    `)
    res.json(result.rows)
  } catch (error) { res.status(500).json({ error: error.message }) }
})

// POST - reemplaza el router.post
router.post('/', async (req, res) => {
  const { paciente_id, profesional_id, nombre, fecha_toma, resultado, estado_envio, notas } = req.body
  try {
    const proximo_control = calcularProximoControl(resultado, fecha_toma)
    const result = await pool.query(
      'INSERT INTO pap (paciente_id, profesional_id, nombre, fecha_toma, resultado, estado_envio, notas, proximo_control) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [paciente_id, profesional_id || null, nombre, fecha_toma, resultado, estado_envio || 'pendiente', notas || null, proximo_control]
    )
    res.status(201).json(result.rows[0])
  } catch (error) { res.status(500).json({ error: error.message }) }
})

// PUT - reemplaza el router.put
router.put('/:id', async (req, res) => {
  const { profesional_id, nombre, fecha_toma, resultado, estado_envio, notas } = req.body
  try {
    const proximo_control = calcularProximoControl(resultado, fecha_toma)
    const result = await pool.query(
      'UPDATE pap SET profesional_id=$1, nombre=$2, fecha_toma=$3, resultado=$4, estado_envio=$5, notas=$6, proximo_control=$7 WHERE id=$8 RETURNING *',
      [profesional_id || null, nombre, fecha_toma, resultado, estado_envio, notas || null, proximo_control, req.params.id]
    )
    res.json(result.rows[0])
  } catch (error) { res.status(500).json({ error: error.message }) }
})

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM pap WHERE id=$1', [req.params.id])
    res.json({ mensaje: 'PAP eliminado' })
  } catch (error) { res.status(500).json({ error: error.message }) }
})

module.exports = router