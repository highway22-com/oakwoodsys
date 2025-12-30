# Despliegue en Netlify

Esta aplicación Angular con SSR está configurada para desplegarse en Netlify.

## Configuración

Los siguientes archivos han sido creados/configurados:

1. **netlify.toml** - Configuración principal de Netlify
2. **netlify/functions/server.js** - Función serverless para manejar SSR
3. **netlify/functions/home-content.js** - Endpoint proxy para el contenido externo

## Pasos para desplegar

### Opción 1: Desde la CLI de Netlify

1. Instala Netlify CLI globalmente:
```bash
npm i -g netlify-cli
```

2. Inicia sesión en Netlify:
```bash
netlify login
```

3. Inicializa el proyecto (solo la primera vez):
```bash
netlify init
```

4. Despliega el proyecto:
```bash
netlify deploy
```

5. Para producción:
```bash
netlify deploy --prod
```

### Opción 2: Desde GitHub (Recomendado)

1. Sube tu código a GitHub
2. Ve a [app.netlify.com](https://app.netlify.com)
3. Haz clic en "Add new site" > "Import an existing project"
4. Conecta tu repositorio de GitHub
5. Netlify detectará automáticamente la configuración desde `netlify.toml`
6. El despliegue se realizará automáticamente en cada push

## Configuración del Build

- **Build command**: `npm run build`
- **Publish directory**: `dist/oaw/browser`
- **Node version**: 20.x

## Funciones Serverless

### `/api/home-content`
Función serverless que actúa como proxy para obtener el contenido externo, evitando problemas de CORS.

### `/*` (Todas las rutas)
Función serverless que maneja el SSR de Angular para todas las rutas de la aplicación.

## Variables de Entorno

Si necesitas configurar variables de entorno, puedes hacerlo desde el dashboard de Netlify o usando:

```bash
netlify env:set VARIABLE_NAME value
```

## Notas

- El build se ejecuta automáticamente con `npm run build`
- Los archivos estáticos se sirven desde `dist/oaw/browser`
- El SSR se maneja mediante la función serverless en `netlify/functions/server.js`
- El endpoint `/api/home-content` está disponible como función serverless separada

## Solución de Problemas

Si encuentras problemas con el despliegue:

1. Verifica que Node.js 20 esté configurado en Netlify
2. Asegúrate de que todas las dependencias estén en `package.json`
3. Revisa los logs de build en el dashboard de Netlify
4. Verifica que los paths en `netlify.toml` sean correctos
