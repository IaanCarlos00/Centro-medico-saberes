const express = require('express');
const cors = require('cors');
const pool = require('./db');

const pacientesRouter = require('./routes/pacientes');
const profesionalesRouter = require('./routes/profesionales');
const citasRouter = require('./routes/citas');
const fichasRouter = require('./routes/fichas');
const authRouter = require('./routes/auth');
const dashboardRouter = require('./routes/dashboard');
const fichasIngresoRouter = require('./routes/fichasIngreso');
const pagosRouter = require('./routes/pagos');
const bloqueosRouter = require('./routes/bloqueos');
const procedimientosRouter = require('./routes/procedimientos');
const papRouter = require('./routes/pap');
const flujosRouter = require('./routes/flujos');
const encuestasRouter = require('./routes/encuestas');
const archivosRouter = require('./routes/archivos');
const logsRouter = require('./routes/logs');
const auth = require('./middleware/auth');
const reportesRouter = require('./routes/reportes');
const asistente = require('./routes/asistente');

const app = express();
const PORT = 3000;

app.use(cors({
  origin: [
    'https://centro-medico-saberes.vercel.app',
    'https://saberes.cl',
    'https://www.saberes.cl',
    'http://centro.saberes.cl',
  ]
}));
app.use(express.json());

// Rutas públicas (sin token)
app.use('/auth', authRouter);
app.use('/encuestas', encuestasRouter);

// Rutas protegidas (requieren token)
app.use('/pacientes', auth, pacientesRouter);
app.use('/profesionales', auth, profesionalesRouter);
app.use('/citas', auth, citasRouter);
app.use('/fichas', auth, fichasRouter);
app.use('/dashboard', auth, dashboardRouter);
app.use('/fichas-ingreso', auth, fichasIngresoRouter);
app.use('/pagos', auth, pagosRouter);
app.use('/bloqueos', auth, bloqueosRouter);
app.use('/procedimientos', auth, procedimientosRouter);
app.use('/pap', auth, papRouter);
app.use('/flujos', auth, flujosRouter);
app.use('/archivos', auth, archivosRouter);
app.use('/logs', auth, logsRouter);
app.use('/reportes', auth, reportesRouter);
app.use('/asistente', asistente);


// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ mensaje: 'Backend centro médico funcionando' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});