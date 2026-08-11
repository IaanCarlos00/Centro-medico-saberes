// El servidor (Railway) corre en horario UTC, pero el centro médico funciona en hora de Chile.
// Usar new Date().toISOString() calcula "hoy" en UTC, lo que hace que el día cambie de
// golpe a las 20:00-21:00 hora Chile (cuando en UTC ya es medianoche del día siguiente).
// Esta función siempre calcula la fecha usando la zona horaria de Chile, sin importar
// en qué zona horaria esté corriendo el servidor.
function hoyChile() {
  // 'en-CA' da el formato YYYY-MM-DD directamente
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' })
}

module.exports = { hoyChile }
