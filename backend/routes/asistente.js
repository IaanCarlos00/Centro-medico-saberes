const express = require('express')
const router = express.Router()
const pool = require('../db')
const axios = require('axios')

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

// Busca pacientes por nombre, tolerante a espacios extra y al orden de las palabras
// (ej. "Katherine Monteghirfo Medina" encuentra "Katherine  Monteghirfo Medina").
async function buscarPacientesPorNombre(texto) {
  const palabras = (texto || '').trim().split(/\s+/).filter(Boolean)
  if (palabras.length === 0) return []
  const condiciones = palabras.map((_, i) => `regexp_replace(nombre || ' ' || apellido, '\\s+', ' ', 'g') ILIKE $${i + 1}`).join(' AND ')
  const r = await pool.query(
    `SELECT id, nombre, apellido, rut, telefono, email, fecha_nacimiento FROM paciente WHERE ${condiciones} LIMIT 5`,
    palabras.map(p => `%${p}%`)
  )
  return r.rows
}

const SYSTEM_PROMPT = `Eres un asistente inteligente de Saberes, una plataforma médica para matronas en Concepción, Chile.

Puedes ayudar con:
- Buscar pacientes por nombre o RUT
- Ver la ficha clínica / historial de una paciente
- Crear una paciente nueva
- Ver citas del día o de una fecha específica
- Ver horarios disponibles (libres, sin agendar) de las matronas en una fecha
- Agendar nuevas citas
- Cancelar una cita
- Reagendar (cambiar fecha/hora) una cita
- Confirmar citas tentativas
- Ver pagos pendientes en general
- Ver la deuda de una paciente específica
- Ver un resumen de reportes (ingresos, citas, pacientes nuevos) de un mes
- Ver el catálogo de procedimientos y sus precios
- Bloquear un horario (ej. vacaciones, permiso, hora de colación)

Cuando el usuario pida algo, responde en JSON con este formato:
{
  "accion": "buscar_paciente" | "ver_ficha_paciente" | "crear_paciente" | "ver_citas" | "ver_horarios_disponibles" | "agendar_cita" | "cancelar_cita" | "reagendar_cita" | "confirmar_tentativas" | "ver_pagos_pendientes" | "ver_deuda_paciente" | "ver_reporte_resumen" | "ver_procedimientos" | "bloquear_horario" | "respuesta_directa",
  "parametros": { ... },
  "mensaje": "mensaje natural para mostrar al usuario"
}

Para "respuesta_directa" solo incluye el mensaje.
Para "buscar_paciente" incluye: { "nombre": "..." } o { "rut": "..." }
Para "ver_ficha_paciente" incluye: { "paciente_nombre": "..." }
Para "crear_paciente" incluye: { "nombre": "...", "apellido": "...", "rut": "..." (opcional), "telefono": "..." (opcional), "email": "..." (opcional), "fecha_nacimiento": "YYYY-MM-DD" (opcional) }. Nombre y apellido son obligatorios.
Para "ver_citas" incluye: { "fecha": "YYYY-MM-DD" } (hoy si no especifica)
Para "ver_horarios_disponibles" incluye: { "fecha": "YYYY-MM-DD", "profesional_id": 1 o 2 (opcional, si no especifica cuál matrona, omite el campo y se muestran ambas) }
Para "agendar_cita" incluye: { "paciente_nombre": "...", "fecha_hora": "YYYY-MM-DDTHH:MM", "profesional_id": 1 o 2 }. La paciente debe existir previamente en el sistema; si no la encuentras, dile al usuario que primero debe crearla en Pacientes (o créala tú mismo si el usuario te lo pide explícitamente).
Para "cancelar_cita" incluye: { "paciente_nombre": "...", "fecha": "YYYY-MM-DD" (opcional, para desambiguar si tiene varias citas) }
Para "reagendar_cita" incluye: { "paciente_nombre": "...", "fecha_actual": "YYYY-MM-DD" (opcional, para desambiguar), "fecha_hora_nueva": "YYYY-MM-DDTHH:MM" }
Para "confirmar_tentativas" incluye: { "fecha": "YYYY-MM-DD" }
Para "ver_pagos_pendientes" no necesita parámetros
Para "ver_deuda_paciente" incluye: { "paciente_nombre": "..." }
Para "ver_reporte_resumen" incluye: { "mes": "YYYY-MM" } (mes actual si no especifica)
Para "ver_procedimientos" incluye: { "nombre": "..." } (opcional, para filtrar; si no, se listan todos)
Para "bloquear_horario" incluye: { "fecha": "YYYY-MM-DD", "hora_inicio": "HH:MM" (opcional), "hora_fin": "HH:MM" (opcional), "motivo": "..." (opcional), "profesional_id": 1 o 2 (opcional, si no especifica se bloquea para ambas matronas) }. Si no se especifica hora_inicio/hora_fin, se bloquea el día completo.

Matrona Javiera Silva = profesional_id 1, Matrona Valentina Leal = profesional_id 2.
Responde SIEMPRE en JSON válido, sin markdown ni backticks.`

