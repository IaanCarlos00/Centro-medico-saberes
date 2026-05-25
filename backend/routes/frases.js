const express = require('express')
const router = express.Router()
const pool = require('../db')

const Anthropic = require('@anthropic-ai/sdk')
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

router.get('/:usuario_id', async (req, res) => {
  try {
    const { usuario_id } = req.params
    const hoy = new Date().toISOString().slice(0, 10)

    // Verificar si ya hay frase para hoy
    const existente = await pool.query(
      'SELECT frase FROM frase_diaria WHERE usuario_id = $1 AND fecha = $2',
      [usuario_id, hoy]
    )

    if (existente.rows.length > 0) {
      return res.json({ frase: existente.rows[0].frase })
    }

    // Obtener datos del usuario
    const usuario = await pool.query('SELECT nombre, rol FROM usuario WHERE id = $1', [usuario_id])
    if (usuario.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' })

    const { nombre, rol } = usuario.rows[0]
    const rolTexto = rol === 'matrona' ? 'matrona' : rol === 'secretaria' ? 'secretaria de un centro médico' : 'profesional de salud'

    // Generar frase con Claude
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: `Genera una frase motivacional corta y cálida (máximo 2 oraciones) para ${nombre}, quien trabaja como ${rolTexto} en un centro ginecológico en Chile. La frase debe ser personal, inspiradora y apropiada para comenzar su jornada laboral. Solo responde con la frase, sin comillas ni explicaciones.`
      }]
    })

    const frase = message.content[0].text.trim()

    // Guardar frase
    await pool.query(
      'INSERT INTO frase_diaria (usuario_id, frase, fecha) VALUES ($1, $2, $3)',
      [usuario_id, frase, hoy]
    )

    res.json({ frase })
  } catch (error) {
    console.error('Error generando frase:', error.message)
    res.status(500).json({ error: error.message })
  }
})

module.exports = router