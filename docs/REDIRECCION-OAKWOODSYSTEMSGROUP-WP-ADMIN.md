# Redirigir oakwoodsystemsgroup.com a oakwoodsys.com (manteniendo acceso a wp-admin)

**Objetivo:** Que los visitantes de oakwoodsystemsgroup.com vean oakwoodsys.com, pero poder acceder a `https://oakwoodsystemsgroup.com/wp-admin/` para administrar WordPress.

---

## Por qué NO usar el redireccionamiento de dominio de GoDaddy

Si activas **Domain Forwarding** en GoDaddy para oakwoodsystemsgroup.com → oakwoodsys.com, **todo** el tráfico se redirige, incluido `/wp-admin/`. No hay forma de excluir rutas en GoDaddy.

---

## Solución: Redirección desde el servidor WordPress (.htaccess)

Mantén oakwoodsystemsgroup.com apuntando al servidor WordPress. La redirección se hace **dentro del servidor**, excluyendo las rutas que necesitas para WordPress.

### Paso 1: Mantener DNS de oakwoodsystemsgroup.com

En **GoDaddy** → **oakwoodsystemsgroup.com** → **Administrar DNS**:

- **A** @ → `160.153.0.191` (IP del servidor WordPress)
- **CNAME** www → según lo que indique GoDaddy para el sitio

**No** actives "Domain Forwarding" ni redirección de dominio.

---

### Paso 2: Editar .htaccess en el servidor WordPress

Accede por **SFTP** al servidor de WordPress (credenciales en WORDPRESS-ACCESO-WP-SUBDOMINIO.md).

1. Localiza el archivo `.htaccess` en la raíz del sitio (carpeta `html`, `public_html` o similar).
2. **Haz backup** del archivo antes de editarlo.
3. Añade estas reglas **al inicio** del archivo (antes de las reglas de WordPress):

```apache
# Redirigir todo a oakwoodsys.com EXCEPTO wp-admin, wp-login, wp-content, graphql, wp-json
RewriteEngine On
RewriteBase /

# No redirigir si ya es una redirección interna
RewriteCond %{ENV:REDIRECT_STATUS} ^$
# Excluir rutas necesarias para WordPress
RewriteCond %{REQUEST_URI} !^/wp-admin [NC]
RewriteCond %{REQUEST_URI} !^/wp-login\.php [NC]
RewriteCond %{REQUEST_URI} !^/wp-content [NC]
RewriteCond %{REQUEST_URI} !^/wp-includes [NC]
RewriteCond %{REQUEST_URI} !^/graphql [NC]
RewriteCond %{REQUEST_URI} !^/wp-json [NC]
# Redirigir el resto a oakwoodsys.com
RewriteRule ^(.*)$ https://oakwoodsys.com/ [R=301,L]
```

4. Guarda y sube el archivo por SFTP.

---

### Paso 3: Verificar

| URL | Resultado esperado |
|-----|--------------------|
| https://oakwoodsystemsgroup.com/ | Redirige a https://oakwoodsys.com |
| https://oakwoodsystemsgroup.com/cualquier-pagina/ | Redirige a https://oakwoodsys.com |
| https://oakwoodsystemsgroup.com/wp-admin/ | Muestra el panel de WordPress |
| https://oakwoodsystemsgroup.com/wp-login.php | Muestra el login de WordPress |
| https://oakwoodsystemsgroup.com/graphql | Sigue funcionando (API para el sitio Angular) |

---

## Si no funciona: verificar sitio correcto

**Importante:** Si tienes **dos instalaciones WordPress** en GoDaddy (una por dominio), debes editar el `.htaccess` del sitio que sirve **oakwoodsystemsgroup.com**, no el de oakwoodsys.com.

1. En GoDaddy → **Managed Hosting for WordPress** → **Administrar todo**
2. Selecciona el sitio **oakwoodsystemsgroup.com** (no oakwoodsys.com)
3. Obtén las credenciales SFTP de **ese** sitio
4. Conéctate con Cyberduck y verifica que estés en la raíz del sitio de oakwoodsystemsgroup.com (deberías ver el contenido de ese WordPress)

## Si usas servidor LiteSpeed (GoDaddy Managed WordPress)

1. **Purgar caché LiteSpeed:** En wp-admin → LiteSpeed Cache → Purge All (o similar)
2. Las reglas de redirección deben estar **al inicio** del .htaccess (antes de LSCACHE)
3. Si tienes acceso a **cPanel** o **Administrador de archivos** de GoDaddy, edita desde ahí.
4. Contacta a soporte de GoDaddy y pide que verifiquen que mod_rewrite está activo.

---

## Alternativa: Subdominio solo para wp-admin

Si no puedes editar `.htaccess` o las reglas no funcionan:

1. Crea un subdominio **wp.oakwoodsystemsgroup.com** en GoDaddy:
   - **A** `wp` → `160.153.0.191`

2. Activa **Domain Forwarding** en oakwoodsystemsgroup.com → oakwoodsys.com (todo el dominio se redirige).

3. Accede a WordPress en: **https://wp.oakwoodsystemsgroup.com/wp-admin/**

4. En `wp-config.php` del servidor WordPress, añade:
   ```php
   define('WP_HOME', 'https://wp.oakwoodsystemsgroup.com');
   define('WP_SITEURL', 'https://wp.oakwoodsystemsgroup.com');
   ```

**Nota:** Con esta alternativa, el GraphQL y las imágenes que usan oakwoodsystemsgroup.com dejarían de funcionar a menos que configures el sitio Angular para usar wp.oakwoodsystemsgroup.com como CMS. La opción con .htaccess es preferible.

---

## Resumen

| Acción | Dónde |
|--------|-------|
| Mantener DNS A @ → 160.153.0.191 | GoDaddy (oakwoodsystemsgroup.com) |
| Añadir reglas de redirección excluyendo /wp-admin/ | .htaccess en servidor WordPress |
| Probar | https://oakwoodsystemsgroup.com/ y https://oakwoodsystemsgroup.com/wp-admin/ |
