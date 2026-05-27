import axios from 'axios'

const API_LOGS = 'https://centro-medico-saberes-production.up.railway.app/logs'

export const registrarLog = async (accion, entidad, entidad_id, detalle) => {
  console.log('registrando log:', accion, entidad, entidad_id, detalle)
  try {
    await axios.post(API_LOGS, {
      usuario_id: localStorage.getItem('id'),
      usuario_nombre: localStorage.getItem('nombre'),
      accion,
      entidad,
      entidad_id,
      detalle
    })
  } catch (error) {
    // Si falla el log no interrumpimos la operación
    console.error('Error registrando log:', error)
  }
}