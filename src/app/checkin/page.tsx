'use client';

import { useState, useRef, useEffect } from 'react';
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
  checkin_xco?: boolean;
  checkin_xco_fecha?: string | null;
  metodo_pago: string;
  estado_pago: string;
  uci_id?: string;
  tipo_licencia?: string;
}

export default function CheckinPage() {
  const [dia, setDia] = useState<DiaEvento | null>(null); // XCC (sábado) o XCO (domingo)
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

  // ¿La inscripción participa en el día seleccionado?
  const participaHoy = (insc: InscripcionData): boolean => {
    if (!dia) return true;
    return getDiasParticipa(insc.evento, insc.categoria).includes(dia);
  };

  // ¿Ya hizo check-in en el día seleccionado?
  const yaHizoCheckin = (insc: InscripcionData): boolean => {
    if (dia === 'XCC') return !!insc.checkin_xcc;
    if (dia === 'XCO') return !!insc.checkin_xco;
    return !!insc.checkin;
  };

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
      ? { checkin_xcc: true, checkin_xcc_fecha: ahora }
      : { checkin_xco: true, checkin_xco_fecha: ahora };

    try {
      const { supabaseClient } = await import('@/lib/inscripcion-client');
      const { error } = await supabaseClient
        .from('inscripciones')
        .update(cambios)
        .eq('id', inscripcion.id);

      if (error) throw new Error(error.message);

      setCheckinExitoso(true);
      setInscripcion({ ...inscripcion, ...cambios });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al confirmar');
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

  // ===== PANTALLA 1: SELECCIÓN DE DÍA =====
  if (!dia) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#0d2240]">Check-in de Participantes</h1>
          <p className="text-gray-600 mt-1">Seleccioná el día para hacer el check-in</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button onClick={() => setDia('XCC')}
            className="bg-white rounded-xl shadow-md p-8 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-[#0d2240] text-center">
            <p className="text-2xl font-bold text-[#0d2240]">XCC</p>
            <p className="text-gray-500 mt-1">Sábado 12 Setiembre</p>
            <p className="text-xs text-gray-400 mt-2">Short Track</p>
          </button>
          <button onClick={() => setDia('XCO')}
            className="bg-white rounded-xl shadow-md p-8 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-[#0d2240] text-center">
            <p className="text-2xl font-bold text-[#0d2240]">XCO</p>
            <p className="text-gray-500 mt-1">Domingo 13 Setiembre</p>
            <p className="text-xs text-gray-400 mt-2">Cross Country · Copa Kids</p>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-[#0d2240]">Check-in · Día {dia}</h1>
        <p className="text-gray-600 mt-1">
          {dia === 'XCC' ? 'Sábado 12 Setiembre' : 'Domingo 13 Setiembre'} · Escaneá el QR o buscá por código, nombre o cédula
        </p>
        <button onClick={() => { setDia(null); limpiar(); }}
          className="mt-2 text-sm text-[#1a4f8b] hover:underline">
          Cambiar día
        </button>
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
              <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">&#10003; Ya hizo check-in {dia}</span>
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

          {/* Aviso si NO participa el día seleccionado */}
          {!participaHoy(inscripcion) && (
            <div className="mt-6 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-4 rounded-lg text-center font-medium">
              ⚠️ Este participante NO compite el día {dia} ({dia === 'XCC' ? 'Sábado' : 'Domingo'}).
              <br />
              <span className="text-sm font-normal">Participa en: {getDiasParticipa(inscripcion.evento, inscripcion.categoria).join(', ')}</span>
            </div>
          )}

          {/* Botón de check-in (solo si participa hoy y no ha hecho check-in) */}
          {participaHoy(inscripcion) && !yaHizoCheckin(inscripcion) && !checkinExitoso && (
            <button onClick={confirmarCheckin}
              className="w-full mt-6 bg-green-600 text-white px-6 py-4 rounded-lg text-lg font-bold hover:bg-green-700 transition-colors">
              &#10003; Confirmar Llegada · Día {dia}
            </button>
          )}
          {checkinExitoso && (
            <div className="mt-6 bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-lg text-center font-medium">
              &#10003; Check-in {dia} confirmado exitosamente
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
