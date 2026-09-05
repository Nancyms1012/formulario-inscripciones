'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { getDiasParticipa, type DiaEvento } from '@/lib/dias-evento';

interface InscripcionData {
  id: string;
  codigo_inscripcion: string;
  dorsal?: string;
  nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  evento: string;
  categoria: string;
  genero: string;
  numero_identificacion: string;
  checkin: boolean;
  checkin_fecha: string | null;
  checkin_xcc?: boolean;
  checkin_xcc_fecha?: string | null;
  checkin_xcc_por?: string | null;
  checkin_xco?: boolean;
  checkin_xco_fecha?: string | null;
  checkin_xco_por?: string | null;
  metodo_pago: string;
  estado_pago: string;
  uci_id?: string;
  tipo_licencia?: string;
}

// Estadística por categoría
interface StatCategoria {
  categoria: string;
  total: number;
  hechos: number;
}

// Modo de check-in seleccionado en pantalla.
// KIDS es el domingo (usa columnas XCO) pero se filtra/cuenta aparte.
type ModoCheckin = 'XCC' | 'XCO' | 'KIDS';

// Día real (columnas de BD) según el modo elegido
const diaDeModo = (modo: ModoCheckin): DiaEvento => (modo === 'XCC' ? 'XCC' : 'XCO');

// ¿La inscripción pertenece a Copa Kids?
const esKids = (evento: string): boolean => evento === 'Copa Kids';

// ¿La inscripción corresponde al modo seleccionado?
const perteneceAlModo = (evento: string, categoria: string, modo: ModoCheckin): boolean => {
  const dia = diaDeModo(modo);
  if (!getDiasParticipa(evento, categoria).includes(dia)) return false;
  if (modo === 'KIDS') return esKids(evento);
  if (modo === 'XCO') return !esKids(evento); // domingo sin Kids
  return true; // XCC
};

