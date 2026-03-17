# Alternativas para WordPress y oakwoodsys.com

Documento con distintas formas de configurar WordPress y el sitio Angular, evitando problemas de subdominios y SSL.

---

## Situación actual (problemas)

- **rest.oakwoodsys.com** → SSL no incluido en GoDaddy para subdominios
- **Cloudflare** → Errores de resolución DNS si la configuración no es correcta
- **Nameservers** → Pueden estar en GoDaddy o Cloudflare, lo que complica el DNS

---

## Propuesta A: WordPress en el dominio principal (más simple)

**Idea:** Usar **oakwoodsys.com** para WordPress y **www.oakwoodsys.com** para Angular (Netlify).

| URL | Destino |
|-----|---------|
| oakwoodsys.com | WordPress (GoDaddy, IP 160.153.0.191) |
| www.oakwoodsys.com | Angular (Netlify) |

**DNS en GoDaddy:**
- **A** @ → `160.153.0.191` (WordPress)
- **CNAME** www → `oakwoodsys.netlify.app` (Angular)

**Ventajas:** SSL en oakwoodsys.com (dominio principal), sin subdominios.
**Desventajas:** La URL principal muestra WordPress, no Angular. Los visitantes de la web Angular usarían www.oakwoodsys.com.

---

## Propuesta B: Invertir A – Angular en raíz, WordPress en www

**Idea:** Angular en la raíz, WordPress en www (o al revés de A).

| URL | Destino |
|-----|---------|
| oakwoodsys.com | Angular (Netlify) |
| www.oakwoodsys.com | WordPress (GoDaddy) |

**DNS:**
- **A** @ → `75.2.60.5` (Netlify)
- **A** www → `160.153.0.191` (WordPress)

**Ventajas:** oakwoodsys.com muestra Angular. WordPress en www con SSL si GoDaddy lo da para el dominio principal.
**Desventajas:** wp-admin estaría en www.oakwoodsys.com/wp-admin. Hay que actualizar wp-config y la app para usar www.oakwoodsys.com como CMS.

---

## Propuesta C: Solo oakwoodsys.com (sin subdominios)

**Idea:** Todo en oakwoodsys.com. Angular en Netlify con proxy de rutas de WordPress.

| URL | Destino |
|-----|---------|
| oakwoodsys.com | Netlify (Angular) |
| oakwoodsys.com/wp-admin, /graphql, etc. | Netlify hace proxy a la IP de WordPress |

**Requisitos:**
1. **DNS:** A @ → `75.2.60.5` (Netlify)
2. **Netlify:** Proxy de `/wp-admin`, `/graphql`, `/wp-json`, `/wp-content` a `http://160.153.0.191` (IP directa)
3. **WordPress:** `WP_HOME` y `WP_SITEURL` = `https://oakwoodsys.com`

**Ventajas:** Una sola URL, SSL de Netlify para todo.
**Desventajas:** Hay que configurar el proxy por IP; si la IP cambia, hay que actualizarla.

---

## Propuesta D: Subdominio con Cloudflare bien configurado

**Idea:** Mantener rest.oakwoodsys.com pero con Cloudflare configurado correctamente.

**Requisitos:**
1. **Nameservers** de oakwoodsys.com en Cloudflare (no en GoDaddy)
2. En **Cloudflare DNS** añadir: A `rest` → `160.153.0.191` (Proxied)
3. En **GoDaddy** no hace falta el registro de `rest` si los nameservers están en Cloudflare

**Ventajas:** SSL de Cloudflare para rest.oakwoodsys.com.
**Desventajas:** Hay que usar Cloudflare y asegurarse de que los nameservers estén bien apuntando.

---

## Propuesta E: Puerto o ruta alternativa (no recomendada)

Usar algo como oakwoodsys.com:8080 o una ruta especial. Suele dar más problemas que ventajas; no se recomienda.

---

## Recomendación

| Si prefieres… | Usa |
|---------------|-----|
| Máxima simplicidad | **Propuesta A** o **B** |
| Una sola URL para visitantes | **Propuesta C** (proxy por IP) |
| Subdominio con SSL | **Propuesta D** (Cloudflare) |

---

## Siguiente paso

Indica qué propuesta quieres seguir y se puede detallar la configuración paso a paso (DNS, Netlify, wp-config, etc.).
