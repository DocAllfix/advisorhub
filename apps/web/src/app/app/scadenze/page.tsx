import { requireStudio } from "@/lib/auth-helpers";
import { clientiPerScadenze, listScadenze } from "@/lib/scadenze/queries";

import { Scadenzario } from "./scadenzario";

export default async function ScadenzePage() {
  const [{ demo }, scadenze, clienti] = await Promise.all([
    requireStudio(),
    listScadenze(),
    clientiPerScadenze(),
  ]);
  return <Scadenzario scadenze={scadenze} clienti={clienti} demo={demo} />;
}
