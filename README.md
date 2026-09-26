# Formulario de Inscripciones - La Copa

Sistema de inscripción para carreras XCO, XCC y Copa Kids.

## Funcionalidades

- Formulario de inscripción (XCO + XCC + XCE vs Copa Kids)
- Consulta de inscripción (mi-inscripcion)
- Panel de administración:
  - Gestión de inscripciones (busca, edita, elimina)
  - Export CSV con filtros
  - Resumen por evento y categoría
  - Mapa de inscritos por cantón
  - Control de apertura/cierre de inscripciones
- Pago por Tilopay
- Correos de confirmación por Resend

## Deployment

- URL: `inscripciones.raceclubhub.com` (o URL principal del evento)
- Plataforma: Cloudflare Pages
- Base de datos: Supabase (compartida)

## Setup

```bash
npm install
npm run dev
```

## Módulos relacionados

- **checkin-app:** Check-in QR de corredores
- **boxes-app:** Parrilla de salida y DNS
- **control-evento:** Control de carreras XCC/XCO en tiempo real
