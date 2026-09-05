// Utilidades para limpiar/validar entradas de nombre y apellidos.
// Reglas solicitadas:
// - Nombre: sin "@", permite UN solo espacio (nombres compuestos), máximo 20 caracteres.
// - Apellidos: sin "@", SIN espacios, máximo 15 caracteres.

export const MAX_NOMBRE = 30;
export const MAX_APELLIDO = 15;
export const MAX_ESPACIOS_NOMBRE = 3; // hasta 4 palabras (ej: "María de los Ángeles")

/**
 * Limpia el valor del NOMBRE:
 * - Elimina el caracter "@".
 * - Colapsa múltiples espacios seguidos a uno solo.
 * - No permite espacio al inicio.
 * - Permite hasta 3 espacios (nombres compuestos como "María de los Ángeles");
 *   los espacios extra se eliminan.
 * - Recorta a máximo 30 caracteres.
 * No hace trim al final para permitir escribir el espacio mientras se digita.
 */
export function sanitizeNombre(value: string): string {
  let v = value.replace(/@/g, '');       // quitar arroba
  v = v.replace(/\s{2,}/g, ' ');          // colapsar espacios múltiples a uno
  v = v.replace(/^\s+/, '');              // no permitir espacio al inicio

  // Limitar la cantidad de espacios a MAX_ESPACIOS_NOMBRE
  const partes = v.split(' ');
  if (partes.length > MAX_ESPACIOS_NOMBRE + 1) {
    // Reunir las palabras extra en la última permitida (elimina espacios sobrantes)
    v = partes.slice(0, MAX_ESPACIOS_NOMBRE + 1).join(' ') + partes.slice(MAX_ESPACIOS_NOMBRE + 1).join('');
  }

  return v.slice(0, MAX_NOMBRE);
}

/**
 * Limpia el valor de un APELLIDO:
 * - Elimina el caracter "@".
 * - Elimina TODOS los espacios.
 * - Recorta a máximo 15 caracteres.
 */
export function sanitizeApellido(value: string): string {
  let v = value.replace(/@/g, '');       // quitar arroba
  v = v.replace(/\s+/g, '');              // quitar todos los espacios
  return v.slice(0, MAX_APELLIDO);
}
