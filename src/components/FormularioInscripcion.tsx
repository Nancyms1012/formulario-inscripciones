'use client';

import { useState, useEffect } from 'react';
import {
  getAvailableCategories,
  EVENTS,
  PROVINCIAS,
  TIPOS_IDENTIFICACION,
  NACIONALIDADES,
  TIPOS_LICENCIA,
  PARENTESCOS,
  METODOS_PAGO,
  CURRENT_YEAR,
} from '@/lib/categories';
import type { Gender, EventType } from '@/lib/categories';

export default function FormularioInscripcion({ modo }: { modo: 'copa' | 'kids' }) {
  // Control de T&C
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // Datos Personales
  const [nacionalidad, setNacionalidad] = useState('');
  const [tipoId, setTipoId] = useState('');
  const [numeroId, setNumeroId] = useState('');
  const [nombre, setNombre] = useState('');
  const [primerApellido, setPrimerApellido] = useState('');
  const [segundoApellido, setSegundoApellido] = useState('');
  const [celular, setCelular] = useState('');
  const [email, setEmail] = useState('');
  const [dia, setDia] = useState('');
  const [mes, setMes] = useState('');
  const [anio, setAnio] = useState('');
  const [genero, setGenero] = useState<Gender | ''>('');
  const [provincia, setProvincia] = useState('');

  // Eventos según modo
  const eventosDisponibles = modo === 'kids'
    ? (['Copa Kids'] as EventType[])
    : (['XCO', 'XCC', 'XCO+XCC'] as EventType[]);
  const [equipo, setEquipo] = useState('');
  const [tipoLicencia, setTipoLicencia] = useState('');
  const [uciId, setUciId] = useState('');
  const [evento, setEvento] = useState('');
  const [categoria, setCategoria] = useState('');
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<string[]>([]);


  // Datos Beneficiario
  const [benefNombre, setBenefNombre] = useState('');
  const [benefCedula, setBenefCedula] = useState('');
  const [benefTelefono, setBenefTelefono] = useState('');
  const [benefParentesco, setBenefParentesco] = useState('');

  // Pago
  const [metodoPago, setMetodoPago] = useState('');
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [requiereFactura, setRequiereFactura] = useState(false);

  // UI State
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState('');
  const [codigoInscripcion, setCodigoInscripcion] = useState('');

  // Calcular categorías disponibles
  useEffect(() => {
    if (genero && anio && evento) {
      const birthYear = parseInt(anio);
      if (!isNaN(birthYear) && birthYear > 1920 && birthYear <= CURRENT_YEAR) {
        const cats = getAvailableCategories(evento as EventType, genero as Gender, birthYear);
        setCategoriasDisponibles(cats);
        if (!cats.includes(categoria)) setCategoria('');
      }
    } else {
      setCategoriasDisponibles([]);
      setCategoria('');
    }
  }, [genero, anio, evento]);


  // Validar # Identificación según nacionalidad y tipo
  const handleNumeroIdChange = (value: string) => {
    if (nacionalidad === 'Nacional') {
      // Solo números
      const cleaned = value.replace(/[^0-9]/g, '');
      if (tipoId === 'Cédula jurídica') {
        setNumeroId(cleaned.slice(0, 10));
      } else {
        setNumeroId(cleaned.slice(0, 9));
      }
    } else {
      // Extranjeros: letras y números sin límite
      const cleaned = value.replace(/[^a-zA-Z0-9]/g, '');
      setNumeroId(cleaned);
    }
  };

  // Validar cédula beneficiario
  const handleBenefCedulaChange = (value: string) => {
    const cleaned = value.replace(/[^a-zA-Z0-9]/g, '');
    setBenefCedula(cleaned);
  };

  // Reset numero de ID cuando cambia nacionalidad o tipo de identificación
  useEffect(() => {
    setNumeroId('');
  }, [nacionalidad, tipoId]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validar cédula nacional
    if (nacionalidad === 'Nacional') {
      if (tipoId === 'Cédula jurídica' && numeroId.length !== 10) {
        setError('La cédula jurídica debe tener exactamente 10 dígitos.');
        return;
      } else if (tipoId !== 'Cédula jurídica' && numeroId.length !== 9) {
        setError('La cédula física debe tener exactamente 9 dígitos.');
        return;
      }
    }

    // Validar comprobante Sinpe obligatorio
    if (metodoPago === 'Sinpe' && !comprobante) {
      setError('Debés adjuntar el comprobante de Sinpe para continuar.');
      return;
    }

    setEnviando(true);
    try {
      const { guardarInscripcion } = await import('@/lib/inscripcion-client');

      const resultado = await guardarInscripcion({
        nacionalidad,
        tipoIdentificacion: tipoId,
        numeroIdentificacion: numeroId,
        nombre,
        primerApellido,
        segundoApellido,
        celular,
        email,
        fechaNacimiento: `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`,
        genero,
        provincia,
        equipo,
        tipoLicencia,
        uciId,
        evento,
        categoria,
        beneficiarioNombre: benefNombre,
        beneficiarioCedula: benefCedula,
        beneficiarioTelefono: benefTelefono,
        beneficiarioParentesco: benefParentesco,
        metodoPago,
        requiereFactura,
        comprobante,
      });

      setCodigoInscripcion(resultado.codigoInscripcion);

      // Enviar email de confirmación con QR (via API route)
      fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          nombre,
          primerApellido,
          codigoInscripcion: resultado.codigoInscripcion,
          evento,
          categoria,
        }),
      }).catch(() => {}); // No bloquear si falla

      setExito(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setEnviando(false);
    }
  };


  // Pantalla de éxito
  if (exito) {
    return (
      <div className="text-center py-12 px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto">
          <div className="text-green-500 text-6xl mb-4">&#10003;</div>
          <h2 className="text-2xl font-bold text-[#0d2240] mb-2">¡Inscripción exitosa!</h2>
          <p className="text-gray-600 mb-4">Tu código de inscripción es:</p>
          <p className="text-3xl font-mono font-bold text-[#1a4f8b] mb-4">{codigoInscripcion}</p>
          <p className="text-sm text-gray-500 mb-6">
            Se envió una confirmación a tu correo electrónico con un código QR para el día de la carrera.
          </p>
          <button onClick={() => window.location.reload()}
            className="bg-[#0d2240] text-white px-6 py-3 rounded-lg hover:bg-[#1a4f8b] transition-colors">
            Nueva inscripción
          </button>
        </div>
      </div>
    );
  }


  // ========== SECCIÓN TÉRMINOS Y CONDICIONES (PRIMERO) ==========
  if (!mostrarFormulario) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <section className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-[#0d2240] mb-6 pb-2 border-b-2 border-[#0d2240]">
            Términos y Condiciones
          </h2>
        <div className="bg-gray-50 rounded-lg p-4 mb-4 text-sm text-gray-600">
  <p className="font-medium mb-2">TÉRMINOS Y CONDICIONES DE PARTICIPACIÓN</p>
  <p className="mb-2">Al inscribirse en este evento, el participante acepta los términos y condiciones estipuladas en la Guía de Protocolo de MTB para la actividad deportiva:</p>
  <ul className="list-disc list-inside space-y-1">
    <li>Libero de toda responsabilidad judicial y extrajudicial a la Asociación de Ciclismo de Montaña CRC y a los patrocinadores y organizadores de La Copa Nacional MTB Costa Rica.</li>
    <li>Declaro que me encuentro en excelente condición física y mental para participar en esta competencia.</li>
    <li>Tengo el conocimiento de los riesgos y situaciones que se pueden derivar de mi participación en eventos del deporte de ciclismo de montaña.</li>
    <li>Todo tipo de acciones con vehículos de tracción mecánica o no, ataques de animales o personas y cualquier otra situación que pudiera surgir ante cualquier accidente, incidente o percance durante el desarrollo de la competencia.</li>
    <li>Autorizo a la organización a realizar cualquier tipo de material audiovisual con fines informativos y no comerciales, en donde mi imagen personal pueda estar expuesta.</li>
    <li>Acepto que la organización puede modificar el recorrido o cancelar el evento por razones de fuerza mayor.</li>
  </ul>
</div>
           <div className="flex items-center gap-3 mb-6">
            <input type="checkbox" id="terminos" checked={aceptaTerminos}
              onChange={(e) => setAceptaTerminos(e.target.checked)}
              className="h-4 w-4 text-[#1a4f8b] rounded focus:ring-[#1a4f8b]" />
            <label htmlFor="terminos" className="text-sm text-gray-700 font-medium">
              Acepto los términos y condiciones *
            </label>
          </div>
          <button onClick={() => setMostrarFormulario(true)} disabled={!aceptaTerminos}
            className="w-full bg-[#0d2240] text-white px-6 py-4 rounded-xl text-lg font-bold hover:bg-[#1a4f8b] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            Continuar con la inscripción
          </button>
        </section>
      </div>
    );
  }


  // ========== FORMULARIO PRINCIPAL ==========
  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}

      {/* ========== SECCIÓN 1: DATOS PERSONALES ========== */}
      <section className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-[#0d2240] mb-6 pb-2 border-b-2 border-[#0d2240]">
          Datos Personales
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nacionalidad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nacionalidad *</label>
            <select value={nacionalidad} onChange={(e) => setNacionalidad(e.target.value)} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent">
              <option value="">Seleccionar...</option>
              {NACIONALIDADES.map((n) => (<option key={n} value={n}>{n}</option>))}
            </select>
          </div>

          {/* Tipo de Identificación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de identificación *</label>
            <select value={tipoId} onChange={(e) => setTipoId(e.target.value)} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent">
              <option value="">Seleccionar...</option>
              {TIPOS_IDENTIFICACION.map((tipo) => (<option key={tipo} value={tipo}>{tipo}</option>))}
            </select>
          </div>

          {/* # Identificación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              # Identificación * {nacionalidad === 'Nacional' && tipoId === 'Cédula jurídica' && <span className="text-xs text-gray-400">(10 dígitos)</span>}
              {nacionalidad === 'Nacional' && tipoId !== 'Cédula jurídica' && tipoId && <span className="text-xs text-gray-400">(9 dígitos)</span>}
            </label>
            <input type="text" value={numeroId} onChange={(e) => handleNumeroIdChange(e.target.value)} required
              placeholder={nacionalidad === 'Nacional' ? (tipoId === 'Cédula jurídica' ? '10 dígitos numéricos' : '9 dígitos numéricos') : 'Letras y números'}
              maxLength={nacionalidad === 'Nacional' ? (tipoId === 'Cédula jurídica' ? 10 : 9) : undefined}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent" />
            {nacionalidad === 'Nacional' && tipoId === 'Cédula jurídica' && numeroId.length > 0 && numeroId.length < 10 && (
              <p className="text-xs text-amber-600 mt-1">Faltan {10 - numeroId.length} dígitos</p>
            )}
            {nacionalidad === 'Nacional' && tipoId !== 'Cédula jurídica' && tipoId && numeroId.length > 0 && numeroId.length < 9 && (
              <p className="text-xs text-amber-600 mt-1">Faltan {9 - numeroId.length} dígitos</p>
            )}
          </div>


          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent" />
          </div>
          {/* Primer Apellido */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Primer Apellido *</label>
            <input type="text" value={primerApellido} onChange={(e) => setPrimerApellido(e.target.value)} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent" />
          </div>
          {/* Segundo Apellido */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Segundo Apellido *</label>
            <input type="text" value={segundoApellido} onChange={(e) => setSegundoApellido(e.target.value)} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent" />
          </div>
          {/* # Celular */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1"># Celular *</label>
            <div className="flex gap-2">
              <input type="text" value="506" disabled
                className="w-16 border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-600 text-center" />
              <input type="tel" value={celular} onChange={(e) => setCelular(e.target.value.replace(/[^0-9]/g, '').slice(0, 8))} required
                placeholder="88888888" maxLength={8}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent" />
            </div>
            {celular.length > 0 && celular.length < 8 && (
              <p className="text-xs text-amber-600 mt-1">Faltan {8 - celular.length} dígitos</p>
            )}
          </div>
          {/* E-mail */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              placeholder="correo@ejemplo.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent" />
          </div>


          {/* Fecha de Nacimiento */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento *</label>
            <div className="grid grid-cols-3 gap-2">
              <select value={dia} onChange={(e) => setDia(e.target.value)} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent">
                <option value="">Día</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d.toString()}>{d}</option>
                ))}
              </select>
              <select value={mes} onChange={(e) => setMes(e.target.value)} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent">
                <option value="">Mes</option>
                {['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].map((m, i) => (
                  <option key={m} value={(i + 1).toString()}>{m}</option>
                ))}
              </select>
              <select value={anio} onChange={(e) => setAnio(e.target.value)} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent">
                <option value="">Año</option>
                {Array.from({ length: 80 }, (_, i) => CURRENT_YEAR - i).map((y) => (
                  <option key={y} value={y.toString()}>{y}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Género */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Género *</label>
            <select value={genero} onChange={(e) => setGenero(e.target.value as Gender | '')} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent">
              <option value="">Seleccionar...</option>
              <option value="F">Femenino</option>
              <option value="M">Masculino</option>
            </select>
          </div>
          {/* Provincia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Provincia *</label>
            <select value={provincia} onChange={(e) => setProvincia(e.target.value)} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent">
              <option value="">Seleccionar...</option>
              {PROVINCIAS.map((p) => (<option key={p} value={p}>{p}</option>))}
            </select>
          </div>
        </div>
      </section>


      {/* ========== SECCIÓN 2: DATOS DE LA CARRERA ========== */}
      <section className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-[#0d2240] mb-6 pb-2 border-b-2 border-[#0d2240]">
          Datos de la Carrera
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Equipo */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Equipo *</label>
            <input type="text" value={equipo} onChange={(e) => setEquipo(e.target.value)} required
              placeholder="Nombre del equipo"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent" />
          </div>
          {/* Tipo Licencia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Licencia *</label>
            <select value={tipoLicencia} onChange={(e) => { setTipoLicencia(e.target.value); if (e.target.value !== 'Anual') setUciId(''); }} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent">
              <option value="">Seleccionar...</option>
              {TIPOS_LICENCIA.map((t) => (<option key={t} value={t}>{t}</option>))}
            </select>
          </div>
          {/* UCI ID (solo si licencia Anual) */}
          {tipoLicencia === 'Anual' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">UCI ID *</label>
             <input type="text" value={uciId} onChange={(e) => setUciId(e.target.value.replace(/[^0-9]/g, '').slice(0, 11))} required
                placeholder="11 dígitos numéricos" maxLength={11}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent" />
            </div>
          )}
          {/* Evento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Evento *</label>
            <select value={evento} onChange={(e) => setEvento(e.target.value)} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent">
              <option value="">Seleccionar evento...</option>
              {eventosDisponibles.map((ev) => (<option key={ev} value={ev}>{ev}</option>))}
            </select>
          </div>
          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)} required
              disabled={categoriasDisponibles.length === 0}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400">
              <option value="">{categoriasDisponibles.length === 0 ? 'Completá género, fecha y evento primero' : 'Seleccionar categoría...'}</option>
              {categoriasDisponibles.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
            </select>
          </div>
        </div>
        {categoriasDisponibles.length > 0 && (
          <p className="text-xs text-gray-500 mt-2">
            Categorías disponibles según tu edad competitiva ({CURRENT_YEAR} - {anio} = {CURRENT_YEAR - parseInt(anio)} años) y género.
          </p>
        )}
      </section>


      {/* ========== SECCIÓN 3: CONTACTO EMERGENCIA ========== */}
      <section className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-[#0d2240] mb-6 pb-2 border-b-2 border-[#0d2240]">
          Contacto de Emergencia
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre y Apellidos *</label>
            <input type="text" value={benefNombre} onChange={(e) => setBenefNombre(e.target.value)} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1"># Teléfono *</label>
            <div className="flex gap-2">
              <input type="text" value="506" disabled
                className="w-16 border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-600 text-center" />
              <input type="tel" value={benefTelefono} onChange={(e) => setBenefTelefono(e.target.value.replace(/[^0-9]/g, '').slice(0, 8))} required
                placeholder="88888888" maxLength={8}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent" />
            </div>
          </div>
        </div>
      </section>



      {/* ========== SECCIÓN 4: PAGO ========== */}
      <section className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-[#0d2240] mb-6 pb-2 border-b-2 border-[#0d2240]">Pago</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Método de pago *</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {METODOS_PAGO.map((metodo) => (
                <label key={metodo}
                  className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    metodoPago === metodo ? 'border-[#1a4f8b] bg-blue-50 text-[#0d2240] font-medium' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  <input type="radio" name="metodoPago" value={metodo} checked={metodoPago === metodo}
                    onChange={(e) => setMetodoPago(e.target.value)} required className="sr-only" />
                  <span>{metodo}</span>
                </label>
              ))}
            </div>
          </div>
          {metodoPago === 'Sinpe' && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">Comprobante de Sinpe *</label>
              <input type="file" accept="image/*,.pdf" onChange={(e) => setComprobante(e.target.files?.[0] || null)} required
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#0d2240] file:text-white hover:file:bg-[#1a4f8b]" />
              <p className="text-xs text-gray-500 mt-1">Sube una imagen o PDF del comprobante de pago.</p>
            </div>
          )}
          <div className="flex items-center gap-3 pt-2">
            <input type="checkbox" id="factura" checked={requiereFactura}
              onChange={(e) => setRequiereFactura(e.target.checked)}
              className="h-4 w-4 text-[#1a4f8b] rounded focus:ring-[#1a4f8b]" />
            <label htmlFor="factura" className="text-sm text-gray-700">Requiero Factura Electrónica</label>
          </div>
        </div>
      </section>


      {/* ========== BOTÓN ENVIAR ========== */}
      <div className="text-center">
        <button type="submit" disabled={enviando}
          className="bg-[#0d2240] text-white px-12 py-4 rounded-xl text-lg font-bold hover:bg-[#1a4f8b] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl">
          {enviando ? (
            <span className="flex items-center gap-2 justify-center">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Enviando...
            </span>
          ) : 'Enviar Inscripción'}
        </button>
      </div>
    </form>
  );
}
