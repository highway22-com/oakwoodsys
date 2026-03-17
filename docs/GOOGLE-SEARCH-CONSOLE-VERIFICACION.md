# Verificación de oakwoodsys.com en Google Search Console

Este documento describe los pasos detallados para verificar el dominio **oakwoodsys.com** en Google Search Console mediante el método de registro DNS TXT.

---

## Información de verificación

| Campo | Valor |
|-------|-------|
| **Dominio** | oakwoodsys.com |
| **Tipo de registro** | TXT |
| **Valor del registro** | `google-site-verification=XzrzwfOVM5L8tltBLg28IYDC0uqkCwApAGEi6n6Vp0I` |

---

## Pasos generales

### 1. Iniciar sesión en tu proveedor de dominios

Accede al panel de administración de tu proveedor de dominios (por ejemplo: GoDaddy, Namecheap, Cloudflare, Google Domains, etc.) donde está registrado **oakwoodsys.com**.

---

### 2. Ir a la configuración DNS

Busca la sección de **DNS**, **DNS Management**, **Zone Editor** o **Registros DNS** en el panel de tu proveedor.

---

### 3. Añadir un nuevo registro TXT

1. Haz clic en **Añadir registro** / **Add Record** / **Add**
2. Selecciona el tipo de registro: **TXT**
3. Configura los campos según tu proveedor:

| Campo | Valor recomendado |
|-------|-------------------|
| **Nombre / Host / Subdominio** | `@` (o vacío, o `oakwoodsys.com`) |
| **Valor / Contenido / Destino** | `google-site-verification=XzrzwfOVM5L8tltBLg28IYDC0uqkCwApAGEi6n6Vp0I` |
| **TTL** | 3600 (o el valor por defecto) |

4. Guarda el registro.

---

## Pasos específicos por proveedor

### GoDaddy

1. Inicia sesión en [godaddy.com](https://www.godaddy.com)
2. Ve a **Mis Productos** → selecciona **oakwoodsys.com** → **DNS**
3. En **Registros**, haz clic en **Añadir**
4. Tipo: **TXT**
5. Nombre: `@` (para el dominio raíz)
6. Valor: `google-site-verification=XzrzwfOVM5L8tltBLg28IYDC0uqkCwApAGEi6n6Vp0I`
7. TTL: 1 hora
8. Guarda los cambios

### Namecheap

1. Inicia sesión en [namecheap.com](https://www.namecheap.com)
2. Ve a **Domain List** → **Manage** en oakwoodsys.com
3. Pestaña **Advanced DNS**
4. Clic en **Add New Record**
5. Tipo: **TXT Record**
6. Host: `@`
7. Value: `google-site-verification=XzrzwfOVM5L8tltBLg28IYDC0uqkCwApAGEi6n6Vp0I`
8. Guarda con el icono de check verde

### Cloudflare

1. Inicia sesión en [cloudflare.com](https://www.cloudflare.com)
2. Selecciona el sitio **oakwoodsys.com**
3. Ve a **DNS** → **Records**
4. Clic en **Add record**
5. Tipo: **TXT**
6. Name: `@` (o `oakwoodsys.com`)
7. Content: `google-site-verification=XzrzwfOVM5L8tltBLg28IYDC0uqkCwApAGEi6n6Vp0I`
8. Proxy status: puede estar en DNS only (nube gris)
9. Save

### Google Domains

1. Inicia sesión en [domains.google.com](https://domains.google.com)
2. Selecciona **oakwoodsys.com**
3. Menú lateral: **DNS**
4. En **Custom records**, clic en **Create new record**
5. Tipo: **TXT**
6. Host name: `@`
7. Data: `google-site-verification=XzrzwfOVM5L8tltBLg28IYDC0uqkCwApAGEi6n6Vp0I`
8. TTL: 1H
9. Guardar

---

## 4. Esperar propagación DNS

Los cambios DNS pueden tardar en propagarse:

- **Mínimo**: 5–15 minutos
- **Habitual**: 1–24 horas
- **Máximo**: hasta 48–72 horas

---

## 5. Verificar en Google Search Console

1. Vuelve a [Google Search Console](https://search.google.com/search-console)
2. En la pantalla de verificación, haz clic en **Verify** / **Verificar**
3. Si aparece un error, espera unas horas y vuelve a intentar

---

## Alternativa: verificación por prefijo de URL

Si la verificación por DNS no funciona o prefieres otro método:

1. En Search Console, elige **"URL prefix property"** en lugar de dominio
2. Introduce: `https://oakwoodsys.com`
3. Métodos alternativos:
   - **Archivo HTML**: subir un archivo de verificación al servidor
   - **Etiqueta meta HTML**: añadir una meta tag en el `<head>` del sitio
   - **Google Analytics**: si ya tienes GA instalado

---

## Comprobar que el registro TXT está activo

Puedes verificar que el registro TXT se ha propagado con:

```bash
dig TXT oakwoodsys.com
```

O en [https://dnschecker.org](https://dnschecker.org): introduce `oakwoodsys.com`, tipo TXT, y revisa que aparezca el valor de verificación en los resultados.

---

## Resumen rápido

1. Entra en el panel de tu proveedor de dominios
2. Añade un registro **TXT** con nombre `@` y el valor de verificación
3. Espera la propagación (hasta 24–48 h)
4. Haz clic en **Verify** en Google Search Console
