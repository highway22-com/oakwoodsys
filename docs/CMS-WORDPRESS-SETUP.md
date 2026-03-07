# Configuración de WordPress (CMS)

La aplicación Angular depende de WordPress para:

- **GraphQL** – contenido CMS, blog, case studies
- **Formulario de contacto** – envío de emails
- **Medios** – videos e imágenes en `wp-content/uploads`

## Arquitectura

| Servicio | URL | Hosting |
|----------|-----|---------|
| Angular (frontend) | https://oakwoodsys.com | Netlify |
| WordPress (CMS) | https://cms.oakwoodsys.com | Tu hosting |

## Pasos para configurar WordPress

### 1. Crear subdominio en GoDaddy

1. En **Mis productos** → **Dominios** → **oakwoodsys.com** → **Administrar DNS**
2. Añade un registro **A** (si WordPress está en tu propio servidor):
   - **Nombre:** `cms`
   - **Valor:** IP de tu servidor WordPress (ej: `192.124.249.10` si es tu hosting)
   - **TTL:** 600 segundos

   O un registro **CNAME** (si WordPress está en un servicio externo):
   - **Nombre:** `cms`
   - **Valor:** hostname que te da el proveedor (ej: `tu-sitio.wordpress.com` o `sitiowp.secureserver.net`)

**Nota:** Usa **A** cuando tengas una IP fija de tu servidor. Usa **CNAME** cuando el proveedor te dé un hostname.

### 2. Añadir subdominio en el panel de hosting (paso extra)

Si usas **GoDaddy** u otro hosting con cPanel/Plesk:

1. Entra al **panel de hosting** (no al de dominios)
2. Busca **Subdominios** o **Addon Domains**
3. Crea el subdominio `cms` para `oakwoodsys.com` → quedará `cms.oakwoodsys.com`
4. Asigna la carpeta donde se instalará WordPress (ej: `public_html/cms` o una carpeta dedicada)

Sin este paso, el DNS apunta al servidor pero el hosting no sabe qué servir para `cms.oakwoodsys.com`.

### 3. Instalar WordPress

1. Instala WordPress en la carpeta del subdominio `cms.oakwoodsys.com`
2. En `wp-config.php`, asegúrate de que:
   ```php
   define('WP_HOME', 'https://cms.oakwoodsys.com');
   define('WP_SITEURL', 'https://cms.oakwoodsys.com');
   ```

### 4. Instalar plugins necesarios

Copia los plugins de la carpeta `wordpress/` a `wp-content/plugins/`:

- `oakwood-bloq` – blog y case studies con GraphQL
- `oakwood-cms` – páginas CMS (home, services, etc.)
- `oakwood-contact` – formulario de contacto
- `oakwood-cors-config` – CORS para GraphQL
- `oakwood-people` – autores/personas

### 5. Instalar WPGraphQL

- Instala el plugin **WPGraphQL** desde el repositorio de WordPress
- Activa todos los plugins

### 6. Configurar SSL

Asegúrate de que `cms.oakwoodsys.com` tenga certificado HTTPS válido (Let's Encrypt, etc.).

### 7. Si usas otra URL para WordPress

Si WordPress está en otra URL (ej: `wp.oakwoodsys.com` o un dominio externo):

1. Edita `src/app/config/cms.config.ts`:
   ```ts
   export const CMS_BASE_URL = 'https://tu-url-wordpress.com';
   ```

2. Edita `netlify.toml` y cambia las URLs en los redirects de `/api/graphql`, `/api/contact`, `/api/contact-fields`

3. Edita `proxy.conf.json` para desarrollo local

4. Actualiza el plugin `oakwood-cors-config` para permitir `https://oakwoodsys.com` como origen
