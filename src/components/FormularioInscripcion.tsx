'use client';

import { useState, useEffect } from 'react';
import {
  getAvailableCategories,
  EVENTS,
  PROVINCIAS,
  TIPOS_IDENTIFICACION,
  PARENTESCOS,
  METODOS_PAGO,
  CURRENT_YEAR,
} from '@/lib/categories';
import type { Gender, EventType } from '@/lib/categories';

export default function FormularioInscripcion() {
  // Datos Personales
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


  // Datos de la Carrera
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

  // Términos
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  // UI State
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState('');
  const [codigoInscripcion, setCodigoInscripcion] = useState('');


  // Calcular categorías disponibles cuando cambian género, fecha o evento
  useEffect(() => {
    if (genero && anio && evento) {
      const birthYear = parseInt(anio);
      if (!isNaN(birthYear) && birthYear > 1920 && birthYear <= CURRENT_YEAR) {
        const cats = getAvailableCategories(
          evento as EventType,
          genero as Gender,
          birthYear
        );
        setCategoriasDisponibles(cats);
        // Resetear categoría si ya no es válida
        if (!cats.includes(categoria)) {
          setCategoria('');
        }
      }
    } else {
      setCategoriasDisponibles([]);
      setCategoria('');
    }
  }, [genero, anio, evento]);

  // Validar que # Identificación solo contenga letras y números
  const handleNumeroIdChange = (value: string) => {
    const cleaned = value.replace(/[^a-zA-Z0-9]/g, '');
    setNumeroId(cleaned);
  };

  // Validar que # Cédula beneficiario solo contenga letras y números
  const handleBenefCedulaChange = (value: string) => {
    const cleaned = value.replace(/[^a-zA-Z0-9]/g, '');
    setBenefCedula(cleaned);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEnviando(true);

    try {
      const formData = new FormData();
      formData.append('tipoIdentificacion', tipoId);
      formData.append('numeroIdentificacion', numeroId);
      formData.append('nombre', nombre);
      formData.append('primerApellido', primerApellido);
      formData.append('segundoApellido', segundoApellido);
      formData.append('celular', celular);
      formData.append('email', email);
      formData.append('fechaNacimiento', `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`);
      formData.append('genero', genero);
      formData.append('provincia', provincia);
      formData.append('evento', evento);
      formData.append('categoria', categoria);
      formData.append('beneficiarioNombre', benefNombre);
      formData.append('beneficiarioCedula', benefCedula);
      formData.append('beneficiarioTelefono', benefTelefono);
      formData.append('beneficiarioParentesco', benefParentesco);
      formData.append('metodoPago', metodoPago);
      formData.append('requiereFactura', requiereFactura.toString());

      if (comprobante) {
        formData.append('comprobante', comprobante);
      }

      const res = await fetch('/api/inscripciones', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar la inscripción');
      }

      setCodigoInscripcion(data.codigoInscripcion);
      setExito(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error inesperado';
      setError(errorMessage);
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
          <h2 className="text-2xl font-bold text-[#0d2240] mb-2">
            ¡Inscripción exitosa!
          </h2>
          <p className="text-gray-600 mb-4">
            Tu código de inscripción es:
          </p>
          <p className="text-3xl font-mono font-bold text-[#1a4f8b] mb-4">
            {codigoInscripcion}
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Se envió una confirmación a tu correo electrónico con un código QR
            para el día de la carrera.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#0d2240] text-white px-6 py-3 rounded-lg hover:bg-[#1a4f8b] transition-colors"
          >
            Nueva inscripción
          </button>
        </div>
      </div>
    );
  }


  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* ========== SECCIÓN 1: DATOS PERSONALES ========== */}
      <section className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-[#0d2240] mb-6 pb-2 border-b-2 border-[#0d2240]">
          Datos Personales
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tipo de Identificación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de identificación *
            </label>
            <select
              value={tipoId}
              onChange={(e) => setTipoId(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent"
            >
              <option value="">Seleccionar...</option>
              {TIPOS_IDENTIFICACION.map((tipo) => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </div>

          {/* # Identificación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              # Identificación *
            </label>
            <input
              type="text"
              value={numeroId}
              onChange={(e) => handleNumeroIdChange(e.target.value)}
              required
              placeholder="Solo letras y números"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent"
            />
          </div>


          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent"
            />
          </div>

          {/* Primer Apellido */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Primer Apellido *
            </label>
            <input
              type="text"
              value={primerApellido}
              onChange={(e) => setPrimerApellido(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent"
            />
          </div>

          {/* Segundo Apellido */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Segundo Apellido *
            </label>
            <input
              type="text"
              value={segundoApellido}
              onChange={(e) => setSegundoApellido(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent"
            />
          </div>


          {/* # Celular */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              # Celular *
            </label>
            <input
              type="tel"
              value={celular}
              onChange={(e) => setCelular(e.target.value)}
              required
              placeholder="+506 8888-8888"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent"
            />
          </div>

          {/* E-mail */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-mail *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="correo@ejemplo.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent"
            />
          </div>

          {/* Fecha de Nacimiento */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Nacimiento *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <select
                  value={dia}
                  onChange={(e) => setDia(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent"
                >
                  <option value="">Día</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d.toString()}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={mes}
                  onChange={(e) => setMes(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent"
                >
                  <option value="">Mes</option>
                  {[
                    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
                    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
                  ].map((m, i) => (
                    <option key={m} value={(i + 1).toString()}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={anio}
                  onChange={(e) => setAnio(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent"
                >
                  <option value="">Año</option>
                  {Array.from({ length: 80 }, (_, i) => CURRENT_YEAR - i).map((y) => (
                    <option key={y} value={y.toString()}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>


          {/* Género */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Género *
            </label>
            <select
              value={genero}
              onChange={(e) => setGenero(e.target.value as Gender | '')}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent"
            >
              <option value="">Seleccionar...</option>
              <option value="F">Femenino</option>
              <option value="M">Masculino</option>
            </select>
          </div>

          {/* Provincia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Provincia *
            </label>
            <select
              value={provincia}
              onChange={(e) => setProvincia(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent"
            >
              <option value="">Seleccionar...</option>
              {PROVINCIAS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
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
          {/* Evento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Evento *
            </label>
            <select
              value={evento}
              onChange={(e) => setEvento(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent"
            >
              <option value="">Seleccionar evento...</option>
              {EVENTS.map((ev) => (
                <option key={ev} value={ev}>{ev}</option>
              ))}
            </select>
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría *
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              required
              disabled={categoriasDisponibles.length === 0}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
            >
              <option value="">
                {categoriasDisponibles.length === 0
                  ? 'Completá género, fecha y evento primero'
                  : 'Seleccionar categoría...'}
              </option>
              {categoriasDisponibles.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
        {categoriasDisponibles.length > 0 && (
          <p className="text-xs text-gray-500 mt-2">
            Categorías disponibles según tu edad competitiva ({CURRENT_YEAR} - {anio} = {CURRENT_YEAR - parseInt(anio)} años) y género.
          </p>
        )}
      </section>


      {/* ========== SECCIÓN 3: DATOS BENEFICIARIO ========== */}
      <section className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-[#0d2240] mb-6 pb-2 border-b-2 border-[#0d2240]">
          Datos del Beneficiario
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre y Apellidos */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre y Apellidos *
            </label>
            <input
              type="text"
              value={benefNombre}
              onChange={(e) => setBenefNombre(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent"
            />
          </div>

          {/* # Cédula */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              # Cédula *
            </label>
            <input
              type="text"
              value={benefCedula}
              onChange={(e) => handleBenefCedulaChange(e.target.value)}
              required
              placeholder="Solo letras y números"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent"
            />
          </div>

          {/* # Teléfono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              # Teléfono *
            </label>
            <input
              type="tel"
              value={benefTelefono}
              onChange={(e) => setBenefTelefono(e.target.value)}
              required
              placeholder="+506 8888-8888"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent"
            />
          </div>

          {/* Parentesco */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parentesco *
            </label>
            <select
              value={benefParentesco}
              onChange={(e) => setBenefParentesco(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a4f8b] focus:border-transparent"
            >
              <option value="">Seleccionar...</option>
              {PARENTESCOS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
      </section>


      {/* ========== SECCIÓN 4: PAGO ========== */}
      <section className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-[#0d2240] mb-6 pb-2 border-b-2 border-[#0d2240]">
          Pago
        </h2>
        <div className="space-y-4">
          {/* Método de Pago */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Método de pago *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {METODOS_PAGO.map((metodo) => (
                <label
                  key={metodo}
                  className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    metodoPago === metodo
                      ? 'border-[#1a4f8b] bg-blue-50 text-[#0d2240] font-medium'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="metodoPago"
                    value={metodo}
                    checked={metodoPago === metodo}
                    onChange={(e) => setMetodoPago(e.target.value)}
                    required
                    className="sr-only"
                  />
                  <span>{metodo}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Comprobante Sinpe */}
          {metodoPago === 'Sinpe' && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comprobante de Sinpe *
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setComprobante(e.target.files?.[0] || null)}
                required
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#0d2240] file:text-white hover:file:bg-[#1a4f8b]"
              />
              <p className="text-xs text-gray-500 mt-1">
                Sube una imagen o PDF del comprobante de pago.
              </p>
            </div>
          )}

          {/* Factura Electrónica */}
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="factura"
              checked={requiereFactura}
              onChange={(e) => setRequiereFactura(e.target.checked)}
              className="h-4 w-4 text-[#1a4f8b] rounded focus:ring-[#1a4f8b]"
            />
            <label htmlFor="factura" className="text-sm text-gray-700">
              Requiero Factura Electrónica
            </label>
          </div>
        </div>
      </section>


      {/* ========== SECCIÓN 5: TÉRMINOS Y CONDICIONES ========== */}
      <section className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-[#0d2240] mb-6 pb-2 border-b-2 border-[#0d2240]">
          Términos y Condiciones
        </h2>
        <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto mb-4 text-sm text-gray-600">
          <p className="font-medium mb-2">TÉRMINOS Y CONDICIONES DE PARTICIPACIÓN</p>
          <p className="mb-2">
            Al inscribirse en este evento, el participante acepta las siguientes condiciones:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Declaro que me encuentro en buen estado de salud para participar en esta competencia.</li>
            <li>Eximo de toda responsabilidad a los organizadores por lesiones o daños sufridos durante el evento.</li>
            <li>Autorizo el uso de mi imagen con fines promocionales del evento.</li>
            <li>Me comprometo a respetar el reglamento de la competencia.</li>
            <li>Acepto que la organización puede modificar el recorrido o cancelar el evento por razones de fuerza mayor.</li>
          </ul>
          <p className="mt-4 text-xs text-gray-400">
            [Espacio para términos y condiciones completos]
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="terminos"
            checked={aceptaTerminos}
            onChange={(e) => setAceptaTerminos(e.target.checked)}
            required
            className="h-4 w-4 text-[#1a4f8b] rounded focus:ring-[#1a4f8b]"
          />
          <label htmlFor="terminos" className="text-sm text-gray-700 font-medium">
            Acepto los términos y condiciones *
          </label>
        </div>
      </section>


      {/* ========== BOTÓN ENVIAR ========== */}
      <div className="text-center">
        <button
          type="submit"
          disabled={enviando || !aceptaTerminos}
          className="bg-[#0d2240] text-white px-12 py-4 rounded-xl text-lg font-bold hover:bg-[#1a4f8b] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          {enviando ? (
            <span className="flex items-center gap-2 justify-center">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Enviando...
            </span>
          ) : (
            'Enviar Inscripción'
          )}
        </button>
      </div>
    </form>
  );
}
