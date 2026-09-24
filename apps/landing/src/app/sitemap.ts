import type { MetadataRoute } from "next";

import { indirizzo } from "@/lib/indirizzo";
import { REVISIONI } from "@/lib/revisioni";

/**
 * `lastModified` solo dove la data è VERA: le pagine legali hanno una data di
 * revisione dichiarata. La home no, e dichiarare la data del build a ogni
 * deploy direbbe ai motori che cambia ogni giorno anche quando non cambia.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: indirizzo("/"), changeFrequency: "monthly", priority: 1 },
    {
      url: indirizzo("/privacy"),
      lastModified: REVISIONI.privacy,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: indirizzo("/note-legali"),
      lastModified: REVISIONI.noteLegali,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
