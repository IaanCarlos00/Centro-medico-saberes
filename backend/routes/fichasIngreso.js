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
        paciente_id, profesional_id, fecha, direccion, paridad, fur, mac, ant_morbidos,
        ant_familiares, ant_ca_mama, medicamentos, tabaco, alcohol, drogas, alergias,
        cirugias, examenes_sangre, ivs, orientacion_sexual, parejas_sexuales,
        pareja_actual, menarquia, its, uso_pstv, eco_tv, pap, presion_arterial,
        peso, altura, efm, especulo, motivo_consulta, indicaciones, observaciones, proximo_control
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,
        $20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35
      ) RETURNING *
    `, [
      f.paciente_id, f.profesional_id, f.fecha || new Date(),
      f.direccion, f.paridad, f.fur, f.mac,
      f.ant_morbidos, f.ant_familiares, f.ant_ca_mama, f.medicamentos, f.tabaco,
      f.alcohol, f.drogas, f.alergias, f.cirugias, f.examenes_sangre, f.ivs,
      f.orientacion_sexual, f.parejas_sexuales, f.pareja_actual, f.menarquia,
      f.its, f.uso_pstv, f.eco_tv, f.pap, f.presion_arterial, f.peso, f.altura,
      f.efm, f.especulo, f.motivo_consulta, f.indicaciones, f.observaciones,
      f.proximo_control || null
    ])
    res.status(201).json(result.rows[0])
  } catch (error) { res.status(500).json({ error: error.message }) }
})

router.put('/1/:id', async (req, res) => {
  const f = req.body
  try {
    const result = await pool.query(`
      UPDATE ficha_ingreso_1 SET
        fecha=$1, direccion=$2, paridad=$3, fur=$4, mac=$5, ant_morbidos=$6,
        ant_familiares=$7, ant_ca_mama=$8, medicamentos=$9, tabaco=$10, alcohol=$11,
        drogas=$12, alergias=$13, cirugias=$14, examenes_sangre=$15, ivs=$16,
        orientacion_sexual=$17, parejas_sexuales=$18, pareja_actual=$19, menarquia=$20,
        its=$21, uso_pstv=$22, eco_tv=$23, pap=$24, presion_arterial=$25, peso=$26,
        altura=$27, efm=$28, especulo=$29, motivo_consulta=$30, indicaciones=$31,
        observaciones=$32, proximo_control=$33
      WHERE id=$34 RETURNING *
    `, [
      f.fecha || new Date(),
      f.direccion, f.paridad, f.fur, f.mac, f.ant_morbidos, f.ant_familiares,
      f.ant_ca_mama, f.medicamentos, f.tabaco, f.alcohol, f.drogas, f.alergias,
      f.cirugias, f.examenes_sangre, f.ivs, f.orientacion_sexual, f.parejas_sexuales,
      f.pareja_actual, f.menarquia, f.its, f.uso_pstv, f.eco_tv, f.pap,
      f.presion_arterial, f.peso, f.altura, f.efm, f.especulo, f.motivo_consulta,
      f.indicaciones, f.observaciones, f.proximo_control || null, req.params.id
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
        paciente_id, profesional_id, fecha, motivo_consulta, edad, gpa, ocupacion, pareja,
        red_apoyo, ant_morbidos, cirugias, alergias, medicamentos, tabaco, alcohol,
        drogas, examenes_sangre, ant_cacu, ant_ca_mama, menarquia, mac, menstruaciones,
        fur, ias, parejas_sexuales, sexo_biologico, its, eco_tv, pap, eco_mam_mamo,
        observaciones, proximo_control
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,
        $20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32
      ) RETURNING *
    `, [
      f.paciente_id, f.profesional_id, f.fecha || new Date(),
      f.motivo_consulta, f.edad, f.gpa, f.ocupacion,
      f.pareja, f.red_apoyo, f.ant_morbidos, f.cirugias, f.alergias, f.medicamentos,
      f.tabaco, f.alcohol, f.drogas, f.examenes_sangre, f.ant_cacu, f.ant_ca_mama,
      f.menarquia, f.mac, f.menstruaciones, f.fur, f.ias, f.parejas_sexuales,
      f.sexo_biologico, f.its, f.eco_tv, f.pap, f.eco_mam_mamo, f.observaciones,
      f.proximo_control || null
    ])
    res.status(201).json(result.rows[0])
  } catch (error) { res.status(500).json({ error: error.message }) }
})

router.put('/2/:id', async (req, res) => {
  const f = req.body
  try {
    const result = await pool.query(`
      UPDATE ficha_ingreso_2 SET
        fecha=$1, motivo_consulta=$2, edad=$3, gpa=$4, ocupacion=$5, pareja=$6, red_apoyo=$7,
        ant_morbidos=$8, cirugias=$9, alergias=$10, medicamentos=$11, tabaco=$12,
        alcohol=$13, drogas=$14, examenes_sangre=$15, ant_cacu=$16, ant_ca_mama=$17,
        menarquia=$18, mac=$19, menstruaciones=$20, fur=$21, ias=$22,
        parejas_sexuales=$23, sexo_biologico=$24, its=$25, eco_tv=$26, pap=$27,
        eco_mam_mamo=$28, observaciones=$29, proximo_control=$30
      WHERE id=$31 RETURNING *
    `, [
      f.fecha || new Date(),
      f.motivo_consulta, f.edad, f.gpa, f.ocupacion, f.pareja, f.red_apoyo,
      f.ant_morbidos, f.cirugias, f.alergias, f.medicamentos, f.tabaco, f.alcohol,
      f.drogas, f.examenes_sangre, f.ant_cacu, f.ant_ca_mama, f.menarquia, f.mac,
      f.menstruaciones, f.fur, f.ias, f.parejas_sexuales, f.sexo_biologico, f.its,
      f.eco_tv, f.pap, f.eco_mam_mamo, f.observaciones, f.proximo_control || null,
      req.params.id
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