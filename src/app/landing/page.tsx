'use client';

import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';

const BASE_URL = 'https://inscripciones.raceclubhub.com';

export default function LandingPage() {
  const [cuposKids, setCuposKids] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { getCuposKids } = await import('@/lib/inscripcion-client');
        const { disponibles } = await getCuposKids();
        setCuposKids(disponibles);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-[#0d2240] flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        {/* Título */}
        <h1 className="text-2xl font-bold text-[#0d2240] text-center mb-2">
          VI Fecha Orosi · 12 y 13 Setiembre
        </h1>

        {/* Leyenda Guía Técnica */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 text-center">
          <p className="text-sm text-amber-800 font-medium mb-2">
            Favor leer la Guía Técnica antes de inscribirse
          </p>
          <a
            href="/guia-tecnica.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#0d2240] text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-[#1a4f8b] transition-colors"
          >
            Ver Guía Técnica
          </a>
        </div>
        <p className="text-gray-600 text-center mb-8">
          Escaneá el código QR para inscribirte
        </p>

        {/* Dos columnas con logos y QR */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* La Copa */}
          <div className="text-center">
            <img
              src="/images/LOGO_COPA.jpeg"
              alt="La Copa"
              className="h-20 w-20 mx-auto rounded-xl object-cover shadow-md mb-4"
            />
            <h2 className="text-lg font-bold text-[#0d2240] mb-1">La Copa</h2>
            <p className="text-xs text-gray-500 mb-4">XCO · XCC</p>
            <div className="w-48 h-48 mx-auto p-3 bg-white rounded-lg shadow-lg">
              <QRCode value={`${BASE_URL}/inscripcion/copa`} className="w-full h-full" style={{ width: '100%', height: '100%' }} />
            </div>
            <a href="/inscripcion/copa"
              className="inline-block mt-4 bg-[#0d2240] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#1a4f8b] transition-colors">
              Inscribirme
            </a>
          </div>

          {/* Copa Kids */}
          <div className="text-center">
            <img
              src="/images/logo-copa-kids.jpeg"
              alt="Copa Kids"
              className="h-20 w-20 mx-auto rounded-xl object-contain shadow-md mb-4"
            />
            <h2 className="text-lg font-bold text-green-700 mb-1">Copa Kids</h2>
            <p className="text-xs text-gray-500 mb-2">Balance · Niños · Preinfantil</p>
            {cuposKids !== null && (
              <p className="text-xs font-bold mb-3 text-red-600">
                {cuposKids <= 0 ? 'Cupos agotados' : cuposKids === 1 ? 'Queda 1 cupo' : `Quedan ${cuposKids} cupos`}
              </p>
            )}
            <div className="w-48 h-48 mx-auto p-3 bg-white rounded-lg shadow-lg">
              <QRCode value={`${BASE_URL}/inscripcion/kids`} className="w-full h-full" style={{ width: '100%', height: '100%' }} />
            </div>
            <a href="/inscripcion/kids"
              className="inline-block mt-4 bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
              Inscribirme
            </a>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center mt-8">
          La Copa - Carreras de Ciclismo
        </p>
      </div>
    </div>
  );
}
