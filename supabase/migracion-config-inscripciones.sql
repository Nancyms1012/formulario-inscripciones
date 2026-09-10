-- Migración: configuración de apertura/cierre de inscripciones por grupo
-- Ejecutar este SQL en el SQL Editor de Supabase (una sola vez)

CREATE TABLE IF NOT EXISTS config_inscripciones (
  grupo TEXT PRIMARY KEY,          -- 'copa' o 'kids'
  abierto BOOLEAN NOT NULL DEFAULT TRUE,   -- interruptor manual
  cierre_at TIMESTAMPTZ,           -- fecha/hora de cierre automático (opcional, NULL = sin fecha)
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Filas iniciales para ambos grupos (abiertas, sin fecha de cierre)
INSERT INTO config_inscripciones (grupo, abierto, cierre_at)
VALUES ('copa', TRUE, NULL), ('kids', TRUE, NULL)
ON CONFLICT (grupo) DO NOTHING;

-- Sin RLS (igual que el resto del proyecto)
ALTER TABLE config_inscripciones DISABLE ROW LEVEL SECURITY;
