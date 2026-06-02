const express = require('express')
const router = express.Router()
const pool = require('../db')

// ===== CATÁLOGO =====
router.get('/catalogo', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM catalogo_procedimiento WHERE activo = TRUE ORDER BY nombre')
    res.json(result.rows)
  } catch (error) { 
    console.error('Error en procedimiento:', error.message)
    res.status(500).json({ error: error.message }) 
  }
})

router.post('/catalogo', async (req, res) => {
  const { nombre, monto } = req.body
  try {
    const result = await pool.query('INSERT INTO catalogo_procedimiento (nombre, monto) VALUES ($1,$2) RETURNING *', [nombre, monto])
    res.status(201).json(result.rows[0])
  } catch (error) { res.status(500).json({ error: error.message }) }
})

router.put('/catalogo/:id', async (req, res) => {
  const { nombre, monto, activo } = req.body
  try {
    const result = await pool.query('UPDATE catalogo_procedimiento SET nombre=$1, monto=$2, activo=$3 WHERE id=$4 RETURNING *', [nombre, monto, activo, req.params.id])
    res.json(result.rows[0])
  } catch (error) { res.status(500).json({ error: error.message }) }
})

router.delete('/catalogo/:id', async (req, res) => {
  try {
    await pool.query('UPDATE catalogo_procedimiento SET activo=FALSE WHERE id=$1', [req.params.id])
    res.json({ mensaje: 'Procedimiento desactivado' })
  } catch (error) { res.status(500).json({ error: error.message }) }
})

// ===== PROCEDIMIENTOS REALIZADOS =====
router.get('/paciente/:paciente_id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM procedimiento WHERE paciente_id = $1 ORDER BY fecha DESC
    `, [req.params.paciente_id])
    res.json(result.rows)
  } catch (error) { res.status(500).json({ error: error.message }) }
})

router.post('/', async (req, res) => {
  const { paciente_id, catalogo_procedimiento_id, nombre, monto, metodo, estado, notas, profesional_id, numero_bono } = req.body
  try {
    const proc = await pool.query(
      'INSERT INTO procedimiento (paciente_id, catalogo_procedimiento_id, nombre, monto, metodo, estado, notas) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [paciente_id, catalogo_procedimiento_id || null, nombre, monto, metodo, estado || 'pendiente', notas || null]
    )
    await pool.query(
      'INSERT INTO pago (paciente_id, monto, metodo, estado, notas, numero_bono, estado_bono) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [paciente_id, monto, metodo, estado || 'pendiente', `Procedimiento: ${nombre}`, numero_bono || null, metodo === 'fonasa' ? 'pendiente' : null]
    )

    // Si el procedimiento es PAP, crear registro automático en tabla pap
    if (nombre && nombre.toUpperCase().includes('PAP')) {
      await pool.query(
      'INSERT INTO pap (paciente_id, nombre, fecha_toma, estado_envio, profesional_id) VALUES ($1,$2,CURRENT_DATE,$3,$4)',
      [paciente_id, nombre, 'pendiente', profesional_id || null]
    )
    }

    // Si el procedimiento es Flujo o Panel, crear registro automático en tabla flujo
    const nombreUpper = nombre ? nombre.toUpperCase() : ''
    if (nombreUpper.includes('FLUJO') || nombreUpper.includes('PANEL')) {
      await pool.query(
        'INSERT INTO flujo (paciente_id, nombre, tipo_examen, fecha_toma, entregado, profesional_id) VALUES ($1,$2,$3,CURRENT_DATE,$4,$5)',
        [paciente_id, nombre, nombreUpper.includes('FLUJO') ? 'Flujo particular' : 'Panel particular', false, profesional_id || null]
      )
    }

    res.status(201).json(proc.rows[0])
  } catch (error) { res.status(500).json({ error: error.message }) }
})

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM procedimiento WHERE id=$1', [req.params.id])
    res.json({ mensaje: 'Procedimiento eliminado' })
  } catch (error) { res.status(500).json({ error: error.message }) }
})

module.exports = router