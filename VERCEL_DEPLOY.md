# Despliegue en Vercel

Esta aplicación Angular con SSR está configurada para desplegarse en Vercel.

## Configuración

Los siguientes archivos han sido creados/configurados:

1. **vercel.json** - Configuración de Vercel
2. **api/[[...path]].js** - Función serverless para manejar SSR
3. **api/home-content.js** - Endpoint proxy para el contenido externo

## Pasos para desplegar

### Opción 1: Desde la CLI de Vercel

1. Instala Vercel CLI globalmente:
```bash
npm i -g vercel
```

2. Inicia sesión en Vercel:
```bash
vercel login
```

3. Despliega el proyecto:
```bash
vercel
```

4. Para producción:
```bash
vercel --prod
```

### Opción 2: Desde GitHub

1. Conecta tu repositorio de GitHub a Vercel
2. Vercel detectará automáticamente la configuración de Angular
3. El despliegue se realizará automáticamente en cada push

## Variables de Entorno (si es necesario)

Si necesitas configurar variables de entorno, puedes hacerlo desde el dashboard de Vercel o usando:

```bash
vercel env add VARIABLE_NAME
```

## Notas

- El build se ejecuta automáticamente con `npm run build`
- Los archivos estáticos se sirven desde `dist/oaw/browser`
- El SSR se maneja mediante la función serverless en `api/[[...path]].js`
- El endpoint `/api/home-content` está disponible como función serverless separada
