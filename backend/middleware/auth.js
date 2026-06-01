const jwt = require('jsonwebtoken')
const SECRET = process.env.JWT_SECRET || 'saberes_secret_key'

module.exports = (req, res, next) => {
  const header = req.headers.authorization
  if (!header) return res.status(401).json({ error: 'No autorizado' })
  const token = header.split(' ')[1]
  try {
    req.usuario = jwt.verify(token, SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' })
  }
}