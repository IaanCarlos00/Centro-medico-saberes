// Devuelve el texto, ícono y clases de color para mostrar si la paciente
// acepta atención con estudiantes, no acepta, o aún no se le preguntó.
export function infoPermiteEstudiantes(valor) {
  if (valor === true) {
    return { texto: 'Acepta estudiantes', icono: '🎓', clase: 'bg-blue-100 text-blue-700' }
  }
  if (valor === false) {
    return { texto: 'No acepta estudiantes', icono: '🚫', clase: 'bg-red-100 text-red-600' }
  }
  return { texto: 'No se preguntó', icono: '❔', clase: 'bg-gray-100 text-gray-500' }
}
