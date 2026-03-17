# Using oakwoodsys.com for Both WordPress and Netlify

Complete guide to configure the same domain (oakwoodsys.com) to serve both WordPress (GoDaddy) and the Angular site (Netlify).

---

## Important Constraint

**A single domain cannot point to two different servers at the same time.** DNS resolves each hostname to one destination. You must choose how to split traffic between WordPress and Netlify.

---

## Reference Information

| Service | IP / URL |
|---------|----------|
| Netlify load balancer | `75.2.60.5` |
| WordPress (GoDaddy) | `160.153.0.191` |
| Netlify site URL | `oakwoodsys.netlify.app` |

---

## Option A: Root for WordPress, www for Netlify (Simplest)

**Idea:** Use **oakwoodsys.com** for WordPress and **www.oakwoodsys.com** for Angular (Netlify).

| URL | Destination |
|-----|-------------|
| oakwoodsys.com | WordPress (GoDaddy) |
| www.oakwoodsys.com | Angular (Netlify) |

### GoDaddy DNS

| Type | Name/Host | Value | TTL |
|------|-----------|-------|-----|
| A | @ | 160.153.0.191 | 1 hour |
| CNAME | www | oakwoodsys.netlify.app | 1 hour |

### Pros
- SSL on oakwoodsys.com (primary domain)
- Simple setup

### Cons
- Main URL shows WordPress; Angular visitors use www.oakwoodsys.com

---

## Option B: Root for Netlify, www for WordPress

**Idea:** Angular on root, WordPress on www.

| URL | Destination |
|-----|-------------|
| oakwoodsys.com | Angular (Netlify) |
| www.oakwoodsys.com | WordPress (GoDaddy) |

### GoDaddy DNS

| Type | Name/Host | Value | TTL |
|------|-----------|-------|-----|
| A | @ | 75.2.60.5 | 1 hour |
| A | www | 160.153.0.191 | 1 hour |

### WordPress Configuration

In `wp-config.php`:

```php
define('WP_HOME', 'https://www.oakwoodsys.com');
define('WP_SITEURL', 'https://www.oakwoodsys.com');
```

Update the app's `CMS_BASE_URL` to `https://www.oakwoodsys.com`.

### Pros
- oakwoodsys.com shows Angular
- WordPress at www.oakwoodsys.com with SSL (if GoDaddy provides it)

### Cons
- wp-admin is at www.oakwoodsys.com/wp-admin
- Must update wp-config and app CMS URL

---

## Option C: Single URL with Netlify Proxy (Recommended for unified experience)

**Idea:** All traffic goes to Netlify. Angular serves the main site; Netlify proxies WordPress routes to the backend.

| URL | Destination |
|-----|-------------|
| oakwoodsys.com | Netlify (Angular) |
| oakwoodsys.com/wp-admin | Proxy → WordPress |
| oakwoodsys.com/wp-json | Proxy → WordPress |
| oakwoodsys.com/graphql | Proxy → WordPress |
| oakwoodsys.com/wp-content | Proxy → WordPress |

### Step 1: GoDaddy DNS

| Type | Name/Host | Value | TTL |
|------|-----------|-------|-----|
| A | @ | 75.2.60.5 | 1 hour |
| CNAME | www | oakwoodsys.netlify.app | 1 hour |

### Step 2: Netlify Proxy (netlify.toml)

Add redirects to proxy WordPress paths:

```toml
# WordPress proxy - routes to backend
[[redirects]]
  from = "/wp-admin/*"
  to = "https://160.153.0.191/:splat"
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

**Note:** Netlify proxy uses `to` with full URLs. If the IP changes, update these redirects.

### Step 3: WordPress (wp-config.php)

```php
define('WP_HOME', 'https://oakwoodsys.com');
define('WP_SITEURL', 'https://oakwoodsys.com');
```

### Pros
- Single URL for visitors
- Netlify SSL for everything
- No subdomain split

### Cons
- Proxy must be configured
- If WordPress IP changes, redirects must be updated

---

## Option D: Subdomain with Cloudflare

**Idea:** Keep a subdomain (e.g. rest.oakwoodsys.com) for WordPress with Cloudflare SSL.

### Requirements

1. Point oakwoodsys.com nameservers to Cloudflare
2. In Cloudflare DNS: A record `rest` → `160.153.0.191` (Proxied)
3. WordPress and app use `https://rest.oakwoodsys.com`

### Pros
- SSL for subdomain via Cloudflare

### Cons
- Requires Cloudflare
- Nameservers must be correctly configured

---

## Option E: Port or Alternative Path (Not Recommended)

Using oakwoodsys.com:8080 or similar. Usually causes more issues than benefits; not recommended.

---

## Adding Domain in Netlify

1. Go to [app.netlify.com](https://app.netlify.com)
2. Select your site
3. **Domain management** → **Add custom domain**
4. Enter oakwoodsys.com (or www.oakwoodsys.com)
5. Verify and note the Netlify URL (e.g. oakwoodsys.netlify.app)

---

## Managing DNS in GoDaddy

1. Log in at [godaddy.com](https://www.godaddy.com)
2. **My Products** → find oakwoodsys.com
3. Three dots (⋮) → **Manage DNS**
4. Add or edit records in the **Records** section

---

## DNS Propagation

- Typical: 15 minutes – 2 hours
- Maximum: up to 48 hours

### Check Propagation

```bash
# Root (should return 75.2.60.5 or 160.153.0.191 depending on option)
dig oakwoodsys.com A +short

# www (should return Netlify CNAME or WordPress IP)
dig www.oakwoodsys.com CNAME +short
```

Or use [dnschecker.org](https://dnschecker.org) for global propagation.

---

## Troubleshooting

### Domain not verifying in Netlify

- Wait up to 48 hours after DNS changes
- Ensure the A record for `@` points to the correct IP
- Remove duplicate A or AAAA records for `@`

### SSL certificate errors

- Netlify can take up to 24 hours to issue certificates
- Ensure only one A record for `@` points to the intended server

### www not redirecting to root

- Netlify → **Domain management** → **Domain settings**
- Enable **Redirects** so www redirects to the non-www version (or vice versa)

### Proxy not working (Option C)

- Confirm WordPress IP is correct
- Check that `WP_HOME` and `WP_SITEURL` match oakwoodsys.com
- Verify Netlify redirects use `status = 200` for proxying

---

## Recommendation Summary

| If you prefer… | Use |
|----------------|-----|
| Maximum simplicity | **Option A** or **B** |
| Single URL for visitors | **Option C** (proxy) |
| Subdomain with SSL | **Option D** (Cloudflare) |

---

## Related Documentation

- `NETLIFY-GODADDY-DOMINIO.md` – Netlify + GoDaddy DNS setup
- `WORDPRESS-ALTERNATIVAS.md` – Original alternatives (Spanish)
- `MIGRAR-WORDPRESS-A-OAKWOODSYSTEMSGROUP.md` – Migrating WordPress to another domain
