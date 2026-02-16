/**
 * Añade X-Robots-Tag: noindex para subdominios de desarrollo/staging.
 * seo-test.oakwoodsystemsgroup.com se indexa (para probar SEO en Google).
 */
const NOINDEX_HOSTS = [
  "staging.oakwoodsystemsgroup.com",
  "preview.oakwoodsystemsgroup.com",
  "dev.oakwoodsystemsgroup.com",
];

export default async (request: Request, context: { next: () => Promise<Response> }) => {
  const response = await context.next();
  const host = request.headers.get("host") ?? "";

  if (NOINDEX_HOSTS.some((h) => host === h || host.endsWith("." + h))) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
}
