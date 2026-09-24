import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * La landing ha il proprio foglio di stile, ma le tinte sono quelle del
 * prodotto: la fonte di verità è il frontmatter di DESIGN.md. Copiarle è stato
 * il prezzo per non toccare apps/web; questo test è ciò che impedisce alla
 * copia di divergere in silenzio.
 */
const radice = join(__dirname, "../../../..");

function tinteDiDesign(): Record<string, string> {
  const design = readFileSync(join(radice, "DESIGN.md"), "utf8");
  const frontmatter = design.split(/^---$/m)[1];
  if (!frontmatter) throw new Error("DESIGN.md senza frontmatter");
  const blocco = frontmatter.split(/^colors:$/m)[1]?.split(/^\S/m)[0];
  if (!blocco) throw new Error("DESIGN.md senza blocco colors");
  const tinte: Record<string, string> = {};
  for (const [, nome, valore] of blocco.matchAll(/^\s+([a-z-]+):\s*"([^"]+)"/gm)) {
    tinte[nome!] = valore!;
  }
  return tinte;
}

describe("token della landing", () => {
  const css = readFileSync(join(__dirname, "../app/globals.css"), "utf8");
  const tinte = tinteDiDesign();

  it("DESIGN.md espone le tinte attese", () => {
    expect(Object.keys(tinte).length).toBeGreaterThanOrEqual(24);
  });

  it.each(Object.entries(tinteDiDesign()))("%s coincide con DESIGN.md", (nome, valore) => {
    const trovata = css.match(new RegExp(`--${nome}:\\s*([^;]+);`));
    expect(trovata, `--${nome} manca in globals.css`).not.toBeNull();
    expect(trovata![1]!.trim()).toBe(valore);
  });
});
