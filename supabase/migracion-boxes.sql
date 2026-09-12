-- Migración: parrilla de salida por boxes
-- Ejecutar este SQL en el SQL Editor de Supabase (una sola vez)

CREATE TABLE IF NOT EXISTS boxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dorsal TEXT NOT NULL,                 -- número de dorsal (RaceNr del archivo)
  nombre_archivo TEXT DEFAULT '',       -- nombre tal como viene en el archivo (referencia)
  categoria TEXT DEFAULT '',            -- categoría del archivo
  box TEXT NOT NULL,                    -- "BOX 1", "BOX 2", ...
  hora_salida TEXT NOT NULL,            -- "08:00", "08:35", ... (HH:MM)
  orden INTEGER NOT NULL,               -- orden de aparición en el archivo (respetar)
  en_box BOOLEAN DEFAULT FALSE,         -- el corredor está en el box (2do check)
  en_box_por TEXT,                      -- operador que marcó "en el box"
  en_box_fecha TIMESTAMPTZ,
  salida_final BOOLEAN DEFAULT FALSE,   -- check final del comisario de salida
  salida_final_por TEXT,
  salida_final_fecha TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas del filtro hora + box
CREATE INDEX IF NOT EXISTS idx_boxes_hora ON boxes(hora_salida);
CREATE INDEX IF NOT EXISTS idx_boxes_box ON boxes(box);
CREATE INDEX IF NOT EXISTS idx_boxes_dorsal ON boxes(dorsal);
CREATE INDEX IF NOT EXISTS idx_boxes_orden ON boxes(orden);

-- IMPORTANTE: RLS deshabilitado (igual que el resto del proyecto, todo va por el navegador)
ALTER TABLE boxes DISABLE ROW LEVEL SECURITY;
