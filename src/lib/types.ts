export interface InscripcionFormData {
  // Datos Personales
  tipoIdentificacion: string;
  numeroIdentificacion: string;
  nombre: string;
  primerApellido: string;
  segundoApellido: string;
  celular: string;
  email: string;
  fechaNacimientoDia: string;
  fechaNacimientoMes: string;
  fechaNacimientoAnio: string;
  genero: 'F' | 'M' | '';
  provincia: string;

  // Datos de la Carrera
  evento: string;
  categoria: string;

  // Datos Beneficiario
  beneficiarioNombre: string;
  beneficiarioCedula: string;
  beneficiarioParentesco: string;

  // Pago
  metodoPago: string;
  comprobanteSinpe: File | null;
  requiereFactura: boolean;

  // Términos
  aceptaTerminos: boolean;
}

export interface Inscripcion {
  id: string;
  codigo_inscripcion: string;
  tipo_identificacion: string;
  numero_identificacion: string;
  nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  celular: string;
  email: string;
  fecha_nacimiento: string;
  genero: string;
  provincia: string;
  evento: string;
  categoria: string;
  beneficiario_nombre: string;
  beneficiario_cedula: string;
  beneficiario_parentesco: string;
  metodo_pago: string;
  comprobante_sinpe_url: string | null;
  requiere_factura: boolean;
  estado_pago: 'pendiente' | 'confirmado';
  checkin: boolean;
  checkin_fecha: string | null;
  created_at: string;
}
