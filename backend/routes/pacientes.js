const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*,
        pc.proximo_control,
        pc.tipo_control
      FROM paciente p
      LEFT JOIN LATERAL (
        SELECT proximo_control, 'Control' AS tipo_control FROM ficha_clinica
        WHERE paciente_id = p.id AND proximo_control IS NOT NULL
        UNION ALL
        SELECT proximo_control, 'Ingreso V' FROM ficha_ingreso_1
        WHERE paciente_id = p.id AND proximo_control IS NOT NULL
        UNION ALL
        SELECT proximo_control, 'Ingreso J' FROM ficha_ingreso_2
        WHERE paciente_id = p.id AND proximo_control IS NOT NULL
        ORDER BY proximo_control ASC
        LIMIT 1
      ) pc ON true
      ORDER BY p.nombre
    `)
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM paciente WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Paciente no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/resumen', async (req, res) => {
  try {
    const id = req.params.id
    const [citas, fichas, pagos, procedimientos, pap, flujos] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM cita WHERE paciente_id = $1', [id]),
      pool.query('SELECT COUNT(*) FROM ficha_clinica WHERE paciente_id = $1', [id]),
      pool.query('SELECT COUNT(*) FROM pago WHERE paciente_id = $1', [id]),
      pool.query('SELECT COUNT(*) FROM procedimiento WHERE paciente_id = $1', [id]),
      pool.query('SELECT COUNT(*) FROM pap WHERE paciente_id = $1', [id]),
      pool.query('SELECT COUNT(*) FROM flujo WHERE paciente_id = $1', [id]),
    ])
    res.json({
      citas: parseInt(citas.rows[0].count),
      fichas: parseInt(fichas.rows[0].count),
      pagos: parseInt(pagos.rows[0].count),
      procedimientos: parseInt(procedimientos.rows[0].count),
      pap: parseInt(pap.rows[0].count),
      flujos: parseInt(flujos.rows[0].count),
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', async (req, res) => {
  const { rut, nombre, apellido, fecha_nacimiento, telefono, email } = req.body
  try {
    if (rut) {
      const dupRut = await pool.query('SELECT id, nombre, apellido FROM paciente WHERE rut = $1', [rut])
      if (dupRut.rows.length > 0) {
        return res.status(409).json({ error: 'rut_duplicado', paciente: dupRut.rows[0] })
      }
    }
    if (!req.query.forzar) {
      const dupNombre = await pool.query(
        'SELECT id, nombre, apellido, rut FROM paciente WHERE LOWER(nombre) = LOWER($1) AND LOWER(apellido) = LOWER($2)',
        [nombre, apellido]
      )
      if (dupNombre.rows.length > 0) {
        return res.status(409).json({ error: 'nombre_duplicado', pacientes: dupNombre.rows })
      }
    }
    const result = await pool.query(
      'INSERT INTO paciente (rut, nombre, apellido, fecha_nacimiento, telefono, email) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [rut || null, nombre, apellido, fecha_nacimiento || null, telefono || null, email || null]
    )
    res.status(201).json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', async (req, res) => {
  const { rut, nombre, apellido, fecha_nacimiento, telefono, email } = req.body
  try {
    const result = await pool.query(
      'UPDATE paciente SET rut=$1, nombre=$2, apellido=$3, fecha_nacimiento=$4, telefono=$5, email=$6 WHERE id=$7 RETURNING *',
      [rut || null, nombre, apellido, fecha_nacimiento || null, telefono || null, email || null, req.params.id]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Paciente no encontrado' })
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id
    await pool.query('DELETE FROM pago WHERE paciente_id = $1', [id])
    await pool.query('DELETE FROM procedimiento WHERE paciente_id = $1', [id])
    await pool.query('DELETE FROM pap WHERE paciente_id = $1', [id])
    await pool.query('DELETE FROM flujo WHERE paciente_id = $1', [id])
    await pool.query('DELETE FROM ficha_clinica WHERE paciente_id = $1', [id])
    await pool.query('DELETE FROM ficha_ingreso_1 WHERE paciente_id = $1', [id])
    await pool.query('DELETE FROM ficha_ingreso_2 WHERE paciente_id = $1', [id])
    await pool.query('DELETE FROM encuesta WHERE paciente_id = $1', [id])
    await pool.query('DELETE FROM archivo_paciente WHERE paciente_id = $1', [id])
    await pool.query('DELETE FROM cita WHERE paciente_id = $1', [id])
    await pool.query('DELETE FROM paciente WHERE id = $1', [id])
    res.json({ mensaje: 'Paciente y todos sus registros eliminados' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router;