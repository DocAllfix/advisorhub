import { requireStudio } from "@/lib/auth-helpers";
import { listClienti, listClientiArchiviati } from "@/lib/clienti/queries";

import { Portafoglio } from "./portafoglio";

export default async function ClientiPage() {
  const [{ demo }, clienti, archiviati] = await Promise.all([
    requireStudio(),
    listClienti(),
    listClientiArchiviati(),
  ]);
  return <Portafoglio clienti={clienti} archiviati={archiviati} demo={demo} />;
}
