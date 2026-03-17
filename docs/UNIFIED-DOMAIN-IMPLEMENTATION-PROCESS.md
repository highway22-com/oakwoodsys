# Process: Implement Unified Domain (oakwoodsys.com for WordPress + Netlify)

Step-by-step guide to fix and implement the proposal that keeps **oakwoodsys.com** as the single domain for both the Angular site (Netlify) and WordPress (GoDaddy backend).

---

## Goal

| Before | After |
|--------|-------|
| oakwoodsys.com → Angular only | oakwoodsys.com → Angular + WordPress |
| WordPress on oakwoodsystemsgroup.com | WordPress accessible via oakwoodsys.com |
| API proxied to different domain | API at oakwoodsys.com/graphql, etc. |

**Result:** Visitors see one domain. WordPress admin at oakwoodsys.com/wp-admin. No subdomains.

---

## Reference Information

| Item | Value |
|------|-------|
| Netlify load balancer IP | `75.2.60.5` |
| WordPress server IP | `160.153.0.191` |
| Netlify site URL | `oakwoodsys.netlify.app` |

---

## Implementation Checklist

### Phase 1: DNS Configuration

- [ ] **1.1** Log in to GoDaddy → My Products → oakwoodsys.com → Manage DNS
- [ ] **1.2** Set or update A record:
  - Type: **A**
  - Name: **@**
  - Value: **75.2.60.5**
  - TTL: 1 hour
- [ ] **1.3** Set or update CNAME record:
  - Type: **CNAME**
  - Name: **www**
  - Value: **oakwoodsys.netlify.app**
  - TTL: 1 hour
- [ ] **1.4** Remove conflicting records (other A for @, AAAA for @)
- [ ] **1.5** Wait for DNS propagation (15 min – 48 h)

---

### Phase 2: Netlify Configuration

- [ ] **2.1** Add oakwoodsys.com in Netlify → Domain management → Add custom domain
- [ ] **2.2** Verify domain shows as Verified in Netlify
- [ ] **2.3** Update `netlify.toml` with WordPress proxy redirects (see below)
- [ ] **2.4** Deploy to Netlify

---

### Phase 3: WordPress Configuration

- [ ] **3.1** Connect via SFTP to WordPress server (see WORDPRESS-ACCESO-WP-SUBDOMINIO.md)
- [ ] **3.2** Edit `wp-config.php` and add or update:

```php
define('WP_HOME', 'https://oakwoodsys.com');
define('WP_SITEURL', 'https://oakwoodsys.com');
```

- [ ] **3.3** Save and upload `wp-config.php`
- [ ] **3.4** In GoDaddy Managed WordPress: ensure oakwoodsys.com is assigned to the site (if the panel allows multiple domains)

---

### Phase 4: Application Configuration

- [ ] **4.1** Update `src/app/config/cms.config.ts`:

```typescript
export const CMS_BASE_URL = 'https://oakwoodsys.com';
```

- [ ] **4.2** Update `netlify.toml` redirects: change proxy targets from oakwoodsystemsgroup.com to oakwoodsys.com or 160.153.0.191 (see Phase 2)
- [ ] **4.3** Update any hardcoded URLs (oakwoodsystemsgroup.com → oakwoodsys.com) in JSON files, plugins, etc.
- [ ] **4.4** Rebuild and deploy

---

### Phase 5: Verification

- [ ] **5.1** https://oakwoodsys.com → Angular site loads
- [ ] **5.2** https://oakwoodsys.com/wp-admin/ → WordPress admin loads
- [ ] **5.3** https://oakwoodsys.com/graphql → GraphQL endpoint responds
- [ ] **5.4** Contact form works (uses /wp-json/oakwood/v1/send-contact)
- [ ] **5.5** Images and videos load from oakwoodsys.com/wp-content/...
- [ ] **5.6** www.oakwoodsys.com redirects to oakwoodsys.com (if configured)

---

## netlify.toml – WordPress Proxy Redirects

Add these redirects **before** the SPA catch-all (`/*` → `/index.html`). Order matters.

```toml
# WordPress proxy – same domain (oakwoodsys.com)
[[redirects]]
  from = "/wp-admin/*"
  to = "https://160.153.0.191/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/wp-login.php"
  to = "https://160.153.0.191/wp-login.php"
  status = 200
  force = true

[[redirects]]
  from = "/wp-json/*"
  to = "https://160.153.0.191/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/graphql"
  to = "https://160.153.0.191/graphql"
  status = 200
  force = true

[[redirects]]
  from = "/wp-content/*"
  to = "https://160.153.0.191/:splat"
  status = 200
  force = true
```

**Note:** If the IP changes, update these redirects. Alternatively, use the WordPress domain (e.g. oakwoodsystemsgroup.com) if it points to the same server and WordPress accepts oakwoodsys.com via proxy headers.

---

## Application API Configuration

With `CMS_BASE_URL = 'https://oakwoodsys.com'`, the app will call:

- `https://oakwoodsys.com/graphql` (same origin, no CORS)
- `https://oakwoodsys.com/wp-json/oakwood/v1/send-contact`
- `https://oakwoodsys.com/wp-json/oakwood/v1/contact-fields`
- `https://oakwoodsys.com/wp-content/...` for media

The `/api/graphql` proxy in netlify.toml can be removed if the app calls `/graphql` directly (same domain).

---

## Troubleshooting

### WordPress returns 404 or wrong site

- The server at 160.153.0.191 must accept requests with `Host: oakwoodsys.com`
- In GoDaddy Managed WordPress, add oakwoodsys.com as a domain for the site
- Confirm `WP_HOME` and `WP_SITEURL` are exactly `https://oakwoodsys.com`

### Proxy not working

- Redirects must use `status = 200` for proxying (not 301/302)
- Check that WordPress proxy redirects appear **before** the `/*` → `/index.html` rule
- Verify the WordPress IP is correct

### Mixed content (HTTP/HTTPS)

- Ensure all proxy `to` URLs use `https://`
- WordPress should force HTTPS in wp-config if needed

### CORS errors

- With same domain, CORS should not be an issue
- If using a different backend domain, ensure the WordPress CORS plugin allows oakwoodsys.com

---

## Rollback

If you need to revert:

1. Set `CMS_BASE_URL` back to `https://oakwoodsystemsgroup.com`
2. Remove WordPress proxy redirects from netlify.toml (keep /api/graphql, /api/contact if used)
3. In wp-config.php, set `WP_HOME` and `WP_SITEURL` back to oakwoodsystemsgroup.com
4. Redeploy

---

## Related Documentation

- `DOMAIN-WORDPRESS-NETLIFY-SETUP.md` – All domain options (English)
- `DOMINIO-WORDPRESS-NETLIFY-CONFIGURACION.md` – All domain options (Spanish)
- `PROPUESTA-C-IMPLEMENTACION.md` – Original proposal C (Spanish)
- `NETLIFY-GODADDY-DOMINIO.md` – Netlify + GoDaddy DNS
- `WORDPRESS-ACCESO-WP-SUBDOMINIO.md` – SFTP access to WordPress