router.post('/', async (req, res) => {
  const { mensaje, historial = [] } = req.body
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Falta configurar GEMINI_API_KEY en las variables de entorno de Railway.' })
  }
  try {
    // Llamar a Gemini para entender la intención
    const mensajes = [
      ...historial,
      { role: 'user', parts: [{ text: mensaje }] }
    ]

    const { data } = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY.trim()}`,
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
    const { accion } = respuestaIA
    const parametros = respuestaIA.parametros || {}

    if (accion === 'buscar_paciente') {
      const q = (parametros.rut || parametros.nombre || '').trim()
      let filas
      if (parametros.rut) {
        const r = await pool.query(
          `SELECT id, nombre, apellido, rut, telefono, email, fecha_nacimiento 
           FROM paciente WHERE rut ILIKE $1 LIMIT 5`,
          [`%${q}%`]
        )
        filas = r.rows
      } else {
        filas = await buscarPacientesPorNombre(q)
      }
      resultado = filas
      if (resultado.length === 0) {
        respuestaIA.mensaje = `No encontré pacientes con "${q}".`
      } else if (resultado.length === 1) {
        const p = resultado[0]
        respuestaIA.mensaje = `Encontré a ${p.nombre} ${p.apellido}. RUT: ${p.rut || 'sin RUT'}, Teléfono: ${p.telefono || 'sin teléfono'}, Email: ${p.email || 'sin email'}.`
      } else {
        respuestaIA.mensaje = `Encontré ${resultado.length} pacientes:\n${resultado.map(p => `• ${p.nombre} ${p.apellido} (${p.rut || 'sin RUT'})`).join('\n')}`
      }

    } else if (accion === 'ver_ficha_paciente') {
      const pacientes = await buscarPacientesPorNombre(parametros.paciente_nombre)
      if (pacientes.length === 0) {
        respuestaIA.mensaje = `No encontré ninguna paciente registrada como "${parametros.paciente_nombre}".`
      } else if (pacientes.length > 1) {
        respuestaIA.mensaje = `Encontré varias pacientes que calzan con "${parametros.paciente_nombre}", dime el nombre completo o el RUT:\n${pacientes.map(p => `• ${p.nombre} ${p.apellido}`).join('\n')}`
      } else {
        const paciente = pacientes[0]
        const r = await pool.query(
          `SELECT TO_CHAR(f.fecha, 'YYYY-MM-DD') AS fecha, f.motivo_consulta, f.diagnostico, f.tratamiento, f.observaciones,
                  pr.nombre AS profesional_nombre, pr.apellido AS profesional_apellido
           FROM ficha_clinica f
           JOIN profesional pr ON f.profesional_id = pr.id
           WHERE f.paciente_id = $1
           ORDER BY f.fecha DESC
           LIMIT 5`,
          [paciente.id]
        )
        resultado = r.rows
        if (resultado.length === 0) {
          respuestaIA.mensaje = `${paciente.nombre} ${paciente.apellido} no tiene fichas clínicas registradas.`
        } else {
          respuestaIA.mensaje = `Últimas fichas clínicas de ${paciente.nombre} ${paciente.apellido}:\n` +
            resultado.map(f => `• ${f.fecha} (${f.profesional_nombre}) — Motivo: ${f.motivo_consulta || 's/i'}. Diagnóstico: ${f.diagnostico || 's/i'}.`).join('\n')
        }
      }

    } else if (accion === 'crear_paciente') {
      const { nombre, apellido, rut, telefono, email, fecha_nacimiento } = parametros
      if (!nombre || !apellido) {
        respuestaIA.mensaje = 'Para crear una paciente necesito al menos su nombre y apellido.'
      } else {
        let duplicada = null
        if (rut) {
          const dupRut = await pool.query('SELECT id, nombre, apellido FROM paciente WHERE rut = $1', [rut])
          if (dupRut.rows.length > 0) duplicada = dupRut.rows[0]
        }
        if (!duplicada) {
          const dupNombre = await pool.query(
            'SELECT id, nombre, apellido, rut FROM paciente WHERE LOWER(nombre) = LOWER($1) AND LOWER(apellido) = LOWER($2)',
            [nombre, apellido]
          )
          if (dupNombre.rows.length > 0) duplicada = dupNombre.rows[0]
        }
        if (duplicada) {
          respuestaIA.mensaje = `Ya existe una paciente registrada como ${duplicada.nombre} ${duplicada.apellido}. No la creé de nuevo para evitar duplicados — si son personas distintas, créala manualmente desde Pacientes.`
        } else {
          const r = await pool.query(
            'INSERT INTO paciente (rut, nombre, apellido, fecha_nacimiento, telefono, email) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
            [rut || null, nombre, apellido, fecha_nacimiento || null, telefono || null, email || null]
          )
          resultado = r.rows[0]
          respuestaIA.mensaje = `✅ Creé a la paciente ${nombre} ${apellido}${rut ? ` (RUT ${rut})` : ''}.`
        }
      }

    } else if (accion === 'ver_citas') {
      const fecha = parametros.fecha || new Date().toISOString().slice(0, 10)
      const r = await pool.query(
        `SELECT c.id, TO_CHAR(c.fecha_hora, 'YYYY-MM-DD HH24:MI:SS') AS fecha_hora, c.estado,
                p.nombre AS paciente_nombre, p.apellido AS paciente_apellido,
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
         WHERE estado = 'pendiente' AND paciente_id IS NULL AND DATE(fecha_hora) = $1
         RETURNING id`,
        [fecha]
      )
      respuestaIA.mensaje = `✅ Se confirmaron ${r.rowCount} reserva${r.rowCount === 1 ? '' : 's'} tentativa${r.rowCount === 1 ? '' : 's'} del ${fecha}.`

    } else if (accion === 'ver_horarios_disponibles') {
      const fecha = parametros.fecha || new Date().toISOString().slice(0, 10)
      const profesionalId = parametros.profesional_id || null
      const diaSemana = new Date(`${fecha}T12:00:00`).getDay()

      const horariosR = await pool.query(
        `SELECT h.profesional_id, TO_CHAR(h.hora, 'HH24:MI') AS hora, h.sobrecupo,
                pr.nombre AS profesional_nombre, pr.apellido AS profesional_apellido
         FROM horario_profesional h
         JOIN profesional pr ON h.profesional_id = pr.id
         WHERE h.dia_semana = $1 ${profesionalId ? 'AND h.profesional_id = $2' : ''}
         ORDER BY h.profesional_id, h.hora`,
        profesionalId ? [diaSemana, profesionalId] : [diaSemana]
      )

      const citasR = await pool.query(
        `SELECT profesional_id, TO_CHAR(fecha_hora, 'HH24:MI') AS hora
         FROM cita
         WHERE DATE(fecha_hora) = $1::date AND estado != 'cancelada'`,
        [fecha]
      )

      const bloqueosR = await pool.query(
        `SELECT profesional_id, fecha_inicio, fecha_fin
         FROM bloqueo_horario
         WHERE fecha_inicio < ($1::date + 1) AND fecha_fin > $1::date`,
        [fecha]
      )

      const ocupados = new Set(citasR.rows.map(c => `${c.profesional_id}_${c.hora}`))

      const disponibles = horariosR.rows.filter(h => {
        if (ocupados.has(`${h.profesional_id}_${h.hora}`)) return false
        const inicioSlot = new Date(`${fecha}T${h.hora}:00`)
        const bloqueado = bloqueosR.rows.some(b =>
          (!b.profesional_id || b.profesional_id === h.profesional_id) &&
          inicioSlot >= new Date(b.fecha_inicio) && inicioSlot < new Date(b.fecha_fin)
        )
        return !bloqueado
      })

      resultado = disponibles
      if (horariosR.rows.length === 0) {
        respuestaIA.mensaje = `Ninguna matrona tiene horario configurado ese día (${fecha}).`
      } else if (disponibles.length === 0) {
        respuestaIA.mensaje = `No quedan horarios disponibles para el ${fecha}, está todo ocupado o bloqueado.`
      } else {
        const porProfesional = {}
        disponibles.forEach(d => {
          const nombre = `${d.profesional_nombre} ${d.profesional_apellido}`
          if (!porProfesional[nombre]) porProfesional[nombre] = []
          porProfesional[nombre].push(`${d.hora}${d.sobrecupo ? ' (sobrecupo)' : ''}`)
        })
        respuestaIA.mensaje = `Horarios disponibles el ${fecha}:\n` +
          Object.entries(porProfesional).map(([nombre, horas]) => `👩‍⚕️ ${nombre}: ${horas.join(', ')}`).join('\n')
      }

    } else if (accion === 'agendar_cita') {
      const { paciente_nombre, fecha_hora, profesional_id } = parametros
      if (!paciente_nombre || !fecha_hora || !profesional_id) {
        respuestaIA.mensaje = 'Me falta información para agendar: necesito el nombre de la paciente, la fecha/hora y el profesional.'
      } else {
        const pacientes = await buscarPacientesPorNombre(paciente_nombre)
        if (pacientes.length === 0) {
          respuestaIA.mensaje = `No encontré ninguna paciente registrada como "${paciente_nombre}". Primero debe estar creada en Pacientes antes de poder agendarla (o dime "créala" y la creo yo).`
        } else if (pacientes.length > 1) {
          respuestaIA.mensaje = `Encontré varias pacientes que calzan con "${paciente_nombre}", dime el nombre completo o el RUT:\n${pacientes.map(p => `• ${p.nombre} ${p.apellido}`).join('\n')}`
        } else {
          const paciente = pacientes[0]
          const r = await pool.query(
            `INSERT INTO cita (paciente_id, profesional_id, fecha_hora, estado, duracion_minutos)
             VALUES ($1,$2,$3::timestamp,'pendiente',30)
             RETURNING id, TO_CHAR(fecha_hora, 'YYYY-MM-DD HH24:MI:SS') AS fecha_hora`,
            [paciente.id, profesional_id, fecha_hora]
          )
          resultado = r.rows[0]
          respuestaIA.mensaje = `✅ Agendé a ${paciente.nombre} ${paciente.apellido} el ${r.rows[0].fecha_hora}. Quedó como pendiente — no olvides confirmarla.`
        }
      }

    } else if (accion === 'cancelar_cita') {
      const pacientes = await buscarPacientesPorNombre(parametros.paciente_nombre)
      if (pacientes.length === 0) {
        respuestaIA.mensaje = `No encontré ninguna paciente registrada como "${parametros.paciente_nombre}".`
      } else if (pacientes.length > 1) {
        respuestaIA.mensaje = `Encontré varias pacientes que calzan con "${parametros.paciente_nombre}", dime el nombre completo o el RUT:\n${pacientes.map(p => `• ${p.nombre} ${p.apellido}`).join('\n')}`
      } else {
        const paciente = pacientes[0]
        const citasR = await pool.query(
          `SELECT id, TO_CHAR(fecha_hora, 'YYYY-MM-DD HH24:MI') AS fecha_hora
           FROM cita
           WHERE paciente_id = $1 AND estado NOT IN ('cancelada','realizada')
           ${parametros.fecha ? 'AND DATE(fecha_hora) = $2' : ''}
           ORDER BY fecha_hora ASC`,
          parametros.fecha ? [paciente.id, parametros.fecha] : [paciente.id]
        )
        if (citasR.rows.length === 0) {
          respuestaIA.mensaje = `${paciente.nombre} ${paciente.apellido} no tiene citas próximas para cancelar.`
        } else if (citasR.rows.length > 1) {
          respuestaIA.mensaje = `${paciente.nombre} ${paciente.apellido} tiene varias citas próximas, dime cuál (dame la fecha):\n${citasR.rows.map(c => `• ${c.fecha_hora}`).join('\n')}`
        } else {
          const cita = citasR.rows[0]
          await pool.query(`UPDATE cita SET estado = 'cancelada' WHERE id = $1`, [cita.id])
          resultado = cita
          respuestaIA.mensaje = `✅ Cancelé la cita de ${paciente.nombre} ${paciente.apellido} del ${cita.fecha_hora}.`
        }
      }

    } else if (accion === 'reagendar_cita') {
      if (!parametros.fecha_hora_nueva) {
        respuestaIA.mensaje = 'Necesito la nueva fecha y hora para reagendar la cita.'
      } else {
        const pacientes = await buscarPacientesPorNombre(parametros.paciente_nombre)
        if (pacientes.length === 0) {
          respuestaIA.mensaje = `No encontré ninguna paciente registrada como "${parametros.paciente_nombre}".`
        } else if (pacientes.length > 1) {
          respuestaIA.mensaje = `Encontré varias pacientes que calzan con "${parametros.paciente_nombre}", dime el nombre completo o el RUT:\n${pacientes.map(p => `• ${p.nombre} ${p.apellido}`).join('\n')}`
        } else {
          const paciente = pacientes[0]
          const citasR = await pool.query(
            `SELECT id, TO_CHAR(fecha_hora, 'YYYY-MM-DD HH24:MI') AS fecha_hora
             FROM cita
             WHERE paciente_id = $1 AND estado NOT IN ('cancelada','realizada')
             ${parametros.fecha_actual ? 'AND DATE(fecha_hora) = $2' : ''}
             ORDER BY fecha_hora ASC`,
            parametros.fecha_actual ? [paciente.id, parametros.fecha_actual] : [paciente.id]
          )
          if (citasR.rows.length === 0) {
            respuestaIA.mensaje = `${paciente.nombre} ${paciente.apellido} no tiene citas próximas para reagendar.`
          } else if (citasR.rows.length > 1) {
            respuestaIA.mensaje = `${paciente.nombre} ${paciente.apellido} tiene varias citas próximas, dime cuál quieres cambiar (dame la fecha actual):\n${citasR.rows.map(c => `• ${c.fecha_hora}`).join('\n')}`
          } else {
            const cita = citasR.rows[0]
            const r = await pool.query(
              `UPDATE cita SET fecha_hora = $1::timestamp, estado = 'pendiente' WHERE id = $2
               RETURNING TO_CHAR(fecha_hora, 'YYYY-MM-DD HH24:MI') AS fecha_hora`,
              [parametros.fecha_hora_nueva, cita.id]
            )
            resultado = r.rows[0]
            respuestaIA.mensaje = `✅ Reagendé a ${paciente.nombre} ${paciente.apellido} del ${cita.fecha_hora} al ${r.rows[0].fecha_hora}. Quedó pendiente — no olvides confirmarla.`
          }
        }
      }

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

    } else if (accion === 'ver_deuda_paciente') {
      const pacientes = await buscarPacientesPorNombre(parametros.paciente_nombre)
      if (pacientes.length === 0) {
        respuestaIA.mensaje = `No encontré ninguna paciente registrada como "${parametros.paciente_nombre}".`
      } else if (pacientes.length > 1) {
        respuestaIA.mensaje = `Encontré varias pacientes que calzan con "${parametros.paciente_nombre}", dime el nombre completo o el RUT:\n${pacientes.map(p => `• ${p.nombre} ${p.apellido}`).join('\n')}`
      } else {
        const paciente = pacientes[0]
        const r = await pool.query(
          `SELECT monto, metodo, TO_CHAR(fecha, 'YYYY-MM-DD') AS fecha
           FROM pago WHERE paciente_id = $1 AND estado = 'pendiente' ORDER BY fecha DESC`,
          [paciente.id]
        )
        resultado = r.rows
        if (resultado.length === 0) {
          respuestaIA.mensaje = `${paciente.nombre} ${paciente.apellido} no tiene deuda pendiente. 🎉`
        } else {
          const total = resultado.reduce((s, p) => s + parseFloat(p.monto), 0)
          respuestaIA.mensaje = `${paciente.nombre} ${paciente.apellido} debe $${total.toLocaleString('es-CL')} en total:\n${resultado.map(p => `• ${p.fecha} — $${parseFloat(p.monto).toLocaleString('es-CL')} (${p.metodo})`).join('\n')}`
        }
      }

    } else if (accion === 'ver_reporte_resumen') {
      const mes = parametros.mes || new Date().toISOString().slice(0, 7)
      const [anio, mesNum] = mes.split('-')
      const inicio = `${anio}-${mesNum}-01`
      const fin = new Date(anio, mesNum, 0).toISOString().slice(0, 10) + ' 23:59:59'

      const [ingresos, citasMes, pacientesNuevos, deudaTotal] = await Promise.all([
        pool.query(`SELECT COALESCE(SUM(monto),0) AS total FROM pago WHERE estado='pagado' AND fecha >= $1 AND fecha <= $2`, [inicio, fin]),
        pool.query(`SELECT COUNT(*) AS total FROM cita WHERE fecha_hora >= $1 AND fecha_hora <= $2`, [inicio, fin]),
        pool.query(`SELECT COUNT(*) AS total FROM paciente WHERE created_at >= $1 AND created_at <= $2`, [inicio, fin]),
        pool.query(`SELECT COALESCE(SUM(monto),0) AS total FROM pago WHERE estado='pendiente'`),
      ])

      resultado = {
        ingresos: parseFloat(ingresos.rows[0].total),
        citas: parseInt(citasMes.rows[0].total),
        pacientesNuevos: parseInt(pacientesNuevos.rows[0].total),
        deudaTotal: parseFloat(deudaTotal.rows[0].total),
      }
      respuestaIA.mensaje = `📊 Resumen de ${mes}:\n` +
        `• Ingresos: $${resultado.ingresos.toLocaleString('es-CL')}\n` +
        `• Citas: ${resultado.citas}\n` +
        `• Pacientes nuevas: ${resultado.pacientesNuevos}\n` +
        `• Deuda pendiente total (histórica): $${resultado.deudaTotal.toLocaleString('es-CL')}`

    } else if (accion === 'ver_procedimientos') {
      const filtro = (parametros.nombre || '').trim()
      const r = await pool.query(
        `SELECT nombre, monto FROM catalogo_procedimiento WHERE activo = TRUE ${filtro ? 'AND nombre ILIKE $1' : ''} ORDER BY nombre`,
        filtro ? [`%${filtro}%`] : []
      )
      resultado = r.rows
      if (resultado.length === 0) {
        respuestaIA.mensaje = filtro ? `No encontré procedimientos que coincidan con "${filtro}".` : 'No hay procedimientos registrados en el catálogo.'
      } else {
        respuestaIA.mensaje = `Procedimientos${filtro ? ` que coinciden con "${filtro}"` : ''}:\n${resultado.map(p => `• ${p.nombre} — $${parseFloat(p.monto).toLocaleString('es-CL')}`).join('\n')}`
      }

    } else if (accion === 'bloquear_horario') {
      const { fecha, hora_inicio, hora_fin, motivo, profesional_id } = parametros
      if (!fecha) {
        respuestaIA.mensaje = 'Necesito la fecha que quieres bloquear.'
      } else {
        const fechaInicio = `${fecha}T${hora_inicio || '00:00'}:00`
        const fechaFin = `${fecha}T${hora_fin || '23:59'}:59`
        const r = await pool.query(
          `INSERT INTO bloqueo_horario (fecha_inicio, fecha_fin, motivo, creado_por, profesional_id)
           VALUES ($1::timestamp, $2::timestamp, $3, $4, $5)
           RETURNING id`,
          [fechaInicio, fechaFin, motivo || null, req.usuario?.id || null, profesional_id || null]
        )
        resultado = r.rows[0]
        const rango = (hora_inicio || hora_fin) ? `de ${hora_inicio || '00:00'} a ${hora_fin || '23:59'}` : 'todo el día'
        respuestaIA.mensaje = `✅ Bloqueé el ${fecha} (${rango})${profesional_id ? '' : ' para ambas matronas'}${motivo ? ` — motivo: ${motivo}` : ''}.`
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