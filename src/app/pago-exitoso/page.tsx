'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function PagoExitosoContent() {
  const searchParams = useSearchParams();
  const [estado, setEstado] = useState<'procesando' | 'exitoso' | 'rechazado'>('procesando');
  const [codigo, setCodigo] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const aprobado = code === '1';

    // Recuperar el código de inscripción guardado antes de ir a pagar
    let codigoInscripcion = '';
    try {
      codigoInscripcion = sessionStorage.getItem('inscripcionPendiente') || '';
    } catch { /* ignore */ }
    setCodigo(codigoInscripcion);

    if (!aprobado) {
      setEstado('rechazado');
      return;
    }

    // Pago aprobado: marcar la inscripción como pagada
    const confirmar = async () => {
      if (codigoInscripcion) {
        try {
          const { supabaseClient } = await import('@/lib/inscripcion-client');
          await supabaseClient
            .from('inscripciones')
            .update({ estado_pago: 'confirmado' })
            .eq('codigo_inscripcion', codigoInscripcion);
          sessionStorage.removeItem('inscripcionPendiente');
        } catch { /* ignore - queda pendiente y se confirma manual */ }
      }
      setEstado('exitoso');
    };
    confirmar();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        {estado === 'procesando' && (
          <>
            <div className="text-[#1a4f8b] text-5xl mb-4">&#8987;</div>
            <h2 className="text-xl font-bold text-[#0d2240] mb-2">Procesando pago...</h2>
            <p className="text-gray-600">Un momento por favor.</p>
          </>
        )}

        {estado === 'exitoso' && (
          <>
            <div className="text-green-500 text-6xl mb-4">&#10003;</div>
            <h2 className="text-2xl font-bold text-[#0d2240] mb-2">¡Pago exitoso!</h2>
            <p className="text-gray-600 mb-4">Tu inscripción quedó confirmada.</p>
            {codigo && (
              <p className="text-3xl font-mono font-bold text-[#1a4f8b] mb-4">{codigo}</p>
            )}
            <p className="text-sm text-gray-500 mb-6">
              Recibirás un correo con tu código QR para el día de la carrera.
            </p>
            <a href="/" className="inline-block bg-[#0d2240] text-white px-6 py-3 rounded-lg hover:bg-[#1a4f8b] transition-colors">
              Volver al inicio
            </a>
          </>
        )}

        {estado === 'rechazado' && (
          <>
            <div className="text-red-500 text-6xl mb-4">&#10007;</div>
            <h2 className="text-2xl font-bold text-[#0d2240] mb-2">El pago no se completó</h2>
            <p className="text-gray-600 mb-4">
              No se pudo procesar el pago. Tu inscripción quedó como &quot;pendiente de pago&quot;.
            </p>
            {codigo && (
              <p className="text-sm text-gray-500 mb-2">Código de inscripción: <span className="font-mono font-bold text-[#1a4f8b]">{codigo}</span></p>
            )}
            <p className="text-sm text-gray-500 mb-6">
              Podés intentar el pago de nuevo o contactar a la organización.
            </p>
            <a href="/" className="inline-block bg-[#0d2240] text-white px-6 py-3 rounded-lg hover:bg-[#1a4f8b] transition-colors">
              Volver al inicio
            </a>
          </>
        )}
      </div>
    </div>
  );
}

export default function PagoExitosoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
      <PagoExitosoContent />
    </Suspense>
  );
}
