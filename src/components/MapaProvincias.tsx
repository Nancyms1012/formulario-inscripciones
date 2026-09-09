'use client';

// Mapa esquemático de Costa Rica por provincia (choropleth simple).
// No usa librerías externas ni GeoJSON: son formas SVG aproximadas de las 7 provincias,
// coloreadas por intensidad según la cantidad de inscritos.

interface MapaProvinciasProps {
  // Conteo de inscritos por provincia (clave = nombre exacto de provincia)
  conteo: Record<string, number>;
}

// Formas SVG aproximadas de cada provincia (viewBox 0 0 400 260).
// Son bloques estilizados con la posición geográfica relativa correcta.
const PROVINCIA_PATHS: { nombre: string; d: string; labelX: number; labelY: number }[] = [
  // Guanacaste (noroeste)
  { nombre: 'Guanacaste', d: 'M20,70 L110,55 L135,95 L120,140 L70,150 L40,120 Z', labelX: 72, labelY: 105 },
  // Puntarenas (franja pacífica, suroeste - forma alargada)
  { nombre: 'Puntarenas', d: 'M70,150 L120,140 L150,165 L175,150 L210,185 L260,230 L200,250 L120,235 L85,190 Z', labelX: 150, labelY: 210 },
  // Alajuela (norte-centro)
  { nombre: 'Alajuela', d: 'M110,55 L215,45 L235,90 L200,120 L150,120 L135,95 Z', labelX: 172, labelY: 82 },
  // Heredia (centro-norte, pequeña)
  { nombre: 'Heredia', d: 'M215,45 L260,55 L262,100 L235,90 Z', labelX: 238, labelY: 72 },
  // San José (centro)
  { nombre: 'San José', d: 'M150,120 L200,120 L235,90 L262,100 L270,150 L230,180 L175,150 Z', labelX: 212, labelY: 140 },
  // Cartago (centro-este)
  { nombre: 'Cartago', d: 'M262,100 L305,110 L315,155 L270,150 Z', labelX: 288, labelY: 132 },
  // Limón (este/caribe - franja)
  { nombre: 'Limón', d: 'M260,55 L360,60 L385,150 L340,200 L315,155 L305,110 L262,100 Z', labelX: 330, labelY: 115 },
];

// Escala de color azul según intensidad (0 a 1)
function colorPorIntensidad(valor: number, max: number): string {
  if (max === 0 || valor === 0) return '#e5e7eb'; // gris claro para 0
  const t = valor / max; // 0..1
  // Interpolar de azul claro (#dbeafe) a azul oscuro marca (#0d2240)
  const from = { r: 0xdb, g: 0xea, b: 0xfe };
  const to = { r: 0x0d, g: 0x22, b: 0x40 };
  const r = Math.round(from.r + (to.r - from.r) * t);
  const g = Math.round(from.g + (to.g - from.g) * t);
  const b = Math.round(from.b + (to.b - from.b) * t);
  return `rgb(${r},${g},${b})`;
}

export default function MapaProvincias({ conteo }: MapaProvinciasProps) {
  const valores = Object.values(conteo);
  const max = valores.length > 0 ? Math.max(...valores) : 0;
  const total = valores.reduce((a, b) => a + b, 0);

  return (
    <div>
      <svg viewBox="0 0 400 260" className="w-full h-auto" role="img" aria-label="Mapa de inscritos por provincia">
        {PROVINCIA_PATHS.map((p) => {
          const cant = conteo[p.nombre] || 0;
          const fill = colorPorIntensidad(cant, max);
          const textoOscuro = max > 0 && cant / max > 0.55;
          return (
            <g key={p.nombre}>
              <path d={p.d} fill={fill} stroke="#ffffff" strokeWidth="2">
                <title>{`${p.nombre}: ${cant} inscrito${cant !== 1 ? 's' : ''}`}</title>
              </path>
              <text x={p.labelX} y={p.labelY} textAnchor="middle"
                className="text-[9px] font-semibold pointer-events-none"
                fill={textoOscuro ? '#ffffff' : '#0d2240'}>
                {p.nombre}
              </text>
              <text x={p.labelX} y={p.labelY + 12} textAnchor="middle"
                className="text-[11px] font-bold pointer-events-none"
                fill={textoOscuro ? '#ffffff' : '#0d2240'}>
                {cant}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Leyenda */}
      <div className="flex items-center justify-center gap-2 mt-3 text-xs text-gray-500">
        <span>Menos</span>
        <div className="flex">
          {['#dbeafe', '#93b4dc', '#4d75ad', '#1a4f8b', '#0d2240'].map((c) => (
            <span key={c} className="w-6 h-3 inline-block" style={{ backgroundColor: c }} />
          ))}
        </div>
        <span>Más</span>
        <span className="ml-3 text-gray-400">· Total: {total}</span>
      </div>
    </div>
  );
}
