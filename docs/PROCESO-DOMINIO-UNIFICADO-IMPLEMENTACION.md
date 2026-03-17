# Proceso: Implementar dominio unificado (oakwoodsys.com para WordPress + Netlify)

Guía paso a paso para aplicar la propuesta que mantiene **oakwoodsys.com** como único dominio para el sitio Angular (Netlify) y WordPress (backend en GoDaddy).

---

## Objetivo

| Antes | Después |
|-------|---------|
| oakwoodsys.com → solo Angular | oakwoodsys.com → Angular + WordPress |
| WordPress en oakwoodsystemsgroup.com | WordPress accesible vía oakwoodsys.com |
| API proxy a otro dominio | API en oakwoodsys.com/graphql, etc. |

**Resultado:** Los visitantes ven un solo dominio. Admin de WordPress en oakwoodsys.com/wp-admin. Sin subdominios.

---

## Información de referencia

| Concepto | Valor |
|----------|-------|
| IP load balancer Netlify | `75.2.60.5` |
| IP servidor WordPress | `160.153.0.191` |
| URL sitio Netlify | `oakwoodsys.netlify.app` |

---

## Lista de implementación

### Fase 1: Configuración DNS

- [ ] **1.1** Entrar en GoDaddy → Mis Productos → oakwoodsys.com → Administrar DNS
- [ ] **1.2** Crear o editar registro A:
  - Tipo: **A**
  - Nombre: **@**
  - Valor: **75.2.60.5**
  - TTL: 1 hora
- [ ] **1.3** Crear o editar registro CNAME:
  - Tipo: **CNAME**
  - Nombre: **www**
  - Valor: **oakwoodsys.netlify.app**
  - TTL: 1 hora
- [ ] **1.4** Eliminar registros conflictivos (otro A para @, AAAA para @)
- [ ] **1.5** Esperar propagación DNS (15 min – 48 h)

---

### Fase 2: Configuración en Netlify

- [ ] **2.1** Añadir oakwoodsys.com en Netlify → Domain management → Add custom domain
- [ ] **2.2** Verificar que el dominio aparezca como Verified en Netlify
- [ ] **2.3** Actualizar `netlify.toml` con los redirects de proxy a WordPress (ver abajo)
- [ ] **2.4** Desplegar en Netlify

---

### Fase 3: Configuración de WordPress

- [ ] **3.1** Conectarse por SFTP al servidor WordPress (ver WORDPRESS-ACCESO-WP-SUBDOMINIO.md)
- [ ] **3.2** Editar `wp-config.php` y añadir o modificar:

```php
define('WP_HOME', 'https://oakwoodsys.com');
define('WP_SITEURL', 'https://oakwoodsys.com');
```

- [ ] **3.3** Guardar y subir `wp-config.php`
- [ ] **3.4** En GoDaddy Managed WordPress: asegurarse de que oakwoodsys.com esté asignado al sitio (si el panel lo permite)

---

### Fase 4: Configuración de la aplicación

- [ ] **4.1** Actualizar `src/app/config/cms.config.ts`:

```typescript
export const CMS_BASE_URL = 'https://oakwoodsys.com';
```

- [ ] **4.2** Actualizar redirects en `netlify.toml`: cambiar destinos de proxy de oakwoodsystemsgroup.com a oakwoodsys.com o 160.153.0.191 (ver Fase 2)
- [ ] **4.3** Actualizar URLs hardcodeadas (oakwoodsystemsgroup.com → oakwoodsys.com) en JSON, plugins, etc.
- [ ] **4.4** Recompilar y desplegar

---

### Fase 5: Verificación

- [ ] **5.1** https://oakwoodsys.com → carga el sitio Angular
- [ ] **5.2** https://oakwoodsys.com/wp-admin/ → carga el admin de WordPress
- [ ] **5.3** https://oakwoodsys.com/graphql → responde el endpoint GraphQL
- [ ] **5.4** El formulario de contacto funciona (usa /wp-json/oakwood/v1/send-contact)
- [ ] **5.5** Imágenes y vídeos cargan desde oakwoodsys.com/wp-content/...
- [ ] **5.6** www.oakwoodsys.com redirige a oakwoodsys.com (si está configurado)

