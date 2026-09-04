# Contexto del Proyecto — "La Copa" (Inscripciones ANCM)

> Documento de contexto/handoff. Resume decisiones, arquitectura, archivos clave, base de datos,
> despliegue y pendientes del proyecto de inscripciones de ciclismo de montaña.
>
> Última actualización: 2 de agosto de 2026

---

## 1. Resumen general

Aplicación web de **inscripciones para carreras de ciclismo de montaña** de la Asociación
Nacional de Ciclismo de Montaña de Costa Rica (ANCM), para el evento **"La Copa"**.

- **App en producción:** `https://inscripciones.raceclubhub.com`
- **Idioma de la interfaz:** Español.
- **Modo de trabajo del usuario:** Solo desde el navegador web (no instala software local; no tiene acceso a la terminal ni al filesystem).

### Stack tecnológico
| Componente | Tecnología |
|---|---|
| Framework | Next.js (App Router) |
| Hosting | Cloudflare Workers (auto-deploy al hacer push a `main`) |
| Base de datos | Supabase (PostgreSQL) |
| Emails | Resend (desde `inscripciones@raceclubhub.com`) |
| Pagos con tarjeta | Tilopay (links de pago) |

---

## 2. Repositorio y despliegue

- **Repo:** `https://github.com/Nancyms1012/formulario-inscripciones` (rama `main`)
- **Clonar:** `git clone https://github.com/Nancyms1012/formulario-inscripciones.git`
- **Push:** `git push origin main` → **dispara auto-deploy en Cloudflare**
- **Build local (verificación):**
  ```bash
  cd /projects/sandbox/formulario-inscripciones
  source /root/.nvm/nvm.sh 2>/dev/null
  npm run build
  ```

### Variables de entorno (Cloudflare)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `RESEND_API_KEY` (secreto)

---

## 3. Base de datos (Supabase)

- **URL:** `https://ijqalxopeqyqfzwpfmfj.supabase.co`
- **RLS:** Deshabilitado.
- **Nota importante (Error 1016):** Todas las operaciones de base de datos se hacen **desde el navegador**
  vía `src/lib/inscripcion-client.ts`. Solo el envío de **email** pasa por una API route.
  Esto se hizo para evitar el error 1016 de Cloudflare.

### Migraciones SQL (carpeta `supabase/`)
| Archivo | Qué hace | Estado |
|---|---|---|
| `contador-visitas.sql` | Tabla + función de contador de visitas | ✅ Corrida por el usuario |
| `migracion-dorsal.sql` | Agrega columna `dorsal` | ✅ Corrida por el usuario |
| `migracion-checkin-por-dia.sql` | Columnas `checkin_xcc`, `checkin_xcc_fecha`, `checkin_xco`, `checkin_xco_fecha` | ⚠️ **PENDIENTE DE CONFIRMAR** |

---

## 4. Estructura de archivos clave

| Archivo | Descripción |
|---|---|
| `src/app/admin/page.tsx` | Panel de administración. Tabs **Inscripciones** / **Resumen**, modal de detalle, botón eliminar, subida de dorsales por CSV, y **modo edición** (lectura/edición). |
| `src/app/checkin/page.tsx` | Check-in con **selección de día** (XCC sábado / XCO domingo). Muestra dorsal grande, licencia (UCI ID). |
| `src/app/mi-inscripcion/page.tsx` | Tarjeta del ciclista, accesible por QR o código. |
| `src/app/inscritos/page.tsx` | Portada de inscritos (2 QR + contador de visitas). |
| `src/app/inscritos/lista/page.tsx` | Lista de inscritos con buscador, filtros y **orden por columna**. |
| `src/app/landing/page.tsx`, `src/app/page.tsx` | Landing + home. |
| `src/lib/categories.ts` | Lógica de categorías (Élite 19+, Copa Kids según Guía Técnica). |
| `src/lib/payment-links.ts` | Mapa de links de Tilopay por `"EVENTO|categoriaBase"`. |
| `src/lib/dias-evento.ts` | `getDiasParticipa(evento, categoria)`: define en qué día(s) participa cada quien. |
| `src/lib/inscripcion-client.ts` | Cliente de Supabase (URL/key hardcodeadas), `guardarInscripcion`, `guardarInscripcionKids`. |
| `src/lib/types.ts` | Tipos compartidos (`InscripcionFormData`, `Inscripcion`). |
| `src/app/api/email/route.ts` | Envío de email vía Resend (usa `RESEND_API_KEY`). |

