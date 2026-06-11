const express = require('express')
const router = express.Router()
const pool = require('../db')
const axios = require('axios')

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

const SYSTEM_PROMPT = `Eres un asistente inteligente de Saberes, una plataforma médica para matronas en Concepción, Chile.

Puedes ayudar con:
- Buscar pacientes por nombre o RUT
- Ver citas del día o de una fecha específica
- Agendar nuevas citas
- Confirmar citas tentativas
- Ver pagos pendientes

Cuando el usuario pida algo, responde en JSON con este formato:
{
  "accion": "buscar_paciente" | "ver_citas" | "agendar_cita" | "confirmar_tentativas" | "ver_pagos_pendientes" | "respuesta_directa",
  "parametros": { ... },
  "mensaje": "mensaje natural para mostrar al usuario"
}

Para "respuesta_directa" solo incluye el mensaje.
Para "buscar_paciente" incluye: { "nombre": "..." } o { "rut": "..." }
Para "ver_citas" incluye: { "fecha": "YYYY-MM-DD" } (hoy si no especifica)
Para "agendar_cita" incluye: { "paciente_nombre": "...", "fecha_hora": "YYYY-MM-DDTHH:MM", "profesional_id": 1 o 2 }
Para "confirmar_tentativas" incluye: { "fecha": "YYYY-MM-DD" }
Para "ver_pagos_pendientes" no necesita parámetros

Matrona Javiera Silva = profesional_id 1, Matrona Valentina Leal = profesional_id 2.
Responde SIEMPRE en JSON válido, sin markdown ni backticks.`

router.post('/', async (req, res) => {
  const { mensaje, historial = [] } = req.body
  try {
    // Llamar a Gemini para entender la intención
    const mensajes = [
      ...historial,
      { role: 'user', parts: [{ text: mensaje }] }
    ]

    const { data } = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
      {
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: mensajes
      }
    )

    const textoRespuesta = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    
    let respuestaIA
    try {
      respuestaIA = JSON.parse(textoRespuesta)
    } catch {
      respuestaIA = { accion: 'respuesta_directa', mensaje: textoRespuesta }
    }

    // Ejecutar la acción
    let resultado = null
    const { accion, parametros } = respuestaIA

    if (accion === 'buscar_paciente') {
      const q = parametros.rut || parametros.nombre
      const r = await pool.query(
        `SELECT id, nombre, apellido, rut, telefono, email, fecha_nacimiento 
         FROM paciente 
         WHERE nombre ILIKE $1 OR apellido ILIKE $1 OR rut ILIKE $1
         LIMIT 5`,
        [`%${q}%`]
      )
      resultado = r.rows
      if (resultado.length === 0) {
        respuestaIA.mensaje = `No encontré pacientes con "${q}".`
      } else if (resultado.length === 1) {
        const p = resultado[0]
        respuestaIA.mensaje = `Encontré a ${p.nombre} ${p.apellido}. RUT: ${p.rut || 'sin RUT'}, Teléfono: ${p.telefono || 'sin teléfono'}, Email: ${p.email || 'sin email'}.`
      } else {
        respuestaIA.mensaje = `Encontré ${resultado.length} pacientes:\n${resultado.map(p => `• ${p.nombre} ${p.apellido} (${p.rut || 'sin RUT'})`).join('\n')}`
      }

    } else if (accion === 'ver_citas') {
      const fecha = parametros.fecha || new Date().toISOString().slice(0, 10)
      const r = await pool.query(
        `SELECT c.fecha_hora, c.estado, p.nombre AS paciente_nombre, p.apellido AS paciente_apellido,
                pr.nombre AS profesional_nombre
         FROM cita c
         JOIN paciente p ON c.paciente_id = p.id
         JOIN profesional pr ON c.profesional_id = pr.id
         WHERE DATE(c.fecha_hora) = $1
         ORDER BY c.fecha_hora ASC`,
        [fecha]
      )
      resultado = r.rows
      if (resultado.length === 0) {
        respuestaIA.mensaje = `No hay citas para el ${fecha}.`
      } else {
        respuestaIA.mensaje = `Citas del ${fecha} (${resultado.length} en total):\n${resultado.map(c => `• ${c.fecha_hora.slice(11,16)} — ${c.paciente_nombre} ${c.paciente_apellido} con ${c.profesional_nombre} [${c.estado}]`).join('\n')}`
      }

    } else if (accion === 'confirmar_tentativas') {
      const fecha = parametros.fecha || new Date().toISOString().slice(0, 10)
      const r = await pool.query(
        `UPDATE cita SET estado = 'confirmada' 
         WHERE estado = 'tentativa' AND DATE(fecha_hora) = $1
         RETURNING id`,
        [fecha]
      )
      respuestaIA.mensaje = `✅ Se confirmaron ${r.rowCount} citas tentativas del ${fecha}.`

    } else if (accion === 'ver_pagos_pendientes') {
      const r = await pool.query(
        `SELECT pa.nombre, pa.apellido, p.monto, p.metodo
         FROM pago p
         JOIN paciente pa ON p.paciente_id = pa.id
         WHERE p.estado = 'pendiente'
         ORDER BY p.fecha DESC
         LIMIT 10`
      )
      resultado = r.rows
      if (resultado.length === 0) {
        respuestaIA.mensaje = 'No hay pagos pendientes.'
      } else {
        const total = resultado.reduce((s, p) => s + parseFloat(p.monto), 0)
        respuestaIA.mensaje = `Hay ${resultado.length} pagos pendientes por $${total.toLocaleString('es-CL')}:\n${resultado.map(p => `• ${p.nombre} ${p.apellido} — $${parseFloat(p.monto).toLocaleString('es-CL')} (${p.metodo})`).join('\n')}`
      }
    }

    const nuevoHistorial = [
      ...mensajes,
      { role: 'model', parts: [{ text: textoRespuesta }] }
    ]

    res.json({ 
      respuesta: respuestaIA.mensaje,
      accion,
      resultado,
      historial: nuevoHistorial
    })

  } catch (error) {
    console.error('Error asistente:', error.response?.data || error.message)
    res.status(500).json({ error: error.response?.data?.error?.message || error.message })
  }
})

module.exports = router