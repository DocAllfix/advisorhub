import { clientiPerScadenze, listScadenze } from "@/lib/scadenze/queries";

import { Scadenzario } from "./scadenzario";

export default async function ScadenzePage() {
  const [scadenze, clienti] = await Promise.all([listScadenze(), clientiPerScadenze()]);
  return <Scadenzario scadenze={scadenze} clienti={clienti} />;
}
