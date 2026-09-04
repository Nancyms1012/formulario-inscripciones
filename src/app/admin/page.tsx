'use client';

import { useState, useEffect } from 'react';
import { EVENTS } from '@/lib/categories';

interface Inscripcion {
  id: string;
  codigo_inscripcion: string;
  dorsal?: string;
  nacionalidad?: string;
  tipo_identificacion?: string;
  numero_identificacion: string;
  nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  email: string;
  celular: string;
  fecha_nacimiento?: string;
  genero: string;
  provincia: string;
  equipo?: string;
  tipo_licencia?: string;
  uci_id?: string;
  evento: string;
  categoria: string;
  beneficiario_nombre?: string;
  beneficiario_cedula?: string;
  beneficiario_telefono?: string;
  beneficiario_parentesco?: string;
  metodo_pago: string;
  estado_pago: string;
  requiere_factura: boolean;
  factura_nombre?: string;
  factura_cedula?: string;
  factura_email?: string;
  comprobante_sinpe_url: string | null;
  checkin: boolean;
  checkin_fecha: string | null;
  created_at: string;
}

export default function AdminPage() {
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [todasInscripciones, setTodasInscripciones] = useState<Inscripcion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEvento, setFiltroEvento] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [tab, setTab] = useState<'inscripciones' | 'resumen'>('inscripciones');
  const [detalle, setDetalle] = useState<Inscripcion | null>(null);


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

  // Cargar TODAS las inscripciones (sin filtro) para el resumen
  const cargarTodas = async () => {
    try {
      const { supabaseClient } = await import('@/lib/inscripcion-client');
      const { data, error } = await supabaseClient
        .from('inscripciones')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        setTodasInscripciones(data);
      }
    } catch (err) {
      console.error('Error cargando todas las inscripciones:', err);
    }
  };

  useEffect(() => {
    cargarInscripciones();
  }, [filtroEvento, filtroCategoria]);

  useEffect(() => {
    cargarTodas();
  }, []);

  // Eliminar una inscripción
  const eliminarInscripcion = async (id: string, nombre: string, codigo: string) => {
    const confirmar = window.confirm(
      `¿Seguro que querés eliminar la inscripción de ${nombre} (${codigo})?\n\nEsta acción NO se puede deshacer.`
    );
    if (!confirmar) return;

    try {
      const { supabaseClient } = await import('@/lib/inscripcion-client');
      const { error } = await supabaseClient
        .from('inscripciones')
        .delete()
        .eq('id', id);

      if (error) {
        alert('Error al eliminar: ' + error.message);
        return;
      }
      // Quitar de las listas locales sin recargar todo
      setInscripciones((prev) => prev.filter((i) => i.id !== id));
      setTodasInscripciones((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      alert('Error al eliminar la inscripción.');
      console.error(err);
    }
  };

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

  // ===== RESUMEN (usa TODAS las inscripciones, sin filtro) =====
  // Total inscritos por evento
  const totalPorEvento = todasInscripciones.reduce((acc, i) => {
    acc[i.evento] = (acc[i.evento] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Tabla evento + categoría con inscritos, pago pendiente y factura
  const resumenPorCategoria = Object.values(
    todasInscripciones.reduce((acc, i) => {
      const key = `${i.evento}|${i.categoria}`;
      if (!acc[key]) {
        acc[key] = { evento: i.evento, categoria: i.categoria, inscritos: 0, pagoPendiente: 0, factura: 0 };
      }
      acc[key].inscritos += 1;
      if (i.estado_pago === 'pendiente') acc[key].pagoPendiente += 1;
      if (i.requiere_factura) acc[key].factura += 1;
      return acc;
    }, {} as Record<string, { evento: string; categoria: string; inscritos: number; pagoPendiente: number; factura: number }>)
  ).sort((a, b) => a.evento.localeCompare(b.evento) || a.categoria.localeCompare(b.categoria));

  // Subir CSV de dorsales (match por número de identificación)
  const [subiendoDorsales, setSubiendoDorsales] = useState(false);

  const subirDorsales = async (file: File) => {
    setSubiendoDorsales(true);
    try {
      const texto = await file.text();
      const lineas = texto.split(/\r?\n/).filter((l) => l.trim());
      if (lineas.length < 2) {
        alert('El archivo está vacío o no tiene datos.');
        setSubiendoDorsales(false);
        return;
      }

      // Detectar columnas del encabezado
      const encabezado = lineas[0].split(',').map((h) => h.trim().toLowerCase());
      const idxId = encabezado.findIndex((h) => h.includes('identificacion') || h.includes('identificación') || h.includes('cedula') || h.includes('cédula') || h === 'id');
      const idxDorsal = encabezado.findIndex((h) => h.includes('dorsal') || h.includes('numero') || h.includes('número') || h === 'placa');

      if (idxId === -1 || idxDorsal === -1) {
        alert('El CSV debe tener una columna de identificación (cédula) y una de dorsal.\n\nEjemplo de encabezado:\nidentificacion,dorsal');
        setSubiendoDorsales(false);
        return;
      }

      const { supabaseClient } = await import('@/lib/inscripcion-client');
      let actualizados = 0;
      let noEncontrados = 0;

      for (let i = 1; i < lineas.length; i++) {
        const cols = lineas[i].split(',');
        const idVal = (cols[idxId] || '').trim().replace(/["']/g, '');
        const dorsalVal = (cols[idxDorsal] || '').trim().replace(/["']/g, '');
        if (!idVal || !dorsalVal) continue;

        const { data, error } = await supabaseClient
          .from('inscripciones')
          .update({ dorsal: dorsalVal })
          .eq('numero_identificacion', idVal)
          .select('id');

        if (!error && data && data.length > 0) {
          actualizados += data.length;
        } else {
          noEncontrados++;
        }
      }

      alert(`Dorsales actualizados: ${actualizados}\nNo encontrados: ${noEncontrados}`);
      cargarInscripciones();
      cargarTodas();
    } catch (err) {
      alert('Error al procesar el CSV.');
      console.error(err);
    } finally {
      setSubiendoDorsales(false);
    }
  };

  // Descargar CSV con todas las columnas
  const descargarCSV = async () => {
    // Traer TODOS los datos (sin filtros) con todas las columnas
    const { supabaseClient } = await import('@/lib/inscripcion-client');
    const { data, error } = await supabaseClient
      .from('inscripciones')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      alert('No hay datos para descargar.');
      return;
    }

    // Definir columnas en orden
    const columnas = [
      'codigo_inscripcion', 'nacionalidad', 'tipo_identificacion', 'numero_identificacion',
      'nombre', 'primer_apellido', 'segundo_apellido', 'celular', 'email',
      'fecha_nacimiento', 'genero', 'provincia', 'equipo', 'tipo_licencia', 'uci_id',
      'evento', 'categoria', 'beneficiario_nombre', 'beneficiario_cedula',
      'beneficiario_telefono', 'beneficiario_parentesco', 'metodo_pago',
      'estado_pago', 'requiere_factura', 'checkin', 'checkin_fecha', 'created_at'
    ];

    const encabezados = [
      'Código', 'Nacionalidad', 'Tipo ID', '# Identificación',
      'Nombre', 'Primer Apellido', 'Segundo Apellido', 'Celular', 'Email',
      'Fecha Nacimiento', 'Género', 'Provincia', 'Equipo', 'Tipo Licencia', 'UCI ID',
      'Evento', 'Categoría', 'Beneficiario Nombre', 'Beneficiario Cédula',
      'Beneficiario Teléfono', 'Beneficiario Parentesco', 'Método Pago',
      'Estado Pago', 'Requiere Factura', 'Check-in', 'Fecha Check-in', 'Fecha Inscripción'
    ];

    // Crear CSV
    const filas = data.map((row: Record<string, unknown>) =>
      columnas.map((col) => {
        const valor = row[col];
        if (valor === null || valor === undefined) return '';
        if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
        const str = String(valor);
        // Escapar comillas y envolver en comillas si tiene comas
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    );

    const csv = [encabezados.join(','), ...filas].join('\n');

    // Descargar archivo
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inscripciones_la_copa_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };


  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0d2240]">Panel de Administración</h1>
          <p className="text-gray-600">Gestión de inscripciones - La Copa</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={descargarCSV}
            className="bg-[#1a4f8b] text-white px-4 py-2 rounded-lg hover:bg-[#0d2240] transition-colors text-sm"
          >
            Descargar CSV
          </button>
          <label className="bg-[#1a4f8b] text-white px-4 py-2 rounded-lg hover:bg-[#0d2240] transition-colors text-sm cursor-pointer">
            {subiendoDorsales ? 'Subiendo...' : 'Subir dorsales (CSV)'}
            <input type="file" accept=".csv" className="hidden" disabled={subiendoDorsales}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) subirDorsales(f); e.target.value = ''; }} />
          </label>
          <a
            href="/checkin"
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            Ir a Check-in
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setTab('inscripciones')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'inscripciones' ? 'border-[#0d2240] text-[#0d2240]' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Inscripciones
        </button>
        <button
          onClick={() => setTab('resumen')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'resumen' ? 'border-[#0d2240] text-[#0d2240]' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Resumen
        </button>
      </div>

      {/* ===== TAB RESUMEN ===== */}
      {tab === 'resumen' && (
        <div>
          {/* Total inscritos por evento */}
          <h2 className="text-lg font-bold text-[#0d2240] mb-3">Total inscritos por evento</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {Object.entries(totalPorEvento).length === 0 ? (
              <p className="text-gray-500 text-sm col-span-4">No hay inscripciones aún.</p>
            ) : (
              Object.entries(totalPorEvento).map(([ev, cant]) => (
                <div key={ev} className="bg-white rounded-xl shadow p-4 text-center">
                  <p className="text-3xl font-bold text-[#0d2240]">{cant}</p>
                  <p className="text-sm text-gray-500">{ev}</p>
                </div>
              ))
            )}
            <div className="bg-[#0d2240] rounded-xl shadow p-4 text-center">
              <p className="text-3xl font-bold text-white">{todasInscripciones.length}</p>
              <p className="text-sm text-blue-200">Total general</p>
            </div>
          </div>

          {/* Tabla por evento y categoría */}
          <h2 className="text-lg font-bold text-[#0d2240] mb-3">Detalle por evento y categoría</h2>
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#0d2240] text-white">
                  <tr>
                    <th className="px-4 py-3 text-left">Evento</th>
                    <th className="px-4 py-3 text-left">Categoría</th>
                    <th className="px-4 py-3 text-center">Inscritos</th>
                    <th className="px-4 py-3 text-center">Pago Pendiente</th>
                    <th className="px-4 py-3 text-center">Requieren Factura</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {resumenPorCategoria.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-gray-500">No hay inscripciones registradas.</td></tr>
                  ) : (
                    resumenPorCategoria.map((r) => (
                      <tr key={`${r.evento}-${r.categoria}`} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{r.evento}</td>
                        <td className="px-4 py-3">{r.categoria}</td>
                        <td className="px-4 py-3 text-center font-bold text-[#0d2240]">{r.inscritos}</td>
                        <td className="px-4 py-3 text-center">
                          {r.pagoPendiente > 0 ? <span className="text-amber-600 font-medium">{r.pagoPendiente}</span> : <span className="text-gray-400">0</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {r.factura > 0 ? <span className="text-[#1a4f8b] font-medium">{r.factura}</span> : <span className="text-gray-400">0</span>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===== TAB INSCRIPCIONES ===== */}
      {tab === 'inscripciones' && (
      <>
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
                  <th className="px-4 py-3 text-left">Comprobante</th>
                  <th className="px-4 py-3 text-left">Check-in</th>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inscripcionesFiltradas.map((insc) => (
                  <tr key={insc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-[#1a4f8b]">
                      {insc.codigo_inscripcion}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setDetalle(insc)} className="text-left hover:underline">
                        <div className="font-medium text-[#1a4f8b]">
                          {insc.nombre} {insc.primer_apellido}
                        </div>
                        <div className="text-xs text-gray-500">{insc.email}</div>
                      </button>
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
                      {insc.comprobante_sinpe_url ? (
                        <a href={insc.comprobante_sinpe_url} target="_blank" rel="noopener noreferrer"
                          className="text-[#1a4f8b] underline text-xs hover:text-[#0d2240]">
                          Ver comprobante
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">{insc.metodo_pago === 'Sinpe' ? 'Sin archivo' : '—'}</span>
                      )}
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
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => setDetalle(insc)}
                          className="text-[#1a4f8b] hover:text-[#0d2240] hover:bg-blue-50 rounded px-2 py-1 text-xs font-medium transition-colors"
                          title="Ver todos los datos"
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => eliminarInscripcion(insc.id, `${insc.nombre} ${insc.primer_apellido}`, insc.codigo_inscripcion)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 rounded px-2 py-1 text-xs font-medium transition-colors"
                          title="Eliminar inscripción"
                        >
                          Eliminar
                        </button>
                      </div>
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
      </>
      )}

      {/* Modal de detalle completo */}
      {detalle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDetalle(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header del modal */}
            <div className="bg-[#0d2240] text-white px-6 py-4 rounded-t-xl flex items-center justify-between sticky top-0">
              <div>
                {detalle.dorsal ? (
                  <p className="font-bold text-2xl">#{detalle.dorsal} <span className="font-mono font-normal text-sm text-blue-200">({detalle.codigo_inscripcion})</span></p>
                ) : (
                  <p className="font-mono font-bold text-lg">{detalle.codigo_inscripcion}</p>
                )}
                <p className="text-sm text-blue-200">{detalle.nombre} {detalle.primer_apellido} {detalle.segundo_apellido}</p>
              </div>
              <button onClick={() => setDetalle(null)} className="text-white hover:bg-white/20 rounded-lg w-8 h-8 flex items-center justify-center text-xl">
                &times;
              </button>
            </div>

            {/* Cuerpo */}
            <div className="p-6 space-y-6">
              {/* Datos Personales */}
              <div>
                <h3 className="text-sm font-bold text-[#0d2240] uppercase mb-2 border-b pb-1">Datos Personales</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div><span className="text-gray-500">Nacionalidad:</span> {detalle.nacionalidad || '—'}</div>
                  <div><span className="text-gray-500">Tipo ID:</span> {detalle.tipo_identificacion || '—'}</div>
                  <div><span className="text-gray-500"># Identificación:</span> <strong>{detalle.numero_identificacion}</strong></div>
                  <div><span className="text-gray-500">Género:</span> {detalle.genero === 'F' ? 'Femenino' : 'Masculino'}</div>
                  <div><span className="text-gray-500">Fecha nacimiento:</span> {detalle.fecha_nacimiento || '—'}</div>
                  <div><span className="text-gray-500">Provincia:</span> {detalle.provincia}</div>
                  <div><span className="text-gray-500">Celular:</span> {detalle.celular}</div>
                  <div className="col-span-2"><span className="text-gray-500">Email:</span> {detalle.email}</div>
                </div>
              </div>

              {/* Datos de la Carrera */}
              <div>
                <h3 className="text-sm font-bold text-[#0d2240] uppercase mb-2 border-b pb-1">Datos de la Carrera</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div><span className="text-gray-500">Evento:</span> <strong>{detalle.evento}</strong></div>
                  <div><span className="text-gray-500">Categoría:</span> <strong>{detalle.categoria}</strong></div>
                  <div><span className="text-gray-500">Equipo:</span> {detalle.equipo || '—'}</div>
                  <div><span className="text-gray-500">Tipo licencia:</span> {detalle.tipo_licencia || '—'}</div>
                  <div><span className="text-gray-500">UCI ID:</span> {detalle.uci_id || '—'}</div>
                </div>
              </div>

              {/* Contacto de Emergencia */}
              <div>
                <h3 className="text-sm font-bold text-[#0d2240] uppercase mb-2 border-b pb-1">Contacto de Emergencia</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div><span className="text-gray-500">Nombre:</span> {detalle.beneficiario_nombre || '—'}</div>
                  <div><span className="text-gray-500">Teléfono:</span> {detalle.beneficiario_telefono || '—'}</div>
                  <div><span className="text-gray-500">Cédula:</span> {detalle.beneficiario_cedula || '—'}</div>
                  <div><span className="text-gray-500">Parentesco:</span> {detalle.beneficiario_parentesco || '—'}</div>
                </div>
              </div>

              {/* Pago */}
              <div>
                <h3 className="text-sm font-bold text-[#0d2240] uppercase mb-2 border-b pb-1">Pago y Factura</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div><span className="text-gray-500">Método:</span> {detalle.metodo_pago}</div>
                  <div><span className="text-gray-500">Estado:</span>{' '}
                    <span className={detalle.estado_pago === 'confirmado' ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>
                      {detalle.estado_pago === 'confirmado' ? 'Confirmado' : 'Pendiente'}
                    </span>
                  </div>
                  <div className="col-span-2"><span className="text-gray-500">Comprobante Sinpe:</span>{' '}
                    {detalle.comprobante_sinpe_url ? (
                      <a href={detalle.comprobante_sinpe_url} target="_blank" rel="noopener noreferrer" className="text-[#1a4f8b] underline">Ver comprobante</a>
                    ) : '—'}
                  </div>
                  <div><span className="text-gray-500">Requiere factura:</span> {detalle.requiere_factura ? 'Sí' : 'No'}</div>
                  {detalle.requiere_factura && (
                    <>
                      <div><span className="text-gray-500">Factura nombre:</span> {detalle.factura_nombre || '—'}</div>
                      <div><span className="text-gray-500">Factura cédula:</span> {detalle.factura_cedula || '—'}</div>
                      <div><span className="text-gray-500">Factura email:</span> {detalle.factura_email || '—'}</div>
                    </>
                  )}
                </div>
              </div>

              {/* Check-in */}
              <div>
                <h3 className="text-sm font-bold text-[#0d2240] uppercase mb-2 border-b pb-1">Check-in</h3>
                <div className="text-sm">
                  {detalle.checkin ? (
                    <span className="text-green-600 font-medium">&#10003; Check-in realizado {detalle.checkin_fecha ? `— ${new Date(detalle.checkin_fecha).toLocaleString('es-CR')}` : ''}</span>
                  ) : (
                    <span className="text-gray-400">Sin check-in</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
