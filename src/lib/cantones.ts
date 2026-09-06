// Cantones de Costa Rica agrupados por provincia (división territorial oficial).
// Usado en los formularios para seleccionar el cantón según la provincia.

export const CANTONES_POR_PROVINCIA: Record<string, string[]> = {
  'San José': [
    'San José', 'Escazú', 'Desamparados', 'Puriscal', 'Tarrazú', 'Aserrí', 'Mora',
    'Goicoechea', 'Santa Ana', 'Alajuelita', 'Vázquez de Coronado', 'Acosta', 'Tibás',
    'Moravia', 'Montes de Oca', 'Turrubares', 'Dota', 'Curridabat', 'Pérez Zeledón', 'León Cortés Castro',
  ],
  'Alajuela': [
    'Alajuela', 'San Ramón', 'Grecia', 'San Mateo', 'Atenas', 'Naranjo', 'Palmares',
    'Poás', 'Orotina', 'San Carlos', 'Zarcero', 'Sarchí', 'Upala', 'Los Chiles',
    'Guatuso', 'Río Cuarto',
  ],
  'Cartago': [
    'Cartago', 'Paraíso', 'La Unión', 'Jiménez', 'Turrialba', 'Alvarado', 'Oreamuno', 'El Guarco',
  ],
  'Heredia': [
    'Heredia', 'Barva', 'Santo Domingo', 'Santa Bárbara', 'San Rafael', 'San Isidro',
    'Belén', 'Flores', 'San Pablo', 'Sarapiquí',
  ],
  'Guanacaste': [
    'Liberia', 'Nicoya', 'Santa Cruz', 'Bagaces', 'Carrillo', 'Cañas', 'Abangares',
    'Tilarán', 'Nandayure', 'La Cruz', 'Hojancha',
  ],
  'Puntarenas': [
    'Puntarenas', 'Esparza', 'Buenos Aires', 'Montes de Oro', 'Osa', 'Quepos',
    'Golfito', 'Coto Brus', 'Parrita', 'Corredores', 'Garabito', 'Monteverde', 'Puerto Jiménez',
  ],
  'Limón': [
    'Limón', 'Pococí', 'Siquirres', 'Talamanca', 'Matina', 'Guácimo',
  ],
};

/**
 * Devuelve los cantones de una provincia. Si no existe, devuelve lista vacía.
 */
export function getCantones(provincia: string): string[] {
  return CANTONES_POR_PROVINCIA[provincia] || [];
}
