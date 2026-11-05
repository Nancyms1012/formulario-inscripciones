-- ============================================================
-- TABLA HISTÓRICA DE INSCRIPCIONES (para el consolidado por fecha)
-- ============================================================
-- Guarda las inscripciones de fechas YA PASADAS (ej. VI Fecha), con una columna
-- `fecha_evento` que identifica a qué fecha pertenece ("VI", "VII", ...).
-- Así el Admin puede comparar varias fechas sin perder datos al limpiar `inscripciones`.
--
-- Cómo correrlo: Supabase → SQL Editor → New query → pegar TODO → Run.
-- Es seguro volver a correrlo (IF NOT EXISTS).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.inscripciones_historico (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha_evento          text NOT NULL,            -- "VI", "VII", ...
  codigo_inscripcion    text,
  nacionalidad          text,
  tipo_identificacion   text,
  numero_identificacion text,                     -- cédula (clave para cruzar corredores)
  nombre                text,
  primer_apellido       text,
  segundo_apellido      text,
  celular               text,
  email                 text,
  fecha_nacimiento      text,
  genero                text,
  provincia             text,
  canton                text,
  equipo                text,
  tipo_licencia         text,
  uci_id                text,
  evento                text,                     -- XCO / XCC / XCO+XCC / Copa Kids / ...
  categoria             text,
  metodo_pago           text,
  estado_pago           text,
  requiere_factura      boolean DEFAULT false,
  dorsal                text,
  fecha_inscripcion     text,                     -- created_at original
  cargado_en            timestamptz DEFAULT now()
);

-- La app opera con la anon key desde el navegador (igual que el resto del proyecto),
-- por eso RLS debe quedar DESHABILITADO o el Admin no podría leer/escribir.
ALTER TABLE public.inscripciones_historico DISABLE ROW LEVEL SECURITY;

-- Índices para consultas rápidas del consolidado
CREATE INDEX IF NOT EXISTS idx_hist_fecha   ON public.inscripciones_historico (fecha_evento);
CREATE INDEX IF NOT EXISTS idx_hist_cedula  ON public.inscripciones_historico (numero_identificacion);

-- Verificación
SELECT 'Tabla inscripciones_historico lista' AS resultado;
