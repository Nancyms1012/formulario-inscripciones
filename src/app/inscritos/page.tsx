'use client';

import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';

const BASE_URL = 'https://inscripciones.raceclubhub.com';

export default function InscritosPortada() {
  const [visitas, setVisitas] = useState<number | null>(null);
  const [cuposKids, setCuposKids] = useState<number | null>(null);

  useEffect(() => {
    // Cupos disponibles de Copa Kids
    (async () => {
      try {
        const { getCuposKids } = await import('@/lib/inscripcion-client');
        const { disponibles } = await getCuposKids();
        setCuposKids(disponibles);
      } catch {
        /* ignore */
      }
    })();

    // Contador de visitas
    const contar = async () => {
      try {
        const { supabaseClient } = await import('@/lib/inscripcion-client');
        const { data, error } = await supabaseClient.rpc('incrementar_visita', { contador_id: 'inscritos' });
        if (!error && typeof data === 'number') {
          setVisitas(data);
        } else {
          // Si falla el RPC, solo leer el total
          const { data: row } = await supabaseClient
            .from('contador_visitas').select('total').eq('id', 'inscritos').single();
          if (row) setVisitas(row.total);
        }
      } catch {
        /* ignore */
      }
    };
    contar();
  }, []);

  return (
    <div className="min-h-screen bg-[#0d2240] flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        {/* Título */}
        <h1 className="text-2xl font-bold text-[#0d2240] text-center mb-1">
          VI Fecha Orosi · 12 y 13 Setiembre
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Escaneá el código QR para ver los inscritos
        </p>

        {/* Dos columnas con logos y QR */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* La Copa */}
          <div className="text-center">
            <img src="/images/LOGO_COPA.jpeg" alt="La Copa"
              className="h-20 w-20 mx-auto rounded-xl object-cover shadow-md mb-4" />
            <h2 className="text-lg font-bold text-[#0d2240] mb-1">La Copa</h2>
            <p className="text-xs text-gray-500 mb-4">XCO · XCC</p>
            <div className="w-48 h-48 mx-auto p-3 bg-white rounded-lg shadow-lg">
              <QRCode value={`${BASE_URL}/inscritos/lista?grupo=copa`} className="w-full h-full" style={{ width: '100%', height: '100%' }} />
            </div>
            <a href="/inscritos/lista?grupo=copa"
              className="inline-block mt-4 bg-[#0d2240] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#1a4f8b] transition-colors">
              Ver inscritos
            </a>
          </div>

          {/* Copa Kids */}
          <div className="text-center">
            <img src="/images/logo-copa-kids.jpeg" alt="Copa Kids"
              className="h-20 w-20 mx-auto rounded-xl object-contain shadow-md mb-4" />
            <h2 className="text-lg font-bold text-green-700 mb-1">Copa Kids</h2>
            <p className="text-xs text-gray-500 mb-2">Balance · Niños · Preinfantil</p>
            {cuposKids !== null && (
              <p className={`text-xs font-bold mb-3 ${cuposKids > 0 ? 'text-green-700' : 'text-red-600'}`}>
                {cuposKids > 0 ? `Quedan ${cuposKids} cupo${cuposKids !== 1 ? 's' : ''}` : 'Cupos agotados'}
              </p>
            )}
            <div className="w-48 h-48 mx-auto p-3 bg-white rounded-lg shadow-lg">
              <QRCode value={`${BASE_URL}/inscritos/lista?grupo=kids`} className="w-full h-full" style={{ width: '100%', height: '100%' }} />
            </div>
            <a href="/inscritos/lista?grupo=kids"
              className="inline-block mt-4 bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
              Ver inscritos
            </a>
          </div>
        </div>

        {/* Contador de visitas */}
        <div className="text-center mt-8 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            {visitas !== null ? `${visitas.toLocaleString('es-CR')} visitas` : 'Cargando visitas...'}
          </p>
        </div>
      </div>
    </div>
  );
}
