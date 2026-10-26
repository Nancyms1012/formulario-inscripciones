'use client';

import { createClient } from '@supabase/supabase-js';

// Cliente Supabase para el navegador (evita error 1016 Cloudflare Workers ↔ Supabase)
const supabaseUrl = 'https://ijqalxopeqyqfzwpfmfj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqcWFseG9wZXF5cWZ6d3BmbWZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2OTk3ODksImV4cCI6MjEwMTI3NTc4OX0.aBusNxkym2JqjXRaKtgHPA-K1cywsb4CqK9NCRvpRw0';

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Cupo máximo total para Copa Kids
export const CUPO_MAXIMO_KIDS = 150;

/**
 * Devuelve cuántos inscritos hay en Copa Kids y cuántos cupos quedan (sobre CUPO_MAXIMO_KIDS).
 */
export async function getCuposKids(): Promise<{ inscritos: number; disponibles: number; maximo: number }> {
  const { count, error } = await supabaseClient
    .from('inscripciones')
    .select('id', { count: 'exact', head: true })
    .eq('evento', 'Copa Kids');

  const inscritos = !error && typeof count === 'number' ? count : 0;
  const disponibles = Math.max(0, CUPO_MAXIMO_KIDS - inscritos);
  return { inscritos, disponibles, maximo: CUPO_MAXIMO_KIDS };
}

// ===== Configuración de apertura/cierre de inscripciones =====

export interface ConfigInscripcion {
  grupo: string; // 'copa' | 'kids'
  abierto: boolean;
  cierre_at: string | null; // ISO datetime o null
}

export interface EstadoInscripcion {
  abierto: boolean;
  motivo: 'abierto' | 'cerrado_manual' | 'cerrado_fecha' | 'cupo_lleno';
  cierre_at: string | null;
}

/**
 * Lee la configuración de un grupo ('copa' o 'kids') y determina si está abierto.
 * Considera: interruptor manual (abierto) y fecha de cierre (cierre_at).
 * El cierre por cupo (Kids) se evalúa aparte con getCuposKids.
 */
export async function getEstadoInscripcion(grupo: 'copa' | 'kids'): Promise<EstadoInscripcion> {
  try {
    const { data, error } = await supabaseClient
      .from('config_inscripciones')
      .select('grupo, abierto, cierre_at')
      .eq('grupo', grupo)
      .single();

    if (error || !data) {
      // Si no hay config, asumimos abierto (no bloquear por error)
      return { abierto: true, motivo: 'abierto', cierre_at: null };
    }

    if (!data.abierto) {
      return { abierto: false, motivo: 'cerrado_manual', cierre_at: data.cierre_at };
    }

    if (data.cierre_at && new Date(data.cierre_at).getTime() <= Date.now()) {
      return { abierto: false, motivo: 'cerrado_fecha', cierre_at: data.cierre_at };
    }

    return { abierto: true, motivo: 'abierto', cierre_at: data.cierre_at };
  } catch {
    return { abierto: true, motivo: 'abierto', cierre_at: null };
  }
}

/** Lee la config cruda de ambos grupos (para el panel de Admin). */
export async function getConfigInscripciones(): Promise<ConfigInscripcion[]> {
  const { data, error } = await supabaseClient
    .from('config_inscripciones')
    .select('grupo, abierto, cierre_at');
  if (error || !data) return [];
  return data as ConfigInscripcion[];
}

/** Actualiza la config de un grupo (desde el Admin). */
export async function actualizarConfigInscripcion(
  grupo: 'copa' | 'kids',
  cambios: { abierto?: boolean; cierre_at?: string | null }
): Promise<boolean> {
  // Upsert: crea la fila si no existe, o la actualiza si ya existe.
  // Esto evita que un UPDATE sobre una tabla vacía no guarde nada.
  const { error } = await supabaseClient
    .from('config_inscripciones')
    .upsert(
      { grupo, ...cambios, updated_at: new Date().toISOString() },
      { onConflict: 'grupo' }
    );
  return !error;
}

export interface DatosCorreo {
  id?: string; // id de la inscripción (para marcar email_enviado)
  email: string;
  nombre: string;
  primerApellido: string;
  codigoInscripcion: string;
  evento: string;
  categoria: string;
}

/**
 * Envía el correo de confirmación vía la API route y marca email_enviado en Supabase.
 * Devuelve true si el correo se envió correctamente, false si falló (límite, error, etc.).
 * Si falla, la inscripción queda con email_enviado = false para reenviar luego.
 */
export async function enviarCorreoConfirmacion(datos: DatosCorreo): Promise<boolean> {
  let enviado = false;
  try {
    const res = await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: datos.email,
        nombre: datos.nombre,
        primerApellido: datos.primerApellido,
        codigoInscripcion: datos.codigoInscripcion,
        evento: datos.evento,
        categoria: datos.categoria,
      }),
    });
    enviado = res.ok;
  } catch {
    enviado = false;
  }

  // Marcar el estado del correo en la BD (si tenemos el id de la inscripción)
  if (datos.id) {
    try {
      await supabaseClient
        .from('inscripciones')
        .update({ email_enviado: enviado })
        .eq('id', datos.id);
    } catch {
      /* no bloquear por error al marcar */
    }
  }

  return enviado;
}

/**
 * Verifica si ya existe una inscripción duplicada.
 * - La Copa: se pasa `categoria` → bloquea por cédula + evento + categoría
 *   (permite la misma cédula en otra categoría o en otro evento).
 * - Kids: se omite `categoria` → bloquea por cédula + evento (Copa Kids).
 * Devuelve los datos de la inscripción existente si la encuentra, o null si no existe.
 */
export async function verificarInscripcionExistente(
  numeroIdentificacion: string,
  evento: string,
  categoria?: string
): Promise<{ codigo_inscripcion: string; nombre: string; primer_apellido: string; categoria: string } | null> {
  if (!numeroIdentificacion || !evento) return null;

  let query = supabaseClient
    .from('inscripciones')
    .select('codigo_inscripcion, nombre, primer_apellido, categoria')
    .eq('numero_identificacion', numeroIdentificacion)
    .eq('evento', evento);

  // Si se pasa categoría (La Copa), también se filtra por categoría
  if (categoria) {
    query = query.eq('categoria', categoria);
  }

  const { data, error } = await query.limit(1);

  if (error) {
    // Si la consulta falla, no bloqueamos el registro (mejor permitir que bloquear por un error de red)
    console.error('Error verificando inscripción existente:', error);
    return null;
  }

  return data && data.length > 0 ? data[0] : null;
}

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
  canton: string;
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

export async function guardarInscripcion(datos: InscripcionData): Promise<{ codigoInscripcion: string; id?: string }> {
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
  const { data: insertData, error } = await supabaseClient
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
      canton: datos.canton,
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
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Error al guardar: ${error.message}`);
  }

  return { codigoInscripcion, id: insertData?.id as string | undefined };
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
  canton: string;
  lateralidad: string;
  categoria: string;
  equipo: string;
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

export async function guardarInscripcionKids(datos: InscripcionKidsData): Promise<{ codigoInscripcion: string; id?: string }> {
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
  const { data: insertData, error } = await supabaseClient
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
      canton: datos.canton,
      equipo: datos.equipo,
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
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Error al guardar: ${error.message}`);
  }

  return { codigoInscripcion, id: insertData?.id as string | undefined };
}
