// Colores por estado de cita, usados en distintas vistas.
// OJO: las 3 variantes tienen forma distinta a propósito (cada vista necesita algo distinto)
// y no todas manejan los mismos estados (InicioMatrona.jsx incluye 'en_atencion').
// Antes de unificarlas en una sola forma, confirmar con el backend qué estados
// puede tener realmente una cita en cada contexto.

// Usado en Citas.jsx — necesita color hex (para el calendario) y clases Tailwind (para badges)
export const estadoColorCita = {
  pendiente: { bg: '#d1d5db', badge: 'bg-gray-100 text-gray-600' },
  confirmada: { bg: '#3b82f6', badge: 'bg-blue-100 text-blue-700' },
  realizada: { bg: '#22c55e', badge: 'bg-green-100 text-green-700' },
  cancelada: { bg: '#ef4444', badge: 'bg-red-100 text-red-700' },
}

// Usado en Reportes.jsx — solo color hex, para las barras del gráfico
export const estadoColorReporte = {
  pendiente: '#f59e0b',
  confirmada: '#3b82f6',
  realizada: '#22c55e',
  cancelada: '#ef4444',
}

// Usado en InicioMatrona.jsx — solo clases Tailwind, incluye 'en_atencion'
export const estadoColorMatrona = {
  pendiente: 'bg-yellow-100 text-yellow-700',
  confirmada: 'bg-blue-100 text-blue-700',
  en_atencion: 'bg-purple-100 text-purple-700',
  realizada: 'bg-green-100 text-green-700',
  cancelada: 'bg-red-100 text-red-700',
}
