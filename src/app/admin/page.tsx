'use client';

import { useState, useEffect } from 'react';
import { EVENTS } from '@/lib/categories';

interface Inscripcion {
  id: string;
  codigo_inscripcion: string;
  nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  numero_identificacion: string;
  email: string;
  celular: string;
  evento: string;
  categoria: string;
  genero: string;
  provincia: string;
  metodo_pago: string;
  estado_pago: string;
  requiere_factura: boolean;
  checkin: boolean;
  checkin_fecha: string | null;
  created_at: string;
}

export default function AdminPage() {
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEvento, setFiltroEvento] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [busqueda, setBusqueda] = useState('');


  const cargarInscripciones = async () => {
    setCargando(true);
    try {
      const { supabaseClient } = await import('@/lib/inscripcion-client');
      let query = supabaseClient.from('inscripciones').select('*');

      if (filtroEvento) query = query.eq('evento', filtroEvento);
      if (filtroCategoria) query = query.eq('categoria', filtroCategoria);

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando inscripciones:', error);
      } else if (data) {
        setInscripciones(data);
      }
    } catch (err) {
      console.error('Error cargando inscripciones:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarInscripciones();
  }, [filtroEvento, filtroCategoria]);

  // Filtrar por búsqueda local
  const inscripcionesFiltradas = inscripciones.filter((insc) => {
    if (!busqueda) return true;
    const texto = busqueda.toLowerCase();
    return (
      insc.nombre.toLowerCase().includes(texto) ||
      insc.primer_apellido.toLowerCase().includes(texto) ||
      insc.segundo_apellido.toLowerCase().includes(texto) ||
      insc.numero_identificacion.toLowerCase().includes(texto) ||
      insc.codigo_inscripcion.toLowerCase().includes(texto) ||
      insc.email.toLowerCase().includes(texto)
    );
  });

  // Estadísticas
  const totalInscritos = inscripciones.length;
  const totalCheckin = inscripciones.filter((i) => i.checkin).length;
  const totalPagoPendiente = inscripciones.filter((i) => i.estado_pago === 'pendiente').length;
  const totalFactura = inscripciones.filter((i) => i.requiere_factura).length;


  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0d2240]">Panel de Administración</h1>
          <p className="text-gray-600">Gestión de inscripciones - La Copa</p>
        </div>
        <a
          href="/checkin"
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
        >
          Ir a Check-in
        </a>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-3xl font-bold text-[#0d2240]">{totalInscritos}</p>
          <p className="text-sm text-gray-500">Total Inscritos</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{totalCheckin}</p>
          <p className="text-sm text-gray-500">Check-in</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-3xl font-bold text-amber-600">{totalPagoPendiente}</p>
          <p className="text-sm text-gray-500">Pago Pendiente</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-3xl font-bold text-[#1a4f8b]">{totalFactura}</p>
          <p className="text-sm text-gray-500">Requieren Factura</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, cédula, código..."
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent"
          />
          <select
            value={filtroEvento}
            onChange={(e) => setFiltroEvento(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent"
          >
            <option value="">Todos los eventos</option>
            {EVENTS.map((ev) => (
              <option key={ev} value={ev}>{ev}</option>
            ))}
          </select>
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent"
          >
            <option value="">Todas las categorías</option>
          </select>
        </div>
      </div>


      {/* Tabla de inscripciones */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {cargando ? (
          <div className="text-center py-12 text-gray-500">Cargando inscripciones...</div>
        ) : inscripcionesFiltradas.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No hay inscripciones registradas.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0d2240] text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Código</th>
                  <th className="px-4 py-3 text-left">Nombre</th>
                  <th className="px-4 py-3 text-left">Evento</th>
                  <th className="px-4 py-3 text-left">Categoría</th>
                  <th className="px-4 py-3 text-left">Pago</th>
                  <th className="px-4 py-3 text-left">Check-in</th>
                  <th className="px-4 py-3 text-left">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inscripcionesFiltradas.map((insc) => (
                  <tr key={insc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-[#1a4f8b]">
                      {insc.codigo_inscripcion}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {insc.nombre} {insc.primer_apellido}
                      </div>
                      <div className="text-xs text-gray-500">{insc.email}</div>
                    </td>
                    <td className="px-4 py-3">{insc.evento}</td>
                    <td className="px-4 py-3">{insc.categoria}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        insc.estado_pago === 'confirmado'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {insc.metodo_pago} - {insc.estado_pago === 'confirmado' ? 'OK' : 'Pend.'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {insc.checkin ? (
                        <span className="text-green-600 font-medium">&#10003; Sí</span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(insc.created_at).toLocaleDateString('es-CR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Contador */}
      <p className="text-sm text-gray-500 mt-4 text-center">
        Mostrando {inscripcionesFiltradas.length} de {totalInscritos} inscripciones
      </p>
    </div>
  );
}
