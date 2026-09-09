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

    // Recuperar los datos del formulario guardados antes de ir a pagar
    let datosCopa = '';
    let datosKids = '';
    try {
      datosCopa = localStorage.getItem('inscripcionTarjeta') || '';
      datosKids = localStorage.getItem('inscripcionTarjetaKids') || '';
    } catch { /* ignore */ }

    if (!aprobado) {
      // Pago rechazado: NO se guarda nada
      setEstado('rechazado');
      try {
        localStorage.removeItem('inscripcionTarjeta');
        localStorage.removeItem('inscripcionTarjetaKids');
      } catch {}
      return;
    }

    // Pago aprobado: AHORA sí se guarda la inscripción como confirmada
    const guardar = async () => {
      try {
        const { guardarInscripcion, guardarInscripcionKids } = await import('@/lib/inscripcion-client');

        if (datosCopa) {
          const datos = JSON.parse(datosCopa);
          const resultado = await guardarInscripcion({ ...datos, comprobante: null, estadoPagoInicial: 'confirmado' });
          setCodigo(resultado.codigoInscripcion);
          fetch('/api/email', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: datos.email, nombre: datos.nombre, primerApellido: datos.primerApellido,
              codigoInscripcion: resultado.codigoInscripcion, evento: datos.evento, categoria: datos.categoria,
            }),
          }).catch(() => {});
          localStorage.removeItem('inscripcionTarjeta');
        } else if (datosKids) {
          const datos = JSON.parse(datosKids);
          const resultado = await guardarInscripcionKids({ ...datos, comprobante: null, estadoPagoInicial: 'confirmado' });
          setCodigo(resultado.codigoInscripcion);
          fetch('/api/email', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: datos.encargadoEmail, nombre: datos.nombre, primerApellido: datos.primerApellido,
              codigoInscripcion: resultado.codigoInscripcion, evento: 'Copa Kids', categoria: datos.categoria,
            }),
          }).catch(() => {});
          localStorage.removeItem('inscripcionTarjetaKids');
        }
        setEstado('exitoso');
      } catch {
        // Si falla el guardado, igual mostramos éxito del pago (se revisa en admin)
        setEstado('exitoso');
      }
    };
    guardar();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        {estado === 'procesando' && (
          <>
            <div className="text-[#1a4f8b] text-5xl mb-4">&#8987;</div>
            <h2 className="text-xl font-bold text-[#0d2240] mb-2">Procesando pago...</h2>
            <p className="text-gray-600">Un momento por favor, estamos confirmando tu inscripción.</p>
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
              No se pudo procesar el pago, por lo que <strong>no se registró tu inscripción</strong>.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Podés volver a intentarlo llenando el formulario de nuevo.
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
