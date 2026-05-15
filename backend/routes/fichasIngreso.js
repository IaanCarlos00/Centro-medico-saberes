const express = require('express')
const router = express.Router()
const pool = require('../db')

// ===== FICHA INGRESO 1 =====
router.get('/1/paciente/:paciente_id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT f.*, pr.nombre AS profesional_nombre, pr.apellido AS profesional_apellido
      FROM ficha_ingreso_1 f
      JOIN profesional pr ON f.profesional_id = pr.id
      WHERE f.paciente_id = $1 ORDER BY f.fecha DESC
    `, [req.params.paciente_id])
    res.json(result.rows)
  } catch (error) { res.status(500).json({ error: error.message }) }
})

router.post('/1', async (req, res) => {
  const f = req.body
  try {
    const result = await pool.query(`
      INSERT INTO ficha_ingreso_1 (
        paciente_id, profesional_id, direccion, paridad, fur, mac, ant_morbidos,
        ant_familiares, ant_ca_mama, medicamentos, tabaco, alcohol, drogas, alergias,
        cirugias, examenes_sangre, ivs, orientacion_sexual, parejas_sexuales,
        pareja_actual, menarquia, its, uso_pstv, eco_tv, pap, presion_arterial,
        peso, altura, efm, especulo, motivo_consulta, indicaciones, observaciones
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,
        $20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33
      ) RETURNING *
    `, [
      f.paciente_id, f.profesional_id, f.direccion, f.paridad, f.fur, f.mac,
      f.ant_morbidos, f.ant_familiares, f.ant_ca_mama, f.medicamentos, f.tabaco,
      f.alcohol, f.drogas, f.alergias, f.cirugias, f.examenes_sangre, f.ivs,
      f.orientacion_sexual, f.parejas_sexuales, f.pareja_actual, f.menarquia,
      f.its, f.uso_pstv, f.eco_tv, f.pap, f.presion_arterial, f.peso, f.altura,
      f.efm, f.especulo, f.motivo_consulta, f.indicaciones, f.observaciones
    ])
    res.status(201).json(result.rows[0])
  } catch (error) { res.status(500).json({ error: error.message }) }
})

router.put('/1/:id', async (req, res) => {
  const f = req.body
  try {
    const result = await pool.query(`
      UPDATE ficha_ingreso_1 SET
        direccion=$1, paridad=$2, fur=$3, mac=$4, ant_morbidos=$5,
        ant_familiares=$6, ant_ca_mama=$7, medicamentos=$8, tabaco=$9, alcohol=$10,
        drogas=$11, alergias=$12, cirugias=$13, examenes_sangre=$14, ivs=$15,
        orientacion_sexual=$16, parejas_sexuales=$17, pareja_actual=$18, menarquia=$19,
        its=$20, uso_pstv=$21, eco_tv=$22, pap=$23, presion_arterial=$24, peso=$25,
        altura=$26, efm=$27, especulo=$28, motivo_consulta=$29, indicaciones=$30,
        observaciones=$31
      WHERE id=$32 RETURNING *
    `, [
      f.direccion, f.paridad, f.fur, f.mac, f.ant_morbidos, f.ant_familiares,
      f.ant_ca_mama, f.medicamentos, f.tabaco, f.alcohol, f.drogas, f.alergias,
      f.cirugias, f.examenes_sangre, f.ivs, f.orientacion_sexual, f.parejas_sexuales,
      f.pareja_actual, f.menarquia, f.its, f.uso_pstv, f.eco_tv, f.pap,
      f.presion_arterial, f.peso, f.altura, f.efm, f.especulo, f.motivo_consulta,
      f.indicaciones, f.observaciones, req.params.id
    ])
    res.json(result.rows[0])
  } catch (error) { res.status(500).json({ error: error.message }) }
})

router.delete('/1/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM ficha_ingreso_1 WHERE id=$1', [req.params.id])
    res.json({ mensaje: 'Ficha eliminada' })
  } catch (error) { res.status(500).json({ error: error.message }) }
})

// ===== FICHA INGRESO 2 =====
router.get('/2/paciente/:paciente_id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT f.*, pr.nombre AS profesional_nombre, pr.apellido AS profesional_apellido
      FROM ficha_ingreso_2 f
      JOIN profesional pr ON f.profesional_id = pr.id
      WHERE f.paciente_id = $1 ORDER BY f.fecha DESC
    `, [req.params.paciente_id])
    res.json(result.rows)
  } catch (error) { res.status(500).json({ error: error.message }) }
})

router.post('/2', async (req, res) => {
  const f = req.body
  try {
    const result = await pool.query(`
      INSERT INTO ficha_ingreso_2 (
        paciente_id, profesional_id, motivo_consulta, edad, gpa, ocupacion, pareja,
        red_apoyo, ant_morbidos, cirugias, alergias, medicamentos, tabaco, alcohol,
        drogas, examenes_sangre, ant_cacu, ant_ca_mama, menarquia, mac, menstruaciones,
        fur, ias, parejas_sexuales, sexo_biologico, its, eco_tv, pap, eco_mam_mamo, observaciones
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,
        $20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30
      ) RETURNING *
    `, [
      f.paciente_id, f.profesional_id, f.motivo_consulta, f.edad, f.gpa, f.ocupacion,
      f.pareja, f.red_apoyo, f.ant_morbidos, f.cirugias, f.alergias, f.medicamentos,
      f.tabaco, f.alcohol, f.drogas, f.examenes_sangre, f.ant_cacu, f.ant_ca_mama,
      f.menarquia, f.mac, f.menstruaciones, f.fur, f.ias, f.parejas_sexuales,
      f.sexo_biologico, f.its, f.eco_tv, f.pap, f.eco_mam_mamo, f.observaciones
    ])
    res.status(201).json(result.rows[0])
  } catch (error) { res.status(500).json({ error: error.message }) }
})

router.put('/2/:id', async (req, res) => {
  const f = req.body
  try {
    const result = await pool.query(`
      UPDATE ficha_ingreso_2 SET
        motivo_consulta=$1, edad=$2, gpa=$3, ocupacion=$4, pareja=$5, red_apoyo=$6,
        ant_morbidos=$7, cirugias=$8, alergias=$9, medicamentos=$10, tabaco=$11,
        alcohol=$12, drogas=$13, examenes_sangre=$14, ant_cacu=$15, ant_ca_mama=$16,
        menarquia=$17, mac=$18, menstruaciones=$19, fur=$20, ias=$21,
        parejas_sexuales=$22, sexo_biologico=$23, its=$24, eco_tv=$25, pap=$26,
        eco_mam_mamo=$27, observaciones=$28
      WHERE id=$29 RETURNING *
    `, [
      f.motivo_consulta, f.edad, f.gpa, f.ocupacion, f.pareja, f.red_apoyo,
      f.ant_morbidos, f.cirugias, f.alergias, f.medicamentos, f.tabaco, f.alcohol,
      f.drogas, f.examenes_sangre, f.ant_cacu, f.ant_ca_mama, f.menarquia, f.mac,
      f.menstruaciones, f.fur, f.ias, f.parejas_sexuales, f.sexo_biologico, f.its,
      f.eco_tv, f.pap, f.eco_mam_mamo, f.observaciones, req.params.id
    ])
    res.json(result.rows[0])
  } catch (error) { res.status(500).json({ error: error.message }) }
})

router.delete('/2/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM ficha_ingreso_2 WHERE id=$1', [req.params.id])
    res.json({ mensaje: 'Ficha eliminada' })
  } catch (error) { res.status(500).json({ error: error.message }) }
})

module.exports = router