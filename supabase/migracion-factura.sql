-- Migración: agregar columnas de Factura Electrónica
-- Ejecutar este SQL en el SQL Editor de Supabase (una sola vez)

ALTER TABLE inscripciones
  ADD COLUMN IF NOT EXISTS factura_nombre VARCHAR(200) DEFAULT '',
  ADD COLUMN IF NOT EXISTS factura_celular VARCHAR(30) DEFAULT '',
  ADD COLUMN IF NOT EXISTS factura_email VARCHAR(150) DEFAULT '';
