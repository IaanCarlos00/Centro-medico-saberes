const { exec } = require('child_process')
const path = require('path')

const DB_URL = process.env.DATABASE_URL
const fecha = new Date().toISOString().slice(0, 10)
const archivo = path.join(__dirname, `backup_saberes_${fecha}.sql`)

console.log(`Generando backup: ${archivo}`)

exec(`pg_dump "${DB_URL}" -f "${archivo}"`, (error, stdout, stderr) => {
  if (error) {
    console.error('Error al generar backup:', error.message)
    return
  }
  console.log(`✅ Backup guardado en: ${archivo}`)
})