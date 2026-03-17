# Conectar Netlify con dominio GoDaddy (registro A @)

Guía para apuntar un dominio de GoDaddy a tu sitio en Netlify usando un registro **A** en el dominio raíz (@).

---

## Información necesaria

| Tipo | Nombre/Host | Valor | Uso |
|------|-------------|-------|-----|
| **A** | `@` | `75.2.60.5` | Dominio raíz (oakwoodsys.com) |
| **CNAME** | `www` | `[tu-sitio].netlify.app` | Subdominio www (www.oakwoodsys.com) |

La IP **75.2.60.5** es el load balancer oficial de Netlify para registros A.

---

## Paso 1: Añadir el dominio en Netlify

1. Entra en [app.netlify.com](https://app.netlify.com)
2. Selecciona tu sitio
3. Menú lateral → **Domain management** / **Administración de dominios**
4. Clic en **Add domain** / **Add custom domain**
5. Escribe tu dominio (ej: `oakwoodsys.com`)
6. Verifica y añade el dominio
7. Anota la URL de Netlify que te muestre (ej: `oakwoodsys.netlify.app`)

---

## Paso 2: Entrar en DNS de GoDaddy

1. Inicia sesión en [godaddy.com](https://www.godaddy.com)
2. Ve a **Mis Productos** / **My Products**
3. Localiza tu dominio (ej: oakwoodsys.com)
4. Clic en los **tres puntos** (⋮) → **Administrar DNS** / **Manage DNS**
5. Baja hasta la sección **Registros** / **Records**

---

## Paso 3: Añadir el registro A para @

1. Clic en **Añadir** / **Add**
2. Configura:
   - **Tipo**: A
   - **Nombre** / **Host**: `@` (representa el dominio raíz)
   - **Valor** / **Apuntar a**: `75.2.60.5`
   - **TTL**: 1 hora (o 600 segundos)
3. Guarda

### Si ya existe un registro A para @

1. Localiza el registro A con nombre `@`
2. Edítalo (icono de lápiz)
3. Cambia el valor a `75.2.60.5`
4. Guarda

---

## Paso 4: Configurar www con CNAME

1. Clic en **Añadir** / **Add**
2. Configura:
   - **Tipo**: CNAME
   - **Nombre** / **Host**: `www`
   - **Valor** / **Apuntar a**: `[tu-sitio].netlify.app` (ej: `oakwoodsys.netlify.app`)
   - **TTL**: 1 hora
3. Guarda

### Si ya existe un CNAME para www

1. Edita el registro CNAME de `www`
2. Cambia el valor a `[tu-sitio].netlify.app`
3. Guarda

---

## Paso 5: Eliminar registros conflictivos

Para evitar problemas con SSL y redirecciones:

- **Elimina** cualquier otro registro A para `@` que apunte a otra IP
- **Elimina** registros AAAA para `@` (Netlify no usa IPv6 en el load balancer)
- Si tienes un registro CNAME para `@`, elimínalo (GoDaddy no permite CNAME en apex en algunos planes)

---

## Paso 6: Esperar propagación DNS

- Tiempo típico: 15 minutos – 2 horas
- Máximo: hasta 48 horas

---

## Paso 7: Verificar en Netlify

1. Vuelve a Netlify → **Domain management**
2. Junto al dominio debería aparecer **Verified** / **Verificado**
3. Si sigue en "Pending", espera un poco más y recarga

---

## Resumen de registros en GoDaddy

| Tipo | Nombre | Valor | TTL |
|------|--------|-------|-----|
| A | @ | 75.2.60.5 | 1 hora |
| CNAME | www | [tu-sitio].netlify.app | 1 hora |

---

## Comprobar propagación DNS

En terminal:

```bash
# Dominio raíz (debe devolver 75.2.60.5)
dig oakwoodsys.com A +short

# Subdominio www (debe devolver la IP de Netlify)
dig www.oakwoodsys.com CNAME +short
```

O usa [dnschecker.org](https://dnschecker.org) para ver la propagación global.

---

## Problemas frecuentes

### El dominio no verifica en Netlify

- Espera hasta 48 h tras los cambios DNS
- Comprueba que el registro A de `@` apunte exactamente a `75.2.60.5`
- Elimina registros A o AAAA duplicados para `@`

### Error de certificado SSL

- Netlify puede tardar hasta 24 h en emitir el certificado
- Asegúrate de tener solo un registro A para `@` apuntando a `75.2.60.5`

### www no redirige al dominio raíz

- En Netlify → **Domain management** → **Domain settings**
- Activa **Redirects** para que `www` redirija a la versión sin www (o al revés)

---

## Alternativa: Netlify DNS

Si prefieres que Netlify gestione el DNS:

1. En Netlify → **Domain management** → **Set up Netlify DNS**
2. Netlify te dará nameservers (ej: `dns1.p01.nsone.net`, etc.)
3. En GoDaddy → **Administrar DNS** → **Cambiar nameservers** / **Change nameservers**
4. Sustituye los nameservers de GoDaddy por los de Netlify

Con Netlify DNS no necesitas crear registros A manualmente en GoDaddy.
