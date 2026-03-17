# Capacidad de servidores para oakwoodsys.com en producción

Análisis de los recursos necesarios para alojar esta aplicación en producción, según su arquitectura actual.

---

## Resumen de la arquitectura actual

| Componente | Tecnología | Ubicación |
|------------|------------|-----------|
| **Frontend** | Angular 20 (prerenderizado) | Netlify CDN (estático) |
| **APIs** (GraphQL, contact) | Proxy/redirect | WordPress en oakwoodsystemsgroup.com |
| **Auth** | Serverless function | Netlify (si se usa) |
| **home-content** | Netlify Blobs / archivo estático | Netlify |
| **CMS** | WordPress + GraphQL | oakwoodsystemsgroup.com (externo) |

---

## Tamaño del build actual

| Carpeta | Tamaño | Uso |
|---------|--------|-----|
| `dist/oaw/browser` | **~49 MB** | Archivos estáticos (HTML, JS, CSS, assets) |
| `dist/oaw/server` | ~3.3 MB | Código del servidor (SSR, APIs) |
| **Total** | **~52 MB** | |

---

## Opción 1: Netlify (actual) — sin servidor propio

No necesitas servidor. Netlify gestiona todo:

| Recurso | Incluido en Netlify Free |
|---------|--------------------------|
| **Almacenamiento** | 100 GB bandwidth/mes |
| **Build** | 300 min/mes |
| **Funciones** | 125K invocaciones/mes |
| **Sitio estático** | ~49 MB en CDN |

**Recomendación:** Mantener Netlify. El plan gratuito suele cubrir un sitio corporativo con tráfico medio.

---

## Opción 2: VPS / servidor propio (ej. DigitalOcean, AWS, Azure)

Si quieres auto-hospedaje (sin Netlify):

### Caso A: Solo estático (sin SSR)

Sirves `dist/oaw/browser` con Nginx o Apache:

| Recurso | Mínimo | Recomendado |
|---------|--------|-------------|
| **CPU** | 1 vCPU | 1 vCPU |
| **RAM** | 512 MB | 1 GB |
| **Disco** | 1 GB | 2 GB |
| **Tráfico** | 100 GB/mes | ~500 GB/mes |

**Ejemplo:** Droplet DigitalOcean 1 GB ($6/mes) o instancia EC2 t3.micro.

### Caso B: Con servidor Node.js (SSR + APIs)

Si ejecutas el servidor Angular (SSR, auth, home-content):

| Recurso | Mínimo | Recomendado |
|---------|--------|-------------|
| **CPU** | 1 vCPU | 2 vCPU |
| **RAM** | 1 GB | 2 GB |
| **Disco** | 2 GB | 5 GB |
| **Tráfico** | 100 GB/mes | ~500 GB/mes |

**Ejemplo:** Droplet 2 GB ($12/mes) o EC2 t3.small.

### Caso C: Con WordPress + GraphQL

Si migras WordPress al mismo servidor:

| Recurso | Mínimo | Recomendado |
|---------|--------|-------------|
| **CPU** | 2 vCPU | 4 vCPU |
| **RAM** | 2 GB | 4 GB |
| **Disco** | 10 GB | 20 GB SSD |
| **Tráfico** | 100 GB/mes | 1 TB/mes |

**Ejemplo:** Droplet 4 GB ($24/mes) o EC2 t3.medium.

---

## Estimación por tráfico

| Tráfico mensual | Usuarios únicos aprox. | Recomendación |
|-----------------|------------------------|---------------|
| **0–10K visitas** | ~500–2K | Netlify Free o VPS 1 GB |
| **10K–50K visitas** | ~2K–10K | Netlify Pro o VPS 2 GB |
| **50K–200K visitas** | ~10K–50K | VPS 4 GB o Netlify Pro |
| **>200K visitas** | >50K | CDN + servidor 4+ GB o Netlify |

---

## Desglose por componente

### 1. Archivos estáticos (49 MB)

- **HTML prerenderizado** ~22 páginas
- **JS/CSS** ~900 KB (bundle inicial excede el budget de 600 KB)
- **Imágenes y assets** (~40 MB)

### 2. APIs (proxy externo)

- GraphQL, contact, contact-fields → WordPress en oakwoodsystemsgroup.com
- No consumen CPU/RAM de tu servidor si usas Netlify redirects

### 3. Auth y home-content

- Solo si usas Netlify Functions o servidor Node
- Consumo bajo: ~50–100 MB RAM por ejecución

---

## Recomendación final

| Escenario | Solución |
|-----------|----------|
| **Sitio actual (oakwoodsys.com)** | **Netlify** — sin servidor propio |
| **Migración a VPS** | Droplet 1–2 GB o equivalente |
| **WordPress + Angular en mismo servidor** | VPS 4 GB o instancia managed |

Para tu caso actual (Angular + Netlify + WordPress externo), **no necesitas servidor propio**. Netlify cubre hosting estático, CDN y funciones serverless.

Si quieres auto-hospedaje, un **VPS de 1–2 GB** es suficiente para servir el sitio estático y, si se usa, el servidor Node.