---

## netlify.toml – Redirects de proxy a WordPress

Añadir estos redirects **antes** del catch-all de la SPA (`/*` → `/index.html`). El orden importa.

```toml
# Proxy de WordPress – mismo dominio (oakwoodsys.com)
[[redirects]]
  from = "/wp-admin/*"
  to = "https://160.153.0.191/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/wp-login.php"
  to = "https://160.153.0.191/wp-login.php"
  status = 200
  force = true

[[redirects]]
  from = "/wp-json/*"
  to = "https://160.153.0.191/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/graphql"
  to = "https://160.153.0.191/graphql"
  status = 200
  force = true

[[redirects]]
  from = "/wp-content/*"
  to = "https://160.153.0.191/:splat"
  status = 200
  force = true
```

**Nota:** Si la IP cambia, actualizar estos redirects. Alternativamente, usar el dominio de WordPress (ej. oakwoodsystemsgroup.com) si apunta al mismo servidor y WordPress acepta oakwoodsys.com vía headers de proxy.

---

## Configuración de la API en la aplicación

Con `CMS_BASE_URL = 'https://oakwoodsys.com'`, la app llamará a:

- `https://oakwoodsys.com/graphql` (mismo origen, sin CORS)
- `https://oakwoodsys.com/wp-json/oakwood/v1/send-contact`
- `https://oakwoodsys.com/wp-json/oakwood/v1/contact-fields`
- `https://oakwoodsys.com/wp-content/...` para medios

El proxy `/api/graphql` en netlify.toml puede eliminarse si la app llama directamente a `/graphql` (mismo dominio).

---

## Solución de problemas

### WordPress devuelve 404 o sitio incorrecto

- El servidor en 160.153.0.191 debe aceptar peticiones con `Host: oakwoodsys.com`
- En GoDaddy Managed WordPress, añadir oakwoodsys.com como dominio del sitio
- Comprobar que `WP_HOME` y `WP_SITEURL` sean exactamente `https://oakwoodsys.com`

### El proxy no funciona

- Los redirects deben usar `status = 200` para el proxy (no 301/302)
- Verificar que los redirects de proxy a WordPress estén **antes** de la regla `/*` → `/index.html`
- Confirmar que la IP de WordPress es correcta

### Contenido mixto (HTTP/HTTPS)

- Asegurarse de que todas las URLs `to` del proxy usen `https://`
- WordPress debe forzar HTTPS en wp-config si hace falta

### Errores CORS

- Con el mismo dominio no debería haber problemas de CORS
- Si se usa otro dominio de backend, verificar que el plugin CORS de WordPress permita oakwoodsys.com

---

## Rollback

Si hay que revertir:

1. Volver a poner `CMS_BASE_URL` en `https://oakwoodsystemsgroup.com`
2. Quitar los redirects de proxy a WordPress de netlify.toml (mantener /api/graphql, /api/contact si se usan)
3. En wp-config.php, restaurar `WP_HOME` y `WP_SITEURL` a oakwoodsystemsgroup.com
4. Volver a desplegar

---

## Documentación relacionada

- `DOMAIN-WORDPRESS-NETLIFY-SETUP.md` – Todas las opciones de dominio (inglés)
- `DOMINIO-WORDPRESS-NETLIFY-CONFIGURACION.md` – Todas las opciones de dominio (español)
- `PROPUESTA-C-IMPLEMENTACION.md` – Propuesta C original
- `NETLIFY-GODADDY-DOMINIO.md` – DNS Netlify + GoDaddy
- `WORDPRESS-ACCESO-WP-SUBDOMINIO.md` – Acceso SFTP a WordPress
