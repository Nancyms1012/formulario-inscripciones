'use client';

import { useState, useRef, useEffect } from 'react';

interface InscripcionData {
  id: string;
  codigo_inscripcion: string;
  nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  evento: string;
  categoria: string;
  genero: string;
  numero_identificacion: string;
  checkin: boolean;
  checkin_fecha: string | null;
  metodo_pago: string;
  estado_pago: string;
}

export default function CheckinPage() {
  const [codigo, setCodigo] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [inscripcion, setInscripcion] = useState<InscripcionData | null>(null);
  const [error, setError] = useState('');
  const [checkinExitoso, setCheckinExitoso] = useState(false);
  const [scannerActivo, setScannerActivo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);


  // Buscar inscripción por código
  const buscarInscripcion = async (codigoBuscar?: string) => {
    const codigoFinal = codigoBuscar || codigo;
    if (!codigoFinal.trim()) return;

    setError('');
    setBuscando(true);
    setInscripcion(null);
    setCheckinExitoso(false);

    try {
      const { supabaseClient } = await import('@/lib/inscripcion-client');
      const { data, error } = await supabaseClient
        .from('inscripciones')
        .select('*')
        .eq('codigo_inscripcion', codigoFinal.trim());

      if (error) {
        throw new Error(error.message);
      }

      if (data && data.length > 0) {
        setInscripcion(data[0]);
      } else {
        setError('No se encontró ninguna inscripción con ese código.');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al buscar inscripción';
      setError(errorMessage);
    } finally {
      setBuscando(false);
    }
  };

  // Confirmar check-in
  const confirmarCheckin = async () => {
    if (!inscripcion) return;

    try {
      const { supabaseClient } = await import('@/lib/inscripcion-client');
      const { error } = await supabaseClient
        .from('inscripciones')
        .update({ checkin: true, checkin_fecha: new Date().toISOString() })
        .eq('id', inscripcion.id);

      if (error) {
        throw new Error(error.message);
      }

      setCheckinExitoso(true);
      setInscripcion({ ...inscripcion, checkin: true, checkin_fecha: new Date().toISOString() });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al confirmar';
      setError(errorMessage);
    }
  };


  // Scanner QR con cámara
  const iniciarScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setScannerActivo(true);
        escanearFrame();
      }
    } catch (err) {
      setError('No se pudo acceder a la cámara. Usá la búsqueda manual.');
    }
  };

  const detenerScanner = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setScannerActivo(false);
  };

  const escanearFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      requestAnimationFrame(escanearFrame);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    // Usar BarcodeDetector API (disponible en navegadores modernos)
    if ('BarcodeDetector' in window) {
      // @ts-expect-error - BarcodeDetector es relativamente nuevo
      const detector = new BarcodeDetector({ formats: ['qr_code'] });
      detector.detect(canvas).then((barcodes: Array<{ rawValue: string }>) => {
        if (barcodes.length > 0) {
          const valor = barcodes[0].rawValue;
          detenerScanner();
          setCodigo(valor);
          buscarInscripcion(valor);
          return;
        }
        if (scannerActivo) requestAnimationFrame(escanearFrame);
      }).catch(() => {
        if (scannerActivo) requestAnimationFrame(escanearFrame);
      });
    } else {
      // Fallback: pedirle al usuario que use búsqueda manual
      setError('Tu navegador no soporta escaneo QR nativo. Usá la búsqueda manual.');
      detenerScanner();
    }
  };

  useEffect(() => {
    return () => {
      detenerScanner();
    };
  }, []);


  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-[#0d2240]">Check-in de Participantes</h1>
        <p className="text-gray-600 mt-1">Escaneá el QR o buscá por código de inscripción</p>
      </div>

      {/* Scanner QR */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex gap-3 mb-4">
          {!scannerActivo ? (
            <button
              onClick={iniciarScanner}
              className="flex-1 bg-[#0d2240] text-white px-4 py-3 rounded-lg hover:bg-[#1a4f8b] transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              Escanear QR
            </button>
          ) : (
            <button
              onClick={detenerScanner}
              className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors"
            >
              Detener cámara
            </button>
          )}
        </div>

        {scannerActivo && (
          <div className="relative rounded-lg overflow-hidden mb-4">
            <video ref={videoRef} className="w-full rounded-lg" playsInline />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 border-2 border-[#1a4f8b] rounded-lg pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white rounded-lg" />
            </div>
          </div>
        )}

        {/* Búsqueda manual */}
        <div className="flex gap-2">
          <input
            type="text"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && buscarInscripcion()}
            placeholder="Código de inscripción (ej: LC-ABC123)"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent"
          />
          <button
            onClick={() => buscarInscripcion()}
            disabled={buscando}
            className="bg-[#1a4f8b] text-white px-6 py-3 rounded-lg hover:bg-[#0d2240] transition-colors disabled:opacity-50"
          >
            {buscando ? '...' : 'Buscar'}
          </button>
        </div>
      </div>


      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Resultado de búsqueda */}
      {inscripcion && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0d2240]">
              Datos del Participante
            </h2>
            {inscripcion.checkin && (
              <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                &#10003; Ya hizo check-in
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Código:</span>
              <p className="font-mono font-bold text-[#1a4f8b]">{inscripcion.codigo_inscripcion}</p>
            </div>
            <div>
              <span className="text-gray-500">Identificación:</span>
              <p className="font-medium">{inscripcion.numero_identificacion}</p>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">Nombre:</span>
              <p className="font-medium text-lg">
                {inscripcion.nombre} {inscripcion.primer_apellido} {inscripcion.segundo_apellido}
              </p>
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
              <span className="text-gray-500">Género:</span>
              <p className="font-medium">{inscripcion.genero === 'F' ? 'Femenino' : 'Masculino'}</p>
            </div>
            <div>
              <span className="text-gray-500">Pago:</span>
              <p className={`font-medium ${inscripcion.estado_pago === 'confirmado' ? 'text-green-600' : 'text-amber-600'}`}>
                {inscripcion.metodo_pago} - {inscripcion.estado_pago === 'confirmado' ? 'Confirmado' : 'Pendiente'}
              </p>
            </div>
          </div>

          {/* Botón Check-in */}
          {!inscripcion.checkin && !checkinExitoso && (
            <button
              onClick={confirmarCheckin}
              className="w-full mt-6 bg-green-600 text-white px-6 py-4 rounded-lg text-lg font-bold hover:bg-green-700 transition-colors"
            >
              &#10003; Confirmar Llegada
            </button>
          )}

          {checkinExitoso && (
            <div className="mt-6 bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-lg text-center font-medium">
              &#10003; Check-in confirmado exitosamente
            </div>
          )}

          {/* Botón para nueva búsqueda */}
          <button
            onClick={() => {
              setInscripcion(null);
              setCodigo('');
              setCheckinExitoso(false);
              setError('');
            }}
            className="w-full mt-3 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Nueva búsqueda
          </button>
        </div>
      )}
    </div>
  );
}
