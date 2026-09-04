'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface Inscripcion {
  codigo_inscripcion: string;
  dorsal?: string;
  nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  evento: string;
  categoria: string;
  equipo: string;
}

function MiInscripcionContent() {
  const searchParams = useSearchParams();
  const codigoUrl = searchParams.get('codigo') || '';

  const [codigo, setCodigo] = useState(codigoUrl);
  const [inscripcion, setInscripcion] = useState<Inscripcion | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState('');
  const [buscoInicial, setBuscoInicial] = useState(false);

  const buscar = async (codigoBuscar?: string) => {
    const cod = (codigoBuscar || codigo).trim().toUpperCase();
    if (!cod) return;

    setError('');
    setBuscando(true);
    setInscripcion(null);

    try {
      const { supabaseClient } = await import('@/lib/inscripcion-client');
      const { data, error } = await supabaseClient
        .from('inscripciones')
        .select('codigo_inscripcion, dorsal, nombre, primer_apellido, segundo_apellido, evento, categoria, equipo')
        .eq('codigo_inscripcion', cod);

      if (error) throw new Error(error.message);

      if (data && data.length > 0) {
        setInscripcion(data[0]);
      } else {
        setError('No se encontró ninguna inscripción con ese código.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al buscar');
    } finally {
      setBuscando(false);
    }
  };

  // Buscar automáticamente si viene el código en la URL (desde el QR)
  useEffect(() => {
    if (codigoUrl && !buscoInicial) {
      setBuscoInicial(true);
      buscar(codigoUrl);
    }
  }, [codigoUrl, buscoInicial]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-md">
        <h1 className="text-xl font-bold text-[#0d2240] text-center mb-1">Mi Inscripción</h1>
        <p className="text-sm text-gray-500 text-center mb-6">VI Fecha Orosi · 12 y 13 Setiembre</p>

        {/* Buscador manual */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Ingresá tu código de inscripción</label>
          <div className="flex gap-2">
            <input type="text" value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && buscar()}
              placeholder="Ej: LC-ABC123"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent" />
            <button onClick={() => buscar()} disabled={buscando}
              className="bg-[#0d2240] text-white px-5 py-2 rounded-lg hover:bg-[#1a4f8b] transition-colors disabled:opacity-50">
              {buscando ? '...' : 'Buscar'}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center text-sm">
            {error}
          </div>
        )}

        {/* Card del inscrito */}
        {inscripcion && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
            {inscripcion.dorsal ? (
              <>
                <p className="text-6xl font-extrabold text-[#1a4f8b] leading-none mb-1">#{inscripcion.dorsal}</p>
                <p className="text-xs text-gray-400 font-mono mb-4">{inscripcion.codigo_inscripcion}</p>
              </>
            ) : (
              <p className="text-4xl font-extrabold text-[#1a4f8b] mb-4 font-mono tracking-wide">
                {inscripcion.codigo_inscripcion}
              </p>
            )}
            <h2 className="text-xl font-bold text-gray-800 uppercase mb-4">
              {inscripcion.nombre} {inscripcion.primer_apellido} {inscripcion.segundo_apellido}
            </h2>
            <p className="text-gray-600 mb-1">{inscripcion.categoria}</p>
            <p className="text-lg font-semibold text-[#0d2240] mb-3">{inscripcion.evento}</p>
            {inscripcion.equipo && (
              <div className="inline-block bg-blue-50 text-[#1a4f8b] text-sm font-medium px-3 py-1 rounded-full">
                Equipo: {inscripcion.equipo}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MiInscripcionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
      <MiInscripcionContent />
    </Suspense>
  );
}
