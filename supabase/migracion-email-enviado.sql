-- Migración: marcar si el correo de confirmación fue enviado
-- Ejecutar este SQL en el SQL Editor de Supabase (una sola vez)

ALTER TABLE inscripciones
  ADD COLUMN IF NOT EXISTS email_enviado BOOLEAN DEFAULT FALSE;

-- Las inscripciones existentes (antes de esta migración) se marcan como enviadas
-- para no reenviarles el correo por error. Ajustá esto si preferís reenviar a todos.
UPDATE inscripciones SET email_enviado = TRUE WHERE email_enviado IS NULL OR email_enviado = FALSE;
