/**
 * JSON-LD in modo che non si possa usare male: il contenuto passa SEMPRE da
 * `JSON.stringify` e poi `<` diventa `<`, così un testo che contenesse
 * `</script>` non può chiudere il tag e finire in pagina come HTML.
 */
export function DatiStrutturati({ dati }: { dati: Record<string, unknown> }) {
  const json = JSON.stringify(dati).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
