-- Migración: cambiar factura_celular por factura_cedula
-- Ejecutar en el SQL Editor de Supabase

-- Agregar la nueva columna de cédula para factura
ALTER TABLE inscripciones
  ADD COLUMN IF NOT EXISTS factura_cedula VARCHAR(30) DEFAULT '';

-- (Opcional) Copiar datos existentes de celular a cédula si los hubiera
-- UPDATE inscripciones SET factura_cedula = factura_celular WHERE factura_celular <> '';

-- (Opcional) Eliminar la columna vieja de celular
-- ALTER TABLE inscripciones DROP COLUMN IF EXISTS factura_celular;
