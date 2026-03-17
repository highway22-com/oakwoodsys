# Configuración de WordPress (CMS)

La aplicación Angular depende de WordPress para:

- **GraphQL** – contenido CMS, blog, case studies
- **Formulario de contacto** – envío de emails (requiere [configuración SMTP](WORDPRESS-SMTP-CONFIGURACION.md) en GoDaddy)
- **Medios** – videos e imágenes en `wp-content/uploads`

## Arquitectura: oakwoodsys.com en Netlify + wp-admin

| Servicio | URL | Hosting |
|----------|-----|---------|
| Angular (frontend) | https://oakwoodsys.com | Netlify |
| WordPress (backend) | https://rest.oakwoodsys.com | GoDaddy Managed WordPress |

**Flujo:**
- `oakwoodsys.com` → Netlify (Angular). DNS: A record → 75.2.60.5
- `rest.oakwoodsys.com` → GoDaddy (WordPress). DNS: CNAME o A según GoDaddy
- Netlify hace proxy de `/wp-admin`, `/graphql`, `/wp-json`, `/wp-content` a `rest.oakwoodsys.com`

---

## Guía detallada paso a paso (para principiantes)

### Paso 1: Añadir rest.oakwoodsys.com en Managed WordPress

**¿Qué hacemos?** Le decimos a GoDaddy que `rest.oakwoodsys.com` debe mostrar el mismo WordPress que `oakwoodsys.com`.

