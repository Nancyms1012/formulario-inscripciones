'use client';

import { useState, useEffect } from 'react';
import { EVENTS } from '@/lib/categories';
import MapaProvincias from '@/components/MapaProvincias';
import { CANTONES_POR_PROVINCIA } from '@/lib/cantones';

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
  canton?: string;
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
  email_enviado?: boolean;
  checkin: boolean;
  checkin_fecha: string | null;
  checkin_xcc?: boolean;
  checkin_xcc_fecha?: string | null;
  checkin_xco?: boolean;
  checkin_xco_fecha?: string | null;
  created_at: string;
}

export default function AdminPage() {
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [todasInscripciones, setTodasInscripciones] = useState<Inscripcion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEvento, setFiltroEvento] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroFactura, setFiltroFactura] = useState(false);
  const [filtroCorreoPendiente, setFiltroCorreoPendiente] = useState(false);
  const [reenviando, setReenviando] = useState<string | null>(null); // id en proceso
  const [reenviandoLote, setReenviandoLote] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [tab, setTab] = useState<'inscripciones' | 'resumen' | 'cantones'>('inscripciones');
  const [cantonEvento, setCantonEvento] = useState(''); // filtro de evento para la gráfica de cantones
  const [cantonProvincia, setCantonProvincia] = useState(''); // filtro de provincia para el detalle de cantones
  // Ordenamiento de la tabla "Detalle por evento y categoría"
  const [resumenOrden, setResumenOrden] = useState<{ col: 'evento' | 'categoria' | 'inscritos' | 'pagoPendiente' | 'factura'; asc: boolean }>({ col: 'evento', asc: true });
  const [detalle, setDetalle] = useState<Inscripcion | null>(null);
  const [editando, setEditando] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Inscripcion>>({});
  const [guardandoEdit, setGuardandoEdit] = useState(false);

  // Iniciar edición: copiar datos del detalle al formulario
  const iniciarEdicion = () => {
    if (!detalle) return;
    setEditForm({ ...detalle });
    setEditando(true);
  };

  // Guardar cambios de la edición
  const guardarEdicion = async () => {
    if (!detalle) return;
    setGuardandoEdit(true);
    try {
      const { supabaseClient } = await import('@/lib/inscripcion-client');
      const campos = {
        nombre: editForm.nombre,
        primer_apellido: editForm.primer_apellido,
        segundo_apellido: editForm.segundo_apellido,
        numero_identificacion: editForm.numero_identificacion,
        fecha_nacimiento: editForm.fecha_nacimiento,
        email: editForm.email,
        celular: editForm.celular,
        provincia: editForm.provincia,
        canton: editForm.canton,
        equipo: editForm.equipo,
        tipo_licencia: editForm.tipo_licencia,
        uci_id: editForm.uci_id,
        evento: editForm.evento,
        categoria: editForm.categoria,
        dorsal: editForm.dorsal,
        estado_pago: editForm.estado_pago,
        beneficiario_nombre: editForm.beneficiario_nombre,
        beneficiario_telefono: editForm.beneficiario_telefono,
        beneficiario_cedula: editForm.beneficiario_cedula,
        beneficiario_parentesco: editForm.beneficiario_parentesco,
      };
      const { error } = await supabaseClient
        .from('inscripciones')
        .update(campos)
        .eq('id', detalle.id);
      if (error) {
        alert('Error al guardar: ' + error.message);
        setGuardandoEdit(false);
        return;
      }
      // Actualizar en las listas locales
      const actualizado = { ...detalle, ...campos } as Inscripcion;
      setInscripciones((prev) => prev.map((i) => (i.id === detalle.id ? actualizado : i)));
      setTodasInscripciones((prev) => prev.map((i) => (i.id === detalle.id ? actualizado : i)));
      setDetalle(actualizado);
      setEditando(false);
    } catch (err) {
      alert('Error al guardar los cambios.');
      console.error(err);
    } finally {
      setGuardandoEdit(false);
    }
  };


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

  // Categorías disponibles para el filtro (de las inscripciones reales)
  // Si hay un evento seleccionado, solo muestra las categorías de ese evento
  const categoriasDisponibles = Array.from(
    new Set(
      todasInscripciones
        .filter((i) => !filtroEvento || i.evento === filtroEvento)
        .map((i) => i.categoria)
        .filter((c) => c && c.trim())
    )
  ).sort((a, b) => a.localeCompare(b));

  // Reenviar el correo de confirmación de UNA inscripción
  const reenviarCorreo = async (insc: Inscripcion) => {
    setReenviando(insc.id);
    try {
      const { enviarCorreoConfirmacion } = await import('@/lib/inscripcion-client');
      const ok = await enviarCorreoConfirmacion({
        id: insc.id,
        email: insc.email,
        nombre: insc.nombre,
        primerApellido: insc.primer_apellido,
        codigoInscripcion: insc.codigo_inscripcion,
        evento: insc.evento,
        categoria: insc.categoria,
      });
      const actualizar = (arr: Inscripcion[]) => arr.map((i) => i.id === insc.id ? { ...i, email_enviado: ok } : i);
      setInscripciones(actualizar);
      setTodasInscripciones(actualizar);
      alert(ok ? 'Correo reenviado correctamente.' : 'No se pudo enviar el correo (posible límite de Resend). Intentá más tarde.');
    } catch {
      alert('Error al reenviar el correo.');
    } finally {
      setReenviando(null);
    }
  };

  // Reenviar en LOTE a todos los que tienen el correo pendiente (con la vista filtrada actual)
  const reenviarPendientes = async (lista: Inscripcion[]) => {
    const pendientes = lista.filter((i) => i.email_enviado === false && i.email);
    if (pendientes.length === 0) {
      alert('No hay correos pendientes en la vista actual.');
      return;
    }
    if (!window.confirm(`¿Reenviar el correo a ${pendientes.length} inscrito(s) con correo pendiente?`)) return;

    setReenviandoLote(true);
    try {
      const { enviarCorreoConfirmacion } = await import('@/lib/inscripcion-client');
      let enviados = 0;
      let fallidos = 0;
      for (const insc of pendientes) {
        const ok = await enviarCorreoConfirmacion({
          id: insc.id,
          email: insc.email,
          nombre: insc.nombre,
          primerApellido: insc.primer_apellido,
          codigoInscripcion: insc.codigo_inscripcion,
          evento: insc.evento,
          categoria: insc.categoria,
        });
        if (ok) {
          enviados++;
          const actualizar = (arr: Inscripcion[]) => arr.map((i) => i.id === insc.id ? { ...i, email_enviado: true } : i);
          setInscripciones(actualizar);
          setTodasInscripciones(actualizar);
        } else {
          fallidos++;
        }
        // Pequeña pausa para no saturar
        await new Promise((r) => setTimeout(r, 300));
      }
      alert(`Reenvío terminado.\nEnviados: ${enviados}\nFallidos (reintentá luego): ${fallidos}`);
    } catch {
      alert('Error durante el reenvío en lote.');
    } finally {
      setReenviandoLote(false);
    }
  };

  // Filtrar por búsqueda local + filtro de factura + filtro de correo pendiente
  const inscripcionesFiltradas = inscripciones.filter((insc) => {
    if (filtroFactura && !insc.requiere_factura) return false;
    if (filtroCorreoPendiente && insc.email_enviado !== false) return false;
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
  );

  // Ordenar la tabla de detalle según la columna elegida
  const resumenPorCategoriaOrdenado = [...resumenPorCategoria].sort((a, b) => {
    const { col, asc } = resumenOrden;
    let cmp = 0;
    if (col === 'evento') cmp = a.evento.localeCompare(b.evento) || a.categoria.localeCompare(b.categoria);
    else if (col === 'categoria') cmp = a.categoria.localeCompare(b.categoria) || a.evento.localeCompare(b.evento);
    else cmp = (a[col] as number) - (b[col] as number);
    return asc ? cmp : -cmp;
  });

  // Cambiar columna/dirección de ordenamiento al hacer clic en el encabezado
  const ordenarResumen = (col: typeof resumenOrden.col) => {
    setResumenOrden((prev) => prev.col === col ? { col, asc: !prev.asc } : { col, asc: true });
  };
  const flechaOrden = (col: typeof resumenOrden.col) =>
    resumenOrden.col === col ? (resumenOrden.asc ? ' ▲' : ' ▼') : '';

  // ===== Datos para la gráfica por cantón (uso interno de la organización) =====
  // Inscritos por cantón, filtrable por evento
  const inscritosCanton = cantonEvento
    ? todasInscripciones.filter((i) => i.evento === cantonEvento)
    : todasInscripciones;

  // Si hay provincia seleccionada, solo cuenta cantones de esa provincia
  const inscritosCantonProvincia = cantonProvincia
    ? inscritosCanton.filter((i) => (i.provincia && i.provincia.trim()) === cantonProvincia)
    : inscritosCanton;

  const conteoPorCanton = inscritosCantonProvincia.reduce((acc, i) => {
    const c = (i.canton && i.canton.trim()) ? i.canton.trim() : 'Sin cantón';
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const cantonesOrdenados = Object.entries(conteoPorCanton)
    .map(([canton, cantidad]) => ({ canton, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad); // de mayor a menor

  const maxCanton = cantonesOrdenados.length > 0 ? cantonesOrdenados[0].cantidad : 0;

  // Conteo por provincia (para el mapa) — respeta el filtro de evento del tab
  const conteoPorProvincia = inscritosCanton.reduce((acc, i) => {
    const p = (i.provincia && i.provincia.trim()) ? i.provincia.trim() : 'Sin provincia';
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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
      'fecha_nacimiento', 'genero', 'provincia', 'canton', 'equipo', 'tipo_licencia', 'uci_id',
      'evento', 'categoria', 'beneficiario_nombre', 'beneficiario_cedula',
      'beneficiario_telefono', 'beneficiario_parentesco', 'metodo_pago',
      'estado_pago', 'requiere_factura', 'checkin', 'checkin_fecha', 'created_at'
    ];

    const encabezados = [
      'Código', 'Nacionalidad', 'Tipo ID', '# Identificación',
      'Nombre', 'Primer Apellido', 'Segundo Apellido', 'Celular', 'Email',
      'Fecha Nacimiento', 'Género', 'Provincia', 'Cantón', 'Equipo', 'Tipo Licencia', 'UCI ID',
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
        <button
          onClick={() => setTab('cantones')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'cantones' ? 'border-[#0d2240] text-[#0d2240]' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Cantones
        </button>
      </div>

      {/* ===== TAB CANTONES (gráfica por evento y cantón - uso interno organización) ===== */}
      {tab === 'cantones' && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-bold text-[#0d2240]">Inscritos por cantón</h2>
              <p className="text-sm text-gray-500">Para planificar sedes de próximas fechas.</p>
            </div>
            <div>
              <label className="text-sm text-gray-600 mr-2">Evento:</label>
              <select value={cantonEvento} onChange={(e) => setCantonEvento(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1a4f8b]">
                <option value="">Todos los eventos</option>
                {Object.keys(totalPorEvento).sort().map((ev) => <option key={ev} value={ev}>{ev}</option>)}
              </select>
            </div>
          </div>

          {/* Mapa por provincia */}
          <div className="bg-white rounded-xl shadow-md p-5 mb-6">
            <h3 className="text-sm font-bold text-[#0d2240] mb-1">Mapa por provincia</h3>
            <p className="text-xs text-gray-500 mb-3">
              Distribución geográfica de inscritos{cantonEvento ? ` en ${cantonEvento}` : ' (todos los eventos)'}.
            </p>
            <div className="max-w-2xl mx-auto">
              <MapaProvincias
                conteo={conteoPorProvincia}
                provinciaActiva={cantonProvincia}
                onSelectProvincia={setCantonProvincia}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5">
            {/* Filtro por provincia para el detalle de cantones */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
              <label className="text-sm text-gray-600">Provincia:</label>
              <select value={cantonProvincia} onChange={(e) => setCantonProvincia(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1a4f8b]">
                <option value="">Todas las provincias</option>
                {Object.keys(CANTONES_POR_PROVINCIA).map((prov) => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
              {cantonProvincia && (
                <button onClick={() => setCantonProvincia('')}
                  className="text-xs text-[#1a4f8b] hover:underline sm:ml-2">Ver todas</button>
              )}
            </div>
            <p className="text-sm text-gray-500 mb-4">
              {inscritosCantonProvincia.length} inscrito{inscritosCantonProvincia.length !== 1 ? 's' : ''}
              {cantonProvincia ? ` en ${cantonProvincia}` : ''}
              {cantonEvento ? ` · evento ${cantonEvento}` : ''} · {cantonesOrdenados.length} cantón(es)
            </p>

            {cantonesOrdenados.length === 0 ? (
              <p className="text-gray-400 text-center py-6">No hay datos para mostrar.</p>
            ) : (
              <div className="space-y-2">
                {cantonesOrdenados.map(({ canton, cantidad }) => {
                  const pct = maxCanton > 0 ? Math.round((cantidad / maxCanton) * 100) : 0;
                  return (
                    <div key={canton} className="flex items-center gap-3">
                      <div className="w-40 shrink-0 text-sm text-gray-700 text-right truncate" title={canton}>{canton}</div>
                      <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                        <div className="bg-[#1a4f8b] h-6 rounded-full flex items-center justify-end px-2 transition-all"
                          style={{ width: `${Math.max(pct, 6)}%` }}>
                          <span className="text-xs font-bold text-white">{cantidad}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

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
                    <th onClick={() => ordenarResumen('evento')} className="px-4 py-3 text-left cursor-pointer select-none hover:bg-[#1a4f8b]">Evento{flechaOrden('evento')}</th>
                    <th onClick={() => ordenarResumen('categoria')} className="px-4 py-3 text-left cursor-pointer select-none hover:bg-[#1a4f8b]">Categoría{flechaOrden('categoria')}</th>
                    <th onClick={() => ordenarResumen('inscritos')} className="px-4 py-3 text-center cursor-pointer select-none hover:bg-[#1a4f8b]">Inscritos{flechaOrden('inscritos')}</th>
                    <th onClick={() => ordenarResumen('pagoPendiente')} className="px-4 py-3 text-center cursor-pointer select-none hover:bg-[#1a4f8b]">Pago Pendiente{flechaOrden('pagoPendiente')}</th>
                    <th onClick={() => ordenarResumen('factura')} className="px-4 py-3 text-center cursor-pointer select-none hover:bg-[#1a4f8b]">Requieren Factura{flechaOrden('factura')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {resumenPorCategoriaOrdenado.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-gray-500">No hay inscripciones registradas.</td></tr>
                  ) : (
                    resumenPorCategoriaOrdenado.map((r) => (
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
            onChange={(e) => { setFiltroEvento(e.target.value); setFiltroCategoria(''); }}
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
            {categoriasDisponibles.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-col gap-2">
            <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-gray-700">
              <input
                type="checkbox"
                checked={filtroFactura}
                onChange={(e) => setFiltroFactura(e.target.checked)}
                className="h-4 w-4 text-[#1a4f8b] rounded focus:ring-[#1a4f8b]"
              />
              Mostrar solo los que requieren Factura Electrónica
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-gray-700">
              <input
                type="checkbox"
                checked={filtroCorreoPendiente}
                onChange={(e) => setFiltroCorreoPendiente(e.target.checked)}
                className="h-4 w-4 text-[#1a4f8b] rounded focus:ring-[#1a4f8b]"
              />
              Mostrar solo los que tienen el correo pendiente
            </label>
          </div>
          <button
            onClick={() => reenviarPendientes(inscripcionesFiltradas)}
            disabled={reenviandoLote}
            className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium disabled:opacity-50 whitespace-nowrap"
            title="Reenvía el correo a los inscritos con correo pendiente en la vista actual"
          >
            {reenviandoLote ? 'Reenviando...' : 'Reenviar correos pendientes'}
          </button>
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
                  <th className="px-4 py-3 text-left">Correo</th>
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
                      {insc.email_enviado === false ? (
                        <button
                          onClick={() => reenviarCorreo(insc)}
                          disabled={reenviando === insc.id}
                          className="text-amber-700 bg-amber-50 hover:bg-amber-100 rounded px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50"
                          title="El correo no se envió. Clic para reenviar."
                        >
                          {reenviando === insc.id ? 'Enviando...' : 'Pendiente · Reenviar'}
                        </button>
                      ) : (
                        <span className="text-green-600 text-xs font-medium" title="Correo enviado">&#10003; Enviado</span>
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
              <div className="flex items-center gap-2">
                {!editando ? (
                  <button onClick={iniciarEdicion} className="bg-white/15 hover:bg-white/25 text-white text-sm font-medium px-3 py-1 rounded-lg transition-colors">
                    Editar
                  </button>
                ) : (
                  <>
                    <button onClick={guardarEdicion} disabled={guardandoEdit}
                      className="bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-3 py-1 rounded-lg transition-colors disabled:opacity-50">
                      {guardandoEdit ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button onClick={() => setEditando(false)}
                      className="bg-white/15 hover:bg-white/25 text-white text-sm font-medium px-3 py-1 rounded-lg transition-colors">
                      Cancelar
                    </button>
                  </>
                )}
                <button onClick={() => { setDetalle(null); setEditando(false); }} className="text-white hover:bg-white/20 rounded-lg w-8 h-8 flex items-center justify-center text-xl">
                  &times;
                </button>
              </div>
            </div>

            {/* Cuerpo - MODO LECTURA */}
            {!editando && (
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
                  <div><span className="text-gray-500">Cantón:</span> {detalle.canton || '—'}</div>
                  <div><span className="text-gray-500">Celular:</span> {detalle.celular}</div>
                  <div className="col-span-2"><span className="text-gray-500">Email:</span> {detalle.email}</div>
                </div>
              </div>

              {/* Datos de la Carrera */}
              <div>
                <h3 className="text-sm font-bold text-[#0d2240] uppercase mb-2 border-b pb-1">Datos de la Carrera</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div><span className="text-gray-500">Dorsal:</span> {detalle.dorsal || '—'}</div>
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
                <div className="text-sm space-y-1">
                  <div>XCC (Sábado): {detalle.checkin_xcc ? <span className="text-green-600 font-medium">&#10003; Realizado</span> : <span className="text-gray-400">Sin check-in</span>}</div>
                  <div>XCO (Domingo): {detalle.checkin_xco ? <span className="text-green-600 font-medium">&#10003; Realizado</span> : <span className="text-gray-400">Sin check-in</span>}</div>
                </div>
              </div>
            </div>
            )}

            {/* Cuerpo - MODO EDICIÓN */}
            {editando && (
            <div className="p-6 space-y-4">
              <p className="text-xs text-gray-500 bg-amber-50 border border-amber-200 rounded p-2">Editá solo los campos necesarios y presioná Guardar.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <label className="block"><span className="text-gray-500 text-xs">Nombre</span>
                  <input type="text" value={editForm.nombre || ''} onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1" /></label>
                <label className="block"><span className="text-gray-500 text-xs">Primer Apellido</span>
                  <input type="text" value={editForm.primer_apellido || ''} onChange={(e) => setEditForm({ ...editForm, primer_apellido: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1" /></label>
                <label className="block"><span className="text-gray-500 text-xs">Segundo Apellido</span>
                  <input type="text" value={editForm.segundo_apellido || ''} onChange={(e) => setEditForm({ ...editForm, segundo_apellido: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1" /></label>
                <label className="block"><span className="text-gray-500 text-xs"># Identificación</span>
                  <input type="text" value={editForm.numero_identificacion || ''} onChange={(e) => setEditForm({ ...editForm, numero_identificacion: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1" /></label>
                <label className="block"><span className="text-gray-500 text-xs">Fecha de nacimiento</span>
                  <input type="date" value={editForm.fecha_nacimiento || ''} onChange={(e) => setEditForm({ ...editForm, fecha_nacimiento: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1" /></label>
                <label className="block"><span className="text-gray-500 text-xs">Email</span>
                  <input type="email" value={editForm.email || ''} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1" /></label>
                <label className="block"><span className="text-gray-500 text-xs">Celular</span>
                  <input type="text" value={editForm.celular || ''} onChange={(e) => setEditForm({ ...editForm, celular: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1" /></label>
                <label className="block"><span className="text-gray-500 text-xs">Provincia</span>
                  <input type="text" value={editForm.provincia || ''} onChange={(e) => setEditForm({ ...editForm, provincia: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1" /></label>
                <label className="block"><span className="text-gray-500 text-xs">Cantón</span>
                  <input type="text" value={editForm.canton || ''} onChange={(e) => setEditForm({ ...editForm, canton: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1" /></label>
                <label className="block"><span className="text-gray-500 text-xs">Dorsal</span>
                  <input type="text" value={editForm.dorsal || ''} onChange={(e) => setEditForm({ ...editForm, dorsal: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1" /></label>
                <label className="block"><span className="text-gray-500 text-xs">Evento</span>
                  <input type="text" value={editForm.evento || ''} onChange={(e) => setEditForm({ ...editForm, evento: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1" /></label>
                <label className="block"><span className="text-gray-500 text-xs">Categoría</span>
                  <input type="text" value={editForm.categoria || ''} onChange={(e) => setEditForm({ ...editForm, categoria: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1" /></label>
                <label className="block"><span className="text-gray-500 text-xs">Equipo</span>
                  <input type="text" value={editForm.equipo || ''} onChange={(e) => setEditForm({ ...editForm, equipo: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1" /></label>
                <label className="block"><span className="text-gray-500 text-xs">Tipo licencia</span>
                  <input type="text" value={editForm.tipo_licencia || ''} onChange={(e) => setEditForm({ ...editForm, tipo_licencia: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1" /></label>
                <label className="block"><span className="text-gray-500 text-xs">UCI ID</span>
                  <input type="text" value={editForm.uci_id || ''} onChange={(e) => setEditForm({ ...editForm, uci_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1" /></label>
                <label className="block"><span className="text-gray-500 text-xs">Estado de pago</span>
                  <select value={editForm.estado_pago || 'pendiente'} onChange={(e) => setEditForm({ ...editForm, estado_pago: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1">
                    <option value="pendiente">Pendiente</option>
                    <option value="confirmado">Confirmado</option>
                  </select></label>
                <label className="block"><span className="text-gray-500 text-xs">Contacto emergencia - Nombre</span>
                  <input type="text" value={editForm.beneficiario_nombre || ''} onChange={(e) => setEditForm({ ...editForm, beneficiario_nombre: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1" /></label>
                <label className="block"><span className="text-gray-500 text-xs">Contacto emergencia - Teléfono</span>
                  <input type="text" value={editForm.beneficiario_telefono || ''} onChange={(e) => setEditForm({ ...editForm, beneficiario_telefono: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1" /></label>
              </div>
            </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
