# Pendientes para mañana - La Copa

## Prueba temprano
- Probar pago con Tarjeta (₡1) en Copa Kids → categoría "Prueba"
- Verificar: vuelve con código + llega correo + aparece confirmado en admin

## Trabajo del día

### 1. Página de Check-in (mejorar la actual `/checkin`)
- Es la que ya existe para escanear QR + buscar por nombre/cédula/código
- Revisar y mejorar para el día del evento

### 2. Página de SOLO CONSULTA de check-in (para los jueces)
- Nueva página, solo lectura
- Para que los jueces el día del evento consulten el estado de check-in
- Sin poder modificar, solo ver quién hizo check-in / quién no
- Filtros por categoría, evento, etc.

### 3. Página para que el ciclista valide su inscripción con QR
- Nueva página pública
- El ciclista escanea/ingresa su código o QR
- Ve el estado de SU inscripción (confirmada, pendiente de pago, etc.)
- Para autovalidación antes del evento

## Estado actual del proyecto
- Formularios Copa y Kids funcionando
- Pago con Tilopay (links por categoría) integrado
- Tarjeta: solo guarda inscripción si el pago es exitoso (localStorage + /pago-exitoso)
- Sinpe: muestra número 6349-0950 + comprobante obligatorio
- Factura electrónica antes del método de pago (nombre/cédula/correo)
- Fecha: VI Fecha Orosi · 12 y 13 Setiembre
- Guía Técnica (PDF) enlazada en / y /landing
- Categoría "Prueba" (₡1) solo en Copa Kids
- Precios XCO corregidos según Guía Técnica
- Categorías Copa Kids según Guía Técnica

## URLs
- Formulario: inscripciones.raceclubhub.com
- Admin: /admin
- Check-in: /checkin
- Landing QR: /landing
