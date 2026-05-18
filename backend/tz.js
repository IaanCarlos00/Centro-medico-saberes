const { Client } = require('pg')
const client = new Client({
  connectionString: 'postgresql://postgres:rarbAqBBQmGGHYcbpeJigNOaetZTGYLD@switchback.proxy.rlwy.net:55769/railway',
  ssl: { rejectUnauthorized: false }
})

client.connect()
  .then(() => client.query('SHOW timezone'))
  .then(r => console.log(r.rows))
  .then(() => client.end())