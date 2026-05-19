const express = require('express')
const router = express.Router()
const pool = require('../db')
const { Resend } = require('resend')

const resend = new Resend('re_CGpgATbp_5o65CMMtivJ4UXp4RjxLFdQF')
const BASE_URL = 'https://centro-medico-saberes.vercel.app'

// Enviar encuesta a un paciente
router.post('/enviar/:paciente_id', async (req, res) => {
  try {
    const paciente = await pool.query('SELECT * FROM paciente WHERE id = $1', [req.params.paciente_id])
    if (paciente.rows.length === 0) return res.status(404).json({ error: 'Paciente no encontrado' })
    const p = paciente.rows[0]
    if (!p.email) return res.status(400).json({ error: 'El paciente no tiene email registrado' })

    // Crear registro de encuesta pendiente
    const enc = await pool.query(
      'INSERT INTO encuesta (paciente_id, estado) VALUES ($1, $2) RETURNING *',
      [p.id, 'pendiente']
    )
    const token = Buffer.from(`${enc.rows[0].id}-${p.id}`).toString('base64')

    await resend.emails.send({
      from: 'Saberes <no-reply@saberes.cl>',
      to: p.email,
      subject: '¿Cómo fue tu experiencia en Saberes?',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #166534; font-size: 24px;">Saberes</h1>
            <p style="color: #6b7280;">Espacio de Salud Integral</p>
          </div>
          <h2 style="color: #166534;">Hola ${p.nombre}, ¿cómo fue tu experiencia?</h2>
          <p style="color: #374151;">Nos importa tu opinión. Por favor tómate un momento para contarnos cómo fue tu atención.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${BASE_URL}/encuesta/${token}" style="background-color: #166534; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
              Responder encuesta
            </a>
          </div>
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">Este enlace es personal y único para ti.</p>
        </div>
      `
    })

    await pool.query('UPDATE encuesta SET token=$1, enviada_en=NOW() WHERE id=$2', [token, enc.rows[0].id])
    res.json({ mensaje: 'Encuesta enviada correctamente' })
  } catch (error) { res.status(500).json({ error: error.message }) }
})

// Obtener encuesta por token (página pública)
router.get('/responder/:token', async (req, res) => {
  try {
    const enc = await pool.query(`
      SELECT e.*, p.nombre, p.apellido FROM encuesta e
      JOIN paciente p ON e.paciente_id = p.id
      WHERE e.token = $1
    `, [req.params.token])
    if (enc.rows.length === 0) return res.status(404).json({ error: 'Encuesta no encontrada' })
    res.json(enc.rows[0])
  } catch (error) { res.status(500).json({ error: error.message }) }
})

// Guardar respuesta
router.post('/responder/:token', async (req, res) => {
  const { estrellas, comentario } = req.body
  try {
    const enc = await pool.query('SELECT * FROM encuesta WHERE token = $1', [req.params.token])
    if (enc.rows.length === 0) return res.status(404).json({ error: 'Encuesta no encontrada' })
    if (enc.rows[0].estado === 'respondida') return res.status(400).json({ error: 'Esta encuesta ya fue respondida' })
    await pool.query(
      'UPDATE encuesta SET estrellas=$1, comentario=$2, estado=$3, respondida_en=NOW() WHERE token=$4',
      [estrellas, comentario || null, 'respondida', req.params.token]
    )
    res.json({ mensaje: 'Gracias por tu respuesta' })
  } catch (error) { res.status(500).json({ error: error.message }) }
})

// Obtener todas las encuestas (admin)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*, p.nombre AS paciente_nombre, p.apellido AS paciente_apellido, p.email
      FROM encuesta e
      JOIN paciente p ON e.paciente_id = p.id
      ORDER BY e.enviada_en DESC
    `)
    res.json(result.rows)
  } catch (error) { res.status(500).json({ error: error.message }) }
})

module.exports = router