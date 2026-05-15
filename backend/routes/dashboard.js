const express = require('express')
const router = express.Router()
const pool = require('../db')

router.get('/', async (req, res) => {
  try {
    const hoy = new Date().toISOString().slice(0, 10)

    const [
      totalPacientes,
      totalProfesionales,
      citasHoy,
      citasPendientes,
      citasConfirmadas,
      citasRealizadas,
      citasCanceladas,
      proximasCitas
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM paciente'),
      pool.query('SELECT COUNT(*) FROM profesional'),
      pool.query("SELECT COUNT(*) FROM cita WHERE DATE(fecha_hora) = $1", [hoy]),
      pool.query("SELECT COUNT(*) FROM cita WHERE estado = 'pendiente'"),
      pool.query("SELECT COUNT(*) FROM cita WHERE estado = 'confirmada'"),
      pool.query("SELECT COUNT(*) FROM cita WHERE estado = 'realizada'"),
      pool.query("SELECT COUNT(*) FROM cita WHERE estado = 'cancelada'"),
      pool.query(`
        SELECT c.fecha_hora, c.estado, c.observaciones,
               p.nombre AS paciente_nombre, p.apellido AS paciente_apellido,
               pr.nombre AS profesional_nombre, pr.apellido AS profesional_apellido
        FROM cita c
        JOIN paciente p ON c.paciente_id = p.id
        JOIN profesional pr ON c.profesional_id = pr.id
        WHERE DATE(c.fecha_hora) = $1
        ORDER BY c.fecha_hora ASC
      `, [hoy])
    ])

    res.json({
      totalPacientes: parseInt(totalPacientes.rows[0].count),
      totalProfesionales: parseInt(totalProfesionales.rows[0].count),
      citasHoy: parseInt(citasHoy.rows[0].count),
      estados: {
        pendiente: parseInt(citasPendientes.rows[0].count),
        confirmada: parseInt(citasConfirmadas.rows[0].count),
        realizada: parseInt(citasRealizadas.rows[0].count),
        cancelada: parseInt(citasCanceladas.rows[0].count),
      },
      proximasCitas: proximasCitas.rows
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router