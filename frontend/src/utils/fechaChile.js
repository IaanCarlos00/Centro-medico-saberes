// Igual que en el backend: usar new Date().toISOString() calcula "hoy" en UTC, y como
// Chile va varias horas detrás de UTC, el día "cambia" de golpe como a las 20:00-21:00
// hora Chile (justo cuando en UTC ya es medianoche del día siguiente). Esta función
// siempre calcula la fecha de hoy usando la zona horaria de Chile.
export function hoyChile() {
  // 'en-CA' da el formato YYYY-MM-DD directamente
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' })
}
