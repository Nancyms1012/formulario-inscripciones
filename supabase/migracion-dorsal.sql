-- Migración: agregar columna dorsal
-- Ejecutar en el SQL Editor de Supabase

ALTER TABLE inscripciones
  ADD COLUMN IF NOT EXISTS dorsal VARCHAR(10) DEFAULT '';
