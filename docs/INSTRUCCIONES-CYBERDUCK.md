# Instrucciones para subir archivos con Cyberduck

Archivos para configurar SEO en **oakwoodsystemsgroup.com** (WordPress) y alinear con **oakwoodsys.com** (Netlify).

---

## Requisitos previos

- Cyberduck instalado
- Credenciales SFTP del sitio **oakwoodsystemsgroup.com** (ver `WORDPRESS-ACCESO-WP-SUBDOMINIO.md`)
- Conectarte al servidor donde está WordPress (IP o host de GoDaddy)

---

## Archivos a subir

| Archivo en docs/ | Subir como | Ubicación en el servidor |
|------------------|------------|---------------------------|
| `robots-oakwoodsystemsgroup.txt` | **robots.txt** | Raíz del sitio (junto a `wp-config.php`, `index.php`) |
| `htaccess-oakwoodsystemsgroup.txt` | **.htaccess** | Raíz del sitio (reemplaza el existente) |

---

## Paso 1: robots.txt

1. Conéctate con Cyberduck al servidor de **oakwoodsystemsgroup.com**
2. Navega a la raíz del sitio (carpeta `html`, `public_html` o similar)
3. **Haz backup** del `robots.txt` actual (descárgalo y guárdalo)
4. Renombra localmente: `robots-oakwoodsystemsgroup.txt` → `robots.txt`
5. Arrastra o sube `robots.txt` a la raíz (sobrescribe el existente)

**Nota:** Si Yoast SEO genera su propio robots.txt, desactívalo en:  
**Yoast SEO → Herramientas → Editor de archivos** (o en Ajustes → Yoast SEO).

---

## Paso 2: .htaccess

1. En la misma carpeta raíz, **haz backup** del `.htaccess` actual
2. Renombra localmente: `htaccess-oakwoodsystemsgroup.txt` → `.htaccess`
3. Sube `.htaccess` a la raíz (sobrescribe el existente)

**Importante:** El archivo `htaccess-oakwoodsystemsgroup.txt` ya incluye:
- Redirección de sitemaps a oakwoodsys.com/sitemap.xml
- Redirección de oakwoodsystemsgroup.com → oakwoodsys.com (excepto wp-admin, graphql, wp-content)
- Bloques de LiteSpeed, WordPress, CORS, etc.

Si tu `.htaccess` actual tiene bloques adicionales (plugins, caché, etc.), **no lo reemplaces**. En su lugar, usa `htaccess-solo-adicion-sitemap.txt` y añade solo esas líneas al inicio de tu bloque de redirección existente.

---

## Paso 3: Verificar

| URL | Resultado esperado |
|-----|--------------------|
| https://oakwoodsystemsgroup.com/robots.txt | Debe mostrar `Sitemap: https://oakwoodsys.com/sitemap.xml` |
| https://oakwoodsystemsgroup.com/sitemap_index.xml | Redirige 301 a https://oakwoodsys.com/sitemap.xml |
| https://oakwoodsystemsgroup.com/wp-admin/ | Panel de WordPress (sin cambios) |

---

## Si algo falla

1. **Restaura el backup** del .htaccess o robots.txt
2. **LiteSpeed:** Si usas LiteSpeed Cache, purga la caché (wp-admin → LiteSpeed → Purge All)
3. **Permisos:** robots.txt y .htaccess suelen ser 644
