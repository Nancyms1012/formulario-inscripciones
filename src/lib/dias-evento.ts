// Determina en qué días participa un inscrito según su evento y categoría
// Día XCC = sábado, Día XCO = domingo

export type DiaEvento = 'XCC' | 'XCO';

/**
 * Devuelve los días (XCC / XCO) en que participa según su evento y categoría.
 * Reglas:
 * - XCC -> solo XCC (sábado)
 * - XCO -> solo XCO (domingo)
 * - XCO+XCC -> ambos
 * - XCO+XCC+XCE -> ambos
 * - Copa Kids -> solo XCO (domingo)
 * - Categorías especiales:
 *    - E-Bike -> solo XCC (sábado)
 *    - Pasados de línea -> solo XCC (sábado)
 *    - Cyclocross -> solo XCC (sábado)
 */
export function getDiasParticipa(evento: string, categoria: string): DiaEvento[] {
  const cat = categoria.toLowerCase();

  // Categorías especiales tienen prioridad
  if (cat.includes('e-bike') || cat.includes('ebike')) return ['XCC'];
  if (cat.includes('pasados de línea') || cat.includes('pasados de linea')) return ['XCC'];
  if (cat.includes('cyclocross') || cat.includes('cyclo cross')) return ['XCC'];

  // Por evento
  if (evento === 'Copa Kids') return ['XCO'];
  if (evento === 'XCC') return ['XCC'];
  if (evento === 'XCO') return ['XCO'];
  if (evento === 'XCO+XCC') return ['XCC', 'XCO'];
  if (evento === 'XCO+XCC+XCE') return ['XCC', 'XCO'];

  // Por defecto (fallback) - ambos
  return ['XCC', 'XCO'];
}

/**
 * Indica si participa en un día específico
 */
export function participaEnDia(evento: string, categoria: string, dia: DiaEvento): boolean {
  return getDiasParticipa(evento, categoria).includes(dia);
}
