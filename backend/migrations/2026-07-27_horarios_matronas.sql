-- Migración: horarios semanales por matrona + color por profesional
-- Ejecutar en la base de datos de producción (Railway) antes de desplegar el backend nuevo.

-- 1. Color identificador de cada profesional (usado en la agenda)
ALTER TABLE profesional ADD COLUMN IF NOT EXISTS color VARCHAR(20);

-- Colores ya usados hoy en el calendario (mantener consistencia visual)
UPDATE profesional SET color = '#06b6d4' WHERE id = 1 AND color IS NULL; -- Javiera (celeste)
UPDATE profesional SET color = '#f97316' WHERE id = 2 AND color IS NULL; -- Valentina (naranjo)

-- 2. Horarios semanales fijos por profesional
CREATE TABLE IF NOT EXISTS horario_profesional (
  id SERIAL PRIMARY KEY,
  profesional_id INTEGER NOT NULL REFERENCES profesional(id) ON DELETE CASCADE,
  dia_semana SMALLINT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0=Domingo ... 6=Sábado
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  CHECK (hora_fin > hora_inicio)
);

CREATE INDEX IF NOT EXISTS idx_horario_profesional_dia ON horario_profesional (dia_semana);

-- 3. Datos iniciales según el horario fijo entregado (ajustar los IDs si no coinciden)
--    1 = Javiera, 2 = Valentina
INSERT INTO horario_profesional (profesional_id, dia_semana, hora_inicio, hora_fin) VALUES
  -- Lunes (1)
  (2, 1, '08:00', '16:00'),
  (1, 1, '18:00', '21:00'),
  -- Martes (2)
  (2, 2, '08:00', '14:00'),
  (1, 2, '14:00', '17:00'),
  -- Miércoles (3)
  (1, 3, '11:00', '20:00'),
  -- Jueves (4)
  (2, 4, '11:00', '14:00'),
  (1, 4, '14:00', '16:00'),
  -- Viernes (5)
  (2, 5, '08:00', '11:00'),
  (1, 5, '11:00', '17:00'),
  (2, 5, '17:00', '20:00');
