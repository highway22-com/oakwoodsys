# Cambiar dominio de WordPress a oakwoodsystemsgroup.com

**Situación:** Solo tienes un WordPress (no puedes crear otro). Quieres que WordPress use **oakwoodsystemsgroup.com** y **oakwoodsys.com** quede libre para Angular.

**Acceso:** SFTP (9dd.884.myftpupload.com) — ver credenciales en WORDPRESS-ACCESO-WP-SUBDOMINIO.md

---

## Opción 1: Cambiar dominio en GoDaddy (la más simple)

1. **GoDaddy** → **Managed WordPress** → **Administrar todo** → tu sitio
2. Busca **Dominio** o **Domain** o **Configuración del sitio**
3. Opción **Cambiar dominio** o **Add domain** / **Change primary domain**
4. Asigna **oakwoodsystemsgroup.com** como dominio principal del WordPress
5. GoDaddy puede guiarte con el DNS

Si esta opción existe, es la más directa.

---

## Opción 2: Cambiar dominio manualmente (con SFTP y phpMyAdmin)

### Paso 1: Backup

- **Base de datos:** GoDaddy → Managed WordPress → phpMyAdmin → Exportar
- **Archivos:** SFTP (FileZilla) → descarga wp-content completo

### Paso 2: DNS de oakwoodsystemsgroup.com

En **Dominios** → **oakwoodsystemsgroup.com** → **Administrar DNS**:

- **A** @ → `160.153.0.191` (la IP de tu WordPress actual)
- **CNAME** www → según lo que indique GoDaddy para el sitio

### Paso 3: Buscar y reemplazar en la base de datos

1. Abre el .sql exportado en un editor de texto
2. Buscar y reemplazar (con cuidado):
   - `oakwoodsys.com` → `oakwoodsystemsgroup.com`
   - `https://oakwoodsys.com` → `https://oakwoodsystemsgroup.com`
   - `http://oakwoodsys.com` → `https://oakwoodsystemsgroup.com`
3. En phpMyAdmin del mismo sitio, **importa** el .sql modificado (sobrescribe las tablas)

### Paso 4: wp-config.php vía SFTP

Edita `wp-config.php` y añade o modifica:

```php
define('WP_HOME', 'https://oakwoodsystemsgroup.com');
define('WP_SITEURL', 'https://oakwoodsystemsgroup.com');
```

Guarda y sube por SFTP.

### Paso 5: En GoDaddy

- Asocia **oakwoodsystemsgroup.com** al sitio WordPress (si no lo has hecho en el paso de DNS)
- En Managed WordPress, verifica que el dominio principal sea oakwoodsystemsgroup.com

---

## Después: oakwoodsys.com solo Angular

1. **netlify.toml:** Quitar todas las reglas de proxy a 160.153.0.191
2. **cms.config.ts:** `CMS_BASE_URL = 'https://oakwoodsystemsgroup.com'`
3. **DNS oakwoodsys.com:** A @ → 75.2.60.5 (Netlify) — sin proxy de WordPress

---

## Resumen

| Antes | Después |
|-------|---------|
| WordPress en oakwoodsys.com (o proxy) | WordPress en oakwoodsystemsgroup.com |
| oakwoodsys.com → Angular + proxy WP | oakwoodsys.com → solo Angular |
| CMS_BASE_URL = oakwoodsys.com | CMS_BASE_URL = oakwoodsystemsgroup.com |

---

## Si no puedes cambiar el dominio en GoDaddy

Contacta a **soporte de GoDaddy** y pide que cambien el dominio principal del sitio WordPress de oakwoodsys.com a oakwoodsystemsgroup.com. Ellos pueden hacerlo en el panel.
