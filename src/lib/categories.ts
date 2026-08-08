// Lógica de categorías para La Copa
// Edad competitiva = Año actual (2026) - Año de nacimiento

export const CURRENT_YEAR = 2026;

export type Gender = 'F' | 'M';
export type EventType = 'XCO' | 'XCC' | 'XCO+XCC' | 'Copa Kids';

export interface Category {
  name: string;
  gender: 'F' | 'M' | 'F/M';
  minAge: number | null;
  maxAge: number | null;
  availableCategories: string[];
}

// Categorías para XCO, XCC, XCE
export const RACE_CATEGORIES: Category[] = [
  // Categorías por edad (ambos géneros)
  { name: 'Preinfantil', gender: 'F/M', minAge: 11, maxAge: 12, availableCategories: ['Preinfantil'] },
  { name: 'Infantil', gender: 'F/M', minAge: 13, maxAge: 14, availableCategories: ['Infantil'] },
  { name: 'Prejuvenil', gender: 'F/M', minAge: 15, maxAge: 16, availableCategories: ['Prejuvenil'] },
  { name: 'Juvenil', gender: 'F/M', minAge: 17, maxAge: 18, availableCategories: ['Juvenil'] },
  { name: 'Sub 23', gender: 'F/M', minAge: 19, maxAge: 22, availableCategories: ['Sub 23', 'Élite'] },
  { name: 'Élite', gender: 'F/M', minAge: 19, maxAge: 34, availableCategories: ['Élite'] },

  // Categorías Máster Masculino
  { name: 'Máster A', gender: 'M', minAge: 30, maxAge: 34, availableCategories: ['Máster A', 'Élite', 'Open'] },
  { name: 'Máster B', gender: 'M', minAge: 35, maxAge: 39, availableCategories: ['Máster B', 'Máster A', 'Élite', 'Open'] },
  { name: 'Máster C', gender: 'M', minAge: 40, maxAge: 44, availableCategories: ['Máster C', 'Máster B', 'Máster A', 'Élite', 'Open'] },
  { name: 'Máster D', gender: 'M', minAge: 45, maxAge: 49, availableCategories: ['Máster D', 'Máster C', 'Máster B', 'Máster A', 'Élite', 'Open'] },
  { name: 'Máster E', gender: 'M', minAge: 50, maxAge: null, availableCategories: ['Máster E', 'Máster D', 'Máster C', 'Máster B', 'Máster A', 'Élite', 'Open'] },

  // Categorías Máster Femenino
  { name: 'Máster A', gender: 'F', minAge: 30, maxAge: 39, availableCategories: ['Máster A', 'Élite', 'Open'] },
  { name: 'Máster B', gender: 'F', minAge: 40, maxAge: null, availableCategories: ['Máster B', 'Máster A', 'Élite', 'Open'] },

  // Categorías adicionales
  { name: 'Open', gender: 'F/M', minAge: 18, maxAge: null, availableCategories: ['Open'] },
  { name: 'E-Bike', gender: 'F/M', minAge: 18, maxAge: null, availableCategories: ['E-Bike'] },
  { name: 'Cyclocross', gender: 'F/M', minAge: 17, maxAge: null, availableCategories: ['Cyclocross'] },
  { name: 'Pasados de línea', gender: 'M', minAge: 18, maxAge: null, availableCategories: ['Pasados de línea'] },
];

// Categorías para Copa Kids
export const KIDS_CATEGORIES: Category[] = [
  { name: 'Balance', gender: 'F/M', minAge: null, maxAge: 4, availableCategories: ['Balance'] },
  { name: 'Niños A', gender: 'F/M', minAge: null, maxAge: 4, availableCategories: ['Niños A'] },
  { name: 'Niños B', gender: 'F/M', minAge: 5, maxAge: 6, availableCategories: ['Niños B'] },
  { name: 'Niños C', gender: 'F/M', minAge: 7, maxAge: 8, availableCategories: ['Niños C'] },
  { name: 'Niños D', gender: 'F/M', minAge: 9, maxAge: 10, availableCategories: ['Niños D'] },
  { name: 'Preinfantil', gender: 'F/M', minAge: 11, maxAge: 12, availableCategories: ['Preinfantil'] },
];

/**
 * Calcula la edad competitiva basada en el año de nacimiento
 */
export function getCompetitiveAge(birthYear: number): number {
  return CURRENT_YEAR - birthYear;
}

/**
 * Obtiene las categorías disponibles según evento, género y año de nacimiento.
 * Agrega el sufijo "Femenino" o "Masculino" al nombre de la categoría.
 */
export function getAvailableCategories(
  event: EventType,
  gender: Gender,
  birthYear: number
): string[] {
  const age = getCompetitiveAge(birthYear);
  const categories = event === 'Copa Kids' ? KIDS_CATEGORIES : RACE_CATEGORIES;
  const genderLabel = gender === 'F' ? 'Femenino' : 'Masculino';

  const available = new Set<string>();

  for (const category of categories) {
    // Verificar si el género aplica
    if (category.gender !== 'F/M' && category.gender !== gender) {
      continue;
    }

    // Verificar si la edad está en el rango
    const meetsMinAge = category.minAge === null || age >= category.minAge;
    const meetsMaxAge = category.maxAge === null || age <= category.maxAge;

    if (meetsMinAge && meetsMaxAge) {
      // Agregar todas las categorías con el sufijo de género
      for (const cat of category.availableCategories) {
        available.add(`${cat} ${genderLabel}`);
      }
    }
  }

  return Array.from(available);
}

// Eventos disponibles
export const EVENTS: EventType[] = ['XCO', 'XCC', 'XCO+XCC', 'Copa Kids'];

// Provincias de Costa Rica
export const PROVINCIAS = [
  'San José',
  'Alajuela',
  'Cartago',
  'Heredia',
  'Guanacaste',
  'Puntarenas',
  'Limón',
];

// Tipos de identificación
export const TIPOS_IDENTIFICACION = [
  'Cédula física',
  'Cédula jurídica',
  'Pasaporte',
];

// Nacionalidad
export const NACIONALIDADES = ['Nacional', 'Extranjero'];

// Tipos de licencia
export const TIPOS_LICENCIA = ['1 Día', 'Anual'];

// Parentescos
export const PARENTESCOS = [
  'Esposo/Esposa',
  'Padre/Madre',
  'Hijo/Hija',
  'Hermano/Hermana',
  'Tío/Tía',
  'Abuelo/Abuela',
  'Otro',
];

// Métodos de pago
export const METODOS_PAGO = ['Tarjeta', 'Sinpe', 'Efectivo'];
