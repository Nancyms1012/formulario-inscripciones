// Mapa de links de pago de Tilopay por evento + categoría base
// La clave es: "EVENTO|CATEGORIA_BASE" (sin sufijo de género)
// El monto es solo informativo (para mostrar al usuario)

export interface PaymentLink {
  url: string;
  monto: number; // en colones
}

// Normaliza el nombre de categoría quitando el sufijo de género
export function getCategoriaBase(categoria: string): string {
  return categoria.replace(/ (Femenino|Masculino)$/, '').trim();
}

// Mapa: "evento|categoriaBase" -> link de pago
export const PAYMENT_LINKS: Record<string, PaymentLink> = {
  // ===== XCO+XCC+XCE =====
  'XCO+XCC+XCE|Élite': { url: 'https://tilo.co/s/Smw8fwjG', monto: 34000 },
  'XCO+XCC+XCE|Sub 23': { url: 'https://tilo.co/s/Smw8fwjG', monto: 34000 },
  'XCO+XCC+XCE|Juvenil': { url: 'https://tilo.co/s/8gMjG8qz', monto: 26000 },
  'XCO+XCC+XCE|Máster A': { url: 'https://tilo.co/s/veH5DHSG', monto: 29000 },
  'XCO+XCC+XCE|Máster B': { url: 'https://tilo.co/s/veH5DHSG', monto: 29000 },
  'XCO+XCC+XCE|Máster C': { url: 'https://tilo.co/s/veH5DHSG', monto: 29000 },
  'XCO+XCC+XCE|Máster D': { url: 'https://tilo.co/s/veH5DHSG', monto: 29000 },
  'XCO+XCC+XCE|Máster E': { url: 'https://tilo.co/s/veH5DHSG', monto: 29000 },

  // ===== XCC (Short Track) =====
  'XCC|Élite': { url: 'https://tilo.co/s/kMn7JEzG', monto: 6000 },
  'XCC|Sub 23': { url: 'https://tilo.co/s/kMn7JEzG', monto: 6000 },
  'XCC|Máster A': { url: 'https://tilo.co/s/kMn7JEzG', monto: 6000 },
  'XCC|Máster B': { url: 'https://tilo.co/s/kMn7JEzG', monto: 6000 },
  'XCC|Máster C': { url: 'https://tilo.co/s/kMn7JEzG', monto: 6000 },
  'XCC|Máster D': { url: 'https://tilo.co/s/kMn7JEzG', monto: 6000 },
  'XCC|Máster E': { url: 'https://tilo.co/s/kMn7JEzG', monto: 6000 },
  'XCC|Open': { url: 'https://tilo.co/s/kMn7JEzG', monto: 6000 },
  // XCC categorías menores (Preinfantil, Infantil, Prejuvenil, Juvenil) = ₡5.000
  'XCC|Preinfantil': { url: 'https://tp.cr/l/MTQ5ODg=', monto: 5000 },
  'XCC|Infantil': { url: 'https://tp.cr/l/MTQ5ODg=', monto: 5000 },
  'XCC|Prejuvenil': { url: 'https://tp.cr/l/MTQ5ODg=', monto: 5000 },
  'XCC|Juvenil': { url: 'https://tp.cr/l/MTQ5ODg=', monto: 5000 },
  'XCC|Ligas menores': { url: 'https://tp.cr/l/MTQ5ODg=', monto: 5000 },

  // ===== XCE =====
  'XCE|Élite': { url: 'https://tp.cr/l/MjYyODk=', monto: 6000 },
  'XCE|Sub 23': { url: 'https://tp.cr/l/MjYyODk=', monto: 6000 },
  'XCE|Máster A': { url: 'https://tp.cr/l/MjYyODk=', monto: 6000 },
  'XCE|Máster B': { url: 'https://tp.cr/l/MjYyODk=', monto: 6000 },
  'XCE|Máster C': { url: 'https://tp.cr/l/MjYyODk=', monto: 6000 },
  'XCE|Máster D': { url: 'https://tp.cr/l/MjYyODk=', monto: 6000 },
  'XCE|Máster E': { url: 'https://tp.cr/l/MjYyODk=', monto: 6000 },
  'XCE|Juvenil': { url: 'https://tp.cr/l/MjYyODk=', monto: 6000 },

  // ===== Categorías adicionales (aplican en cualquier evento con XCO/XCC) =====
  'XCC|Pasados de línea': { url: 'https://tp.cr/l/MTUxNjQ1', monto: 7000 },
  'XCO|Pasados de línea': { url: 'https://tp.cr/l/MTUxNjQ1', monto: 7000 },
  'XCO+XCC|Pasados de línea': { url: 'https://tp.cr/l/MTUxNjQ1', monto: 7000 },
  'XCC|Cyclocross': { url: 'https://tp.cr/l/MTUxNjQ0', monto: 7000 },
  'XCO|Cyclocross': { url: 'https://tp.cr/l/MTUxNjQ0', monto: 7000 },
  'XCO+XCC|Cyclocross': { url: 'https://tp.cr/l/MTUxNjQ0', monto: 7000 },
  'XCO+XCC|E-Bike': { url: 'https://tp.cr/l/MTE4NTU3', monto: 17000 },
  'XCO|E-Bike': { url: 'https://tp.cr/l/MTQ5ODE=', monto: 17000 },

  // ===== Preinfantil =====
  'XCO+XCC|Preinfantil': { url: 'https://tp.cr/l/MTA0NTQ0', monto: 13000 },
  'XCO|Preinfantil': { url: 'https://tp.cr/l/MTA0NTQz', monto: 8000 },

  // ===== XCO+XCC =====
  'XCO+XCC|Open': { url: 'https://tp.cr/l/MTUwMzI=', monto: 23000 },
  'XCO+XCC|Máster A': { url: 'https://tp.cr/l/MTUwMzE=', monto: 23000 },
  'XCO+XCC|Máster B': { url: 'https://tp.cr/l/MTUwMzE=', monto: 23000 },
  'XCO+XCC|Máster C': { url: 'https://tp.cr/l/MTUwMzE=', monto: 23000 },
  'XCO+XCC|Máster D': { url: 'https://tp.cr/l/MTUwMzE=', monto: 23000 },
  'XCO+XCC|Máster E': { url: 'https://tp.cr/l/MTUwMzE=', monto: 23000 },
  'XCO+XCC|Élite': { url: 'https://tp.cr/l/MTUwMzA=', monto: 28000 },
  'XCO+XCC|Sub 23': { url: 'https://tp.cr/l/MTUwMzA=', monto: 28000 },
  'XCO+XCC|Juvenil': { url: 'https://tp.cr/l/MTUwMjk=', monto: 20000 },
  'XCO+XCC|Prejuvenil': { url: 'https://tp.cr/l/MTUwMjc=', monto: 20000 },
  'XCO+XCC|Infantil': { url: 'https://tp.cr/l/MTUwMjY=', monto: 15000 },

  // ===== XCO =====
  'XCO|Juvenil': { url: 'https://tp.cr/l/MTQ5ODA=', monto: 15000 },
  'XCO|Open': { url: 'https://tp.cr/l/MTQ5Nzk=', monto: 17000 },
  'XCO|Élite': { url: 'https://tp.cr/l/MTQ5Nzg=', monto: 22000 },
  'XCO|Sub 23': { url: 'https://tp.cr/l/MTQ5Nzg=', monto: 22000 },
  'XCO|Prejuvenil': { url: 'https://tp.cr/l/MTQ5Nzc=', monto: 15000 },
  'XCO|Máster A': { url: 'https://tp.cr/l/MTQ4NjQ=', monto: 17000 },
  'XCO|Máster B': { url: 'https://tp.cr/l/MTQ4NjQ=', monto: 17000 },
  'XCO|Máster C': { url: 'https://tp.cr/l/MTQ4NjQ=', monto: 17000 },
  'XCO|Máster D': { url: 'https://tp.cr/l/MTQ4NjQ=', monto: 17000 },
  'XCO|Máster E': { url: 'https://tp.cr/l/MTQ4NjQ=', monto: 17000 },
  'XCO|Infantil': { url: 'https://tp.cr/l/MTQ4NjE=', monto: 10000 },

  // ===== Copa Kids (todas ₡8.000, mismo link) =====
  'Copa Kids|Balance (Niños A)': { url: 'https://tp.cr/l/MTQ5OTA=', monto: 8000 },
  'Copa Kids|0 a 4 años (Niños A)': { url: 'https://tp.cr/l/MTQ5OTA=', monto: 8000 },
  'Copa Kids|5 a 6 años (Niños B)': { url: 'https://tp.cr/l/MTQ5OTA=', monto: 8000 },
  'Copa Kids|7 a 8 años (Niños B)': { url: 'https://tp.cr/l/MTQ5OTA=', monto: 8000 },
  'Copa Kids|9 a 10 años (Niños C)': { url: 'https://tp.cr/l/MTQ5OTA=', monto: 8000 },
  'Copa Kids|11 a 12 años (Preinfantil)': { url: 'https://tp.cr/l/MTQ5OTA=', monto: 8000 },

  // ===== PRUEBA (₡1) - para testear el flujo de pago =====
  'XCO|Prueba': { url: 'https://tilo.co/s/63fr9kF9', monto: 1 },
  'XCC|Prueba': { url: 'https://tilo.co/s/63fr9kF9', monto: 1 },
  'XCO+XCC|Prueba': { url: 'https://tilo.co/s/63fr9kF9', monto: 1 },
  'XCO+XCC+XCE|Prueba': { url: 'https://tilo.co/s/63fr9kF9', monto: 1 },
  'Copa Kids|Prueba': { url: 'https://tilo.co/s/63fr9kF9', monto: 1 },
};

/**
 * Obtiene el link de pago según el evento y la categoría (con o sin sufijo de género)
 */
export function getPaymentLink(evento: string, categoria: string): PaymentLink | null {
  const catBase = getCategoriaBase(categoria);
  const key = `${evento}|${catBase}`;
  return PAYMENT_LINKS[key] || null;
}
