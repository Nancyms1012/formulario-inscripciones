-- Tabla para el contador de visitas de la página de inscritos
-- Ejecutar en el SQL Editor de Supabase

CREATE TABLE IF NOT EXISTS contador_visitas (
  id TEXT PRIMARY KEY,
  total INTEGER NOT NULL DEFAULT 0
);

-- Insertar el contador inicial para la página de inscritos
INSERT INTO contador_visitas (id, total)
VALUES ('inscritos', 0)
ON CONFLICT (id) DO NOTHING;

-- Función para incrementar el contador de forma atómica
CREATE OR REPLACE FUNCTION incrementar_visita(contador_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  nuevo_total INTEGER;
BEGIN
  UPDATE contador_visitas
  SET total = total + 1
  WHERE id = contador_id
  RETURNING total INTO nuevo_total;
  RETURN nuevo_total;
END;
$$ LANGUAGE plpgsql;

-- Sin RLS (acceso público de lectura/escritura para el contador)
ALTER TABLE contador_visitas DISABLE ROW LEVEL SECURITY;
