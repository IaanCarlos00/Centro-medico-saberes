// Bloquea el acceso a rutas relacionadas con dinero (pagos, reportes financieros)
// para el rol "matrona". Se usa junto al middleware auth, que ya deja req.usuario.
module.exports = (req, res, next) => {
  if (req.usuario?.rol === 'matrona') {
    return res.status(403).json({ error: 'No tienes permisos para ver esta información' })
  }
  next()
}
