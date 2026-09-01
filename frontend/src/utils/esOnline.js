// Detecta si el procedimiento de una cita corresponde a una atención online
// (ej. "Online Fonasa", "Online Particular"), para avisar en recepción que
// la paciente no llegará físicamente y no hay que esperarla.
export function esAtencionOnline(procedimientoNombre) {
  return typeof procedimientoNombre === 'string' && procedimientoNombre.toLowerCase().includes('online')
}