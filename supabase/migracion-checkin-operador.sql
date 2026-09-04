-- Migración: registrar quién aplicó el check-in (operador) por día
-- Ejecutar en el SQL Editor de Supabase

ALTER TABLE inscripciones
  ADD COLUMN IF NOT EXISTS checkin_xcc_por VARCHAR(120),
  ADD COLUMN IF NOT EXISTS checkin_xco_por VARCHAR(120);
