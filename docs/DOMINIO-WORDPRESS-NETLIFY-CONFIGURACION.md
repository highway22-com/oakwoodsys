# Usar oakwoodsys.com para WordPress y Netlify

Guía completa para configurar el mismo dominio (oakwoodsys.com) con WordPress (GoDaddy) y el sitio Angular (Netlify).

---

## Restricción importante

**Un mismo dominio no puede apuntar a dos servidores distintos al mismo tiempo.** El DNS resuelve cada hostname a un solo destino. Hay que elegir cómo repartir el tráfico entre WordPress y Netlify.

---

## Información de referencia

| Servicio | IP / URL |
|----------|----------|
| Load balancer de Netlify | `75.2.60.5` |
| WordPress (GoDaddy) | `160.153.0.191` |
| URL del sitio en Netlify | `oakwoodsys.netlify.app` |

---

## Opción A: Raíz para WordPress, www para Netlify (la más simple)

**Idea:** Usar **oakwoodsys.com** para WordPress y **www.oakwoodsys.com** para Angular (Netlify).

| URL | Destino |
|-----|---------|
| oakwoodsys.com | WordPress (GoDaddy) |
| www.oakwoodsys.com | Angular (Netlify) |

### DNS en GoDaddy

| Tipo | Nombre/Host | Valor | TTL |
|------|-------------|-------|-----|
| A | @ | 160.153.0.191 | 1 hora |
| CNAME | www | oakwoodsys.netlify.app | 1 hora |

### Ventajas
- SSL en oakwoodsys.com (dominio principal)
- Configuración sencilla

### Desventajas
- La URL principal muestra WordPress; los visitantes de Angular usan www.oakwoodsys.com

---

## Opción B: Raíz para Netlify, www para WordPress

**Idea:** Angular en la raíz, WordPress en www.

| URL | Destino |
|-----|---------|
| oakwoodsys.com | Angular (Netlify) |
| www.oakwoodsys.com | WordPress (GoDaddy) |

### DNS en GoDaddy

| Tipo | Nombre/Host | Valor | TTL |
|------|-------------|-------|-----|
| A | @ | 75.2.60.5 | 1 hora |
| A | www | 160.153.0.191 | 1 hora |

### Configuración de WordPress

En `wp-config.php`:

```php
define('WP_HOME', 'https://www.oakwoodsys.com');
define('WP_SITEURL', 'https://www.oakwoodsys.com');
```

Actualizar `CMS_BASE_URL` en la app a `https://www.oakwoodsys.com`.

### Ventajas
- oakwoodsys.com muestra Angular
- WordPress en www.oakwoodsys.com con SSL (si GoDaddy lo ofrece)

### Desventajas
- wp-admin queda en www.oakwoodsys.com/wp-admin
- Hay que actualizar wp-config y la URL del CMS en la app

---

## Opción C: Una sola URL con proxy en Netlify (recomendada para experiencia unificada)

**Idea:** Todo el tráfico va a Netlify. Angular sirve el sitio principal; Netlify hace proxy de las rutas de WordPress al backend.

| URL | Destino |
|-----|---------|
| oakwoodsys.com | Netlify (Angular) |
| oakwoodsys.com/wp-admin | Proxy → WordPress |
| oakwoodsys.com/wp-json | Proxy → WordPress |
| oakwoodsys.com/graphql | Proxy → WordPress |
| oakwoodsys.com/wp-content | Proxy → WordPress |

### Paso 1: DNS en GoDaddy

| Tipo | Nombre/Host | Valor | TTL |
|------|-------------|-------|-----|
| A | @ | 75.2.60.5 | 1 hora |
| CNAME | www | oakwoodsys.netlify.app | 1 hora |

### Paso 2: Proxy en Netlify (netlify.toml)

Añadir redirects para hacer proxy de las rutas de WordPress:

