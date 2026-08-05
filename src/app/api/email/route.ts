import { NextRequest, NextResponse } from 'next/server';

const RESEND_API_KEY = 're_5KSK1YDa_HRKTiXEnLJF2zCWu5jPwFZ7g';

export async function POST(request: NextRequest) {
  try {
    const { email, nombre, primerApellido, codigoInscripcion, evento, categoria } = await request.json();

    if (!email || !codigoInscripcion) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(codigoInscripcion)}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
        <div style="background: #0d2240; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">La Copa</h1>
          <p style="color: #93c5fd; margin: 4px 0 0 0; font-size: 14px;">VI Fecha 13-14 Setiembre</p>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
          <h2 style="color: #0d2240; margin-top: 0;">Inscripcion exitosa!</h2>
          <p style="color: #4a5568;">Hola <strong>${nombre} ${primerApellido}</strong>,</p>
          <p style="color: #4a5568;">Tu inscripcion ha sido registrada exitosamente.</p>
          <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 4px 0; color: #4a5568;"><strong>Codigo:</strong> <span style="font-family: monospace; font-size: 18px; color: #1a4f8b;">${codigoInscripcion}</span></p>
            <p style="margin: 4px 0; color: #4a5568;"><strong>Evento:</strong> ${evento}</p>
            <p style="margin: 4px 0; color: #4a5568;"><strong>Categoria:</strong> ${categoria}</p>
          </div>
          <div style="text-align: center; margin: 24px 0;">
            <p style="color: #4a5568; font-weight: bold;">Tu codigo QR para el dia de la carrera:</p>
            <img src="${qrUrl}" alt="QR Code" style="width: 200px; height: 200px; border-radius: 8px;" />
          </div>
          <p style="color: #4a5568; font-size: 14px;">Presenta este codigo QR el dia del evento para hacer tu check-in.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">La Copa - Carreras de Ciclismo</p>
        </div>
      </div>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'La Copa <inscripciones@raceclubhub.com>',
        to: [email],
        subject: `Inscripcion confirmada - ${evento} - ${codigoInscripcion}`,
        html: htmlContent,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Resend error:', result);
      return NextResponse.json({ error: result.message || 'Error enviando email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: result.id });
  } catch (err) {
    console.error('Error en API email:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
