# Contexto del Proyecto — "La Copa" (Inscripciones ANCM)

> Documento de contexto/handoff. Resume decisiones, arquitectura, archivos clave, base de datos,
> despliegue y pendientes del proyecto de inscripciones de ciclismo de montaña.
>
> Última actualización: 6 de septiembre de 2026 (evento este fin de semana: 12-13 sept)

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
| `migracion-email-enviado.sql` | Columna `email_enviado` (marca si el correo se envió) | ✅ Corrida por el usuario (sept) |
| `migracion-config-inscripciones.sql` | Tabla `config_inscripciones` (abrir/cerrar por grupo) | ✅ Corrida por el usuario (sept) — **RLS DEBE quedar deshabilitado** o el cierre no persiste |

> **Importante:** el proyecto usa **RLS deshabilitado en TODAS las tablas** a propósito (todo se
> opera desde el navegador con la anon key). Al crear tablas nuevas hay que hacer
> `ALTER TABLE ... DISABLE ROW LEVEL SECURITY;`, si no, el navegador no puede escribir
> (pasó con `config_inscripciones`: el cierre no se guardaba por RLS activo).

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
| `src/lib/inscripcion-client.ts` | Cliente de Supabase (URL/key hardcodeadas). `guardarInscripcion`, `guardarInscripcionKids`, `getCuposKids`, `enviarCorreoConfirmacion`, `verificarInscripcionExistente`, `getEstadoInscripcion`, `getConfigInscripciones`, `actualizarConfigInscripcion`. |
| `src/lib/terminos.ts` | Texto de Términos y Condiciones (movido aquí para evitar error de parseo en Cloudflare). |
| `src/lib/cantones.ts` | Cantones por provincia. |
| `src/components/FormularioInscripcion.tsx` | Formulario de La Copa. |
| `src/components/FormularioKids.tsx` | Formulario de Copa Kids (separado). |
| `src/components/MapaProvincias.tsx` | Mapa SVG de CR por provincia (choropleth #FFC20D). |
| `src/app/jueces/page.tsx` | Vista de solo lectura del check-in para jueces (filtros por día/evento/categoría). |
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
- **Cyclocross desactivado** en esta fecha: comentado en `categories.ts` (`RACE_CATEGORIES` y
  `CATEGORIAS_ESPECIALES`). Los links de pago de Cyclocross quedaron intactos. Para reactivar,
  descomentar esas 2 líneas.

### Cupos Copa Kids (máx. 150)
- Constante `CUPO_MAXIMO_KIDS = 150` en `inscripcion-client.ts`. Función `getCuposKids()`
  devuelve `{ inscritos, disponibles, maximo }`.
- Leyenda **"Queda 1 cupo" / "Quedan X cupos" / "Cupos agotados"** (en ROJO) en: home (`/`),
  `/landing`, `/inscritos` y el formulario Kids.
- El formulario Kids se **cierra solo** al llegar a 150 (deshabilita continuar y re-verifica al enviar).

### Control de apertura/cierre de inscripciones (tabla `config_inscripciones`)
- Tab **"Abrir/Cerrar"** en el Admin, una tarjeta por evento (La Copa / Copa Kids):
  - Botón **"Cerrar ahora" / "Abrir ahora"** (interruptor manual, columna `abierto`).
  - **Cierre automático por fecha/hora** (`datetime-local`, columna `cierre_at`).
  - Badge ABIERTO/CERRADO.
- `getEstadoInscripcion(grupo)` decide si está abierto (manual + fecha). `actualizarConfigInscripcion`
  usa **upsert** (crea la fila si no existe).
- El **home y los formularios respetan el cierre**: si está cerrado, la tarjeta del home sale en gris
  ("Inscripciones cerradas") y el formulario muestra pantalla de cerrado.
- Kids: cerrado = manual/fecha **O** cupo lleno (150).

### Reenvío de correos (límite de Resend)
- Columna `email_enviado` (BOOLEAN). Al inscribir, `enviarCorreoConfirmacion()` envía vía `/api/email`
  y marca `true`/`false` según resultado. La inscripción se guarda igual aunque el correo falle.
- Admin → tab Inscripciones: columna **"Correo"** (Enviado / Pendiente·Reenviar por fila),
  filtro **"solo correo pendiente"** y botón **"Reenviar correos pendientes"** (lote).
- Uso: si se topa el límite diario de Resend, al día siguiente se reenvían los pendientes desde el Admin.

### Mapa de Costa Rica por provincia (Admin → tab Cantones)
- Componente `MapaProvincias.tsx`: contornos reales de las 7 provincias (SVG dominio público),
  choropleth en tonos del amarillo dorado **#FFC20D**. Sin dependencias externas.
- Filtro por provincia (clic en el mapa o desplegable) que filtra el detalle de cantones.

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
| — | **Sesión sept:** links de Tilopay verificados (68) y nombres Kids alineados (Niños C/D) |
| — | Validación de inscripción duplicada: La Copa por cédula+evento+categoría; Kids por cédula+evento |
| — | Cyclocross desactivado para esta fecha (comentado, fácil de reactivar) |
| — | Cupos Copa Kids (máx 150) con leyenda en home/landing/inscritos/formulario (texto rojo) |
| — | Filtro "solo requieren factura" en Admin; cuadro grande de total en `/inscritos/lista` |
| — | Mapa real de CR por provincia (color #FFC20D) + filtro de cantones por provincia |
| — | Marcado y reenvío de correos (columna `email_enviado`, botón individual + lote en Admin) |
| — | Control de abrir/cerrar inscripciones por evento (manual + fecha) — tabla `config_inscripciones` |
| — | Fix: cierre no persistía por RLS activo → upsert + RLS deshabilitado; home respeta el cierre |
| — | Fix gramática "Queda 1 cupo" (singular) |

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

4. **Página de jueces (read-only):** ✅ existe y validada (`/jueces`).

5. **Nota Supabase (plan gratuito):** el proyecto se **pausa por inactividad** (~7 días) y el
   subdominio deja de resolver DNS → los formularios dan "Failed to fetch". Ya pasó una vez y
   el usuario lo reactivó. Antes del evento, verificar que esté activo (o considerar plan Pro
   / un keep-alive para que no se pause).

6. **🔒 ACTIVAR RLS EN SUPABASE — PENDIENTE PARA LA SEMANA DESPUÉS DEL EVENTO (Opción 1).**
   Supabase envió alertas de seguridad ("Table publicly accessible", `rls_disabled_in_public`):
   con RLS desactivado, cualquiera con la URL + anon key podría leer/editar/borrar los datos
   (incluye datos personales y de MENORES en Copa Kids).
   - **Decisión acordada (6 sept):** NO tocar la seguridad antes/durante el evento del 12-13 sept
     (hay inscripciones activas; un error de política rompería el formulario). El aviso NO bloquea nada.
   - **La otra semana:** dedicar una sesión a activar RLS con políticas que permitan:
     (a) INSERT de inscripciones desde el navegador (formulario sigue funcionando),
     (b) controlar lectura/edición/borrado del Admin y listas (que también leen con anon key).
     Probar todo con calma para no romper nada.

## 8.b Estado FUNCIONANDO (a 6 sept 2026 — evento este fin de semana)
- Formularios Copa y Kids funcionando y separados.
- Pago con Tilopay (links por categoría-evento) integrado; tras pago exitoso vuelve a `/pago-exitoso`.
- Sinpe: número + comprobante obligatorio. Efectivo y Tarjeta disponibles.
- Factura electrónica (captura de datos) funcionando en ambos formularios.
- Validación de duplicados activa (Copa: cédula+evento+categoría; Kids: cédula+evento).
- Cupos Copa Kids (máx 150) con leyenda y cierre automático.
- Control de abrir/cerrar inscripciones por evento (manual + fecha) FUNCIONANDO y persistiendo.
- Marcado + reenvío de correos desde Admin (por límite de Resend).
- Panel Admin: filtros (evento + categoría + factura), resumen, cantones (con mapa CR), edición,
  dorsales CSV, eliminar, control de cierre, reenvío de correos.
- Página de jueces (read-only) validada.
- Cyclocross desactivado esta fecha.
- Fecha del evento: **VI Fecha Orosi · 12 y 13 Setiembre**.

---

## 9. Notas de entorno

- El usuario trabaja **solo desde el navegador**. No suponer que puede correr comandos ni ver la terminal.
- Las operaciones de BD van por el navegador (`inscripcion-client.ts`); solo email por API route.
- Push a `main` = deploy automático en Cloudflare.