1. **Entra a GoDaddy**  
   - Ve a [godaddy.com](https://www.godaddy.com) e inicia sesión.

2. **Abre tu panel de productos**  
   - Haz clic en tu nombre (arriba a la derecha) → **Mis productos**  
   - O ve directo a: [account.godaddy.com/products](https://account.godaddy.com/products)

3. **Localiza Managed Hosting for WordPress**  
   - En la lista busca **Managed Hosting for WordPress** o **Hosting administrado para WordPress**.  
   - Haz clic en **Administrar todo** (o **Manage All**).

4. **Selecciona tu sitio**  
   - Verás tu sitio (por ejemplo, oakwoodsys.com).  
   - Haz clic en los **tres puntos** (⋮) o en **Configuración** junto al sitio.

5. **Busca la sección de dominios**  
   - Busca **Dominios**, **Domain Settings** o **Dominio del sitio**.  
   - Si no lo ves, prueba **Configuración** → **Dominios** o **Cambiar dominio**.

6. **Añade el subdominio**  
   - Haz clic en **Agregar** o **Add domain** / **Nuevo dominio adicional**.  
   - Escribe: `rest.oakwoodsys.com` (solo el subdominio, sin `https://`).  
   - Confirma con **Continuar** o **Agregar**.

7. **Anota las instrucciones de DNS**  
   - GoDaddy te dirá qué registro crear (CNAME o A) y qué valor usar.  
   - Si no aparece nada, pasa al Paso 2 y usa el CNAME que indicamos.

**Importante:** La **Cartera de dominios** (donde ves oakwoodsys.com, myoakwoodsys.com, etc.) es solo para gestionar dominios y DNS. Para añadir rest.oakwoodsys.com al sitio WordPress debes ir a **Sitio web** → **Managed Hosting for WordPress** → **Administrar todo** → tu sitio → **Configuración**. Son secciones distintas.

**Si no encuentras Managed WordPress:** Si en **Mis productos** o **Sitio web** no ves "Managed Hosting for WordPress", es posible que tu WordPress esté en otro tipo de plan (p. ej. Airo, Websites + Marketing). En ese caso, puedes saltar el Paso 1 y hacer solo el Paso 2 (DNS): crea un CNAME `wp` → `oakwoodsys.com` para que rest.oakwoodsys.com use el mismo servidor que oakwoodsys.com.

---

### Cómo añadir rest.oakwoodsys.com solo con DNS (sin Managed WordPress)

**Importante:** Si `oakwoodsys.com` ya apunta a Netlify (75.2.60.5), **no uses CNAME wp → oakwoodsys.com**. Eso haría que wp también apunte a Netlify y provoque un bucle (error 502).

Debes apuntar `wp` **directamente al servidor de WordPress** (GoDaddy) con un registro **A**:

1. **Cartera de dominios** → haz clic en **oakwoodsys.com**
2. Haz clic en **DNS** (o **Administrar DNS**)
3. **Elimina** el registro CNAME de `rest` si lo creaste antes
4. **Agregar nuevo registro** → elige **A** (no CNAME):
   - **Tipo:** A
   - **Nombre:** `rest`
   - **Valor:** IP de tu servidor WordPress (ej: `160.153.0.191`)
   - **TTL:** 600 segundos
5. Haz clic en **Guardar** o **Save**

**¿Cuál es la IP correcta?** Es la IP del servidor donde está WordPress. Si antes tenías `@` → `160.153.0.191` cuando oakwoodsys.com mostraba WordPress, usa esa misma IP. También puede estar en el email de bienvenida de GoDaddy o en el panel de hosting.

---

### Paso 2: Configurar DNS en GoDaddy

**¿Qué hacemos?** Conectamos cada dominio con el servicio correcto (Netlify o WordPress).

1. **Abre la gestión de DNS**  
   - **Mis productos** → **Dominios** → haz clic en **oakwoodsys.com**  
   - Haz clic en **Administrar DNS** o **DNS**.

2. **Configura oakwoodsys.com para Netlify (Angular)**  

   - **Registro A para la raíz (@):**
     - **Tipo:** A  
     - **Nombre:** `@` (o deja vacío si así lo indica)  
     - **Valor:** `75.2.60.5`  
     - **TTL:** 600 (o 1 hora)  
     - Guarda.

   - **Registro CNAME para www:**
     - **Tipo:** CNAME  
     - **Nombre:** `www`  
     - **Valor:** `oakwoodsys.netlify.app`  
     - **TTL:** 600  
     - Guarda.

3. **Configura rest.oakwoodsys.com para WordPress**  

   Usa la **IP** que obtengas en la sección siguiente (recomendado: registro A):

   - **Tipo:** A  
   - **Nombre:** `rest`  
   - **Valor:** la IP de tu WordPress (ver abajo cómo obtenerla)  
   - Guarda.

   **No uses** CNAME wp → oakwoodsys.com si oakwoodsys.com apunta a Netlify (provoca error 502).

4. **Espera la propagación**  
   - Los cambios pueden tardar entre 15 minutos y 48 horas.  
   - Puedes comprobar en [dnschecker.org](https://dnschecker.org).

---

### Cómo encontrar la IP de tu WordPress en GoDaddy

Necesitas la IP del servidor donde está tu WordPress para el registro A de `rest`. Pasos:

1. **Entra a GoDaddy** → [account.godaddy.com/products](https://account.godaddy.com/products)
2. Busca **Managed Hosting for WordPress** → haz clic en **Administrar todo** (Manage All)
3. Selecciona tu sitio (oakwoodsys.com) → haz clic en **Configuración** (Settings)
4. En la pestaña **Configuración**, busca la sección **Production Site** o **Sitio en producción**
5. Haz clic en **Show more** / **Mostrar más**
6. Verás la **dirección IP** (ej: `160.153.0.191`) → haz clic en **Copy** para copiarla

**Si no ves Managed Hosting for WordPress:** Tu WordPress puede estar en otro plan (Airo, etc.). En ese caso:
- Revisa el **email de bienvenida** de GoDaddy cuando contrataste el hosting
- O contacta a **soporte de GoDaddy** y pide la IP del servidor donde está tu sitio oakwoodsys.com
- O prueba temporalmente: cambia el A de `@` a `160.153.0.191`, verifica si WordPress carga en oakwoodsys.com; si sí, esa es la IP correcta para `wp`

---

### Paso 3: Editar wp-config.php en WordPress

**¿Qué hacemos?** Le decimos a WordPress que la URL pública es la de Netlify y que los archivos viven en rest.oakwoodsys.com.

1. **Abre el Administrador de archivos**  
   - **Managed Hosting for WordPress** → **Administrar todo**  
   - Selecciona tu sitio → **Configuración**  
   - En **Herramientas**, busca **Navegador de archivos** o **File Manager**  
   - Haz clic en **Abrir**.

2. **Localiza wp-config.php**  
   - En la raíz del sitio (carpeta principal) verás `wp-config.php`.  
   - Haz clic en el archivo → **Editar** (o ícono de lápiz).

3. **Añade las líneas antes de "That's all, stop editing!"**  
   - Busca la línea que dice: `/* That's all, stop editing! Happy publishing. */`  
   - **Justo antes** de esa línea, añade:

   ```php
   define('WP_HOME', 'https://oakwoodsys.com');
   define('WP_SITEURL', 'https://rest.oakwoodsys.com');
   ```

4. **Guarda el archivo**  
   - Haz clic en **Guardar** o **Save changes**.

**Importante:**  
- `WP_HOME` = URL que ven los visitantes (la de Netlify).  
- `WP_SITEURL` = URL donde WordPress sirve los archivos (rest.oakwoodsys.com).

---

### Paso 4: Verificar CORS

El plugin `oakwood-cors-config` ya incluye `https://oakwoodsys.com`. Si no lo ves, añádelo en la lista de dominios permitidos del plugin.

---

### Resumen de cambios

| Paso | Dónde | Qué hacer |
|------|-------|-----------|
| 1 | Managed WordPress | Añadir `rest.oakwoodsys.com` como dominio |
| 2 | DNS de oakwoodsys.com | A @ → 75.2.60.5, www → oakwoodsys.netlify.app, wp → CNAME o A |
| 3 | wp-config.php | Añadir WP_HOME y WP_SITEURL |
| 4 | Plugin CORS | Comprobar que oakwoodsys.com esté permitido |

### Orden recomendado

1. **Primero** completa el Paso 1 (añadir rest.oakwoodsys.com) y el Paso 2 (registro DNS de `wp`).
2. **Después** cambia el registro A de `@` a 75.2.60.5.  
   Si lo cambias antes, perderás acceso a WordPress en oakwoodsys.com hasta que rest.oakwoodsys.com esté configurado.
3. **Por último** edita wp-config.php (Paso 3).

## Pasos para configurar WordPress

### 1. Crear subdominio en GoDaddy

1. En **Mis productos** → **Dominios** → **oakwoodsys.com** → **Administrar DNS**
2. Añade un registro **A** (si WordPress está en tu propio servidor):
   - **Nombre:** `cms`
   - **Valor:** IP de tu servidor WordPress (ej: `160.153.0.191` si es tu hosting)
   - **TTL:** 600 segundos

   O un registro **CNAME** (si WordPress está en un servicio externo):
   - **Nombre:** `cms`
   - **Valor:** hostname que te da el proveedor (ej: `tu-sitio.wordpress.com` o `sitiowp.secureserver.net`)

**Nota:** Usa **A** cuando tengas una IP fija de tu servidor. Usa **CNAME** cuando el proveedor te dé un hostname.

### 2. Añadir subdominio en el panel de hosting (paso extra)

GoDaddy tiene distintos tipos de hosting. Elige según lo que tengas:

---

#### Opción A: Web Hosting con cPanel

1. **Sitio web** → tu plan de hosting → **Administrar**
2. Haz clic en **cPanel** (o **Administrar cPanel**)
3. En cPanel → **Dominios** → **Subdominios**
4. Subdominio: `cms` | Dominio: `oakwoodsys.com` | Document Root: `public_html/cms`
5. **Crear**

---

#### Opción B: Managed WordPress (sin cPanel)

Managed WordPress no usa cPanel. Para añadir `cms.oakwoodsys.com`:

1. **Sitio web** → **Managed Hosting for WordPress** → **Administrar todo** (Manage All)
2. Busca **Añadir sitio** o **Add Site**
3. Crea un sitio nuevo y asigna el dominio `cms.oakwoodsys.com`
4. GoDaddy instalará WordPress en ese subdominio

Si no ves "Añadir sitio", puede que tengas que comprar sitios adicionales en tu plan.

---

#### Opción C: No tienes cPanel ni Managed WordPress

Si solo tienes **dominio** y el sitio está en otro proveedor (p. ej. Netlify):

- El subdominio se configura solo con DNS (registro A o CNAME).
- Para que `cms.oakwoodsys.com` sirva WordPress, necesitas un hosting que lo soporte (Web Hosting o Managed WordPress en GoDaddy, o un hosting externo).

---

#### Opción D: Usar el dominio principal (oakwoodsys.com)

Si ya tienes WordPress en `oakwoodsys.com` y funciona:

- Puedes usar `oakwoodsys.com` como CMS y cambiar la configuración del proyecto para apuntar ahí en lugar de `cms.oakwoodsys.com`.

### 3. Instalar WordPress

1. Instala WordPress en la carpeta del subdominio `cms.oakwoodsys.com`
2. En `wp-config.php`, asegúrate de que:
   ```php
   define('WP_HOME', 'https://cms.oakwoodsys.com');
   define('WP_SITEURL', 'https://cms.oakwoodsys.com');
   ```

### 4. Instalar plugins necesarios

Copia los plugins de la carpeta `wordpress/` a `wp-content/plugins/`:

- `oakwood-bloq` – blog y case studies con GraphQL
- `oakwood-cms` – páginas CMS (home, services, etc.)
- `oakwood-contact` – formulario de contacto
- `oakwood-smtp` – configuración SMTP para wp_mail (ver [WORDPRESS-SMTP-CONFIGURACION.md](WORDPRESS-SMTP-CONFIGURACION.md))
- `oakwood-cors-config` – CORS para GraphQL
- `oakwood-people` – autores/personas

### 5. Instalar WPGraphQL

- Instala el plugin **WPGraphQL** desde el repositorio de WordPress
- Activa todos los plugins

### 6. Configurar SSL

Asegúrate de que `cms.oakwoodsys.com` tenga certificado HTTPS válido (Let's Encrypt, etc.).

### 7. Si usas otra URL para WordPress

Si WordPress está en otra URL (ej: `rest.oakwoodsys.com` o un dominio externo):

1. Edita `src/app/config/cms.config.ts`:
   ```ts
   export const CMS_BASE_URL = 'https://tu-url-wordpress.com';
   ```

2. Edita `netlify.toml` y cambia las URLs en los redirects de `/api/graphql`, `/api/contact`, `/api/contact-fields`

3. Edita `proxy.conf.json` para desarrollo local

4. Actualiza el plugin `oakwood-cors-config` para permitir `https://oakwoodsys.com` como origen

---

## Solución de problemas

### Error HTTP 502 — Unable to Connect to the Origin Server

Este error suele indicar que el DNS apunta al servidor pero algo falla en la conexión. Revisa en este orden:

#### 1. ¿Creaste el subdominio en el panel de hosting?

El registro A en DNS solo apunta `cms.oakwoodsys.com` a la IP. **Debes crear el subdominio** en el panel de hosting de GoDaddy:

- **Mi cuenta** → **Web Hosting** → **Administrar** → **cPanel** (o Plesk)
- **Subdominios** → **Crear subdominio**
- Nombre: `cms` | Dominio: `oakwoodsys.com`
- Carpeta: `public_html/cms` (o similar)

#### 2. ¿WordPress está instalado en esa carpeta?

Si la carpeta del subdominio está vacía o no tiene WordPress, el servidor puede devolver 502. Instala WordPress en la carpeta asignada al subdominio.

#### 3. ¿La IP del registro A es correcta?

- Si usas **hosting compartido de GoDaddy**, la IP suele ser la del servidor compartido (no siempre 160.153.0.191).
- En **cPanel** → **Información general** o en el email de bienvenida de GoDaddy verás la IP correcta.
- El registro A de `cms` debe usar **esa misma IP** que usa `oakwoodsys.com` (o la que te indique GoDaddy para tu cuenta).

#### 4. Alternativa: usar CNAME en lugar de A

Si tienes WordPress en **hosting de GoDaddy** para el mismo dominio:

1. Elimina el registro A de `cms`.
2. Crea un **CNAME**: Nombre `cms`, Valor `oakwoodsys.com` (o el hostname que te dé GoDaddy para tu sitio).

Así `cms.oakwoodsys.com` usará la misma configuración que el dominio principal.

#### 5. Esperar propagación

Los cambios de DNS pueden tardar 15 minutos–48 horas. Prueba de nuevo más tarde o usa [dnschecker.org](https://dnschecker.org) para ver si ya se propagó.
