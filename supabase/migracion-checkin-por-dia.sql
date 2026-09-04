-- Migración: check-in separado por día (XCC sábado / XCO domingo)
-- Ejecutar en el SQL Editor de Supabase

ALTER TABLE inscripciones
  ADD COLUMN IF NOT EXISTS checkin_xcc BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS checkin_xcc_fecha TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS checkin_xco BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS checkin_xco_fecha TIMESTAMP WITH TIME ZONE;
