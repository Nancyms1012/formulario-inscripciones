'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

// Fila de la parrilla (tabla boxes) unida con datos de la inscripción
interface BoxRow {
  id: string;
  dorsal: string;
  nombre_archivo: string;
  categoria: string;
  box: string;
  hora_salida: string;
  orden: number;
  en_box: boolean;
  en_box_por: string | null;
  salida_final: boolean;
  salida_final_por: string | null;
  // De la inscripción (match por dorsal):
  ins_nombre?: string;
  ins_primer_apellido?: string;
  ins_checkin?: boolean; // check-in del día XCO/XCC según corresponda
}

// Formatea "APELLIDO Nombre" — apellido en mayúsculas, nombre con primera letra mayúscula
function formatoNombre(primerApellido?: string, nombre?: string): string {
  const ap = (primerApellido || '').trim().toUpperCase();
  const nom = (nombre || '').trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  return `${ap} ${nom}`.trim();
}

export default function BoxesPage() {
  const [operador, setOperador] = useState<string | null>(null);
  const [operadorInput, setOperadorInput] = useState('');
  const [rows, setRows] = useState<BoxRow[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Filtros
  const [horaSel, setHoraSel] = useState<string>('');
  const [categoriasSel, setCategoriasSel] = useState<string[]>([]);
  const [boxSel, setBoxSel] = useState<string>('');
  const [verDNS, setVerDNS] = useState(false);

  // Operador guardado
  useEffect(() => {
    const g = typeof window !== 'undefined' ? localStorage.getItem('checkin_operador') : null;
    if (g) setOperador(g);
  }, []);

  const guardarOperador = () => {
    const n = operadorInput.trim();
    if (!n) return;
    localStorage.setItem('checkin_operador', n);
    setOperador(n);
  };


  // Cargar parrilla (boxes) + datos de inscripciones (match por dorsal)
  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const { supabaseClient } = await import('@/lib/inscripcion-client');
      const [boxesRes, insRes] = await Promise.all([
        supabaseClient.from('boxes').select('*').order('orden', { ascending: true }),
        supabaseClient.from('inscripciones').select('dorsal, nombre, primer_apellido, checkin_xco, checkin_xcc'),
      ]);
      if (boxesRes.error) throw new Error(boxesRes.error.message);

      // Mapa de inscripciones por dorsal
      const insByDorsal = new Map<string, { nombre: string; primer_apellido: string; checkin_xco?: boolean; checkin_xcc?: boolean }>();
      for (const i of insRes.data || []) {
        if (i.dorsal) insByDorsal.set(String(i.dorsal).trim(), i);
      }

      const merged: BoxRow[] = (boxesRes.data || []).map((b) => {
        const ins = insByDorsal.get(String(b.dorsal).trim());
        return {
          ...b,
          ins_nombre: ins?.nombre,
          ins_primer_apellido: ins?.primer_apellido,
          // XCO (domingo) es el día de estas salidas por boxes; usar checkin_xco
          ins_checkin: ins ? !!ins.checkin_xco : false,
        } as BoxRow;
      });
      setRows(merged);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { if (operador) cargar(); }, [operador, cargar]);

  // Horas de salida disponibles (ordenadas)
  const horas = useMemo(
    () => Array.from(new Set(rows.map((r) => r.hora_salida))).sort(),
    [rows]
  );

  // Categorías disponibles según la hora seleccionada
  const categoriasDeHora = useMemo(() => {
    const base = horaSel ? rows.filter((r) => r.hora_salida === horaSel) : rows;
    return Array.from(new Set(base.map((r) => r.categoria).filter(Boolean))).sort();
  }, [rows, horaSel]);

  // Boxes disponibles según hora + categorías seleccionadas
  const boxesDeHora = useMemo(() => {
    let base = horaSel ? rows.filter((r) => r.hora_salida === horaSel) : [];
    if (categoriasSel.length > 0) base = base.filter((r) => categoriasSel.includes(r.categoria));
    return Array.from(new Set(base.map((r) => r.box))).sort();
  }, [rows, horaSel, categoriasSel]);

  // Corredores del box seleccionado (respetando el orden del archivo)
  const corredoresDelBox = useMemo(() => {
    if (!horaSel || !boxSel) return [];
    let base = rows.filter((r) => r.hora_salida === horaSel && r.box === boxSel);
    if (categoriasSel.length > 0) base = base.filter((r) => categoriasSel.includes(r.categoria));
    return base.sort((a, b) => a.orden - b.orden);
  }, [rows, horaSel, boxSel, categoriasSel]);

  // Lista de DNS: solo cuando ya se dio la SALIDA de la tanda (salida_final=true)
  // y el corredor NO estuvo en el box. Así no aparecen tandas que aún no han salido.
  const listaDNS = useMemo(
    () => rows.filter((r) => r.salida_final && !r.en_box).sort((a, b) => a.orden - b.orden),
    [rows]
  );

  const toggleCategoria = (c: string) => {
    setCategoriasSel((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
    setBoxSel('');
  };


  // Marcar / desmarcar "en el box"
  const toggleEnBox = async (row: BoxRow) => {
    const nuevo = !row.en_box;
    // Optimista
    setRows((prev) => prev.map((r) => r.id === row.id
      ? { ...r, en_box: nuevo, en_box_por: nuevo ? operador : null }
      : r));
    try {
      const { supabaseClient } = await import('@/lib/inscripcion-client');
      await supabaseClient.from('boxes').update({
        en_box: nuevo,
        en_box_por: nuevo ? operador : null,
        en_box_fecha: nuevo ? new Date().toISOString() : null,
      }).eq('id', row.id);
    } catch {
      // revertir si falla
      setRows((prev) => prev.map((r) => r.id === row.id ? { ...r, en_box: row.en_box, en_box_por: row.en_box_por } : r));
      setError('No se pudo guardar el cambio de box.');
    }
  };

  // Dar la salida a TODA la tanda de una hora (check único del comisario).
  // Marca salida_final=true para todos los de esa hora. Los que NO están "en el box" quedan DNS.
  const darSalidaHora = async (hora: string) => {
    const dela = rows.filter((r) => r.hora_salida === hora);
    const enBox = dela.filter((r) => r.en_box).length;
    const dns = dela.length - enBox;
    if (!window.confirm(
      `¿Dar la SALIDA a la tanda de las ${hora}?\n\nEn el box (salen): ${enBox}\nNo estaban en el box (DNS): ${dns}\n\nEsta acción marca la salida de toda la tanda.`
    )) return;

    const ahora = new Date().toISOString();
    // Optimista
    setRows((prev) => prev.map((r) => r.hora_salida === hora
      ? { ...r, salida_final: true, salida_final_por: operador, salida_final_fecha: ahora }
      : r));
    try {
      const { supabaseClient } = await import('@/lib/inscripcion-client');
      await supabaseClient.from('boxes').update({
        salida_final: true,
        salida_final_por: operador,
        salida_final_fecha: ahora,
      }).eq('hora_salida', hora);
    } catch {
      setError('No se pudo guardar la salida de la tanda.');
      cargar();
    }
  };

  // Revertir la salida de una tanda (por si se dio por error)
  const revertirSalidaHora = async (hora: string) => {
    if (!window.confirm(`¿Revertir la salida de la tanda de las ${hora}?`)) return;
    setRows((prev) => prev.map((r) => r.hora_salida === hora
      ? { ...r, salida_final: false, salida_final_por: null, salida_final_fecha: null }
      : r));
    try {
      const { supabaseClient } = await import('@/lib/inscripcion-client');
      await supabaseClient.from('boxes').update({
        salida_final: false, salida_final_por: null, salida_final_fecha: null,
      }).eq('hora_salida', hora);
    } catch {
      setError('No se pudo revertir la salida.');
      cargar();
    }
  };

  // ¿Ya se dio la salida de esta hora? (todos los de la hora con salida_final)
  const salidaDadaHora = (hora: string): boolean => {
    const dela = rows.filter((r) => r.hora_salida === hora);
    return dela.length > 0 && dela.every((r) => r.salida_final);
  };

  const horaLabel = (h: string) => h; // ya viene HH:MM


  // ===== Login operador =====
  if (!operador) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-[#0d2240]">Check-in Boxes</h1>
          <p className="text-gray-600 mt-2 mb-6">Ingresá tu nombre para comenzar.</p>
          <input type="text" value={operadorInput} onChange={(e) => setOperadorInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && guardarOperador()} placeholder="Tu nombre" autoFocus
            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 text-center focus:ring-2 focus:ring-[#1a4f8b]" />
          <button onClick={guardarOperador} disabled={!operadorInput.trim()}
            className="w-full bg-[#0d2240] text-white px-6 py-3 rounded-lg text-lg font-bold hover:bg-[#1a4f8b] transition-colors disabled:opacity-50">
            Ingresar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-[#0d2240]">Check-in Boxes</h1>
        <p className="text-sm text-gray-500 mt-1">
          Operador: <span className="font-medium text-[#1a4f8b]">{operador}</span>
          <span className="mx-2 text-gray-300">|</span>
          <a href="/checkin" className="text-[#1a4f8b] hover:underline">Ir a Check-in</a>
          <span className="mx-2 text-gray-300">|</span>
          <button onClick={cargar} className="text-[#1a4f8b] hover:underline">Actualizar</button>
        </p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>}
      {cargando && <p className="text-center text-gray-500">Cargando parrilla…</p>}

      {!cargando && rows.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-6 rounded-lg text-center">
          No hay parrilla de boxes cargada. Subí el archivo desde el panel de Admin (botón &quot;Subir boxes&quot;).
        </div>
      )}

      {/* Tabs: Boxes / DNS */}
      {!cargando && rows.length > 0 && (
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button onClick={() => setVerDNS(false)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${!verDNS ? 'border-[#0d2240] text-[#0d2240]' : 'border-transparent text-gray-500'}`}>
            Boxes
          </button>
          <button onClick={() => setVerDNS(true)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${verDNS ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500'}`}>
            DNS ({listaDNS.length})
          </button>
        </div>
      )}


      {/* ===== TAB DNS ===== */}
      {!cargando && rows.length > 0 && verDNS && (
        <div className="bg-white rounded-xl shadow-md p-5">
          <h2 className="text-lg font-bold text-red-600 mb-1">DNS — No salieron</h2>
          <p className="text-sm text-gray-500 mb-4">Corredores que no fueron marcados &quot;en el box&quot;. {listaDNS.length} en total.</p>
          {listaDNS.length === 0 ? (
            <p className="text-gray-400 text-center py-6">Todos los corredores estuvieron en su box.</p>
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
                  {listaDNS.map((r) => (
                    <tr key={r.id} className="border-t border-gray-100">
                      <td className="px-4 py-2 font-bold text-red-600">{r.dorsal}</td>
                      <td className="px-4 py-2">{formatoNombre(r.ins_primer_apellido, r.ins_nombre) || r.nombre_archivo}</td>
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

      {/* ===== TAB BOXES ===== */}
      {!cargando && rows.length > 0 && !verDNS && (
        <>
          {/* Filtro: hora de salida */}
          <div className="bg-white rounded-xl shadow-md p-5 mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Hora de salida</label>
            <div className="flex flex-wrap gap-2">
              {horas.map((h) => (
                <button key={h} onClick={() => { setHoraSel(h); setBoxSel(''); setCategoriasSel([]); }}
                  className={`px-4 py-2 rounded-lg border font-medium transition-colors ${
                    horaSel === h ? 'bg-[#0d2240] text-white border-[#0d2240]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}>
                  {horaLabel(h)}
                </button>
              ))}
            </div>

            {/* Filtro: categorías (opcional, múltiple) */}
            {horaSel && categoriasDeHora.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Categorías (opcional)</label>
                  {categoriasSel.length > 0 && (
                    <button onClick={() => { setCategoriasSel([]); setBoxSel(''); }} className="text-xs text-[#1a4f8b] hover:underline">Limpiar</button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {categoriasDeHora.map((c) => (
                    <button key={c} onClick={() => toggleCategoria(c)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        categoriasSel.includes(c) ? 'bg-[#1a4f8b] text-white border-[#1a4f8b]' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'
                      }`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cuadros de boxes de la hora seleccionada */}
          {horaSel && (
            <div className="bg-white rounded-xl shadow-md p-5 mb-4">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">Boxes de las {horaSel}</label>
                {/* Botón ÚNICO de salida por hora (comisario) */}
                {salidaDadaHora(horaSel) ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#0d2240] bg-blue-50 px-3 py-1.5 rounded-lg">&#10003; Salida dada</span>
                    <button onClick={() => revertirSalidaHora(horaSel)} className="text-xs text-[#1a4f8b] hover:underline">Revertir</button>
                  </div>
                ) : (
                  <button onClick={() => darSalidaHora(horaSel)}
                    className="bg-[#0d2240] text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-[#1a4f8b] transition-colors">
                    Dar salida {horaSel}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {boxesDeHora.map((b) => (
                  <button key={b} onClick={() => setBoxSel(b)}
                    className={`p-6 rounded-xl border-2 font-bold text-lg transition-all ${
                      boxSel === b ? 'border-[#1a4f8b] bg-blue-50 text-[#0d2240]' : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}>
                    {b}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}


      {/* Grilla de corredores del box seleccionado */}
      {!cargando && rows.length > 0 && !verDNS && horaSel && boxSel && (
        <div className="bg-white rounded-xl shadow-md p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0d2240]">{boxSel} · {horaSel}</h2>
            <p className="text-sm text-gray-500">{corredoresDelBox.length} corredores</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {corredoresDelBox.map((r) => (
              <div key={r.id}
                className={`rounded-xl border-2 p-3 transition-all ${
                  r.en_box ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'
                }`}>
                {/* Dorsal grande */}
                <p className="text-3xl font-extrabold text-[#1a4f8b] text-center leading-none">{r.dorsal}</p>
                {/* Apellido MAYÚSCULA + Nombre */}
                <p className="text-xs text-gray-700 text-center mt-1 leading-tight min-h-[2rem]">
                  {formatoNombre(r.ins_primer_apellido, r.ins_nombre) || r.nombre_archivo}
                </p>
                <div className="flex flex-col gap-1.5 mt-2">
                  {/* Estado check-in (de la BD, solo lectura) */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className={r.ins_checkin ? 'text-green-600' : 'text-gray-300'}>&#10003;</span>
                    <span className={r.ins_checkin ? 'text-green-700' : 'text-gray-400'}>Check-in</span>
                  </div>
                  {/* Toggle: en el box */}
                  <button onClick={() => toggleEnBox(r)}
                    className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg border transition-colors ${
                      r.en_box ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}>
                    <span>{r.en_box ? '\u2713' : '\u25CB'}</span> En el box
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
