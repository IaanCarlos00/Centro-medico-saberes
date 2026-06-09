import { useNavigate } from 'react-router-dom'
import { confirmarSalir } from './useGuardarAviso'

export function useNavegacionSegura(tieneCambios) {
  const navigate = useNavigate()

  const navegarSeguro = async (ruta) => {
    if (!tieneCambios) { navigate(ruta); return }
    const confirmar = await confirmarSalir()
    if (confirmar) navigate(ruta)
  }

  return navegarSeguro
}