export default function CheckinPage() {
  const [operador, setOperador] = useState<string | null>(null);
  const [operadorInput, setOperadorInput] = useState('');
  const [modo, setModo] = useState<ModoCheckin | null>(null); // XCC (sábado), XCO (domingo) o KIDS (domingo aparte)
  const dia: DiaEvento | null = modo ? diaDeModo(modo) : null; // día real de BD
  const [codigo, setCodigo] = useState('');
  const [busquedaTexto, setBusquedaTexto] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [inscripcion, setInscripcion] = useState<InscripcionData | null>(null);
  const [resultados, setResultados] = useState<InscripcionData[]>([]);
  const [error, setError] = useState('');
  const [checkinExitoso, setCheckinExitoso] = useState(false);
  const [scannerActivo, setScannerActivo] = useState(false);
  const scannerRef = useRef<unknown>(null);
  const scannerContainerId = 'qr-reader';

  // Estadísticas del día
  const [statTotal, setStatTotal] = useState({ total: 0, hechos: 0 });
  const [statsPorCategoria, setStatsPorCategoria] = useState<StatCategoria[]>([]);
  const [cargandoStats, setCargandoStats] = useState(false);
  // Lista de participantes del grupo (para mostrar quiénes hicieron check-in)
  const [lista, setLista] = useState<InscripcionData[]>([]);
  const [mostrarLista, setMostrarLista] = useState(false);
  const [filtroLista, setFiltroLista] = useState<'todos' | 'hechos' | 'pendientes'>('todos');

  // QR hacia la página de consulta para jueces
  const [qrJueces, setQrJueces] = useState('');
  const [urlJueces, setUrlJueces] = useState('');

  // Cargar operador guardado en el navegador
  useEffect(() => {
    const guardado = typeof window !== 'undefined' ? localStorage.getItem('checkin_operador') : null;
    if (guardado) setOperador(guardado);

    // Generar QR de /jueces con el dominio actual
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/jueces`;
      setUrlJueces(url);
      setQrJueces(`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}`);
    }
  }, []);

  const guardarOperador = () => {
    const nombre = operadorInput.trim();
    if (!nombre) return;
    localStorage.setItem('checkin_operador', nombre);
    setOperador(nombre);
  };

  const cambiarOperador = () => {
    localStorage.removeItem('checkin_operador');
    setOperador(null);
    setOperadorInput('');
    setModo(null);
  };

  // ¿La inscripción corresponde al modo seleccionado (día + Kids/no Kids)?
  const participaHoy = (insc: InscripcionData): boolean => {
    if (!modo) return true;
    return perteneceAlModo(insc.evento, insc.categoria, modo);
  };

  // ¿Ya hizo check-in en el día seleccionado?
  const yaHizoCheckin = (insc: InscripcionData): boolean => {
    if (dia === 'XCC') return !!insc.checkin_xcc;
    if (dia === 'XCO') return !!insc.checkin_xco;
    return !!insc.checkin;
  };

  // Calcular estadísticas del modo seleccionado
  const cargarStats = useCallback(async (modoActual: ModoCheckin) => {
    setCargandoStats(true);
    try {
      const { supabaseClient } = await import('@/lib/inscripcion-client');
      const { data, error } = await supabaseClient
        .from('inscripciones')
        .select('*');

      if (error) throw new Error(error.message);
      if (!data) return;

      const diaActual = diaDeModo(modoActual);

      // Filtrar solo quienes corresponden al modo (día + Kids/no Kids)
      const participantes = data.filter((r) =>
        perteneceAlModo(r.evento, r.categoria, modoActual)
      );

      // Guardar la lista ordenada (por dorsal numérico, luego apellido)
      const listaOrdenada = [...participantes].sort((a, b) => {
        const da = parseInt(a.dorsal || '', 10);
        const db = parseInt(b.dorsal || '', 10);
        if (!isNaN(da) && !isNaN(db)) return da - db;
        return `${a.primer_apellido} ${a.nombre}`.localeCompare(`${b.primer_apellido} ${b.nombre}`);
      });
      setLista(listaOrdenada as InscripcionData[]);

      const hechoEn = (r: { checkin_xcc?: boolean; checkin_xco?: boolean }) =>
        diaActual === 'XCC' ? !!r.checkin_xcc : !!r.checkin_xco;

      // Total general
      const total = participantes.length;
      const hechos = participantes.filter(hechoEn).length;
      setStatTotal({ total, hechos });

      // Por categoría
      const mapa = new Map<string, StatCategoria>();
      for (const r of participantes) {
        const key = r.categoria || 'Sin categoría';
        const actual = mapa.get(key) || { categoria: key, total: 0, hechos: 0 };
        actual.total += 1;
        if (hechoEn(r)) actual.hechos += 1;
        mapa.set(key, actual);
      }
      const stats = Array.from(mapa.values()).sort((a, b) =>
        a.categoria.localeCompare(b.categoria)
      );
      setStatsPorCategoria(stats);
    } catch (err: unknown) {
      // No bloqueamos el check-in si fallan las stats
      console.error('Error al cargar estadísticas', err);
    } finally {
      setCargandoStats(false);
    }
  }, []);

  // Recargar stats cuando cambia el modo
  useEffect(() => {
    if (modo) cargarStats(modo);
  }, [modo, cargarStats]);

  // Buscar por código QR
  const buscarPorCodigo = async (codigoBuscar?: string) => {
    const codigoFinal = codigoBuscar || codigo;
    if (!codigoFinal.trim()) return;

    setError('');
    setBuscando(true);
    setInscripcion(null);
    setResultados([]);
    setCheckinExitoso(false);

    try {
      const { supabaseClient } = await import('@/lib/inscripcion-client');
      const { data, error } = await supabaseClient
        .from('inscripciones')
        .select('*')
        .eq('codigo_inscripcion', codigoFinal.trim());

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

  // Buscar por nombre, apellido o cédula
  const buscarPorTexto = async () => {
    if (!busquedaTexto.trim()) return;

    setError('');
    setBuscando(true);
    setInscripcion(null);
    setResultados([]);
    setCheckinExitoso(false);

    try {
      const { supabaseClient } = await import('@/lib/inscripcion-client');
      const texto = busquedaTexto.trim().toLowerCase();

      const { data, error } = await supabaseClient
        .from('inscripciones')
        .select('*')
        .or(`nombre.ilike.%${texto}%,primer_apellido.ilike.%${texto}%,segundo_apellido.ilike.%${texto}%,numero_identificacion.ilike.%${texto}%`);

      if (error) throw new Error(error.message);

      if (data && data.length === 1) {
        setInscripcion(data[0]);
      } else if (data && data.length > 1) {
        setResultados(data);
      } else {
        setError('No se encontró ninguna inscripción con ese nombre o cédula.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al buscar');
    } finally {
      setBuscando(false);
    }
  };

  // Confirmar check-in (para el día seleccionado)
  const confirmarCheckin = async () => {
    if (!inscripcion || !dia) return;

    const ahora = new Date().toISOString();
    const cambios = dia === 'XCC'
      ? { checkin_xcc: true, checkin_xcc_fecha: ahora, checkin_xcc_por: operador }
      : { checkin_xco: true, checkin_xco_fecha: ahora, checkin_xco_por: operador };

    try {
      const { supabaseClient } = await import('@/lib/inscripcion-client');
      const { error } = await supabaseClient
        .from('inscripciones')
        .update(cambios)
        .eq('id', inscripcion.id);

      if (error) throw new Error(error.message);

      setCheckinExitoso(true);
      setInscripcion({ ...inscripcion, ...cambios });
      // Actualizar stats en vivo
      if (modo) cargarStats(modo);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al confirmar');
    }
  };

  // Reversar check-in (por si se aplicó por error)
  const reversarCheckin = async () => {
    if (!inscripcion || !dia) return;
    if (!confirm('¿Reversar el check-in de este participante? Podrá volver a hacer check-in.')) return;

    const cambios = dia === 'XCC'
      ? { checkin_xcc: false, checkin_xcc_fecha: null, checkin_xcc_por: null }
      : { checkin_xco: false, checkin_xco_fecha: null, checkin_xco_por: null };

    try {
      const { supabaseClient } = await import('@/lib/inscripcion-client');
      const { error } = await supabaseClient
        .from('inscripciones')
        .update(cambios)
        .eq('id', inscripcion.id);

      if (error) throw new Error(error.message);

      setCheckinExitoso(false);
      setInscripcion({ ...inscripcion, ...cambios });
      if (modo) cargarStats(modo);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al reversar');
    }
  };

  // Seleccionar de lista de resultados
  const seleccionarInscripcion = (insc: InscripcionData) => {
    setInscripcion(insc);
    setResultados([]);
  };

  // Scanner QR con html5-qrcode
  const iniciarScanner = async () => {
    try {
      setScannerActivo(true);
      // Esperar a que el DOM se actualice
      await new Promise(resolve => setTimeout(resolve, 100));

      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode(scannerContainerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          // QR detectado
          scanner.stop().then(() => {
            setScannerActivo(false);
            setCodigo(decodedText);
            buscarPorCodigo(decodedText);
          });
        },
        () => {} // ignorar errores de frames sin QR
      );
    } catch {
      setScannerActivo(false);
      setError('No se pudo acceder a la cámara. Usá la búsqueda manual.');
    }
  };

  const detenerScanner = async () => {
    if (scannerRef.current) {
      try {
        await (scannerRef.current as { stop: () => Promise<void> }).stop();
      } catch {}
      scannerRef.current = null;
    }
    setScannerActivo(false);
  };

  useEffect(() => {
    return () => { detenerScanner(); };
  }, []);

  // Nueva búsqueda
  const limpiar = () => {
    setInscripcion(null);
    setResultados([]);
    setCodigo('');
    setBusquedaTexto('');
    setCheckinExitoso(false);
    setError('');
  };

  // ===== PANTALLA 0: LOGIN POR NOMBRE (operador) =====
  if (!operador) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-[#0d2240]">Check-in de Participantes</h1>
          <p className="text-gray-600 mt-2 mb-6">Ingresá tu nombre para comenzar. Se registrará quién aplica cada check-in.</p>
          <input
            type="text"
            value={operadorInput}
            onChange={(e) => setOperadorInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && guardarOperador()}
            placeholder="Tu nombre"
            autoFocus
            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 text-center focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent"
          />
          <button
            onClick={guardarOperador}
            disabled={!operadorInput.trim()}
            className="w-full bg-[#0d2240] text-white px-6 py-3 rounded-lg text-lg font-bold hover:bg-[#1a4f8b] transition-colors disabled:opacity-50"
          >
            Ingresar
          </button>
        </div>
      </div>
    );
  }

  // ===== PANTALLA 1: SELECCIÓN DE DÍA / MODO =====
  if (!modo) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#0d2240]">Check-in de Participantes</h1>
          <p className="text-gray-600 mt-1">Seleccioná el grupo para hacer el check-in</p>
          <p className="text-sm text-gray-500 mt-2">
            Operador: <span className="font-medium text-[#1a4f8b]">{operador}</span>
            <button onClick={cambiarOperador} className="ml-2 text-[#1a4f8b] hover:underline">(cambiar)</button>
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button onClick={() => setModo('XCC')}
            className="bg-white rounded-xl shadow-md p-8 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-[#0d2240] text-center">
            <p className="text-2xl font-bold text-[#0d2240]">XCC</p>
            <p className="text-gray-500 mt-1">Sábado 12 Setiembre</p>
            <p className="text-xs text-gray-400 mt-2">Short Track</p>
          </button>
          <button onClick={() => setModo('XCO')}
            className="bg-white rounded-xl shadow-md p-8 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-[#0d2240] text-center">
            <p className="text-2xl font-bold text-[#0d2240]">XCO</p>
            <p className="text-gray-500 mt-1">Domingo 13 Setiembre</p>
            <p className="text-xs text-gray-400 mt-2">Cross Country (sin Kids)</p>
          </button>
          <button onClick={() => setModo('KIDS')}
            className="bg-white rounded-xl shadow-md p-8 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-[#1a7a3a] text-center">
            <p className="text-2xl font-bold text-[#1a7a3a]">Copa Kids</p>
            <p className="text-gray-500 mt-1">Domingo 13 Setiembre</p>
            <p className="text-xs text-gray-400 mt-2">Balance · Niños · Preinfantil</p>
          </button>
        </div>

        {/* QR para jueces (consulta de solo lectura) */}
        <div className="bg-white rounded-xl shadow-md p-6 mt-6 text-center">
          <h2 className="text-sm font-bold text-[#0d2240] uppercase mb-1">Consulta para Jueces</h2>
          <p className="text-gray-500 text-sm mb-4">Escaneá este código para ver el listado (solo consulta)</p>
          {qrJueces && (
            <img src={qrJueces} alt="QR consulta jueces" className="mx-auto rounded-lg" width={180} height={180} />
          )}
          <a href="/jueces" target="_blank" rel="noopener noreferrer"
            className="inline-block mt-3 text-sm text-[#1a4f8b] hover:underline break-all">
            {urlJueces || '/jueces'}
          </a>
        </div>
      </div>
    );
  }

  // Etiquetas según el modo
  const modoLabel = modo === 'KIDS' ? 'Copa Kids' : modo;
  const modoFecha = modo === 'XCC' ? 'Sábado 12 Setiembre' : 'Domingo 13 Setiembre';

  const pendientes = statTotal.total - statTotal.hechos;
  const pct = statTotal.total > 0 ? Math.round((statTotal.hechos / statTotal.total) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-[#0d2240]">Check-in · {modoLabel}</h1>
        <p className="text-gray-600 mt-1">
          {modoFecha} · Escaneá el QR o buscá por código, nombre o cédula
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Operador: <span className="font-medium text-[#1a4f8b]">{operador}</span>
          <button onClick={cambiarOperador} className="ml-2 text-[#1a4f8b] hover:underline">(cambiar)</button>
          <span className="mx-2 text-gray-300">|</span>
          <button onClick={() => { setModo(null); limpiar(); }} className="text-[#1a4f8b] hover:underline">Cambiar grupo</button>
          <span className="mx-2 text-gray-300">|</span>
          <a href="/jueces" target="_blank" rel="noopener noreferrer" className="text-[#1a4f8b] hover:underline">Consulta jueces</a>
        </p>
      </div>

      {/* ===== PANEL DE PROGRESO ===== */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-[#0d2240] uppercase flex items-center gap-2">
            <svg className="w-5 h-5 text-[#1a4f8b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Check-in {modoLabel}
          </h2>
          <button onClick={() => cargarStats(modo)} className="text-xs text-[#1a4f8b] hover:underline">
            {cargandoStats ? 'Actualizando…' : 'Actualizar'}
          </button>
        </div>
        <p className="text-4xl font-extrabold text-[#1a4f8b] leading-none">
          {statTotal.hechos} <span className="text-gray-400 font-bold">/ {statTotal.total}</span>
        </p>
        <p className="text-sm text-gray-500 mt-1">{pct}% con check-in · {pendientes} pendientes</p>
        <div className="w-full bg-gray-100 rounded-full h-3 mt-3 overflow-hidden">
          <div className="bg-green-500 h-3 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Tarjetas por categoría */}
      {statsPorCategoria.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-bold text-[#0d2240] uppercase mb-3">Por Categoría</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {statsPorCategoria.map((s) => {
              const p = s.total > 0 ? Math.round((s.hechos / s.total) * 100) : 0;
              return (
                <div key={s.categoria} className="bg-white rounded-xl shadow-sm p-4">
                  <p className="font-bold text-[#0d2240] text-sm leading-snug">{s.categoria}</p>
                  <p className="text-xs text-gray-500 mt-1">Total: <span className="font-medium text-gray-700">{s.total}</span></p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-green-600 text-sm">&#10003;</span>
                    <span className="text-sm text-gray-700">Check-in: <span className="font-bold text-[#0d2240]">{s.hechos} / {s.total}</span></span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 mt-2 overflow-hidden">
                    <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${p}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== LISTA DE PARTICIPANTES ===== */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <button onClick={() => setMostrarLista((v) => !v)}
          className="w-full flex items-center justify-between text-left">
          <span className="text-sm font-bold text-[#0d2240] uppercase">
            Lista de participantes ({lista.length})
          </span>
          <span className="text-[#1a4f8b] text-sm">{mostrarLista ? 'Ocultar ▲' : 'Ver lista ▼'}</span>
        </button>

        {mostrarLista && (
          <div className="mt-4">
            {/* Filtro del listado */}
            <div className="flex gap-2 mb-3">
              {([
                { k: 'todos', label: `Todos (${lista.length})` },
                { k: 'hechos', label: `Con check-in (${lista.filter(yaHizoCheckin).length})` },
                { k: 'pendientes', label: `Pendientes (${lista.filter((r) => !yaHizoCheckin(r)).length})` },
              ] as const).map((f) => (
                <button key={f.k} onClick={() => setFiltroLista(f.k)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    filtroLista === f.k ? 'bg-[#1a4f8b] text-white border-[#1a4f8b]' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto -mx-4">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="text-left px-4 py-2">Dorsal</th>
                    <th className="text-left px-4 py-2">Nombre</th>
                    <th className="text-left px-4 py-2 hidden sm:table-cell">Categoría</th>
                    <th className="text-left px-4 py-2">Estado</th>
                    <th className="text-left px-4 py-2 hidden md:table-cell">Operador</th>
                  </tr>
                </thead>
                <tbody>
                  {lista
                    .filter((r) => {
                      if (filtroLista === 'hechos') return yaHizoCheckin(r);
                      if (filtroLista === 'pendientes') return !yaHizoCheckin(r);
                      return true;
                    })
                    .map((r) => {
                      const hecho = yaHizoCheckin(r);
                      const por = dia === 'XCC' ? r.checkin_xcc_por : r.checkin_xco_por;
                      return (
                        <tr key={r.id} className="border-t border-gray-100">
                          <td className="px-4 py-2 font-bold text-[#1a4f8b]">{r.dorsal || '—'}</td>
                          <td className="px-4 py-2">
                            {r.nombre} {r.primer_apellido} {r.segundo_apellido}
                            <div className="text-xs text-gray-400 sm:hidden">{r.categoria}</div>
                          </td>
                          <td className="px-4 py-2 hidden sm:table-cell text-gray-600">{r.categoria}</td>
                          <td className="px-4 py-2">
                            {hecho
                              ? <span className="text-green-600 font-medium">✓ Llegó</span>
                              : <span className="text-gray-400">Pendiente</span>}
                          </td>
                          <td className="px-4 py-2 hidden md:table-cell text-gray-500">{por || '—'}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Scanner QR */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex gap-3 mb-4">
          {!scannerActivo ? (
            <button onClick={iniciarScanner}
              className="flex-1 bg-[#0d2240] text-white px-4 py-3 rounded-lg hover:bg-[#1a4f8b] transition-colors flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              Escanear QR
            </button>
          ) : (
            <button onClick={detenerScanner}
              className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors">
              Detener cámara
            </button>
          )}
        </div>

        <div className={`relative rounded-lg overflow-hidden mb-4 ${scannerActivo ? '' : 'hidden'}`} style={{ minHeight: '300px' }}>
          <div id={scannerContainerId} className="w-full" />
        </div>

        {/* Búsqueda por código */}
        <label className="block text-sm font-medium text-gray-700 mb-1">Buscar por código:</label>
        <div className="flex gap-2 mb-4">
          <input type="text" value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && buscarPorCodigo()}
            placeholder="Código (ej: LC-ABC123)"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent" />
          <button onClick={() => buscarPorCodigo()} disabled={buscando}
            className="bg-[#1a4f8b] text-white px-6 py-3 rounded-lg hover:bg-[#0d2240] transition-colors disabled:opacity-50">
            {buscando ? '...' : 'Buscar'}
          </button>
        </div>

        {/* Búsqueda por nombre/cédula */}
        <label className="block text-sm font-medium text-gray-700 mb-1">Buscar por nombre, apellido o cédula:</label>
        <div className="flex gap-2">
          <input type="text" value={busquedaTexto}
            onChange={(e) => setBusquedaTexto(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && buscarPorTexto()}
            placeholder="Nombre, apellido o # cédula"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent" />
          <button onClick={buscarPorTexto} disabled={buscando}
            className="bg-[#1a4f8b] text-white px-6 py-3 rounded-lg hover:bg-[#0d2240] transition-colors disabled:opacity-50">
            {buscando ? '...' : 'Buscar'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>
      )}

      {/* Lista de resultados (cuando hay varios) */}
      {resultados.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-bold text-[#0d2240] mb-4">
            Se encontraron {resultados.length} resultados — seleccioná uno:
          </h2>
          <div className="space-y-2">
            {resultados.map((r) => (
              <button key={r.id} onClick={() => seleccionarInscripcion(r)}
                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-[#1a4f8b] transition-colors">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{r.nombre} {r.primer_apellido} {r.segundo_apellido}</p>
                    <p className="text-sm text-gray-500">{r.evento} — {r.categoria}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono text-[#1a4f8b]">{r.codigo_inscripcion}</p>
                    {r.checkin && <span className="text-xs text-green-600">&#10003; Check-in</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Resultado individual */}
      {inscripcion && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0d2240]">Datos del Participante</h2>
            {yaHizoCheckin(inscripcion) && (
              <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">&#10003; Ya hizo check-in {modoLabel}</span>
            )}
          </div>
          {/* Dorsal grande en azul (o código si aún no hay dorsal) */}
          <div className="text-center mb-4">
            {inscripcion.dorsal ? (
              <>
                <p className="text-5xl font-extrabold text-[#1a4f8b] leading-none">#{inscripcion.dorsal}</p>
                <p className="text-xs text-gray-400 font-mono mt-1">{inscripcion.codigo_inscripcion}</p>
              </>
            ) : (
              <p className="text-3xl font-mono font-bold text-[#1a4f8b]">{inscripcion.codigo_inscripcion}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Identificación:</span>
              <p className="font-medium">{inscripcion.numero_identificacion}</p>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">Nombre:</span>
              <p className="font-medium text-lg">{inscripcion.nombre} {inscripcion.primer_apellido} {inscripcion.segundo_apellido}</p>
            </div>
            <div>
              <span className="text-gray-500">Evento:</span>
              <p className="font-medium">{inscripcion.evento}</p>
            </div>
            <div>
              <span className="text-gray-500">Categoría:</span>
              <p className="font-medium">{inscripcion.categoria}</p>
            </div>
            <div>
              <span className="text-gray-500">Licencia:</span>
              <p className="font-medium">
                {inscripcion.tipo_licencia || '—'}
                {inscripcion.uci_id ? ` · UCI ID: ${inscripcion.uci_id}` : ''}
              </p>
            </div>
          </div>

          {/* Quién aplicó el check-in (si ya está hecho) + botón reversar */}
          {yaHizoCheckin(inscripcion) && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center justify-between gap-3">
              <div className="text-sm">
                <p className="text-green-700 font-medium">&#10003; Check-in {modoLabel} ya realizado</p>
                {(dia === 'XCC' ? inscripcion.checkin_xcc_por : inscripcion.checkin_xco_por) && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Aplicado por: {dia === 'XCC' ? inscripcion.checkin_xcc_por : inscripcion.checkin_xco_por}
                  </p>
                )}
              </div>
              <button onClick={reversarCheckin}
                className="shrink-0 border border-red-300 text-red-600 text-sm px-3 py-2 rounded-lg hover:bg-red-50 transition-colors">
                Reversar
              </button>
            </div>
          )}

          {/* Aviso si NO corresponde al grupo seleccionado */}
          {!participaHoy(inscripcion) && (
            <div className="mt-6 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-4 rounded-lg text-center font-medium">
              {modo === 'KIDS' ? (
                <>⚠️ Este participante NO es de Copa Kids.</>
              ) : modo === 'XCO' && esKids(inscripcion.evento) ? (
                <>⚠️ Este participante es de Copa Kids. Usá el grupo <strong>Copa Kids</strong>.</>
              ) : (
                <>⚠️ Este participante NO compite el {modoFecha}.</>
              )}
              <br />
              <span className="text-sm font-normal">
                Participa en: {getDiasParticipa(inscripcion.evento, inscripcion.categoria).join(', ')}
                {esKids(inscripcion.evento) ? ' (Copa Kids)' : ''}
              </span>
            </div>
          )}

          {/* Botón de check-in (solo si participa hoy y no ha hecho check-in) */}
          {participaHoy(inscripcion) && !yaHizoCheckin(inscripcion) && !checkinExitoso && (
            <button onClick={confirmarCheckin}
              className="w-full mt-6 bg-green-600 text-white px-6 py-4 rounded-lg text-lg font-bold hover:bg-green-700 transition-colors">
              &#10003; Confirmar Llegada · {modoLabel}
            </button>
          )}
          {checkinExitoso && (
            <div className="mt-6 bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-lg text-center font-medium">
              &#10003; Check-in {modoLabel} confirmado exitosamente por {operador}
            </div>
          )}
          <button onClick={limpiar}
            className="w-full mt-3 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors">
            Nueva búsqueda
          </button>
        </div>
      )}
    </div>
  );
}
