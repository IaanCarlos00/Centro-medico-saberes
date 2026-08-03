export function validarFechaHora(fechaHora, bloqueos = []) {
  if (!fechaHora) return 'La hora de la cita es obligatoria'
  const fecha = new Date(fechaHora)
  const ahora = new Date()
  const diaSemana = fecha.getDay()
  const hora = fechaHora.slice(11, 16)

  if (diaSemana === 0) return 'No se pueden agendar citas los domingos'
  if (hora < '08:30') return 'advertencia:Fuera de horario: la hora ingresada es antes de las 08:30. ¿Deseas continuar de todos modos?'
  if (hora > '20:30') return 'advertencia:Fuera de horario: la hora ingresada es después de las 20:30. ¿Deseas continuar de todos modos?'
  if (fecha < ahora) return 'advertencia:Esta fecha y hora ya pasaron. ¿Deseas agendar de todos modos?'

  const bloqueado = bloqueos.find(b => {
    const inicio = new Date(b.fecha_inicio)
    const fin = new Date(b.fecha_fin)
    return fecha >= inicio && fecha <= fin
  })
  if (bloqueado) return `Horario bloqueado${bloqueado.motivo ? ': ' + bloqueado.motivo : ''}`

  return null
}
