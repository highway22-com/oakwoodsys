/**
 * Calcula el tiempo de lectura aproximado (minutos) a partir de contenido HTML.
 * Usa ~200 palabras/minuto como referencia.
 */
export function readingTimeMinutes(content: string | null | undefined): number {
  if (!content || typeof content !== 'string') return 0;
  const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = text ? text.split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / 200));
}
