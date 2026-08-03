'use client';

import { useEffect, useState } from 'react';

export default function LandingPage() {
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    // Generar QR que direcciona al formulario
    const formUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/`
      : '';
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(formUrl)}`;
    setQrUrl(qrApiUrl);
  }, []);

  return (
    <div className="min-h-screen bg-[#0d2240] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        {/* Logos */}
        <div className="flex items-center justify-center gap-6 mb-8">
          <img
            src="/images/LOGO_COPA.jpeg"
            alt="La Copa"
            className="h-20 w-20 rounded-xl object-cover shadow-md"
          />
          <img
            src="/images/logo-copa-kids.jpeg"
            alt="Copa Kids"
            className="h-20 w-20 rounded-xl object-contain shadow-md"
          />
        </div>

        {/* Título */}
        <h1 className="text-2xl font-bold text-[#0d2240] mb-2">
          VI Fecha 13-14 Setiembre
        </h1>
        <p className="text-gray-600 mb-6">
          Escaneá el código QR para inscribirte
        </p>

        {/* QR Code */}
        {qrUrl && (
          <div className="flex justify-center mb-6">
            <img
              src={qrUrl}
              alt="QR Code - Inscripción La Copa"
              className="w-64 h-64 rounded-lg shadow-lg"
            />
          </div>
        )}

        {/* Botón directo */}
        <a
          href="/"
          className="inline-block bg-[#0d2240] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#1a4f8b] transition-colors"
        >
          Ir al formulario de inscripción
        </a>

        <p className="text-xs text-gray-400 mt-6">
          La Copa - Carreras de Ciclismo
        </p>
      </div>
    </div>
  );
}
