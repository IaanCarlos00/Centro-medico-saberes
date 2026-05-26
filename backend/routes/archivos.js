const express = require('express')
const router = express.Router()
const multer = require('multer')
const cloudinary = require('cloudinary').v2
const pool = require('../db')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const upload = multer({ storage: multer.memoryStorage() })

// Subir archivo
router.post('/subir', upload.single('archivo'), async (req, res) => {
  try {
    const { paciente_id, nombre, descripcion } = req.body
    if (!req.file) return res.status(400).json({ error: 'No se recibió archivo' })

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { 
          folder: `saberes/pacientes/${paciente_id}`, 
          resource_type: 'image',
          format: 'pdf',
          type: 'upload'
        },
        (error, result) => error ? reject(error) : resolve(result)
      ).end(req.file.buffer)
    })

    const archivo = await pool.query(
      'INSERT INTO archivo_paciente (paciente_id, nombre, descripcion, url, public_id, tipo) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [paciente_id, nombre || req.file.originalname, descripcion || null, result.secure_url, result.public_id, req.file.mimetype]
    )

    res.status(201).json(archivo.rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Obtener archivos de un paciente
router.get('/paciente/:paciente_id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM archivo_paciente WHERE paciente_id = $1 ORDER BY created_at DESC',
      [req.params.paciente_id]
    )
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Eliminar archivo
router.delete('/:id', async (req, res) => {
  try {
    const archivo = await pool.query('SELECT * FROM archivo_paciente WHERE id = $1', [req.params.id])
    if (archivo.rows.length === 0) return res.status(404).json({ error: 'Archivo no encontrado' })
    await cloudinary.uploader.destroy(archivo.rows[0].public_id, { resource_type: 'raw' })
    await pool.query('DELETE FROM archivo_paciente WHERE id = $1', [req.params.id])
    res.json({ mensaje: 'Archivo eliminado' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router