```toml
# Proxy de WordPress - rutas al backend
[[redirects]]
  from = "/wp-admin/*"
  to = "https://160.153.0.191/:splat"
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

**Nota:** El proxy de Netlify usa `to` con URLs completas. Si la IP cambia, hay que actualizar estos redirects.

### Paso 3: WordPress (wp-config.php)

```php
define('WP_HOME', 'https://oakwoodsys.com');
define('WP_SITEURL', 'https://oakwoodsys.com');
```

### Ventajas
- Una sola URL para los visitantes
- SSL de Netlify para todo
- Sin división por subdominios

### Desventajas
- Hay que configurar el proxy
- Si la IP de WordPress cambia, hay que actualizar los redirects

---

## Opción D: Subdominio con Cloudflare

**Idea:** Mantener un subdominio (ej. rest.oakwoodsys.com) para WordPress con SSL de Cloudflare.

### Requisitos

1. Apuntar los nameservers de oakwoodsys.com a Cloudflare
2. En Cloudflare DNS: registro A `rest` → `160.153.0.191` (Proxied)
3. WordPress y la app usan `https://rest.oakwoodsys.com`

### Ventajas
- SSL para el subdominio vía Cloudflare

### Desventajas
- Requiere Cloudflare
- Los nameservers deben estar bien configurados

---

## Opción E: Puerto o ruta alternativa (no recomendada)

Usar algo como oakwoodsys.com:8080 o una ruta especial. Suele dar más problemas que ventajas; no se recomienda.

---

## Añadir dominio en Netlify

1. Entra en [app.netlify.com](https://app.netlify.com)
2. Selecciona tu sitio
3. **Domain management** / **Administración de dominios** → **Add custom domain**
4. Escribe oakwoodsys.com (o www.oakwoodsys.com)
5. Verifica y anota la URL de Netlify (ej. oakwoodsys.netlify.app)

---

## Gestionar DNS en GoDaddy

1. Inicia sesión en [godaddy.com](https://www.godaddy.com)
2. **Mis Productos** → localiza oakwoodsys.com
3. Tres puntos (⋮) → **Administrar DNS**
4. Añade o edita registros en la sección **Registros**

---

## Propagación DNS

- Típico: 15 minutos – 2 horas
- Máximo: hasta 48 horas

### Comprobar propagación

```bash
# Raíz (debe devolver 75.2.60.5 o 160.153.0.191 según la opción)
dig oakwoodsys.com A +short

# www (debe devolver CNAME de Netlify o IP de WordPress)
dig www.oakwoodsys.com CNAME +short
```

O usa [dnschecker.org](https://dnschecker.org) para ver la propagación global.

---

## Solución de problemas

### El dominio no verifica en Netlify

- Espera hasta 48 h tras los cambios DNS
- Comprueba que el registro A de `@` apunte a la IP correcta
- Elimina registros A o AAAA duplicados para `@`

### Error de certificado SSL

- Netlify puede tardar hasta 24 h en emitir el certificado
- Asegúrate de tener solo un registro A para `@` apuntando al servidor correcto

### www no redirige al dominio raíz

- Netlify → **Domain management** → **Domain settings**
- Activa **Redirects** para que www redirija a la versión sin www (o al revés)

### El proxy no funciona (Opción C)

- Confirma que la IP de WordPress es correcta
- Verifica que `WP_HOME` y `WP_SITEURL` coincidan con oakwoodsys.com
- Comprueba que los redirects de Netlify usen `status = 200` para el proxy

---

## Resumen de recomendaciones

| Si prefieres… | Usa |
|---------------|-----|
| Máxima simplicidad | **Opción A** o **B** |
| Una sola URL para visitantes | **Opción C** (proxy) |
| Subdominio con SSL | **Opción D** (Cloudflare) |

---

## Documentación relacionada

- `NETLIFY-GODADDY-DOMINIO.md` – Configuración DNS Netlify + GoDaddy
- `WORDPRESS-ALTERNATIVAS.md` – Alternativas originales
- `MIGRAR-WORDPRESS-A-OAKWOODSYSTEMSGROUP.md` – Migrar WordPress a otro dominio
