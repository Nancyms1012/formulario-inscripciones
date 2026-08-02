# La Copa - Formulario de Inscripciones 🚴

Aplicación web para inscripciones a carreras de ciclismo.

## Tecnologías

- **Frontend:** Next.js 15 + Tailwind CSS
- **Backend:** Next.js API Routes
- **Base de datos:** Supabase (PostgreSQL)
- **Hosting:** Cloudflare Pages
- **Facturación:** GTI Costa Rica (pendiente integración)

## Páginas

| Ruta | Descripción |
|------|-------------|
| `/` | Formulario de inscripción público |
| `/admin` | Panel de administración (ver inscritos) |
| `/checkin` | Check-in el día de la carrera (escaneo QR) |

## Configuración

### 1. Crear cuenta en Supabase

1. Ir a [supabase.com](https://supabase.com) y crear proyecto
2. Copiar la URL y la Anon Key del proyecto

### 2. Crear la base de datos

Ejecutar el contenido de `supabase/schema.sql` en el SQL Editor de Supabase.

### 3. Variables de entorno

Copiar `.env.local.example` a `.env.local` y completar:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Instalar y ejecutar

```bash
npm install
npm run dev
```

### 5. Deploy en Cloudflare Pages

1. Conectar el repositorio de GitHub en Cloudflare Pages
2. Build command: `npm run build`
3. Build output directory: `.next`
4. Agregar las variables de entorno en Cloudflare

## Estructura del Proyecto

```
src/
  app/
    page.tsx              → Formulario principal
    layout.tsx            → Layout con header/footer
    globals.css           → Estilos globales
    api/
      inscripciones/      → API CRUD inscripciones
      checkin/            → API check-in
    admin/                → Panel administrativo
    checkin/              → Página de check-in (QR)
  components/
    FormularioInscripcion.tsx → Formulario completo
  lib/
    categories.ts         → Lógica de categorías
    supabase.ts           → Cliente Supabase
    types.ts              → TypeScript types
public/
  images/                 → Logo e imágenes
supabase/
  schema.sql              → Esquema de base de datos
```

## Colores de Marca

- Azul marino oscuro (primario): `#0d2240`
- Azul acento: `#1a4f8b`
- Blanco: `#FFFFFF`

## Pendientes

- [ ] Integración con GTI Costa Rica (factura electrónica)
- [ ] Pasarela de pago (tarjeta)
- [ ] Envío de email con QR de confirmación
- [ ] Autenticación para panel admin
