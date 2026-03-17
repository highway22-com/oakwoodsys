# Diagnóstico: 502 Bad Gateway en /api/contact

## Problema

`POST https://oakwoodsys.com/api/contact` devuelve **502 Bad Gateway**.

## Flujo original

```
Browser → POST /api/contact (JSON body)
    → Netlify redirect (status 200) → proxy a oakwoodsystemsgroup.com
    → WordPress REST: /wp-json/oakwood/v1/send-contact
    → wp_mail() envía el email
```

## Causas posibles del 502

1. **Proxy de Netlify**: Los redirects con `status = 200` a URLs externas pueden tener limitaciones con POST (body, headers, timeout 26s).
2. **WordPress devuelve 500**: Si `wp_mail()` falla, el plugin oakwood-contact devuelve 500. Algunos proxies convierten 500 upstream en 502.
3. **WordPress lento o inaccesible**: Timeout o error de conexión.
4. **Configuración de correo**: Si SMTP no está configurado en WordPress, `wp_mail()` suele fallar.

## Solución aplicada: Netlify Function

Se creó `netlify/functions/contact-proxy.js` que:

- Recibe el POST desde el navegador
- Reenvía el body a WordPress con control total
- Devuelve la respuesta de WordPress o un error controlado

El redirect en `netlify.toml` ahora apunta a la función en lugar de WordPress directamente.

## Verificar que funciona

1. Despliega los cambios a Netlify.
2. Envía el formulario de contacto en https://oakwoodsys.com/contact-us
3. Si sigue fallando, revisa los logs en Netlify: **Site → Functions → contact-proxy → Logs**

## Si la función también devuelve 502

Entonces el problema está en **WordPress**, no en Netlify:

1. **Probar el endpoint directamente**:
   ```bash
   curl -X POST https://oakwoodsystemsgroup.com/wp-json/oakwood/v1/send-contact \
     -H "Content-Type: application/json" \
     -d '{"fullName":"Test","email":"test@ejemplo.com","company":"Test","message":"Test"}'
   ```

2. **Revisar configuración SMTP** en WordPress:
   - Plugin Oakwood SMTP debe estar activo
   - En `wp-config.php` deben estar definidas: `OAKWOOD_SMTP_HOST`, `OAKWOOD_SMTP_FROM`, etc.
   - Ver `docs/` o el plugin `wordpress/oakwood-smtp/` para la configuración

3. **Logs de WordPress**:
   - `wp-content/oakwood-contact-errors.log` (si wp_mail falla)
   - Logs de PHP del servidor

## Resumen de cambios

| Archivo | Cambio |
|---------|--------|
| `netlify/functions/contact-proxy.js` | Nueva función que hace proxy a WordPress |
| `netlify.toml` | Redirect `/api/contact` → `/.netlify/functions/contact-proxy` |
