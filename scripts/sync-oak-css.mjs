#!/usr/bin/env node

// Syncs the Oakwood Blocks WordPress plugin's own CSS (oak-new) at build time, so
// post.css's WordPress-content styling (CTA block, accordion) stays pixel-exact with
// zero hand-copied values to drift out of sync. These are static plugin assets served
// directly by WordPress — no wp-admin auth needed. Fails loudly (non-zero exit) if the
// plugin path ever moves, instead of silently shipping a stale copy.

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const OAK_VER = '1.0.8';
const PLUGIN_BASE = 'https://oakwoodsystemsgroup.com/wp-content/plugins/oak-new';

const FILES = [
  { url: `${PLUGIN_BASE}/assets/css/oak.css?ver=${OAK_VER}`, out: 'src/assets/oak/oak.css' },
  { url: `${PLUGIN_BASE}/blocks/accordion-item/style.css?ver=${OAK_VER}`, out: 'src/assets/oak/oak-accordion.css' },
];

// The plugin's CSS pulls Inter from Google Fonts via @import — but the app already
// self-hosts Inter (index.html preloads inter-latin-var.woff2 and defines its own
// @font-face), so this would just add a second, render-blocking, cross-origin font
// fetch of the same family. Strip it so the synced copy doesn't reintroduce it.
const GOOGLE_FONTS_IMPORT_RE = /@import\s+url\(["']?https:\/\/fonts\.googleapis\.com\/[^)]*\)\s*;?\s*\n?/g;

async function syncFile(url, outRelPath) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`${url} responded ${res.status} ${res.statusText} — the plugin path may have moved.`);
  }
  const css = (await res.text()).replace(GOOGLE_FONTS_IMPORT_RE, '');
  const outPath = join(ROOT, outRelPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, css, 'utf8');
  console.log(`[sync-oak] ${url} -> ${outRelPath} (${css.length} bytes)`);
}

async function main() {
  for (const { url, out } of FILES) {
    await syncFile(url, out);
  }
}

main().catch((err) => {
  console.error('[sync-oak] Failed to sync Oakwood Blocks plugin CSS:', err.message);
  process.exit(1);
});
