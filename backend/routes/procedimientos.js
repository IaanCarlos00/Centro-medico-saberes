const express = require('express')
const router = express.Router()
const pool = require('../db')

// ===== CATÁLOGO =====
router.get('/catalogo', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM catalogo_procedimiento WHERE activo = TRUE ORDER BY nombre')
    res.json(result.rows)
  } catch (error) {
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

// ===== PROCEDIMIENTOS =====
router.get('/paciente/:paciente_id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM procedimiento WHERE paciente_id = $1 ORDER BY fecha DESC', [req.params.paciente_id])
    res.json(result.rows)
  } catch (error) { res.status(500).json({ error: error.message }) }
})

router.post('/', async (req, res) => {
  const { paciente_id, catalogo_procedimiento_id, nombre, monto, metodo, estado, notas, profesional_id, numero_bono, cita_id, fecha_atencion } = req.body
  try {
    let fechaFinal = null
    if (cita_id) {
      const cita = await pool.query('SELECT fecha_hora FROM cita WHERE id = $1', [cita_id])
      if (cita.rows.length > 0) fechaFinal = cita.rows[0].fecha_hora
    }
    if (!fechaFinal) fechaFinal = fecha_atencion || new Date().toISOString()

    // Crear procedimiento
    const proc = await pool.query(
      'INSERT INTO procedimiento (paciente_id, catalogo_procedimiento_id, nombre, monto, metodo, estado, notas, fecha) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [paciente_id, catalogo_procedimiento_id || null, nombre, monto, metodo, estado || 'pendiente', notas || null, fechaFinal]
    )
    const procedimientoId = proc.rows[0].id

    // Crear pago vinculado al procedimiento (anti-duplicado 5 min)
    const pagoExistente = await pool.query(
      `SELECT id FROM pago WHERE paciente_id = $1 AND monto = $2 AND fecha > NOW() - INTERVAL '5 minutes'`,
      [paciente_id, monto]
    )
    if (pagoExistente.rows.length === 0) {
      await pool.query(
        'INSERT INTO pago (paciente_id, monto, metodo, estado, notas, numero_bono, estado_bono, fecha, procedimiento_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
        [paciente_id, monto, metodo, estado || 'pendiente', `Procedimiento: ${nombre}`, numero_bono || null, metodo === 'fonasa' ? 'pendiente' : null, fechaFinal, procedimientoId]
      )
    }

    if (nombre && nombre.toUpperCase().includes('PAP')) {
      await pool.query(
        'INSERT INTO pap (paciente_id, nombre, fecha_toma, estado_envio, profesional_id) VALUES ($1,$2,$3,$4,$5)',
        [paciente_id, nombre, fechaFinal, 'pendiente', profesional_id || null]
      )
    }

    const nombreUpper = nombre ? nombre.toUpperCase() : ''
    if (nombreUpper.includes('FLUJO') || nombreUpper.includes('PANEL')) {
      await pool.query(
        'INSERT INTO flujo (paciente_id, nombre, tipo_examen, fecha_toma, entregado, profesional_id) VALUES ($1,$2,$3,$4,$5,$6)',
        [paciente_id, nombre, nombreUpper.includes('FLUJO') ? 'Flujo particular' : 'Panel particular', fechaFinal, false, profesional_id || null]
      )
    }

    res.status(201).json(proc.rows[0])
  } catch (error) { res.status(500).json({ error: error.message }) }
})

router.put('/:id', async (req, res) => {
  const { nombre, monto, metodo, estado, notas, paciente_id } = req.body
  try {
    const result = await pool.query(
      'UPDATE procedimiento SET nombre=$1, monto=$2, metodo=$3, estado=$4, notas=$5 WHERE id=$6 RETURNING *',
      [nombre, monto, metodo, estado, notas, req.params.id]
    )
    // Sincronizar pago vinculado
    await pool.query(
      'UPDATE pago SET monto=$1, metodo=$2, estado=$3 WHERE procedimiento_id=$4',
      [monto, metodo, estado, req.params.id]
    )
    res.json(result.rows[0])
  } catch (error) { res.status(500).json({ error: error.message }) }
})

// Eliminar procedimiento + su pago vinculado
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM pago WHERE procedimiento_id = $1', [req.params.id])
    await pool.query('DELETE FROM procedimiento WHERE id = $1', [req.params.id])
    res.json({ mensaje: 'Procedimiento y pago eliminados' })
  } catch (error) { res.status(500).json({ error: error.message }) }
})

module.exports = router