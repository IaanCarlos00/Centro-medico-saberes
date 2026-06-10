const express = require('express')
const router = express.Router()
const pool = require('../db')
const { Resend } = require('resend')

const resend = new Resend('re_CGpgATbp_5o65CMMtivJ4UXp4RjxLFdQF')
const BASE_URL = 'https://saberes.cl'

// Enviar encuesta
router.post('/enviar/:paciente_id', async (req, res) => {
  try {
    const paciente = await pool.query('SELECT * FROM paciente WHERE id = $1', [req.params.paciente_id])
    if (paciente.rows.length === 0) return res.status(404).json({ error: 'Paciente no encontrado' })
    const p = paciente.rows[0]
    if (!p.email) return res.status(400).json({ error: 'El paciente no tiene email registrado' })

    const enc = await pool.query(
      'INSERT INTO encuesta (paciente_id, estado) VALUES ($1, $2) RETURNING *',
      [p.id, 'pendiente']
    )
    const token = Buffer.from(`${enc.rows[0].id}-${p.id}-${Date.now()}`).toString('base64')

    await resend.emails.send({
      from: 'Saberes <no-reply@saberes.cl>',
      to: p.email,
      subject: '¿Cómo fue tu experiencia en Saberes? 💚',
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
        <body style="margin:0;padding:0;background:#f0fdf4;font-family:Arial,sans-serif;">
          <div style="max-width:600px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            <div style="background:linear-gradient(135deg,#166534,#16a34a);padding:40px 30px;text-align:center;">
              <div style="width:64px;height:64px;background:white;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
                <span style="font-size:28px;">🌿</span>
              </div>
              <h1 style="color:white;margin:0;font-size:28px;font-weight:bold;">Saberes</h1>
              <p style="color:#bbf7d0;margin:8px 0 0;font-size:14px;">Espacio de Salud Integral</p>
            </div>
            <div style="padding:40px 30px;">
              <h2 style="color:#166534;margin:0 0 12px;font-size:22px;">Hola ${p.nombre} 👋</h2>
              <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">
                Gracias por confiar en nosotras para tu cuidado. Tu opinión es fundamental para seguir mejorando y entregarte la mejor atención posible.
              </p>
              <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 32px;">
                ¿Puedes dedicar 2 minutos a contarnos cómo fue tu experiencia? 🙏
              </p>
              <div style="text-align:center;margin:0 0 32px;">
                <a href="${BASE_URL}/encuesta/${token}" style="display:inline-block;background:linear-gradient(135deg,#166534,#16a34a);color:white;padding:16px 36px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px;box-shadow:0 4px 12px rgba(22,101,52,0.3);">
                  ✨ Responder encuesta
                </a>
              </div>
              <div style="background:#f0fdf4;border-radius:12px;padding:20px;text-align:center;">
                <p style="color:#166534;font-size:14px;margin:0;font-weight:500;">Tu experiencia importa. Gracias por ser parte de Saberes 💚</p>
              </div>
            </div>
            <div style="background:#f9fafb;padding:20px 30px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="color:#9ca3af;font-size:12px;margin:0;">Este enlace es personal y único para ti · Saberes — Espacio de Salud Integral</p>
            </div>
          </div>
        </body>
        </html>
      `
    })

    await pool.query('UPDATE encuesta SET token=$1, enviada_en=NOW(), estado=$2 WHERE id=$3', [token, 'enviada', enc.rows[0].id])
    res.json({ mensaje: 'Encuesta enviada correctamente' })
  } catch (error) { res.status(500).json({ error: error.message }) }
})

// Obtener encuesta por token
router.get('/responder/:token', async (req, res) => {
  try {
    const enc = await pool.query(`
      SELECT e.*, p.nombre, p.apellido,
        pr.nombre AS profesional_nombre, pr.apellido AS profesional_apellido
      FROM encuesta e
      JOIN paciente p ON e.paciente_id = p.id
      LEFT JOIN profesional pr ON e.profesional_id = pr.id
      WHERE e.token = $1
    `, [req.params.token])
    if (enc.rows.length === 0) return res.status(404).json({ error: 'Encuesta no encontrada' })

    // Traer profesionales para el selector
    const profesionales = await pool.query('SELECT id, nombre, apellido FROM profesional ORDER BY nombre')
    res.json({ ...enc.rows[0], profesionales: profesionales.rows })
  } catch (error) { res.status(500).json({ error: error.message }) }
})

// Guardar respuesta
router.post('/responder/:token', async (req, res) => {
  const { estrellas, comentario, profesional_id, recomendaria, aspectos_positivos, aspectos_mejorar, calidad_atencion, puntualidad, instalaciones, trato } = req.body
  try {
    const enc = await pool.query('SELECT * FROM encuesta WHERE token = $1', [req.params.token])
    if (enc.rows.length === 0) return res.status(404).json({ error: 'Encuesta no encontrada' })
    if (enc.rows[0].estado === 'respondida') return res.status(400).json({ error: 'Esta encuesta ya fue respondida' })
    await pool.query(
      `UPDATE encuesta SET
        estrellas=$1, comentario=$2, estado=$3, respondida_en=NOW(),
        profesional_id=$4, recomendaria=$5, aspectos_positivos=$6,
        aspectos_mejorar=$7, calidad_atencion=$8, puntualidad=$9,
        instalaciones=$10, trato=$11
      WHERE token=$12`,
      [estrellas, comentario || null, 'respondida', profesional_id || null,
       recomendaria ?? null, aspectos_positivos || null, aspectos_mejorar || null,
       calidad_atencion || null, puntualidad || null, instalaciones || null,
       trato || null, req.params.token]
    )
    res.json({ mensaje: 'Gracias por tu respuesta' })
  } catch (error) { res.status(500).json({ error: error.message }) }
})

// Obtener todas las encuestas
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*,
        p.nombre AS paciente_nombre, p.apellido AS paciente_apellido, p.email,
        pr.nombre AS profesional_nombre, pr.apellido AS profesional_apellido
      FROM encuesta e
      JOIN paciente p ON e.paciente_id = p.id
      LEFT JOIN profesional pr ON e.profesional_id = pr.id
      ORDER BY e.enviada_en DESC
    `)
    res.json(result.rows)
  } catch (error) { res.status(500).json({ error: error.message }) }
})

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM encuesta WHERE id = $1', [req.params.id])
    res.json({ mensaje: 'Encuesta eliminada' })
  } catch (error) { res.status(500).json({ error: error.message }) }
})

router.post('/generar-link/:paciente_id', async (req, res) => {
  try {
    const paciente = await pool.query('SELECT * FROM paciente WHERE id = $1', [req.params.paciente_id])
    if (paciente.rows.length === 0) return res.status(404).json({ error: 'Paciente no encontrado' })
    const p = paciente.rows[0]

    const enc = await pool.query(
      'INSERT INTO encuesta (paciente_id, estado) VALUES ($1, $2) RETURNING *',
      [p.id, 'pendiente']
    )
    const token = Buffer.from(`${enc.rows[0].id}-${p.id}-${Date.now()}`).toString('base64')
    await pool.query('UPDATE encuesta SET token=$1 WHERE id=$2', [token, enc.rows[0].id])

    res.json({ link: `${BASE_URL}/encuesta/${token}`, paciente: p })
  } catch (error) { res.status(500).json({ error: error.message }) }
})

module.exports = router