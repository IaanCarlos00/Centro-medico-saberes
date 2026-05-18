const { Client } = require('pg')
const client = new Client({
  connectionString: 'postgresql://postgres:rarbAqBBQmGGHYcbpeJigNOaetZTGYLD@switchback.proxy.rlwy.net:55769/railway',
  ssl: { rejectUnauthorized: false }
})

client.connect()
  .then(() => client.query('SELECT id, fecha_inicio, fecha_fin FROM bloqueo_horario ORDER BY id DESC LIMIT 3'))
  .then(r => console.log(r.rows))
  .then(() => client.end())