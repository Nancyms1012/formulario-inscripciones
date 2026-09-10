'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Home() {
  const [cuposKids, setCuposKids] = useState<number | null>(null);
  const [copaAbierta, setCopaAbierta] = useState<boolean | null>(null);
  const [kidsAbierta, setKidsAbierta] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { getCuposKids, getEstadoInscripcion } = await import('@/lib/inscripcion-client');
        const { disponibles } = await getCuposKids();
        setCuposKids(disponibles);
        const estadoCopa = await getEstadoInscripcion('copa');
        const estadoKids = await getEstadoInscripcion('kids');
        setCopaAbierta(estadoCopa.abierto);
        setKidsAbierta(estadoKids.abierto);
      } catch {
        setCopaAbierta(true);
        setKidsAbierta(true);
      }
    })();
  }, []);

  // Kids está efectivamente cerrada si la cerraron (manual/fecha) o si no quedan cupos
  const kidsCerrada = kidsAbierta === false || cuposKids === 0;
  const copaCerrada = copaAbierta === false;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full text-center">
        <h1 className="text-2xl font-bold text-[#0d2240] mb-2">VI Fecha Orosi · 12 y 13 Setiembre</h1>
        <p className="text-gray-600 mb-4">Selecciona tu evento para inscribirte</p>

        {/* Leyenda Guía Técnica */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* La Copa */}
          {copaCerrada ? (
            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-transparent opacity-60 cursor-not-allowed">
              <img src="/images/LOGO_COPA.jpeg" alt="La Copa"
                className="h-24 w-24 mx-auto rounded-xl object-cover mb-4 grayscale" />
              <h2 className="text-lg font-bold text-[#0d2240]">La Copa</h2>
              <p className="text-sm text-gray-500 mt-1">XCO · XCC</p>
              <p className="text-sm font-bold mt-2 text-red-600">Inscripciones cerradas</p>
            </div>
          ) : (
            <Link href="/inscripcion/copa"
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-[#0d2240]">
              <img src="/images/LOGO_COPA.jpeg" alt="La Copa"
                className="h-24 w-24 mx-auto rounded-xl object-cover mb-4" />
              <h2 className="text-lg font-bold text-[#0d2240]">La Copa</h2>
              <p className="text-sm text-gray-500 mt-1">XCO · XCC</p>
            </Link>
          )}

          {/* Copa Kids */}
          {kidsCerrada ? (
            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-transparent opacity-60 cursor-not-allowed">
              <img src="/images/logo-copa-kids.jpeg" alt="Copa Kids"
                className="h-24 w-24 mx-auto rounded-xl object-contain mb-4 grayscale" />
              <h2 className="text-lg font-bold text-green-700">Copa Kids</h2>
              <p className="text-sm text-gray-500 mt-1">Balance · Niños · Preinfantil</p>
              <p className="text-sm font-bold mt-2 text-red-600">
                {cuposKids === 0 && kidsAbierta !== false ? 'Cupos agotados' : 'Inscripciones cerradas'}
              </p>
            </div>
          ) : (
            <Link href="/inscripcion/kids"
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-green-600">
              <img src="/images/logo-copa-kids.jpeg" alt="Copa Kids"
                className="h-24 w-24 mx-auto rounded-xl object-contain mb-4" />
              <h2 className="text-lg font-bold text-green-700">Copa Kids</h2>
              <p className="text-sm text-gray-500 mt-1">Balance · Niños · Preinfantil</p>
              {cuposKids !== null && (
                <p className="text-sm font-bold mt-2 text-red-600">
                  {cuposKids === 1 ? 'Queda 1 cupo' : `Quedan ${cuposKids} cupos`}
                </p>
              )}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
