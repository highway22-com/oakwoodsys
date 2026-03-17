# Propuesta C: Implementación

Todo en **oakwoodsys.com**. Sin subdominios. Netlify hace proxy directo a la IP de WordPress.

---

## Arquitectura

| URL | Destino |
|-----|---------|
| oakwoodsys.com | Netlify (Angular) |
| oakwoodsys.com/wp-admin, /graphql, /wp-json, /wp-content | Netlify proxy → 160.153.0.191 (WordPress) |

---

## Cambios ya aplicados en el código

- `netlify.toml` → proxy a `http://160.153.0.191`
- `cms.config.ts` → `https://oakwoodsys.com`
- Medios (videos, imágenes) → `oakwoodsys.com/wp-content/...`
- `proxy.conf.json` → desarrollo local apunta a la IP

---

## Pasos que debes hacer

### 1. DNS en GoDaddy

- **A** @ → `75.2.60.5` (Netlify)
- **CNAME** www → `oakwoodsys.netlify.app`

No hace falta registro para `rest` ni subdominios.

### 2. WordPress wp-config.php

En el servidor WordPress (por SFTP o Navegador de archivos), edita `wp-config.php` y añade:

```php
define('WP_HOME', 'https://oakwoodsys.com');
define('WP_SITEURL', 'https://oakwoodsys.com');
```

Guarda el archivo.

### 3. Desplegar en Netlify

Haz push de los cambios y espera a que Netlify termine el deploy.

### 4. Probar

- **Sitio Angular:** https://oakwoodsys.com
- **WordPress admin:** https://oakwoodsys.com/wp-admin/

---

## Si WordPress no responde bien al proxy

El servidor en 160.153.0.191 debe aceptar peticiones con `Host: oakwoodsys.com`. Si el sitio está configurado para ese dominio en GoDaddy, debería funcionar.

Si hay errores, comprueba en GoDaddy que oakwoodsys.com esté asignado al sitio WordPress (aunque el dominio apunte a Netlify para el público).
