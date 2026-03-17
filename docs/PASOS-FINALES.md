# Pasos finales – oakwoodsys.com + oakwoodsystemsgroup.com

**Configuración actual:** Angular en oakwoodsys.com, WordPress en oakwoodsystemsgroup.com.

---

## Arquitectura

| Dominio | Contenido |
|---------|------------|
| oakwoodsys.com | Angular (Netlify) |
| oakwoodsystemsgroup.com | WordPress (GoDaddy) |

La app Angular llama a GraphQL y contact vía proxy `/api/graphql` → oakwoodsystemsgroup.com.

---

## Paso 1: DNS en GoDaddy

**oakwoodsys.com** (para Netlify):

| Tipo | Nombre | Valor |
|------|--------|-------|
| A | @ | 75.2.60.5 |
| CNAME | www | oakwoodsys.netlify.app |

**Quitar** si existe: A @ → 192.124.249.10 (debe ser 75.2.60.5 para Netlify).

**oakwoodsystemsgroup.com** (para WordPress): lo gestiona GoDaddy según tu plan.

---

## Paso 2: WordPress en oakwoodsystemsgroup.com

En **wp-config.php** del sitio en oakwoodsystemsgroup.com:

```php
define('WP_HOME', 'https://oakwoodsystemsgroup.com');
define('WP_SITEURL', 'https://oakwoodsystemsgroup.com');
```

---

## Paso 3: Desplegar en Netlify

1. Haz **push** de todos los cambios al repositorio
2. Espera a que Netlify termine el build y el deploy
3. Comprueba en el panel de Netlify que el deploy se completó sin errores

---

## Paso 4: Probar

| URL | Qué debe cargar |
|-----|-----------------|
| https://oakwoodsys.com | Sitio Angular |
| https://oakwoodsystemsgroup.com/wp-admin/ | Login de WordPress |
| https://oakwoodsystemsgroup.com/graphql | Endpoint GraphQL |

---

## Si algo falla

- **GraphQL no responde:** CORS en WordPress debe permitir oakwoodsys.com (plugin oakwood-cors-config)
- **Imágenes no cargan:** Revisa que las URLs de medios apunten a oakwoodsystemsgroup.com
- **502 en /api/graphql:** Comprueba que oakwoodsystemsgroup.com esté accesible
