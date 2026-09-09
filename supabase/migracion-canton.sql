-- Migración: agregar columna cantón
-- Ejecutar en el SQL Editor de Supabase

ALTER TABLE inscripciones
  ADD COLUMN IF NOT EXISTS canton VARCHAR(60) DEFAULT '';
