// Bloquea el acceso a rutas relacionadas con dinero (pagos, reportes financieros).
// Es un permiso individual (usuario.ver_finanzas), no por rol: por defecto los
// usuarios nuevos con rol "matrona" no lo tienen, pero se puede activar caso a
// caso desde la pantalla de Usuarios para quienes sí deban verlo.
module.exports = (req, res, next) => {
  if (req.usuario?.rol === 'matrona' && !req.usuario?.ver_finanzas) {
    return res.status(403).json({ error: 'No tienes permisos para ver esta información' })
  }
  next()
}
