# Contexto del Proyecto — "La Copa" (Inscripciones ANCM)

> Documento de contexto/handoff. Resume decisiones, arquitectura, archivos clave, base de datos,
> despliegue y pendientes del proyecto de inscripciones de ciclismo de montaña.
>
> Última actualización: 11 de agosto de 2026

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
| `migracion-factura.sql` | Columnas `factura_nombre`, `factura_celular`, `factura_email` | ✅ Corrida por el usuario (11 ago) |
| `migracion-factura-cedula.sql` | Columna `factura_cedula` | ⚠️ Revisar si se corrió |
| `migracion-canton.sql` | Columna `canton` | ⚠️ Revisar si se corrió |
| `migracion-checkin-operador.sql` | Datos del operador de check-in | ⚠️ Revisar si se corrió |

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

#### Categorías Copa Kids (definitivas, edad = 2026 - año nacimiento)
| Categoría | Edad |
|---|---|
| Balance (Niños A) | 1 a 4 años |
| 0 a 4 años (Niños A) | 1 a 4 años |
| 5 a 6 años (Niños B) | 5 a 6 años |
| 7 a 8 años (Niños C) | 7 a 8 años |
| 9 a 10 años (Niños D) | 9 a 10 años |
| 11 a 12 años (Preinfantil) | 11 a 12 años |

- **Edad máxima Kids: 12 años.** El selector de año en el formulario Kids muestra solo
  años válidos (edad 1 a 12, o sea 2025 a 2014). Es esperado y correcto que Balance y
  "0 a 4 años" compartan el mismo rango (ambas aparecen para 1-4 años).
- **Validación:** el formulario Kids **bloquea el envío si no hay categoría seleccionada**
  (el select `disabled` saltaba el `required` del navegador, lo que permitía inscribir sin
  categoría; se corrigió con una validación explícita en el submit).

### Formulario Copa Kids (`src/components/FormularioKids.tsx`)
Componente **separado** de `FormularioInscripcion.tsx` (La Copa). Diferencias:
- Datos personales del menor **sin celular ni email**, **con lateralidad** (Diestro/Zurdo/Ambidiestro).
- Datos de la carrera: **solo categoría** (evento fijo "Copa Kids").
- Sección **"Datos del Encargado"** (en lugar de Contacto de Emergencia): nombre, # cédula,
  # teléfono, e-mail, parentesco.
- **Validación:** la cédula del encargado no puede ser igual a la del menor.
- El **correo de confirmación (QR) llega al correo del encargado** (el menor no tiene).
- Header/layout propio **verde** (`#1a7a3a`) con logo Copa Kids (La Copa usa azul `#0d2240`).
- Ambos formularios tienen botón **"Volver a la portada"** en el header.

### Factura electrónica (NO automática con GTI todavía)
- Al activar el check **"Requiero Factura Electrónica"** aparece un selector:
  usar **datos del formulario** o **usar otros datos**.
- Si elige "otros datos": campos obligatorios **nombre, # celular (506+8), correo**.
- En La Copa "datos del formulario" = datos del participante; en Kids = datos del encargado.
- Se guarda en Supabase: `factura_nombre`, `factura_celular`, `factura_email`.

### Pagos
- Links de Tilopay mapeados en `payment-links.ts` por `"EVENTO|categoriaBase"`.
- Función `getPaymentLink(evento, categoria)` normaliza quitando sufijo de género.
- **68 combinaciones** configuradas. Copa Kids: todas ₡8.000, mismo link.
- Juvenil XCO usa el mismo link que Prejuvenil (`https://tp.cr/l/MTQ5Nzc=`, ₡15000).
- **Nota:** los links incluyen eventos **XCE / XCO+XCC+XCE / "Ligas menores"** que NO se usan
  en este evento (el formulario solo ofrece XCO, XCC, XCO+XCC). Se dejaron para futuras fechas.

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
| — | Fix parse Turbopack/Cloudflare en T&C (texto movido a `src/lib/terminos.ts` y render dinámico) |
| — | Formulario Kids separado (`FormularioKids.tsx`): sin celular/email, con lateralidad, Datos del Encargado, header verde |
| — | Validación cédula encargado ≠ cédula menor (Kids) |
| — | Factura electrónica con campos condicionales (usar datos del formulario u otros) + `migracion-factura.sql` |
| — | Botón "Volver a la portada" en headers de Copa y Kids |
| — | Fix Kids sin categoría + limitar edad a 12 años (selector de año 2025-2014) |
| — | Fix nombres categorías Kids: 7-8 = Niños C, 9-10 = Niños D (en `categories.ts` y `payment-links.ts`) |
| — | Fix filtro de categoría en Admin (el desplegable estaba vacío; ahora se llena con categorías reales) |

---

## 8. Pendientes / Puntos abiertos

1. **Confirmar que las migraciones SQL estén corridas en Supabase** (ver tabla sección 3):
   `migracion-checkin-por-dia.sql`, `migracion-factura-cedula.sql`, `migracion-canton.sql`,
   `migracion-checkin-operador.sql`. La de `migracion-factura.sql` ya se corrió (11 ago).

2. **Facturación electrónica automática con GTI Costa Rica.**
   Por ahora la factura solo captura datos (nombre/celular/correo); NO se emite automáticamente.
   Requiere integración con GTI (pendiente de info del usuario).

3. **Conectar dominio principal de La Copa.**
   El dominio de La Copa NO está en la cuenta de Cloudflare del usuario (está en otra cuenta).
   Decisión: usar **subdominio** (ej. `inscripciones.dominio-lacopa.com`), no ruta.
   Requiere que quien administra ese dominio agregue un registro DNS (CNAME al Worker).
   El usuario controla el código; solo el DNS depende de la otra persona.

4. **Página de solo consulta para jueces (read-only).**
   Existe `/jueces` (revisar estado). Vista de solo lectura del check-in.

5. **Nota Supabase (plan gratuito):** el proyecto se **pausa por inactividad** (~7 días) y el
   subdominio deja de resolver DNS → los formularios dan "Failed to fetch". Ya pasó una vez y
   el usuario lo reactivó. Antes del evento, verificar que esté activo (o considerar plan Pro
   / un keep-alive para que no se pause).

## 8.b Estado FUNCIONANDO (a 11 ago 2026)
- Formularios Copa y Kids funcionando y separados.
- Pago con Tilopay (links por categoría-evento) integrado; tras pago exitoso vuelve a `/pago-exitoso`.
- Sinpe: número + comprobante obligatorio. Efectivo y Tarjeta disponibles.
- Factura electrónica (captura de datos) funcionando en ambos formularios.
- Panel Admin: filtros (evento + categoría), resumen, cantones, edición, dorsales CSV, eliminar.
- Fecha del evento: **VI Fecha Orosi · 12 y 13 Setiembre**.

---

## 9. Notas de entorno

- El usuario trabaja **solo desde el navegador**. No suponer que puede correr comandos ni ver la terminal.
- Las operaciones de BD van por el navegador (`inscripcion-client.ts`); solo email por API route.
- Push a `main` = deploy automático en Cloudflare.
