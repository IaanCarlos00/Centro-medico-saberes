import { useEffect, useRef } from 'react'

let _setModalSalir = null
let _resolverSalir = null

export function registrarModalSalir(fn) {
  _setModalSalir = fn
}

export function useGuardarAviso(tieneCambios) {
  const tieneCambiosRef = useRef(tieneCambios)
  tieneCambiosRef.current = tieneCambios

  useEffect(() => {
    const handler = e => {
      if (!tieneCambiosRef.current) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])
}

export async function confirmarSalir() {
  return new Promise(resolve => {
    _resolverSalir = resolve
    _setModalSalir?.(true)
  })
}

export function resolverModal(valor) {
  _resolverSalir?.(valor)
  _setModalSalir?.(false)
}