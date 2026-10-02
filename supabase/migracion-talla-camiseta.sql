-- Migración: agregar columna de talla de camiseta (solo se usa en Copa Kids)
-- Ejecutar este SQL en el SQL Editor de Supabase (una sola vez)
-- La columna es nullable para no afectar las inscripciones de La Copa (adultos)

ALTER TABLE inscripciones
  ADD COLUMN IF NOT EXISTS talla_camiseta VARCHAR(10);
