'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

interface BoxRow {
  id: string;
  dorsal: string;
  nombre_archivo: string;
  categoria: string;
  box: string;
  hora_salida: string;
  orden: number;
  en_box: boolean;
  salida_final: boolean;
  ins_nombre?: string;
  ins_primer_apellido?: string;
}

// "APELLIDO Nombre" — apellido en mayúsculas, nombre con primera letra mayúscula
function formatoNombre(primerApellido?: string, nombre?: string): string {
  const ap = (primerApellido || '').trim().toUpperCase();
  const nom = (nombre || '').trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  return `${ap} ${nom}`.trim();
}

export default function DNSPage() {
  const [rows, setRows] = useState<BoxRow[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtroHora, setFiltroHora] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const { supabaseClient } = await import('@/lib/inscripcion-client');
      const [boxesRes, insRes] = await Promise.all([
        supabaseClient.from('boxes').select('*').order('orden', { ascending: true }),
        supabaseClient.from('inscripciones').select('dorsal, nombre, primer_apellido'),
      ]);
      if (boxesRes.error) throw new Error(boxesRes.error.message);

      const insByDorsal = new Map<string, { nombre: string; primer_apellido: string }>();
      for (const i of insRes.data || []) {
        if (i.dorsal) insByDorsal.set(String(i.dorsal).trim(), i);
      }
      const merged: BoxRow[] = (boxesRes.data || []).map((b) => {
        const ins = insByDorsal.get(String(b.dorsal).trim());
        return { ...b, ins_nombre: ins?.nombre, ins_primer_apellido: ins?.primer_apellido } as BoxRow;
      });
      setRows(merged);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Auto-refresco cada 15 s (solo lectura)
  useEffect(() => {
    const t = setInterval(() => cargar(), 15000);
    return () => clearInterval(t);
  }, [cargar]);

  // DNS: salida ya dada Y no estuvo en el box
  const listaDNS = useMemo(
    () => rows.filter((r) => r.salida_final && !r.en_box).sort((a, b) => a.orden - b.orden),
    [rows]
  );

  // Horas disponibles entre los DNS (para filtrar)
  const horas = useMemo(
    () => Array.from(new Set(listaDNS.map((r) => r.hora_salida))).sort(),
    [listaDNS]
  );

  const dnsFiltrados = useMemo(
    () => (filtroHora ? listaDNS.filter((r) => r.hora_salida === filtroHora) : listaDNS),
    [listaDNS, filtroHora]
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-red-600">DNS — No salieron</h1>
        <p className="text-sm text-gray-500 mt-1">
          Vista de solo lectura · Corredores cuya tanda ya salió y no estuvieron en el box.
          <span className="mx-2 text-gray-300">|</span>
          <button onClick={cargar} className="text-[#1a4f8b] hover:underline">Actualizar</button>
        </p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>}
      {cargando && <p className="text-center text-gray-500">Cargando…</p>}

      {!cargando && (
        <div className="bg-white rounded-xl shadow-md p-5">
          {/* Filtro por hora */}
          {horas.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora de salida</label>
              <select value={filtroHora} onChange={(e) => setFiltroHora(e.target.value)}
                className="w-full sm:w-auto border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#1a4f8b]">
                <option value="">Todas las horas</option>
                {horas.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          )}

          <p className="text-sm text-gray-500 mb-3">{dnsFiltrados.length} corredor(es) DNS</p>

          {dnsFiltrados.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No hay corredores DNS por el momento.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="text-left px-4 py-2">Dorsal</th>
                    <th className="text-left px-4 py-2">Nombre</th>
                    <th className="text-left px-4 py-2 hidden sm:table-cell">Categoría</th>
                    <th className="text-left px-4 py-2">Salida</th>
                    <th className="text-left px-4 py-2">Box</th>
                  </tr>
                </thead>
                <tbody>
                  {dnsFiltrados.map((r) => (
                    <tr key={r.id} className="border-t border-gray-100">
                      <td className="px-4 py-2 font-bold text-red-600">{r.dorsal}</td>
                      <td className="px-4 py-2">
                        {formatoNombre(r.ins_primer_apellido, r.ins_nombre) || r.nombre_archivo}
                        <div className="text-xs text-gray-400 sm:hidden">{r.categoria}</div>
                      </td>
                      <td className="px-4 py-2 hidden sm:table-cell text-gray-600">{r.categoria}</td>
                      <td className="px-4 py-2 text-gray-600">{r.hora_salida}</td>
                      <td className="px-4 py-2 text-gray-600">{r.box}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
