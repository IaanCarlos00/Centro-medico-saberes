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

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Rutas
app.use('/pacientes', pacientesRouter);
app.use('/profesionales', profesionalesRouter);
app.use('/citas', citasRouter);
app.use('/fichas', fichasRouter);
app.use('/auth', authRouter);
app.use('/dashboard', dashboardRouter);
app.use('/fichas-ingreso', fichasIngresoRouter);
app.use('/pagos', pagosRouter);
app.use('/bloqueos', bloqueosRouter);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ mensaje: 'Backend centro médico funcionando' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});