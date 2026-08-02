import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { inscripcionId } = await request.json();

    if (!inscripcionId) {
      return NextResponse.json(
        { error: 'ID de inscripción requerido' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('inscripciones')
      .update({
        checkin: true,
        checkin_fecha: new Date().toISOString(),
      })
      .eq('id', inscripcionId)
      .select()
      .single();

    if (error) {
      console.error('Error en check-in:', error);
      return NextResponse.json(
        { error: 'Error al confirmar check-in' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Check-in confirmado',
      inscripcion: data,
    });
  } catch (err) {
    console.error('Error en API check-in:', err);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
