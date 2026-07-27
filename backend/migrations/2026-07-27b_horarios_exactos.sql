-- Reemplaza el modelo de "rangos" por horas exactas de cita, con sobrecupo (colación con excepción)

DROP TABLE IF EXISTS horario_profesional;

CREATE TABLE horario_profesional (
  id SERIAL PRIMARY KEY,
  profesional_id INTEGER NOT NULL REFERENCES profesional(id) ON DELETE CASCADE,
  dia_semana SMALLINT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0=Domingo ... 6=Sábado
  hora TIME NOT NULL,
  sobrecupo BOOLEAN NOT NULL DEFAULT false, -- true = solo si un paciente cancela / hay espacio
  UNIQUE (profesional_id, dia_semana, hora)
);

CREATE INDEX idx_horario_profesional_dia ON horario_profesional (dia_semana);

-- 1 = Javiera (celeste), 2 = Valentina (naranjo)

INSERT INTO horario_profesional (profesional_id, dia_semana, hora, sobrecupo) VALUES
-- Valentina — Lunes
(2,1,'08:30',false),(2,1,'09:15',false),(2,1,'10:00',false),(2,1,'10:45',false),(2,1,'11:30',false),(2,1,'12:15',false),
(2,1,'13:00',true),
(2,1,'14:00',false),(2,1,'14:45',false),(2,1,'15:30',false),
-- Valentina — Martes
(2,2,'08:30',false),(2,2,'09:15',false),(2,2,'10:00',false),(2,2,'10:45',false),(2,2,'11:30',false),(2,2,'12:15',false),
(2,2,'13:00',true),(2,2,'13:30',true),
-- Valentina — Miércoles: sin horas
-- Valentina — Jueves
(2,4,'11:30',false),(2,4,'12:15',false),
(2,4,'13:00',true),
-- Valentina — Viernes
(2,5,'08:30',false),(2,5,'09:15',false),(2,5,'10:00',false),
(2,5,'17:00',false),(2,5,'17:30',false),(2,5,'18:00',false),(2,5,'18:30',false),(2,5,'19:00',false),(2,5,'19:30',false),

-- Javiera — Lunes
(1,1,'18:00',false),(1,1,'18:30',false),(1,1,'19:00',false),(1,1,'19:30',false),(1,1,'20:00',false),(1,1,'20:30',false),
-- Javiera — Martes
(1,2,'14:45',false),(1,2,'15:30',false),(1,2,'16:45',false),
-- Javiera — Miércoles
(1,3,'11:30',false),(1,3,'12:15',false),
(1,3,'13:00',true),
(1,3,'14:00',false),(1,3,'14:45',false),(1,3,'15:30',false),(1,3,'16:15',false),(1,3,'17:00',false),(1,3,'17:45',false),(1,3,'18:30',false),(1,3,'19:15',false),
-- Javiera — Jueves
(1,4,'13:45',false),(1,4,'14:30',false),(1,4,'15:15',false),
-- Javiera — Viernes
(1,5,'11:30',false),(1,5,'12:15',false),
(1,5,'13:00',true),
(1,5,'14:00',false),(1,5,'14:45',false),(1,5,'15:30',false),(1,5,'16:15',false);
