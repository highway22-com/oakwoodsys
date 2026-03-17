# Acceder a WordPress en rest.oakwoodsys.com

Guía para configurar el subdominio `rest.oakwoodsys.com` y acceder al panel de WordPress usando la IP del servidor.

---

## Objetivo

Poder acceder a WordPress en: **<https://rest.oakwoodsys.com/wp-admin/>**

**IP del servidor WordPress:** `160.153.0.191`

---

## Paso 1: Crear el registro DNS

1. Entra a [GoDaddy](https://www.godaddy.com) e inicia sesión.
2. **Cartera de dominios** → haz clic en **oakwoodsys.com**.
3. Haz clic en **DNS** (o **Administrar DNS**).
4. Haz clic en **Agregar** o **Agregar nuevo registro**.
5. Completa:

| Campo   | Valor            |
|---------|------------------|
| **Tipo** | A               |
| **Nombre** | `rest`       |
| **Valor** | `160.153.0.191` |
| **TTL** | 600 segundos     |

1. Haz clic en **Guardar**.

---

## Paso 2: Esperar propagación

Los cambios de DNS pueden tardar entre **15 minutos y 48 horas**.

Puedes comprobar el estado en: [dnschecker.org](https://dnschecker.org) (introduce `rest.oakwoodsys.com`).

---

## Paso 3: Probar el acceso

Cuando el DNS haya propagado, abre en el navegador:

**<https://rest.oakwoodsys.com/wp-admin/>**

Deberías ver la pantalla de inicio de sesión de WordPress.

---

## Conectarse por SFTP (FileZilla)

Para subir archivos o editar `wp-config.php` por SFTP:

1. **Obtener credenciales en GoDaddy** (no están en WordPress, sino en el panel de hosting)

   - Entra a [account.godaddy.com/products](https://account.godaddy.com/products)
   - Busca **Managed Hosting for WordPress** → **Administrar todo**
   - Selecciona tu sitio (oakwoodsys.com) → menú de tres puntos (⋮) o **Configuración**
   - En la pestaña **Configuración**, baja hasta **Production Site** / **Sitio en producción**
   - Haz clic en **Show more** / **Mostrar más**
   - Verás **SSH/SFTP login** con el Host (ej: `oakwoodsys.com` o `sftp.secureserver.net`)
   - Haz clic en **Change** / **Cambiar**
   - **Host:** copia el valor que aparece (úsalo en FileZilla)
   - Haz clic en **Create new login** / **Crear nuevo inicio de sesión**
   - Se generarán usuario y contraseña nuevos → **cópialos de inmediato** (la contraseña no se vuelve a mostrar)
   - Guárdalos en un lugar seguro

2. **Configurar FileZilla**
   - Descarga [FileZilla](https://filezilla-project.org/) si no lo tienes
   - Archivo → Gestor de sitios → Nuevo sitio
   - **Host:** el Host que copiaste (o `rest.oakwoodsys.com` si el DNS ya propagó, o `160.153.0.191`)
   - 9dd.884.myftpupload.com
   - client_a459e9719e_977252
   - Xkf4l8ZrSEbybF
   - **Protocolo:** SFTP - SSH File Transfer Protocol
   - **Puerto:** 22
   - **Tipo de inicio de sesión:** Normal
   - **Usuario** y **Contraseña:** los que copiaste
   - Conectar

3. **Primera conexión**
   - Aparecerá "Clave de host desconocida" → verifica que el Host sea correcto → Aceptar

**Importante:** Las credenciales SFTP **no están en WordPress** (wp-admin). Son del hosting y solo se ven en el panel de GoDaddy (Managed Hosting for WordPress).

**Si no ves Managed Hosting for WordPress:** Tu plan puede ser distinto (Airo, etc.). En ese caso:

- Usa el **Navegador de archivos** en GoDaddy (si está disponible)
- O contacta a **soporte de GoDaddy** y pide las credenciales SFTP para tu sitio

---

## Si no funciona

### Error 502 o no carga

- Comprueba que el registro A esté bien: **Nombre** `rest`, **Valor** `160.153.0.191`.
- Espera más tiempo (hasta 48 h).
- Prueba en modo incógnito o en otro dispositivo.

### Error de certificado SSL (ERR_SSL_VERSION_OR_CIPHER_MISMATCH)

GoDaddy Managed WordPress **no incluye SSL para subdominios adicionales**. El certificado suele cubrir solo el dominio principal (oakwoodsys.com).

**Solución inmediata:** Usa **HTTP** en lugar de HTTPS:

- **<http://rest.oakwoodsys.com/wp-admin/>** (sin `s` en http)
- **<http://rest.oakwoodsys.com/wp-login.php>**

Actualiza `wp-config.php` para usar HTTP temporalmente:

```php
define('WP_HOME', 'http://rest.oakwoodsys.com');
define('WP_SITEURL', 'http://rest.oakwoodsys.com');
```

**Para tener HTTPS en rest.oakwoodsys.com:**

1. **Cloudflare (gratis):** Añade tu dominio a Cloudflare y activa el proxy. Cloudflare proporciona SSL automático.
2. **Certificado adicional en GoDaddy:** Contacta a soporte y pregunta por SSL para subdominios o certificado wildcard (*.oakwoodsys.com).
3. **Usar solo oakwoodsys.com:** Si el dominio principal tiene SSL, puedes acceder a WordPress en `oakwoodsys.com/wp-admin` cuando oakwoodsys.com apunte al servidor de WordPress (antes de cambiarlo a Netlify).

---

### Error 1001 de Cloudflare (DNS resolution error)

Si ves "DNS resolution error" en rest.oakwoodsys.com, falta el registro DNS del subdominio.

**Importante:** El registro se añade donde estén los **nameservers** de oakwoodsys.com:

- Si los nameservers apuntan a **Cloudflare** → añade el registro en Cloudflare
- Si los nameservers están en **GoDaddy** → añade el registro en GoDaddy

---

**En GoDaddy:**

1. **Cartera de dominios** → **oakwoodsys.com** → **DNS**
2. **Agregar** → **Agregar nuevo registro**
3. **Tipo:** A | **Nombre:** `rest` | **Valor:** `160.153.0.191` | **TTL:** 600
4. **Guardar**

---

**En Cloudflare** (si los nameservers están en Cloudflare):

1. [dash.cloudflare.com](https://dash.cloudflare.com) → sitio **oakwoodsys.com**
2. **DNS** → **Add record**
3. **Type:** A | **Name:** `rest` | **IPv4:** `160.153.0.191` | **Proxy:** Proxied (nube naranja)
4. **Save**

---

Espera 2–5 minutos. Luego prueba <https://rest.oakwoodsys.com/wp-admin/>

### Redirige a oakwoodsys.com después del login

Si al iniciar sesión te redirige a `oakwoodsys.com/wp-admin` en lugar de `rest.oakwoodsys.com/wp-admin`:

Actualiza `wp-config.php` para que **ambas** constantes usen `rest.oakwoodsys.com`:

```php
define('WP_HOME', 'https://rest.oakwoodsys.com');
define('WP_SITEURL', 'https://rest.oakwoodsys.com');
```

Guarda el archivo y borra la caché del navegador. Vuelve a iniciar sesión en <https://rest.oakwoodsys.com/wp-login.php>

---

### WordPress pide cambiar la URL

Si WordPress redirige o muestra errores de URL:

1. Accede por SFTP o al **Navegador de archivos** de GoDaddy.
2. Edita `wp-config.php` (en la raíz del sitio, carpeta `html` o similar).
3. Añade las líneas **antes** de `require_once ABSPATH . 'wp-settings.php';`:

```php
define('WP_HOME', 'https://rest.oakwoodsys.com');
define('WP_SITEURL', 'https://rest.oakwoodsys.com');
```

**En tu archivo** (GoDaddy Managed WordPress suele tener esta estructura):

```php
define('MWP_OBJECT_CACHE_DISABLED', true);

define('WP_HOME', 'https://rest.oakwoodsys.com');
define('WP_SITEURL', 'https://rest.oakwoodsys.com');

require_once ABSPATH . 'wp-settings.php';
```

1. Guarda el archivo.

---
backup

```php
<?php

/* That's all, stop editing! Happy publishing. */

if (!defined('ABSPATH')) {
    define('ABSPATH', dirname(__FILE__) . '/');

}
require_once __DIR__ . '/../configs/wp-config-hosting.php';

define('WP_CACHE', true);

define('WP2FA_ENCRYPT_KEY', 'N0h9fz1eaJzFx4VDU3TETw==');

define('MWP_OBJECT_CACHE_DISABLED', true);

require_once ABSPATH . 'wp-settings.php';

```

## Resumen

| Acción | Dónde | Valor |
|--------|-------|-------|
| Crear registro A | DNS de oakwoodsys.com | Nombre: `rest`, Valor: `160.153.0.191` |
| Probar | Navegador | <https://rest.oakwoodsys.com/wp-admin/> |
