-- Esquema de base de datos para La Copa - Formulario de Inscripciones
-- Ejecutar este SQL en el SQL Editor de Supabase

-- Tabla principal de inscripciones
CREATE TABLE IF NOT EXISTS inscripciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_inscripcion VARCHAR(20) UNIQUE NOT NULL,
  
  -- Datos Personales
  nacionalidad VARCHAR(20) NOT NULL,
  tipo_identificacion VARCHAR(20) NOT NULL,
  numero_identificacion VARCHAR(50) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  primer_apellido VARCHAR(100) NOT NULL,
  segundo_apellido VARCHAR(100) NOT NULL,
  celular VARCHAR(30) NOT NULL,
  email VARCHAR(150) NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  genero VARCHAR(1) NOT NULL CHECK (genero IN ('F', 'M')),
  lateralidad VARCHAR(20) NOT NULL,
  provincia VARCHAR(50) NOT NULL,
  
  -- Datos de la Carrera
  equipo VARCHAR(100) DEFAULT '',
  tipo_licencia VARCHAR(20) NOT NULL,
  uci_id VARCHAR(50) DEFAULT '',
  evento VARCHAR(20) NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  
  -- Datos Beneficiario
  beneficiario_nombre VARCHAR(200) NOT NULL,
  beneficiario_cedula VARCHAR(50) NOT NULL,
  beneficiario_telefono VARCHAR(30) NOT NULL,
  beneficiario_parentesco VARCHAR(50) NOT NULL,
  
  -- Pago
  metodo_pago VARCHAR(20) NOT NULL CHECK (metodo_pago IN ('Tarjeta', 'Sinpe', 'Efectivo')),
  comprobante_sinpe_url TEXT,
  requiere_factura BOOLEAN DEFAULT FALSE,
  factura_nombre VARCHAR(200) DEFAULT '',
  factura_celular VARCHAR(30) DEFAULT '',
  factura_email VARCHAR(150) DEFAULT '',
  estado_pago VARCHAR(20) DEFAULT 'pendiente' CHECK (estado_pago IN ('pendiente', 'confirmado')),
  
  -- Check-in
  checkin BOOLEAN DEFAULT FALSE,
  checkin_fecha TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsquedas frecuentes
CREATE INDEX idx_inscripciones_evento ON inscripciones(evento);
CREATE INDEX idx_inscripciones_categoria ON inscripciones(categoria);
CREATE INDEX idx_inscripciones_codigo ON inscripciones(codigo_inscripcion);
CREATE INDEX idx_inscripciones_email ON inscripciones(email);
CREATE INDEX idx_inscripciones_checkin ON inscripciones(checkin);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
CREATE TRIGGER update_inscripciones_updated_at
  BEFORE UPDATE ON inscripciones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS deshabilitado por ahora (habilitar cuando se agregue autenticación)
ALTER TABLE inscripciones DISABLE ROW LEVEL SECURITY;
