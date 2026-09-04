'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface Inscrito {
  id: string;
  nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  evento: string;
  categoria: string;
  equipo: string;
}

function ListaInscritosContent() {
  const searchParams = useSearchParams();
  const grupo = searchParams.get('grupo') || 'copa'; // 'copa' o 'kids'

  const [inscritos, setInscritos] = useState<Inscrito[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroEvento, setFiltroEvento] = useState('');

  const esKids = grupo === 'kids';
  const titulo = esKids ? 'Copa Kids' : 'La Copa';

  const cargar = async () => {
    setCargando(true);
    try {
      const { supabaseClient } = await import('@/lib/inscripcion-client');
      let query = supabaseClient
        .from('inscripciones')
        .select('id, nombre, primer_apellido, segundo_apellido, evento, categoria, equipo');

      if (esKids) {
        query = query.eq('evento', 'Copa Kids');
      } else {
        query = query.neq('evento', 'Copa Kids');
      }

      const { data, error } = await query.order('primer_apellido', { ascending: true });
      if (!error && data) setInscritos(data);
    } catch (err) {
      console.error('Error cargando inscritos:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [grupo]);

  // Categorías y eventos únicos para los filtros
  const categorias = Array.from(new Set(inscritos.map((i) => i.categoria))).sort();
  const eventos = Array.from(new Set(inscritos.map((i) => i.evento))).sort();

  // Filtrado
  const filtrados = inscritos.filter((i) => {
    const texto = busqueda.trim().toLowerCase();
    const nombreCompleto = `${i.nombre} ${i.primer_apellido} ${i.segundo_apellido}`.toLowerCase();
    const coincideTexto = !texto || nombreCompleto.includes(texto) || (i.equipo || '').toLowerCase().includes(texto);
    const coincideCat = !filtroCategoria || i.categoria === filtroCategoria;
    const coincideEvento = !filtroEvento || i.evento === filtroEvento;
    return coincideTexto && coincideCat && coincideEvento;
  });

  const colorPrimary = esKids ? '#1a7a3a' : '#0d2240';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: colorPrimary }}>{titulo}</h1>
            <p className="text-sm text-gray-500">{inscritos.length} INSCRITOS</p>
          </div>
          <a href="/inscritos" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <span aria-hidden="true">&larr;</span> Volver
          </a>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Buscador y filtros */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Buscar Inscrito</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">Nombre o Equipo</label>
              <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Ej: Juan o Team..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent" />
            </div>
            {!esKids && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">Evento</label>
                <select value={filtroEvento} onChange={(e) => setFiltroEvento(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent">
                  <option value="">Todos los eventos</option>
                  {eventos.map((ev) => (<option key={ev} value={ev}>{ev}</option>))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">Categoría</label>
              <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent">
                <option value="">Todas las categorías</option>
                {categorias.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button onClick={() => { setBusqueda(''); setFiltroCategoria(''); setFiltroEvento(''); }}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                Limpiar
              </button>
              <button onClick={cargar}
                className="border border-[#1a4f8b] text-[#1a4f8b] px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors text-sm">
                Actualizar
              </button>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-500 mb-3">Mostrando {filtrados.length} de {inscritos.length} inscritos</p>

        {/* Tabla */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {cargando ? (
            <div className="text-center py-12 text-gray-500">Cargando inscritos...</div>
          ) : filtrados.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No se encontraron inscritos.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left">Nombre</th>
                    <th className="px-4 py-3 text-left">Evento</th>
                    <th className="px-4 py-3 text-left">Categoría</th>
                    <th className="px-4 py-3 text-left">Equipo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtrados.map((i) => (
                    <tr key={i.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {i.nombre} {i.primer_apellido} {i.segundo_apellido}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{i.evento}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block bg-blue-50 text-[#1a4f8b] text-xs font-medium px-2 py-1 rounded-full">
                          {i.categoria}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{i.equipo || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ListaInscritosPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
      <ListaInscritosContent />
    </Suspense>
  );
}