---

## 5. Reglas de negocio importantes

### Días del evento (2 días)
El evento dura 2 días. Definido en `src/lib/dias-evento.ts`:
- **XCC** = Sábado (día 1)
- **XCO** = Domingo (día 2)

| Evento / Categoría | Día(s) |
|---|---|
| XCO + XCC | Ambos días |
| Copa Kids | Solo XCO (domingo) |
| E-Bike | Solo XCC (sábado) |
| Cyclocross | Solo XCC (sábado) |
| Categorías "Pasados" | Solo XCC (sábado) |

### Check-in por día
- Es **separado por día** (columnas independientes en la BD: `checkin_xcc` / `checkin_xco`).
- Se eligió esto (en lugar de un único campo `checkin`) porque el evento es de 2 días.
- Un ciclista que solo participa en XCO no debe aparecer para check-in el día de XCC (y viceversa).

### Categorías
- Élite: 19+ años.
- Copa Kids: según Guía Técnica.
- Se eliminó la categoría de prueba **"Prueba"** de Kids.

### Pagos
- Links de Tilopay mapeados en `payment-links.ts` por `"EVENTO|categoriaBase"`.
- Juvenil XCO usa el mismo link que Prejuvenil (`https://tp.cr/l/MTQ5Nzc=`, ₡15000).

---

## 6. Funcionalidad de Edición en Admin (recién agregada)

En el **modal de detalle** del panel de Admin (se abre al hacer clic en el nombre o en "Ver"):
- **Modo lectura** por defecto (muestra todos los datos por secciones).
- Botón **"Editar"** → cambia a **modo edición** con formulario editable.
- Botón **"Guardar"** → actualiza en Supabase y en las listas locales sin recargar.

**Campos editables:** nombre, primer apellido, segundo apellido, número de identificación,
email, celular, provincia, equipo, tipo de licencia, UCI ID, evento, categoría, dorsal,
estado de pago, y contacto de emergencia (nombre, teléfono, cédula, parentesco).

**Campos NO editables:** género, fecha de nacimiento, comprobante.

**Motivo:** El personal de la Asociación **no tiene acceso a Supabase**, así que toda la gestión
(eliminar, editar, subir dorsales) debe poder hacerse desde la UI de Admin.

---

## 7. Historial de cambios (commits recientes)

| Commit | Descripción |
|---|---|
| `bec1d87` | Botón eliminar por fila en Admin (con confirmación) |
| `dbc45a2` | Tab "Resumen" en Admin (total por evento + tabla por categoría) |
| `9336f25` | Sección `/inscritos` (portada 2 QR + contador) y `/inscritos/lista` |
| `a6c0f95` | Orden por columna en `/inscritos/lista` |
| `9abc178` | Modal de detalle en Admin |
| `75d29f5` | Tarjeta de check-in: quitar pago + género, agregar licencia |
| `db0065f` | Subida de dorsales por CSV (match por `numero_identificacion`) + dorsal grande |
| `520e0c6` | Check-in por día (migración + `dias-evento.ts` + pantalla de selección de día) |
| `f894645` | Fix: E-Bike solo sábado (XCC) |
| `5de5c5e` | Quitar categoría "Prueba" de Kids |
| `8fd122a` | **feat: Opción editar inscripción en Admin** |

---

## 8. Pendientes / Puntos abiertos

1. **Verificar deploy de Cloudflare del check-in por día.**
   El usuario reportó que la pantalla de selección de día (XCC/XCO) no aparecía tras el deploy,
   aunque el código está correcto en el repo (commit `520e0c6` / `f894645`).
   Sospecha: auto-deploy de Cloudflare quedó desactualizado o desconectado.
   → Confirmar que el deploy activo en Cloudflare tenga el último hash.

2. **Confirmar migración `migracion-checkin-por-dia.sql` en Supabase.**
   Sin esta migración, el check-in por día falla (faltan las columnas `checkin_xcc`/`checkin_xco`).

3. **Página de solo consulta para jueces (read-only).**
   Vista de solo lectura del estado de check-in, pendiente de implementar.

---

## 9. Notas de entorno

- El usuario trabaja **solo desde el navegador**. No suponer que puede correr comandos ni ver la terminal.
- Las operaciones de BD van por el navegador (`inscripcion-client.ts`); solo email por API route.
- Push a `main` = deploy automático en Cloudflare.
