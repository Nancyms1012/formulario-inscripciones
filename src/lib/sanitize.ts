// Utilidades para limpiar/validar entradas de nombre y apellidos.
// Reglas solicitadas:
// - Nombre: sin "@", permite UN solo espacio (nombres compuestos), máximo 20 caracteres.
// - Apellidos: sin "@", SIN espacios, máximo 15 caracteres.

export const MAX_NOMBRE = 20;
export const MAX_APELLIDO = 15;

/**
 * Limpia el valor del NOMBRE:
 * - Elimina el caracter "@".
 * - Colapsa múltiples espacios a uno solo (permite un solo espacio entre palabras).
 * - Recorta a máximo 20 caracteres.
 * No hace trim al final para permitir escribir el espacio mientras se digita.
 */
export function sanitizeNombre(value: string): string {
  let v = value.replace(/@/g, '');       // quitar arroba
  v = v.replace(/\s{2,}/g, ' ');          // colapsar espacios múltiples a uno
  v = v.replace(/^\s+/, '');              // no permitir espacio al inicio
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
