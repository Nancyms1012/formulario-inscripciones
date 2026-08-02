import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// Generar código de inscripción único
function generarCodigo(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let codigo = 'LC-'; // La Copa
  for (let i = 0; i < 6; i++) {
    codigo += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return codigo;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const tipoIdentificacion = formData.get('tipoIdentificacion') as string;
    const numeroIdentificacion = formData.get('numeroIdentificacion') as string;
    const nombre = formData.get('nombre') as string;
    const primerApellido = formData.get('primerApellido') as string;
    const segundoApellido = formData.get('segundoApellido') as string;
    const celular = formData.get('celular') as string;
    const email = formData.get('email') as string;
    const fechaNacimiento = formData.get('fechaNacimiento') as string;
    const genero = formData.get('genero') as string;
    const provincia = formData.get('provincia') as string;
    const evento = formData.get('evento') as string;
    const categoria = formData.get('categoria') as string;
    const beneficiarioNombre = formData.get('beneficiarioNombre') as string;
    const beneficiarioCedula = formData.get('beneficiarioCedula') as string;
    const beneficiarioTelefono = formData.get('beneficiarioTelefono') as string;
    const beneficiarioParentesco = formData.get('beneficiarioParentesco') as string;
    const metodoPago = formData.get('metodoPago') as string;
    const requiereFactura = formData.get('requiereFactura') === 'true';
    const comprobante = formData.get('comprobante') as File | null;

    // Validaciones básicas
    if (!tipoIdentificacion || !numeroIdentificacion || !nombre || !primerApellido ||
        !segundoApellido || !celular || !email || !fechaNacimiento || !genero ||
        !provincia || !evento || !categoria || !beneficiarioNombre ||
        !beneficiarioCedula || !beneficiarioTelefono || !beneficiarioParentesco || !metodoPago) {
      return NextResponse.json(
        { error: 'Todos los campos obligatorios deben estar completos' },
        { status: 400 }
      );
    }

    // Subir comprobante Sinpe si existe
    let comprobanteUrl: string | null = null;
    if (comprobante && metodoPago === 'Sinpe') {
      const fileExt = comprobante.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const arrayBuffer = await comprobante.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('comprobantes')
        .upload(fileName, buffer, {
          contentType: comprobante.type,
        });

      if (uploadError) {
        console.error('Error subiendo comprobante:', uploadError);
      } else {
        const { data: urlData } = supabase.storage
          .from('comprobantes')
          .getPublicUrl(uploadData.path);
        comprobanteUrl = urlData.publicUrl;
      }
    }

    // Generar código único
    const codigoInscripcion = generarCodigo();

    // Insertar en la base de datos
    const { data, error } = await supabase
      .from('inscripciones')
      .insert({
        codigo_inscripcion: codigoInscripcion,
        tipo_identificacion: tipoIdentificacion,
        numero_identificacion: numeroIdentificacion,
        nombre,
        primer_apellido: primerApellido,
        segundo_apellido: segundoApellido,
        celular,
        email,
        fecha_nacimiento: fechaNacimiento,
        genero,
        provincia,
        evento,
        categoria,
        beneficiario_nombre: beneficiarioNombre,
        beneficiario_cedula: beneficiarioCedula,
        beneficiario_telefono: beneficiarioTelefono,
        beneficiario_parentesco: beneficiarioParentesco,
        metodo_pago: metodoPago,
        comprobante_sinpe_url: comprobanteUrl,
        requiere_factura: requiereFactura,
        estado_pago: metodoPago === 'Efectivo' ? 'pendiente' : 'pendiente',
      })
      .select()
      .single();

    if (error) {
      console.error('Error insertando inscripción:', error);
      return NextResponse.json(
        { error: 'Error al guardar la inscripción. Intente de nuevo.' },
        { status: 500 }
      );
    }

    // TODO: Enviar email de confirmación con QR
    // TODO: Integrar con GTI para factura electrónica

    return NextResponse.json({
      success: true,
      codigoInscripcion,
      inscripcionId: data.id,
      message: 'Inscripción registrada exitosamente',
    });
  } catch (err) {
    console.error('Error en API inscripciones:', err);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET - Obtener inscripciones (para admin y check-in)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const codigo = searchParams.get('codigo');
  const evento = searchParams.get('evento');
  const categoria = searchParams.get('categoria');

  try {
    let query = supabase.from('inscripciones').select('*');

    if (codigo) {
      query = query.eq('codigo_inscripcion', codigo);
    }
    if (evento) {
      query = query.eq('evento', evento);
    }
    if (categoria) {
      query = query.eq('categoria', categoria);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ inscripciones: data });
  } catch (err) {
    console.error('Error en GET inscripciones:', err);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
