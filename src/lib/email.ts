// Envío de email de confirmación con QR usando Resend
// Se llama desde el cliente después de guardar la inscripción

const RESEND_API_KEY = process.env.NEXT_PUBLIC_RESEND_API_KEY || '';

export interface EmailData {
  email: string;
  nombre: string;
  primerApellido: string;
  codigoInscripcion: string;
  evento: string;
  categoria: string;
}

export async function enviarEmailConfirmacion(data: EmailData): Promise<void> {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.codigoInscripcion)}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
      <div style="background: #0d2240; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">La Copa</h1>
        <p style="color: #93c5fd; margin: 4px 0 0 0; font-size: 14px;">VI Fecha 13-14 Setiembre</p>
      </div>
      <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
        <h2 style="color: #0d2240; margin-top: 0;">¡Inscripción exitosa!</h2>
        <p style="color: #4a5568;">Hola <strong>${data.nombre} ${data.primerApellido}</strong>,</p>
        <p style="color: #4a5568;">Tu inscripción ha sido registrada exitosamente. Aquí están tus datos:</p>
        
        <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 4px 0; color: #4a5568;"><strong>Código:</strong> <span style="font-family: monospace; font-size: 18px; color: #1a4f8b;">${data.codigoInscripcion}</span></p>
          <p style="margin: 4px 0; color: #4a5568;"><strong>Evento:</strong> ${data.evento}</p>
          <p style="margin: 4px 0; color: #4a5568;"><strong>Categoría:</strong> ${data.categoria}</p>
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <p style="color: #4a5568; font-weight: bold;">Tu código QR para el día de la carrera:</p>
          <img src="${qrUrl}" alt="QR Code" style="width: 200px; height: 200px; border-radius: 8px;" />
        </div>

        <p style="color: #4a5568; font-size: 14px;">Presentá este código QR el día del evento para hacer tu check-in.</p>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">
          La Copa - Carreras de Ciclismo<br/>
          Este es un correo automático, por favor no respondas.
        </p>
      </div>
    </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'La Copa <onboarding@resend.dev>',
        to: [data.email],
        subject: `Inscripción confirmada - ${data.evento} - ${data.codigoInscripcion}`,
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error enviando email:', errorData);
    }
  } catch (err) {
    console.error('Error al enviar email:', err);
    // No lanzamos error para no bloquear la inscripción si falla el email
  }
}
