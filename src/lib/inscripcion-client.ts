'use client';

import { createClient } from '@supabase/supabase-js';

// Cliente Supabase para el navegador (evita error 1016 Cloudflare Workers ↔ Supabase)
const supabaseUrl = 'https://ijqalxopeqyqfzwpfmfj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqcWFseG9wZXF5cWZ6d3BmbWZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2OTk3ODksImV4cCI6MjEwMTI3NTc4OX0.aBusNxkym2JqjXRaKtgHPA-K1cywsb4CqK9NCRvpRw0';

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Generar código de inscripción único
function generarCodigo(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let codigo = 'LC-';
  for (let i = 0; i < 6; i++) {
    codigo += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return codigo;
}

export interface InscripcionData {
  nacionalidad: string;
  tipoIdentificacion: string;
  numeroIdentificacion: string;
  nombre: string;
  primerApellido: string;
  segundoApellido: string;
  celular: string;
  email: string;
  fechaNacimiento: string;
  genero: string;
  provincia: string;
  equipo: string;
  tipoLicencia: string;
  uciId: string;
  evento: string;
  categoria: string;
  beneficiarioNombre: string;
  beneficiarioCedula: string;
  beneficiarioTelefono: string;
  beneficiarioParentesco: string;
  metodoPago: string;
  requiereFactura: boolean;
  facturaNombre: string;
  facturaCedula: string;
  facturaEmail: string;
  comprobante: File | null;
  estadoPagoInicial?: 'pendiente' | 'confirmado';
}

export async function guardarInscripcion(datos: InscripcionData): Promise<{ codigoInscripcion: string }> {
  const codigoInscripcion = generarCodigo();

  // Subir comprobante si existe
  let comprobanteUrl: string | null = null;
  if (datos.comprobante && datos.metodoPago === 'Sinpe') {
    const file = datos.comprobante;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('comprobantes')
      .upload(fileName, file, { contentType: file.type });

    if (!uploadError && uploadData) {
      const { data: urlData } = supabaseClient.storage
        .from('comprobantes')
        .getPublicUrl(uploadData.path);
      comprobanteUrl = urlData.publicUrl;
    }
  }

  // Insertar inscripción
  const { error } = await supabaseClient
    .from('inscripciones')
    .insert({
      codigo_inscripcion: codigoInscripcion,
      nacionalidad: datos.nacionalidad,
      tipo_identificacion: datos.tipoIdentificacion,
      numero_identificacion: datos.numeroIdentificacion,
      nombre: datos.nombre,
      primer_apellido: datos.primerApellido,
      segundo_apellido: datos.segundoApellido,
      celular: datos.celular,
      email: datos.email,
      fecha_nacimiento: datos.fechaNacimiento,
      genero: datos.genero,
      provincia: datos.provincia,
      equipo: datos.equipo,
      tipo_licencia: datos.tipoLicencia,
      uci_id: datos.uciId,
      evento: datos.evento,
      categoria: datos.categoria,
      beneficiario_nombre: datos.beneficiarioNombre,
      beneficiario_cedula: datos.beneficiarioCedula,
      beneficiario_telefono: datos.beneficiarioTelefono,
      beneficiario_parentesco: datos.beneficiarioParentesco,
      metodo_pago: datos.metodoPago,
      comprobante_sinpe_url: comprobanteUrl,
      requiere_factura: datos.requiereFactura,
      factura_nombre: datos.facturaNombre,
      factura_cedula: datos.facturaCedula,
      factura_email: datos.facturaEmail,
      estado_pago: datos.estadoPagoInicial || 'pendiente',
    });

  if (error) {
    throw new Error(`Error al guardar: ${error.message}`);
  }

  return { codigoInscripcion };
}


export interface InscripcionKidsData {
  nacionalidad: string;
  tipoIdentificacion: string;
  numeroIdentificacion: string;
  nombre: string;
  primerApellido: string;
  segundoApellido: string;
  fechaNacimiento: string;
  genero: string;
  provincia: string;
  lateralidad: string;
  categoria: string;
  encargadoNombre: string;
  encargadoCedula: string;
  encargadoTelefono: string;
  encargadoEmail: string;
  encargadoParentesco: string;
  metodoPago: string;
  requiereFactura: boolean;
  facturaNombre: string;
  facturaCedula: string;
  facturaEmail: string;
  comprobante: File | null;
  estadoPagoInicial?: 'pendiente' | 'confirmado';
}

export async function guardarInscripcionKids(datos: InscripcionKidsData): Promise<{ codigoInscripcion: string }> {
  const codigoInscripcion = generarCodigo();

  // Subir comprobante si existe
  let comprobanteUrl: string | null = null;
  if (datos.comprobante && datos.metodoPago === 'Sinpe') {
    const file = datos.comprobante;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('comprobantes')
      .upload(fileName, file, { contentType: file.type });

    if (!uploadError && uploadData) {
      const { data: urlData } = supabaseClient.storage
        .from('comprobantes')
        .getPublicUrl(uploadData.path);
      comprobanteUrl = urlData.publicUrl;
    }
  }

  // Insertar inscripción Kids
  const { error } = await supabaseClient
    .from('inscripciones')
    .insert({
      codigo_inscripcion: codigoInscripcion,
      nacionalidad: datos.nacionalidad,
      tipo_identificacion: datos.tipoIdentificacion,
      numero_identificacion: datos.numeroIdentificacion,
      nombre: datos.nombre,
      primer_apellido: datos.primerApellido,
      segundo_apellido: datos.segundoApellido,
      celular: '',
      email: datos.encargadoEmail,
      fecha_nacimiento: datos.fechaNacimiento,
      genero: datos.genero,
      provincia: datos.provincia,
      equipo: '',
      tipo_licencia: '',
      uci_id: '',
      evento: 'Copa Kids',
      categoria: datos.categoria,
      beneficiario_nombre: datos.encargadoNombre,
      beneficiario_cedula: datos.encargadoCedula,
      beneficiario_telefono: datos.encargadoTelefono,
      beneficiario_parentesco: datos.encargadoParentesco,
      metodo_pago: datos.metodoPago,
      comprobante_sinpe_url: comprobanteUrl,
      requiere_factura: datos.requiereFactura,
      factura_nombre: datos.facturaNombre,
      factura_cedula: datos.facturaCedula,
      factura_email: datos.facturaEmail,
      estado_pago: datos.estadoPagoInicial || 'pendiente',
    });

  if (error) {
    throw new Error(`Error al guardar: ${error.message}`);
  }

  return { codigoInscripcion };
}
