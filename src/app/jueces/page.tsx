'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { getDiasParticipa, type DiaEvento } from '@/lib/dias-evento';

interface Registro {
  id: string;
  dorsal?: string;
  nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  evento: string;
  categoria: string;
  numero_identificacion: string;
  checkin_xcc?: boolean;
  checkin_xcc_fecha?: string | null;
  checkin_xcc_por?: string | null;
  checkin_xco?: boolean;
  checkin_xco_fecha?: string | null;
  checkin_xco_por?: string | null;
}

// Día real de BD según el filtro de día seleccionado
function estadoDia(r: Registro, dia: DiaEvento) {
  if (dia === 'XCC') {
    return { hecho: !!r.checkin_xcc, fecha: r.checkin_xcc_fecha, por: r.checkin_xcc_por };
  }
  return { hecho: !!r.checkin_xco, fecha: r.checkin_xco_fecha, por: r.checkin_xco_por };
}

function formatoHora(iso?: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('es-CR', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

export default function JuecesPage() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [filtroEvento, setFiltroEvento] = useState('');
  const [categoriasSel, setCategoriasSel] = useState<string[]>([]);
  const [dia, setDia] = useState<DiaEvento>('XCO');
  const [busqueda, setBusqueda] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const { supabaseClient } = await import('@/lib/inscripcion-client');
      const { data, error } = await supabaseClient
        .from('inscripciones')
        .select('id, dorsal, nombre, primer_apellido, segundo_apellido, evento, categoria, numero_identificacion, checkin_xcc, checkin_xcc_fecha, checkin_xcc_por, checkin_xco, checkin_xco_fecha, checkin_xco_por');

      if (error) throw new Error(error.message);
      setRegistros(data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Lista de eventos que existen en los datos
  const eventos = useMemo(() => {
    const set = new Set(registros.map((r) => r.evento).filter(Boolean));
    return Array.from(set).sort();
  }, [registros]);

  // Categorías disponibles para el evento seleccionado
  const categoriasDisponibles = useMemo(() => {
    const base = filtroEvento ? registros.filter((r) => r.evento === filtroEvento) : registros;
    const set = new Set(base.map((r) => r.categoria).filter(Boolean));
    return Array.from(set).sort();
  }, [registros, filtroEvento]);

  // Al cambiar de evento, limpiar categorías que ya no existen
  useEffect(() => {
    setCategoriasSel((prev) => prev.filter((c) => categoriasDisponibles.includes(c)));
  }, [categoriasDisponibles]);

  const toggleCategoria = (cat: string) => {
    setCategoriasSel((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  // Resultado filtrado
  const filtrados = useMemo(() => {
    let res = registros.filter((r) => getDiasParticipa(r.evento, r.categoria).includes(dia));
    if (filtroEvento) res = res.filter((r) => r.evento === filtroEvento);
    if (categoriasSel.length > 0) res = res.filter((r) => categoriasSel.includes(r.categoria));
    if (busqueda.trim()) {
      const t = busqueda.trim().toLowerCase();
      res = res.filter((r) =>
        `${r.nombre} ${r.primer_apellido} ${r.segundo_apellido}`.toLowerCase().includes(t) ||
        (r.numero_identificacion || '').toLowerCase().includes(t) ||
        (r.dorsal || '').toLowerCase().includes(t)
      );
    }
    // Ordenar por dorsal (numérico si aplica) y luego por nombre
    return res.sort((a, b) => {
      const da = parseInt(a.dorsal || '', 10);
      const db = parseInt(b.dorsal || '', 10);
      if (!isNaN(da) && !isNaN(db)) return da - db;
      return `${a.primer_apellido} ${a.nombre}`.localeCompare(`${b.primer_apellido} ${b.nombre}`);
    });
  }, [registros, dia, filtroEvento, categoriasSel, busqueda]);

  // Mostrar listado solo cuando ya se eligió al menos un filtro (categoría)
  const mostrarLista = categoriasSel.length > 0 || filtroEvento !== '';

  const totalHechos = filtrados.filter((r) => estadoDia(r, dia).hecho).length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-[#0d2240]">Consulta de Participantes · Jueces</h1>
        <p className="text-gray-600 mt-1 text-sm">Vista de solo lectura. Seleccioná evento y categorías para ver el listado.</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-md p-5 mb-6">
        {/* Día */}
        <label className="block text-sm font-medium text-gray-700 mb-2">Día</label>
        <div className="flex gap-2 mb-4">
          {(['XCC', 'XCO'] as DiaEvento[]).map((d) => (
            <button key={d} onClick={() => setDia(d)}
              className={`flex-1 px-4 py-2 rounded-lg border font-medium transition-colors ${
                dia === d ? 'bg-[#0d2240] text-white border-[#0d2240]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}>
              {d === 'XCC' ? 'XCC · Sábado' : 'XCO · Domingo'}
            </button>
          ))}
        </div>

        {/* Evento */}
        <label className="block text-sm font-medium text-gray-700 mb-1">Evento</label>
        <select value={filtroEvento} onChange={(e) => setFiltroEvento(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent">
          <option value="">Todos los eventos</option>
          {eventos.map((ev) => <option key={ev} value={ev}>{ev}</option>)}
        </select>

        {/* Categorías (selección múltiple) */}
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Categorías (podés elegir varias)</label>
          {categoriasSel.length > 0 && (
            <button onClick={() => setCategoriasSel([])} className="text-xs text-[#1a4f8b] hover:underline">Limpiar</button>
          )}
        </div>
        {categoriasDisponibles.length === 0 ? (
          <p className="text-sm text-gray-400">No hay categorías para mostrar.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categoriasDisponibles.map((cat) => {
              const activa = categoriasSel.includes(cat);
              return (
                <button key={cat} onClick={() => toggleCategoria(cat)}
                  className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                    activa ? 'bg-[#1a4f8b] text-white border-[#1a4f8b]' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'
                  }`}>
                  {activa ? '✓ ' : ''}{cat}
                </button>
              );
            })}
          </div>
        )}

        {/* Búsqueda */}
        <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">Buscar (nombre, cédula o dorsal)</label>
        <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Escribí para filtrar…"
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent" />
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>}
      {cargando && <p className="text-center text-gray-500">Cargando…</p>}

      {/* Listado */}
      {!cargando && !mostrarLista && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-6 rounded-lg text-center">
          Seleccioná un <strong>evento</strong> o una o más <strong>categorías</strong> para ver el listado.
        </div>
      )}

      {!cargando && mostrarLista && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-5 py-3 border-b bg-gray-50 flex items-center justify-between">
            <p className="text-sm font-medium text-[#0d2240]">
              {filtrados.length} participante{filtrados.length !== 1 ? 's' : ''}
            </p>
            <p className="text-sm text-gray-600">
              Check-in {dia}: <span className="font-bold text-green-600">{totalHechos}</span> / {filtrados.length}
            </p>
          </div>

          {filtrados.length === 0 ? (
            <p className="px-5 py-6 text-center text-gray-500">No hay participantes con esos filtros.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="text-left px-4 py-2">Dorsal</th>
                    <th className="text-left px-4 py-2">Nombre</th>
                    <th className="text-left px-4 py-2 hidden sm:table-cell">Categoría</th>
                    <th className="text-left px-4 py-2">Check-in {dia}</th>
                    <th className="text-left px-4 py-2 hidden md:table-cell">Hora</th>
                    <th className="text-left px-4 py-2 hidden md:table-cell">Operador</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((r) => {
                    const est = estadoDia(r, dia);
                    return (
                      <tr key={r.id} className="border-t border-gray-100">
                        <td className="px-4 py-2 font-bold text-[#1a4f8b]">{r.dorsal || '—'}</td>
                        <td className="px-4 py-2">
                          {r.nombre} {r.primer_apellido} {r.segundo_apellido}
                          <div className="text-xs text-gray-400 sm:hidden">{r.categoria}</div>
                        </td>
                        <td className="px-4 py-2 hidden sm:table-cell text-gray-600">{r.categoria}</td>
                        <td className="px-4 py-2">
                          {est.hecho
                            ? <span className="text-green-600 font-medium">✓ Llegó</span>
                            : <span className="text-gray-400">Pendiente</span>}
                        </td>
                        <td className="px-4 py-2 hidden md:table-cell text-gray-500">{formatoHora(est.fecha)}</td>
                        <td className="px-4 py-2 hidden md:table-cell text-gray-500">{est.por || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="text-center mt-6">
        <button onClick={cargar} className="text-sm text-[#1a4f8b] hover:underline">Actualizar datos</button>
      </div>
    </div>
  );
}
